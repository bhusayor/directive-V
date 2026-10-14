import { networkNodes, networkEdges, compromiseAt } from "./eclipse-network";

export type NetworkFrame = { progress: number; x: number; y: number };
export type NetworkScene = ReturnType<typeof createNetworkScene>;

/** Perspective infrastructure geometry; two draw calls, no texture/particle/post FX. */
export function createNetworkScene(canvas: HTMLCanvasElement, dprCap: number) {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: true, depth: false, powerPreference: "low-power" });
  if (!gl) throw new Error("Network graphics unavailable");
  const releases: Array<() => void> = [];
  let disposed = false;
  const releaseContext = () => { if (!gl.isContextLost()) gl.getExtension("WEBGL_lose_context")?.loseContext(); };
  const dispose = () => {
    if (disposed) return; disposed = true;
    gl.useProgram(null); gl.bindBuffer(gl.ARRAY_BUFFER, null);
    releases.reverse().forEach((release) => release());
    // A connected canvas returns the same context on re-entry. Keep it reusable,
    // but shrink its backing store and release ALL scene resources while dormant.
    canvas.width = 1; canvas.height = 1;
    if (!canvas.isConnected) releaseContext();
  };
  try {
    const shader = (type: number, source: string) => {
      const value = gl.createShader(type); if (!value) throw new Error("Shader allocation failed");
      releases.push(() => gl.deleteShader(value)); gl.shaderSource(value, source); gl.compileShader(value);
      if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) throw new Error("Network shader failed");
      return value;
    };
    const vertex = shader(gl.VERTEX_SHADER, `
      attribute vec3 position; attribute float arrival; attribute float strength;
      uniform float aspect; uniform float camera; uniform vec2 pointer; uniform float dpr;
      varying float route; varying float light;
      void main(){
        float yaw=-.16+camera*.12+pointer.x*.025;
        vec3 p=vec3(position.x*cos(yaw)+position.z*sin(yaw),position.y,-position.x*sin(yaw)+position.z*cos(yaw));
        float tilt=.48+pointer.y*.015;
        vec3 q=vec3(p.x,p.y*cos(tilt)-p.z*sin(tilt),p.y*sin(tilt)+p.z*cos(tilt));
        float depth=17.-camera*3.1-q.z;
        gl_Position=vec4(q.x*2.1/aspect+depth*.21,(q.y-.65)*2.1,0.,depth);
        gl_PointSize=clamp(78./depth,3.,9.)*dpr;
        route=arrival; light=strength*(.65+.35*clamp((22.-depth)/12.,0.,1.));
      }`);
    const fragment = shader(gl.FRAGMENT_SHADER, `
      precision mediump float; uniform float spread; uniform float points;
      varying float route; varying float light;
      void main(){
        float cut=1.-smoothstep(spread-.025,spread+.015,route);
        vec3 bone=vec3(.83,.87,.87), red=vec3(.788,.165,.165);
        float alpha=light;
        if(points>.5){ vec2 p=abs(gl_PointCoord-.5); float edge=max(p.x,p.y); alpha*=1.-smoothstep(.32,.5,edge); }
        gl_FragColor=vec4(mix(bone,red,cut),alpha*mix(.8,1.,cut));
      }`);
    const program = gl.createProgram(); if (!program) throw new Error("Program allocation failed");
    releases.push(() => gl.deleteProgram(program)); gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Network linking failed");
    gl.useProgram(program); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    const lines: number[] = [], points: number[] = [];
    type Point = readonly [number, number, number];
    const segment = (a: Point, b: Point, ra: number, rb = ra, light = 0.65) => { lines.push(...a, ra, light, ...b, rb, light); };
    const point = (index: number): Point => { const n = networkNodes[index]; return [n.x, n.y, n.z]; };
    for (const [a, b] of networkEdges) {
      const na = networkNodes[a], nb = networkNodes[b];
      if (a >= 36 || b >= 36) {
        // Elevated relay links, not orbital trails or arbitrary particles.
        let previous = point(a);
        for (let step = 1; step <= 16; step++) {
          const t = step / 16, prior = (step - 1) / 16;
          const next: Point = [na.x + (nb.x - na.x) * t, na.y + (nb.y - na.y) * t + Math.sin(t * Math.PI) * 0.65, na.z + (nb.z - na.z) * t];
          segment(previous, next, na.arrival + (nb.arrival - na.arrival) * prior, na.arrival + (nb.arrival - na.arrival) * t, 0.65); previous = next;
        }
      } else segment(point(a), point(b), na.arrival, nb.arrival, 0.48);
    }
    networkNodes.forEach((n) => {
      const { x, y, z, arrival } = n;
      points.push(x, y, z, arrival, 1);
      const local = (a: Point, b: Point, strength = 0.85) => segment([x + a[0], y + a[1], z + a[2]], [x + b[0], y + b[1], z + b[2]], arrival, arrival, strength);
      if (n.kind === "communications") {
        const top: Point = [0, 1.35, 0];
        local([-.28, 0, -.2], top); local([.28, 0, -.2], top); local([0, 0, .26], top);
        local([-.2, .4, -.14], [.2, .8, -.08]); local([.2, .4, -.14], [-.2, .8, -.08]);
        local([-.45, 1.08, 0], [.45, 1.08, 0]); local([0, 1.35, 0], [0, 1.65, 0]);
      } else if (n.kind === "satellite") {
        local([-.6, 0, -.2], [.6, 0, -.2]); local([-.6, 0, .2], [.6, 0, .2]);
        for (const xx of [-.6, -.25, .25, .6]) local([xx, 0, -.2], [xx, 0, .2]);
        local([0, -.2, 0], [0, .35, 0]);
      } else {
        const height = n.kind === "defense" ? .5 : .15;
        for (const side of [-1, 1]) {
          local([-.25, height, side * .25], [.25, height, side * .25]);
          local([side * .25, height, -.25], [side * .25, height, .25]);
          local([side * .25, 0, -.25], [side * .25, height, -.25]);
        }
      }
    });
    // Faint infrastructure survey datum; never a full-screen HUD.
    for (let i = -7; i <= 7; i++) {
      segment([i, -.06, -7], [i, -.06, 7], 2, 2, .085);
      segment([-7, -.06, i], [7, -.06, i], 2, 2, .085);
    }
    const buffer = (values: number[]) => {
      const value = gl.createBuffer(); if (!value) throw new Error("Geometry allocation failed");
      releases.push(() => gl.deleteBuffer(value)); gl.bindBuffer(gl.ARRAY_BUFFER, value);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW); return value;
    };
    const lineBuffer = buffer(lines), pointBuffer = buffer(points);
    const attributes = [gl.getAttribLocation(program, "position"), gl.getAttribLocation(program, "arrival"), gl.getAttribLocation(program, "strength")];
    attributes.forEach((attribute) => gl.enableVertexAttribArray(attribute));
    const uniforms = Object.fromEntries(["aspect", "camera", "pointer", "dpr", "spread", "points"].map((key) => [key, gl.getUniformLocation(program, key)]));
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const ratio = Math.min(devicePixelRatio || 1, dprCap, 1920 / Math.max(width, 1));
      canvas.width = Math.max(1, Math.round(width * ratio)); canvas.height = Math.max(1, Math.round(height * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform1f(uniforms.aspect, canvas.width / canvas.height); gl.uniform1f(uniforms.dpr, ratio);
    };
    const draw = (source: WebGLBuffer, mode: number, count: number) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, source);
      gl.vertexAttribPointer(attributes[0], 3, gl.FLOAT, false, 20, 0);
      gl.vertexAttribPointer(attributes[1], 1, gl.FLOAT, false, 20, 12);
      gl.vertexAttribPointer(attributes[2], 1, gl.FLOAT, false, 20, 16);
      gl.drawArrays(mode, 0, count);
    };
    resize();
    let verified = false;
    return { resize, dispose, releaseContext, render({ progress, x, y }: NetworkFrame) {
      if (disposed || gl.isContextLost()) return false;
      gl.clear(gl.COLOR_BUFFER_BIT); gl.uniform1f(uniforms.camera, progress);
      gl.uniform2f(uniforms.pointer, x, y); gl.uniform1f(uniforms.spread, compromiseAt(progress));
      gl.uniform1f(uniforms.points, 0); draw(lineBuffer, gl.LINES, lines.length / 5);
      gl.uniform1f(uniforms.points, 1); draw(pointBuffer, gl.POINTS, points.length / 5);
      if (!verified && gl.getError() !== gl.NO_ERROR) throw new Error("Network rendering failed");
      verified = true;
      return true;
    } };
  } catch (error) { dispose(); throw error; }
}
