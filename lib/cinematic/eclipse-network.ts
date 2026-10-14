/** A deterministic infrastructure schematic, deliberately not a geographic globe. */
export type NetworkNode = { x: number; y: number; z: number; kind: "communications" | "satellite" | "defense" | "power"; arrival: number };
export const networkNodes: NetworkNode[] = Array.from({ length: 36 }, (_, i) => ({
  x: (i % 6 - 2.5) * 2.3 + (Math.floor(i / 6) % 2) * 0.35,
  y: 0, z: (Math.floor(i / 6) - 2.5) * 2.1,
  kind: i % 7 === 0 ? "communications" : i % 3 === 0 ? "defense" : "power", arrival: 0,
}));
networkNodes.push(
  { x: -4.8, y: 3.8, z: -3.5, kind: "satellite", arrival: 0 },
  { x: 3.9, y: 4.5, z: -4.5, kind: "satellite", arrival: 0 },
  { x: -3.5, y: 3.2, z: 4.1, kind: "satellite", arrival: 0 },
  { x: 5.4, y: 3.7, z: 3.2, kind: "satellite", arrival: 0 },
);
export const networkEdges: Array<readonly [number, number]> = [];
for (let i = 0; i < 36; i++) {
  if (i % 6 < 5) networkEdges.push([i, i + 1]);
  if (i < 30 && (i % 2 === 0 || i % 6 === 5)) networkEdges.push([i, i + 6]);
}
networkEdges.push([36, 0], [36, 14], [37, 5], [37, 14], [38, 21], [38, 30], [39, 28], [39, 35], [14, 28]);
const distances = networkNodes.map(() => Infinity); distances[36] = 0;
const queue = [36];
while (queue.length) {
  const current = queue.shift()!;
  for (const [a, b] of networkEdges) {
    const next = a === current ? b : b === current ? a : -1;
    if (next >= 0 && distances[next] === Infinity) { distances[next] = distances[current] + 1; queue.push(next); }
  }
}
const maximum = Math.max(...distances);
networkNodes.forEach((node, i) => { node.arrival = 0.04 + distances[i] / maximum * 0.91; });
export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const compromiseAt = (progress: number) => clamp01((progress - 0.12) / 0.48);
export const eclipsePhase = (progress: number) => progress < 0.19 ? "network" : progress < 0.32 ? "satellite" : progress < 0.46 ? "defense" : progress < 0.67 ? "grid" : progress < 0.85 ? "revelation" : "directive";

/** Shared projection for the static SVG: the same topology as the GPU scene. */
export function schematicPoint(node: NetworkNode) {
  return { x: 510 + node.x * 43 + node.z * 17, y: 310 + node.z * 20 - node.y * 48 };
}
