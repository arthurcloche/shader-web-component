export class ShaderComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.canvas = document.createElement("canvas");
    this.gl = null;
    this.program = null;
    this.uniforms = {};
    this.startTime = Date.now();
    this.resizeObserver = null;
    this.intersectionObserver = null;
    this.isVisible = false;
    this.pausedTime = 0;
    this.totalPausedTime = 0;
    this.lastPauseTime = 0;
    this.mousePosition = [0, 0];
    this.isInitialized = false;

    // Default vertex shader (simple passthrough)
    this.vertexShaderSource = `#version 300 es
    in vec4 aPosition;
    out vec2 vUv;

    void main() {
      vUv = aPosition.xy * 0.5 + 0.5;
      gl_Position = aPosition;
    }`;

    // Default fragment shader (will be overridden)
    this.fragmentShaderSource = `#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 fragColor;
    uniform vec2 uResolution;
    uniform float uTime;

    void main() {
      fragColor = vec4(vUv, 0.5, 1.0);
    }`;
  }

  connectedCallback() {
    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        position: relative;
      }
      canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
    `;

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(this.canvas);

    // Add event listeners for mouse position
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.canvas.addEventListener("mouseleave", () => {
      this.mousePosition = [0, 0];
    });

    // Get attributes
    this.width = parseInt(this.getAttribute("width") || "400");
    this.height = parseInt(this.getAttribute("height") || "300");

    // Set canvas size
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Initialize WebGL - we'll delay this to avoid immediate context creation
    // until we're sure the element is visible
    this.setupObservers();

    // Start in visible state (assume visible on connect)
    // but wait a tick to initialize to avoid context creation on hidden elements
    this.isVisible = true;
    setTimeout(() => this.checkVisibilityAndInitialize(), 100);
  }

  setupObservers() {
    // Set up resize observer
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this) {
          this.handleResize();
        }
      }
    });
    this.resizeObserver.observe(this);

    // Set up intersection observer
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === this) {
            this.handleVisibilityChange(entry.isIntersecting);
          }
        }
      },
      { threshold: 0.1 }
    );
    this.intersectionObserver.observe(this);
  }

  checkVisibilityAndInitialize() {
    if (this.isVisible && !this.isInitialized) {
      this.initWebGL();
      this.isInitialized = true;
      this.render();
    }
  }

  disconnectedCallback() {
    // Remove event listeners
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);

    // Disconnect observers
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    // Cancel animation frame
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    // Clean up WebGL context
    if (this.gl) {
      const loseContext = this.gl.getExtension("WEBGL_lose_context");
      if (loseContext) {
        loseContext.loseContext();
      }
    }
  }

  handleMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePosition = [
      event.clientX - rect.left,
      this.canvas.height - (event.clientY - rect.top), // Flip Y for WebGL coordinate system
    ];
  }

  handleVisibilityChange(isVisible) {
    if (isVisible === this.isVisible) return;

    this.isVisible = isVisible;

    if (isVisible) {
      // Component became visible, resume rendering and initialize if needed
      if (this.lastPauseTime > 0) {
        this.totalPausedTime += Date.now() - this.lastPauseTime;
        this.lastPauseTime = 0;
      }

      this.checkVisibilityAndInitialize();

      if (this.isInitialized) {
        this.render();
      }
    } else {
      // Component became invisible, pause rendering
      this.lastPauseTime = Date.now();
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
    }
  }

  initWebGL() {
    // Only initialize once
    if (this.gl) return;

    try {
      // Initialize WebGL2 context with preserveDrawingBuffer: true
      this.gl = this.canvas.getContext("webgl2", {
        preserveDrawingBuffer: true,
        antialias: true,
        powerPreference: "high-performance",
      });

      if (!this.gl) {
        console.error("WebGL2 not supported");
        return;
      }

      // Create a full viewport quad (triangle strip)
      const vertices = new Float32Array([
        -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0,
      ]);

      // Create and bind vertex buffer
      const vertexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

      // Create shader program
      this.program = this.createShaderProgram();
      if (!this.program) {
        console.error("Failed to create shader program");
        return;
      }

      // Set up vertex attributes
      const aPosition = this.gl.getAttribLocation(this.program, "aPosition");
      this.gl.enableVertexAttribArray(aPosition);
      this.gl.vertexAttribPointer(aPosition, 2, this.gl.FLOAT, false, 0, 0);

      // Set up common uniforms
      this.uniforms = {};

      this.uniforms.uTime = this.gl.getUniformLocation(this.program, "uTime");
      this.uniforms.iResolution = this.gl.getUniformLocation(
        this.program,
        "iResolution"
      );
      this.uniforms.iTime = this.gl.getUniformLocation(this.program, "iTime");
      this.uniforms.iMouse = this.gl.getUniformLocation(this.program, "iMouse");
    } catch (e) {
      console.error("Error initializing WebGL:", e);
    }
  }

  createShaderProgram() {
    const gl = this.gl;
    if (!gl) return null;

    try {
      // Create shaders
      const vertexShader = this.createShader(
        gl.VERTEX_SHADER,
        this.vertexShaderSource
      );
      const fragmentShader = this.createShader(
        gl.FRAGMENT_SHADER,
        this.fragmentShaderSource
      );

      if (!vertexShader || !fragmentShader) {
        return null;
      }

      // Create program
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      // Check for errors
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        console.error("Could not link WebGL program:", info);
        gl.deleteProgram(program);
        return null;
      }

      return program;
    } catch (e) {
      console.error("Error creating shader program:", e);
      return null;
    }
  }

  createShader(type, source) {
    const gl = this.gl;
    if (!gl) return null;

    try {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      // Check for errors
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        const typeStr = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
        console.error(`Could not compile ${typeStr} shader:`, info);
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    } catch (e) {
      console.error("Error creating shader:", e);
      return null;
    }
  }

  setFragmentShader(source) {
    this.fragmentShaderSource = source;

    // If GL is initialized, recreate the program
    if (this.gl && this.program) {
      try {
        // Delete old program
        this.gl.deleteProgram(this.program);

        // Create new program
        this.program = this.createShaderProgram();
        if (!this.program) {
          console.error("Failed to recreate shader program");
          return;
        }

        // Re-initialize uniforms
        this.uniforms = {};
        this.uniforms.uResolution = this.gl.getUniformLocation(
          this.program,
          "uResolution"
        );
        this.uniforms.uTime = this.gl.getUniformLocation(this.program, "uTime");
        this.uniforms.iResolution = this.gl.getUniformLocation(
          this.program,
          "iResolution"
        );
        this.uniforms.iTime = this.gl.getUniformLocation(this.program, "iTime");
        this.uniforms.iMouse = this.gl.getUniformLocation(
          this.program,
          "iMouse"
        );
      } catch (e) {
        console.error("Error setting fragment shader:", e);
      }
    }
  }

  addUniform(name, type, value) {
    if (!this.gl || !this.program) return;

    try {
      const uniformLocation = this.gl.getUniformLocation(this.program, name);
      if (!uniformLocation) {
        console.warn(`Uniform '${name}' not found in shader program.`);
        return;
      }

      this.uniforms[name] = {
        location: uniformLocation,
        type: type,
        value: value,
      };
    } catch (e) {
      console.error(`Error adding uniform ${name}:`, e);
    }
  }

  setUniform(name, value) {
    if (!this.gl || !this.program || !this.uniforms[name]) return;
    this.uniforms[name].value = value;
  }

  updateUniforms() {
    if (!this.gl || !this.program) return;

    try {
      this.gl.useProgram(this.program);

      // Set resolution uniforms (support both naming conventions)
      const width = this.canvas.width;
      const height = this.canvas.height;

      if (this.uniforms.uResolution) {
        this.gl.uniform2f(this.uniforms.uResolution, width, height);
      }

      if (this.uniforms.iResolution) {
        this.gl.uniform2f(this.uniforms.iResolution, width, height);
      }

      // Set time uniforms (support both naming conventions)
      const time = (Date.now() - this.startTime - this.totalPausedTime) / 1000;

      if (this.uniforms.uTime) {
        this.gl.uniform1f(this.uniforms.uTime, time);
      }

      if (this.uniforms.iTime) {
        this.gl.uniform1f(this.uniforms.iTime, time);
      }

      // Set mouse position uniform
      if (this.uniforms.iMouse) {
        this.gl.uniform2f(
          this.uniforms.iMouse,
          this.mousePosition[0],
          this.mousePosition[1]
        );
      }

      // Set custom uniforms
      for (const name in this.uniforms) {
        if (
          name === "uResolution" ||
          name === "uTime" ||
          name === "iResolution" ||
          name === "iTime" ||
          name === "iMouse"
        )
          continue;

        const uniform = this.uniforms[name];
        try {
          if (uniform.type === "float") {
            this.gl.uniform1f(uniform.location, uniform.value);
          } else if (uniform.type === "bool") {
            this.gl.uniform1i(uniform.location, uniform.value ? 1 : 0);
          } else if (uniform.type === "vec2") {
            this.gl.uniform2f(
              uniform.location,
              uniform.value[0],
              uniform.value[1]
            );
          }
        } catch (e) {
          console.error(`Error updating uniform ${name}:`, e);
        }
      }
    } catch (e) {
      console.error("Error updating uniforms:", e);
    }
  }

  render = () => {
    if (!this.gl || !this.program || !this.isVisible || !this.isInitialized)
      return;

    try {
      this.updateUniforms();

      // Draw the quad
      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

      // Continue render loop
      this.animationFrame = requestAnimationFrame(this.render);
    } catch (e) {
      console.error("Error in render loop:", e);
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  };

  handleResize() {
    // Get the actual computed size of the component
    const computedStyle = window.getComputedStyle(this);
    const width = parseInt(computedStyle.width);
    const height = parseInt(computedStyle.height);

    // Update canvas size if needed
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      if (this.gl) {
        this.gl.viewport(0, 0, width, height);
      }
    }
  }
}

// Register the custom element
customElements.define("shader-component", ShaderComponent);
