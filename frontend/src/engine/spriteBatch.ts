/** Three RGBA texels per sprite, uploaded directly from borrowed WASM records. */
export class SpriteBatch {
  private readonly texture: WebGLTexture;
  private rows = 0;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.texture = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.activeTexture(gl.TEXTURE0);
  }

  upload(records: Float32Array) {
    const gl = this.gl;
    const count = records.length / 12;
    const fullRows = Math.floor(count / 256),
      remainder = count % 256;
    const rows = Math.max(1, Math.ceil(count / 256));
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    if (rows > this.rows) {
      this.rows = Math.max(rows, this.rows * 2);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 768, this.rows, 0, gl.RGBA, gl.FLOAT, null);
    }
    if (fullRows)
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        768,
        fullRows,
        gl.RGBA,
        gl.FLOAT,
        records.subarray(0, fullRows * 256 * 12)
      );
    if (remainder)
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        fullRows,
        remainder * 3,
        1,
        gl.RGBA,
        gl.FLOAT,
        records.subarray(fullRows * 256 * 12)
      );
    gl.activeTexture(gl.TEXTURE0);
  }

  dispose() {
    this.gl.deleteTexture(this.texture);
  }
}
