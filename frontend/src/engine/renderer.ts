import { type EngineWorld } from "./client";
import { cellFragment, cellVertex, fieldFragment, fieldVertex } from "./shaders";
import { SpriteBatch } from "./spriteBatch";

export interface Camera {
  x: number;
  y: number;
  scale: number;
}
export interface ViewOptions {
  width: number;
  height: number;
  camera: Camera;
  field: number;
  species: number;
  color: number;
  exposure: number;
  selected: number;
  layers: boolean[];
  regions: boolean;
  sources: boolean;
}
function shader(gl: WebGL2RenderingContext, type: number, source: string) {
  const value = gl.createShader(type)!;
  gl.shaderSource(value, source);
  gl.compileShader(value);
  if (!gl.getShaderParameter(value, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(value) ?? "Shader compilation failed");
  return value;
}
function illuminationMode(layers: boolean[]) {
  if (layers[6]) return 1;
  if (layers[7]) return 2;
  return layers[8] ? 3 : 0;
}
function program(gl: WebGL2RenderingContext, vertex: string, fragment: string) {
  const p = gl.createProgram()!;
  const stages = [shader(gl, gl.VERTEX_SHADER, vertex), shader(gl, gl.FRAGMENT_SHADER, fragment)];
  stages.forEach((s) => gl.attachShader(p, s));
  gl.linkProgram(p);
  stages.forEach((s) => gl.deleteShader(s));
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(p) ?? "Shader linking failed");
  return p;
}

/** Owns the transferred canvas in the same worker as WASM. CPU views are borrowed, never cloned. */
export class Renderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly fieldProgram: WebGLProgram;
  private readonly cellProgram: WebGLProgram;
  private readonly texture: WebGLTexture;
  private readonly sprites: SpriteBatch;
  private readonly empty: WebGLVertexArrayObject;
  private textureSize = "";
  private pending: WebGLSync | null = null;
  private refreshPending = false;
  private fieldKind = -1;

  constructor(private readonly canvas: OffscreenCanvas) {
    // Circle edges are smoothed in the fragment shader; a multisample framebuffer
    // adds a separate resolve for every presented frame without adding cell detail.
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: false });
    if (!gl) throw new Error("Antropy requires worker WebGL2 rendering");
    this.gl = gl;
    this.fieldProgram = program(gl, fieldVertex, fieldFragment);
    this.cellProgram = program(gl, cellVertex, cellFragment);
    this.texture = gl.createTexture()!;
    this.sprites = new SpriteBatch(gl);
    this.empty = gl.createVertexArray()!;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  }

  draw(world: EngineWorld, size: [number, number], options: ViewOptions, refreshField: boolean) {
    const gl = this.gl;
    if (gl.isContextLost())
      throw new Error("Graphics context lost; simulation paused with its state retained");
    this.refreshPending ||= refreshField;
    if (!this.ready()) return null;
    refreshField = this.refreshPending;
    this.refreshPending = false;
    const kind = illuminationMode(options.layers) > 0 ? 6 : 5;
    refreshField ||= kind !== this.fieldKind;
    this.fieldKind = kind;
    if (this.canvas.width !== options.width) this.canvas.width = options.width;
    if (this.canvas.height !== options.height) this.canvas.height = options.height;
    gl.viewport(0, 0, options.width, options.height);
    const frame = world.render(
      kind,
      options.species,
      options.color,
      refreshField,
      Math.max(0, options.selected)
    );
    this.upload(frame, refreshField);
    this.drawField(size, options);
    this.drawCells(size, options, frame.count);
    this.drawMarkers(size, options, frame.markers, frame.markerCount);
    this.drawShadow(size, options);
    this.pending = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!this.pending) throw new Error("Graphics completion fence unavailable");
    gl.flush();
    return {
      tick: frame.tick,
      uploadedBytes:
        frame.cells.byteLength +
        frame.markers.byteLength +
        (refreshField ? frame.field.byteLength : 0),
    };
  }

  private upload(frame: ReturnType<EngineWorld["render"]>, refresh: boolean) {
    const gl = this.gl;
    this.sprites.upload(frame.cells);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    const key = `${frame.nx}:${frame.ny}`;
    if (key !== this.textureSize) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA32F,
        frame.nx * 2,
        frame.ny,
        0,
        gl.RGBA,
        gl.FLOAT,
        frame.field
      );
      this.textureSize = key;
    } else if (refresh)
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        frame.nx * 2,
        frame.ny,
        gl.RGBA,
        gl.FLOAT,
        frame.field
      );
  }

  private ready() {
    if (!this.pending) return true;
    const gl = this.gl;
    const state = gl.clientWaitSync(this.pending, 0, 0);
    if (state === gl.WAIT_FAILED) throw new Error("Graphics completion check failed");
    if (state === gl.TIMEOUT_EXPIRED) return false;
    gl.deleteSync(this.pending);
    this.pending = null;
    return true;
  }

  private common(p: WebGLProgram, o: ViewOptions) {
    const gl = this.gl;
    gl.useProgram(p);
    gl.uniform2f(gl.getUniformLocation(p, "viewport"), o.width, o.height);
    gl.uniform3f(gl.getUniformLocation(p, "camera"), o.camera.x, o.camera.y, o.camera.scale);
  }
  private drawMarkers(
    size: [number, number],
    o: ViewOptions,
    records: Float32Array,
    count: number
  ) {
    const gl = this.gl,
      p = this.cellProgram;
    this.sprites.upload(records);
    this.common(p, o);
    gl.bindVertexArray(this.empty);
    gl.uniform1i(gl.getUniformLocation(p, "records"), 1);
    gl.uniform1f(gl.getUniformLocation(p, "halo"), 2);
    gl.uniform1f(gl.getUniformLocation(p, "showSources"), Number(o.sources));
    gl.uniform1f(gl.getUniformLocation(p, "showDeaths"), Number(o.camera.scale >= 5));
    for (const x of [-size[0], 0, size[0]])
      for (const y of [-size[1], 0, size[1]]) {
        gl.uniform2f(gl.getUniformLocation(p, "offset"), x, y);
        gl.drawArrays(gl.TRIANGLES, 0, 6 * count);
      }
  }

  private drawShadow(size: [number, number], o: ViewOptions) {
    if (!o.layers[9] || illuminationMode(o.layers) > 0) return;
    this.drawField(size, o, true);
  }

  private drawField(size: [number, number], o: ViewOptions, shadow = false) {
    const gl = this.gl,
      p = this.fieldProgram;
    this.common(p, o);
    if (shadow) gl.enable(gl.BLEND);
    else gl.disable(gl.BLEND);
    gl.bindVertexArray(this.empty);
    gl.uniform2f(gl.getUniformLocation(p, "worldSize"), ...size);
    gl.uniform4f(
      gl.getUniformLocation(p, "layers"),
      Number(o.layers[0]),
      Number(o.layers[1]),
      Number(o.layers[2]),
      Number(o.layers[3])
    );
    gl.uniform1f(gl.getUniformLocation(p, "selectedLayer"), Number(o.layers[4]));
    gl.uniform1f(gl.getUniformLocation(p, "weatheringLayer"), Number(o.layers[5] ?? false));
    gl.uniform1i(gl.getUniformLocation(p, "illuminationMode"), illuminationMode(o.layers));
    gl.uniform1i(gl.getUniformLocation(p, "shadowPass"), Number(shadow));
    gl.uniform1f(gl.getUniformLocation(p, "exposure"), o.exposure);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private drawCells(size: [number, number], o: ViewOptions, count: number) {
    const gl = this.gl,
      p = this.cellProgram;
    this.common(p, o);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindVertexArray(this.empty);
    gl.uniform1i(gl.getUniformLocation(p, "records"), 1);
    gl.uniform1f(gl.getUniformLocation(p, "selected"), o.selected);
    gl.uniform2f(gl.getUniformLocation(p, "worldSize"), ...size);
    const detail = Math.min(1, o.camera.scale / 6);
    for (const halo of o.regions ? [1, 0] : [0]) {
      gl.uniform1f(gl.getUniformLocation(p, "halo"), halo);
      gl.uniform1f(
        gl.getUniformLocation(p, "opacity"),
        halo ? (1 - detail) * 0.32 : 0.2 + detail * 0.8
      );
      for (const x of [-size[0], 0, size[0]])
        for (const y of [-size[1], 0, size[1]]) {
          gl.uniform2f(gl.getUniformLocation(p, "offset"), x, y);
          gl.drawArrays(gl.TRIANGLES, 0, 6 * count);
        }
    }
  }

  dispose() {
    const gl = this.gl;
    if (this.pending) gl.deleteSync(this.pending);
    this.pending = null;
    gl.deleteProgram(this.fieldProgram);
    gl.deleteProgram(this.cellProgram);
    gl.deleteTexture(this.texture);
    this.sprites.dispose();
    gl.deleteVertexArray(this.empty);
  }
}
