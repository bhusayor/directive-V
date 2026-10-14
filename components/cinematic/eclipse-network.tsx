"use client";
import { useRef, type RefObject } from "react";
import { networkEdges, networkNodes, schematicPoint } from "@/lib/cinematic/eclipse-network";
import { useNetworkCanvas } from "@/lib/cinematic/use-network-canvas";

/** The static schematic and WebGL scene share real geometry and topology. */
export function EclipseNetwork({ progress }: { progress: RefObject<number> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const status = useNetworkCanvas(canvas, progress);
  return <div className="eclipse-network-visual" data-renderer={status}>
    <svg className="eclipse-schematic" viewBox="0 0 1000 620" aria-hidden="true">
      {networkEdges.map(([a, b]) => {
        const start = schematicPoint(networkNodes[a]), end = schematicPoint(networkNodes[b]);
        return <path key={`${a}-${b}`} data-rank={Math.ceil(Math.max(networkNodes[a].arrival, networkNodes[b].arrival) * 3)} d={`M${start.x},${start.y} L${end.x},${end.y}`} />;
      })}
      {networkNodes.map((node, index) => {
        const p = schematicPoint(node);
        return <g key={index} data-rank={Math.ceil(node.arrival * 3)} transform={`translate(${p.x} ${p.y})`}>
          <rect x="-2" y="-2" width="4" height="4" />
          {node.kind === "communications" && <path d="M-9 0 L0 -43 L9 0 M-13 -29 H13 M-5 -12 L5 -25 M5 -12 L-5 -25" />}
          {node.kind === "satellite" && <path d="M-20 -5 H20 V5 H-20 Z M-7 -5 V5 M7 -5 V5 M0 -12 V12" />}
          {node.kind === "defense" && <path d="M-9 0 V-12 H9 V0 Z" />}
        </g>;
      })}
    </svg>
    <canvas ref={canvas} className="eclipse-canvas" aria-hidden="true" />
  </div>;
}
