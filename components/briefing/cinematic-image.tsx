"use client";
import Image from "next/image";
import { useRef } from "react";
import { useImageMedia } from "@/lib/cinematic/hooks";

type CinematicImageProps = { file: string; alt: string; className?: string; priority?: boolean; sizes?: string };

export function CinematicImage({ file, alt, className = "", priority = false, sizes = "100vw" }: CinematicImageProps) {
  const root = useRef<HTMLDivElement>(null);
  const src = `/assets/cinematic/${file}`;
  const events = useImageMedia(root, src, priority);
  return (
    <div ref={root} className={`cinematic-image ${className}`} data-camera>
      <Image src={src} alt={alt} fill priority={priority} sizes={sizes} quality={85}
        {...events} />
    </div>
  );
}
