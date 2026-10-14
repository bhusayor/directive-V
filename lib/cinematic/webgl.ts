/** A disposable 2D texture scene. No scene graph or always-running renderer. */
export function textureScene(canvas: HTMLCanvasElement, image: HTMLImageElement, dprCap: number) {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, powerPreference: "low-power" });
  if (!gl) throw new Error("WebGL unavailable");
  const cleanup: Array<() => void> = [];
  let disposed = false;
  const dispose = () => {
    if (disposed) return; disposed = true;
    cleanup.reverse().forEach((release) => release());
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
  try {
    const shader = (type: number, source: string) => {
      const value = gl.createShader(type);
      if (!value) throw new Error("Shader allocation failed");
      cleanup.push(() => gl.deleteShader(value)); gl.shaderSource(value, source); gl.compileShader(value);
      if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) throw new Error("Shader compilation failed");
      return value;
    };
    const vertex = shader(gl.VERTEX_SHADER, `attribute vec2 position; varying vec2 uv;
      void main(){ uv=position*.5+.5; gl_Position=vec4(position,0.,1.); }`);
    const fragment = shader(gl.FRAGMENT_SHADER, `precision mediump float; varying vec2 uv;
      uniform sampler2D picture; uniform vec2 cover; uniform float progress;
      void main(){
        vec2 p=(vec2(uv.x,1.-uv.y)-.5)*cover+.5;
        p.x += (1.-cover.x)*.13;
        float envelope=sin(progress*3.14159);
        float band=step(.65,fract(p.y*13.+progress*2.));
        p.x += band*envelope*.0015;
        vec3 c=texture2D(picture,p).rgb;
        c.r=texture2D(picture,p+vec2(envelope*.001,0.)).r;
        c.b=texture2D(picture,p-vec2(envelope*.001,0.)).b;
        gl_FragColor=vec4(c*(1.-progress)*.45,1.);
      }`);
    const program = gl.createProgram(), buffer = gl.createBuffer(), texture = gl.createTexture();
    if (program) cleanup.push(() => gl.deleteProgram(program));
    if (buffer) cleanup.push(() => gl.deleteBuffer(buffer));
    if (texture) cleanup.push(() => gl.deleteTexture(texture));
    if (!program || !buffer || !texture) throw new Error("GPU allocation failed");
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Program linking failed");
    gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    if (gl.getError() !== gl.NO_ERROR) throw new Error("Texture upload failed");
    const progress = gl.getUniformLocation(program, "progress"), cover = gl.getUniformLocation(program, "cover");
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(devicePixelRatio || 1, dprCap, 1920 / Math.max(bounds.width, 1));
      canvas.width = Math.max(1, Math.round(bounds.width * ratio)); canvas.height = Math.max(1, Math.round(bounds.height * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      const viewAspect = canvas.width / canvas.height, imageAspect = image.naturalWidth / image.naturalHeight;
      gl.uniform2f(cover, Math.min(1, viewAspect / imageAspect), Math.min(1, imageAspect / viewAspect));
    };
    resize();
    return { resize, dispose, render(value: number) {
      if (disposed || gl.isContextLost()) return;
      gl.uniform1f(progress, value); gl.drawArrays(gl.TRIANGLES, 0, 6);
    } };
  } catch (error) { dispose(); throw error; }
}
