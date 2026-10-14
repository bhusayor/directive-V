"use client";

import Image from "next/image";
import { useRef } from "react";
import { useImageMedia } from "@/lib/cinematic/hooks";
import type { OperatorMediaSource } from "@/lib/operators";
import { useManagedVideo } from "@/lib/cinematic/video";
import { useCinema } from "@/components/cinematic/provider";
import { relevance } from "@/lib/cinematic/media";

type Props = { media: OperatorMediaSource; alt: string; prepare: boolean; active: boolean };

/** Poster-backed presentation; the shared runtime owns player lifetimes. */
export function OperatorMedia({ media, alt, prepare, active }: Props) {
  const runtime = useCinema();
  const root = useRef<HTMLDivElement>(null);
  const imageEvents = useImageMedia(root, media.poster);
  const { attach, visible, failed, preview, stop, fail, waiting } = useManagedVideo(media, prepare, active);
  return <div ref={root} className="operator-media" data-preview={preview} data-video-visible={visible}>
    <Image className="operator-poster" src={media.poster} alt={alt} fill
      style={{ objectPosition: media.posterPosition ?? "center top" }}
      {...imageEvents}
      sizes="(min-width: 1800px) 1080px, (min-width: 1100px) 60vw, (min-width: 721px) 53vw, 100vw" quality={90} />
    {prepare && !failed && media.video && <video ref={attach} className="operator-video" src={media.video}
      style={{ objectPosition: media.videoPosition ?? "center top" }} muted playsInline preload="metadata"
      controls={false} disablePictureInPicture aria-hidden="true"
      onLoadedMetadata={() => runtime.media.report(media.video!, "READY", relevance.NEAR)}
      onError={fail} onEnded={stop} onWaiting={waiting} onStalled={waiting} />}
  </div>;
}
