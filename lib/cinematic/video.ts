"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCinema } from "@/components/cinematic/provider";
import type { OperatorMediaSource } from "@/lib/operators";
import { relevance } from "./media";
const FADE_MS = 440;
export function useManagedVideo(media: OperatorMediaSource, prepare: boolean, active: boolean) {
  const runtime = useCinema();
  const id = media.video ?? media.poster;
  const video = useRef<HTMLVideoElement | null>(null);
  const wanted = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const frame = useRef<number | undefined>(undefined);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const [preview, setPreview] = useState("poster");

  const stop = useCallback(() => {
    runtime.releaseVideo(id);
    wanted.current = false;
    clearTimeout(timer.current); clearTimeout(resetTimer.current);
    const node = video.current;
    if (node && frame.current !== undefined) node.cancelVideoFrameCallback?.(frame.current);
    node?.pause(); // Stop immediately: the outgoing frozen frame can still crossfade.
    setVisible(false); setPreview("poster");
    resetTimer.current = setTimeout(() => {
      if (node && !wanted.current) { try { node.currentTime = 0; } catch { /* Poster remains intact. */ } }
    }, FADE_MS);
  }, [runtime, id]);
  useEffect(() => runtime.registerVideo(id, stop), [runtime, id, stop]);
  const fail = useCallback(() => { stop(); runtime.media.report(id, "ERROR", relevance.VISIBLE); setFailed(true); setPreview("unavailable"); }, [stop, runtime, id]);
  const attach = useCallback((node: HTMLVideoElement | null) => {
    if (video.current && video.current !== node) {
      video.current.pause(); video.current.removeAttribute("src"); video.current.load();
    }
    video.current = node;
  }, []);

  useEffect(() => {
    const node = video.current;
    if (!active || !prepare || failed || !node) { stop(); return; }
    clearTimeout(resetTimer.current);
    runtime.claimVideo(id);
    runtime.media.report(id, "LOADING", relevance.VISIBLE);
    wanted.current = true;
    let cancelled = false;
    try { node.currentTime = 0; } catch { /* Metadata may still be arriving. */ }
    const reveal = () => {
      if (!cancelled && wanted.current && node.readyState >= 2 && !node.paused) {
        clearTimeout(timer.current); runtime.media.report(id, "READY", relevance.VISIBLE); setVisible(true); setPreview("playing");
      }
    };
    const presented = () => {
      if (node.requestVideoFrameCallback) frame.current = node.requestVideoFrameCallback(reveal);
      else reveal();
    };
    setPreview("loading");
    timer.current = setTimeout(fail, 8000);
    node.addEventListener("playing", presented);
    node.muted = true;
    node.play().catch(() => { if (!cancelled && wanted.current) fail(); });
    return () => {
      cancelled = true; node.removeEventListener("playing", presented); stop();
    };
  }, [active, prepare, failed, stop, fail, runtime, id]);

  useEffect(() => () => {
    clearTimeout(timer.current); clearTimeout(resetTimer.current);
  }, []);

  const waiting = () => {
    if (!wanted.current) return;
    setVisible(false); setPreview("loading"); clearTimeout(timer.current);
    timer.current = setTimeout(fail, 5000);
  };
  return { attach, visible, failed, preview, stop, fail, waiting };
}
