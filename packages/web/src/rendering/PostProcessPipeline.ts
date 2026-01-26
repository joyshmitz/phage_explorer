import { VERTEX_SHADER, CRT_FRAGMENT_SHADER } from './shaders';

export interface PostProcessOptions {
  reducedMotion?: boolean;
  enableScanlines?: boolean;
  enableBloom?: boolean;
  enableChromaticAberration?: boolean;
  scanlineIntensity?: number;
  bloomIntensity?: number;
  aberrationOffset?: number;
}

export class PostProcessPipeline {
  private opts: PostProcessOptions;
  private glCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private textureUniform: WebGLUniformLocation | null = null;
  private uTime = 0;
  private disabled = false;

  constructor(opts: PostProcessOptions = {}) {
    this.opts = {
      reducedMotion: false,
      enableScanlines: false,
      enableBloom: false,
      enableChromaticAberration: false,
      scanlineIntensity: 0.06,
      bloomIntensity: 0.4,
      aberrationOffset: 1.5,
      ...opts,
    };
  }

  updateOptions(opts: PostProcessOptions): void {
    Object.assign(this.opts, opts);
  }

  private initWebGL(): void {
    if (this.gl || this.disabled) return;

    try {
      const contextOptions = {
        alpha: false,
        desynchronized: true,
        antialias: false,
      };
      let canvas: OffscreenCanvas | HTMLCanvasElement | null = null;
      let gl: WebGL2RenderingContext | null = null;

      // Prefer DOM canvas when `document` exists (window context). OffscreenCanvas support on
      // iOS Safari is still inconsistent, especially when used as a `drawImage()` source.
      if (typeof document !== 'undefined') {
        const domCanvas = document.createElement('canvas');
        const domGl = domCanvas.getContext('webgl2', contextOptions) as WebGL2RenderingContext | null;
        if (domGl) {
          canvas = domCanvas;
          gl = domGl;
        }
      }

      if (!gl && typeof OffscreenCanvas !== 'undefined') {
        try {
          const offscreen = new OffscreenCanvas(1, 1);
          const offscreenGl = offscreen.getContext('webgl2', contextOptions) as WebGL2RenderingContext | null;
          if (offscreenGl) {
            canvas = offscreen;
            gl = offscreenGl;
          }
        } catch {
          // Ignore: we'll treat this as unsupported below.
        }
      }

      if (!gl || !canvas) {
        throw new Error('WebGL2 not supported');
      }

      this.glCanvas = canvas;
      this.gl = gl;

      // Compile Shaders
      const vert = this.compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      const frag = this.compileShader(gl, gl.FRAGMENT_SHADER, CRT_FRAGMENT_SHADER);

      this.program = gl.createProgram();
      if (!this.program) {
        throw new Error('Failed to create WebGL program');
      }

      gl.attachShader(this.program, vert);
      gl.attachShader(this.program, frag);
      gl.linkProgram(this.program);

      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
        throw new Error('Program link failed: ' + gl.getProgramInfoLog(this.program));
      }

      // Setup Geometry (Full-screen quad)
      const positions = new Float32Array([
        -1, -1,
        1, -1,
        -1,  1,
        -1,  1,
        1, -1,
        1,  1,
      ]);

      this.positionBuffer = gl.createBuffer();
      if (!this.positionBuffer) {
        throw new Error('Failed to create position buffer');
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

      this.vao = gl.createVertexArray();
      if (!this.vao) {
        throw new Error('Failed to create vertex array');
      }

      gl.bindVertexArray(this.vao);

      const positionLoc = gl.getAttribLocation(this.program, 'a_position');
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

      // Create Texture
      this.texture = gl.createTexture();
      if (!this.texture) {
        throw new Error('Failed to create texture');
      }

      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      // Bind texture sampler explicitly to unit 0 (some drivers are picky about defaults).
      gl.useProgram(this.program);
      this.textureUniform = gl.getUniformLocation(this.program, 'u_texture');
      if (this.textureUniform) {
        gl.uniform1i(this.textureUniform, 0);
      }

    } catch (e) {
      console.error('Failed to init PostProcessPipeline:', e);
      this.gl = null;
      this.disabled = true; // Prevent repeated retries on unsupported devices
    }
  }

  private compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error('Failed to create shader');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('Shader compile failed: ' + log);
    }
    return shader;
  }

  /**
   * Process the source image and render to the destination canvas.
   * 
   * @param source The source image (can be OffscreenCanvas, ImageBitmap, etc.)
   * @param destination The destination canvas to render the final result to
   * @returns boolean True if processing occurred, false if skipped (e.g. reduced motion)
   */
  process(source: TexImageSource, destination: HTMLCanvasElement | OffscreenCanvas): boolean {
    if (
      this.disabled ||
      this.opts.reducedMotion ||
      (!this.opts.enableScanlines && !this.opts.enableChromaticAberration && !this.opts.enableBloom)
    ) {
      return false;
    }

    this.initWebGL();
    const gl = this.gl;
    if (!gl || !this.program || !this.glCanvas || !this.texture || !this.vao) return false;
    if (typeof gl.isContextLost === 'function' && gl.isContextLost()) {
      this.disabled = true;
      return false;
    }

    const width = destination.width;
    const height = destination.height;

    // Resize WebGL canvas if needed
    if (this.glCanvas.width !== width || this.glCanvas.height !== height) {
      this.glCanvas.width = width;
      this.glCanvas.height = height;
      gl.viewport(0, 0, width, height);
    }

    // Upload texture
    try {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    } catch {
      // Texture uploads can fail for unsupported TexImageSource types on some browsers/GPU combos.
      this.disabled = true;
      return false;
    }

    // Draw
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    // Uniforms
    gl.uniform2f(gl.getUniformLocation(this.program, 'u_resolution'), width, height);
    gl.uniform1f(gl.getUniformLocation(this.program, 'u_time'), this.uTime);
    gl.uniform1f(
      gl.getUniformLocation(this.program, 'u_scanlineIntensity'),
      this.opts.enableScanlines ? (this.opts.scanlineIntensity ?? 0.06) : 0.0
    );
    gl.uniform1f(
      gl.getUniformLocation(this.program, 'u_aberrationOffset'),
      this.opts.enableChromaticAberration ? (this.opts.aberrationOffset ?? 1.5) : 0.0
    );
    gl.uniform1f(
      gl.getUniformLocation(this.program, 'u_bloomIntensity'),
      this.opts.enableBloom ? (this.opts.bloomIntensity ?? 0.4) : 0.0
    );

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    const glError = gl.getError();
    if (glError !== gl.NO_ERROR) {
      this.disabled = true;
      return false;
    }

    // Copy back to destination 2D canvas
    const ctx = destination.getContext('2d');
    if (!ctx) {
      this.disabled = true;
      return false;
    }

    try {
      ctx.globalCompositeOperation = 'copy';
      // Cast to CanvasImageSource because OffscreenCanvas types can be tricky
      ctx.drawImage(this.glCanvas as unknown as CanvasImageSource, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    } catch {
      this.disabled = true;
      return false;
    }

    this.uTime += 0.01;
    return true;
  }

  /**
   * Release WebGL resources and GPU context when possible.
   * Safe to call multiple times.
   */
  dispose(): void {
    if (!this.gl) {
      this.glCanvas = null;
      this.program = null;
      this.texture = null;
      this.positionBuffer = null;
      this.vao = null;
      this.textureUniform = null;
      return;
    }

    try {
      if (this.program) this.gl.deleteProgram(this.program);
      if (this.texture) this.gl.deleteTexture(this.texture);
      if (this.positionBuffer) this.gl.deleteBuffer(this.positionBuffer);
      if (this.vao) this.gl.deleteVertexArray(this.vao);

      this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    } finally {
      this.gl = null;
      this.glCanvas = null;
      this.program = null;
      this.texture = null;
      this.positionBuffer = null;
      this.vao = null;
      this.textureUniform = null;
    }
  }
}

export default PostProcessPipeline;
