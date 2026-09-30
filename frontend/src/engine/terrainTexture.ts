export interface TerrainDisplay {
  values: Float32Array;
  nx: number;
  ny: number;
  revision: number;
}

/** Static overview on unit 2; uploads borrow the local WASM or remote packet view. */
export class TerrainTexture {
  private readonly texture: WebGLTexture;
  private revision = 0;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.texture = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.activeTexture(gl.TEXTURE0);
  }

  upload(terrain: TerrainDisplay) {
    if (terrain.revision === this.revision) return 0;
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA32F,
      terrain.nx,
      terrain.ny,
      0,
      gl.RGBA,
      gl.FLOAT,
      terrain.values
    );
    gl.activeTexture(gl.TEXTURE0);
    this.revision = terrain.revision;
    return terrain.values.byteLength;
  }

  reset() {
    this.revision = 0;
  }

  dispose() {
    this.gl.deleteTexture(this.texture);
  }
}
