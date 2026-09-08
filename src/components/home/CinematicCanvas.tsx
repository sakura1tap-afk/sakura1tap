import { useEffect, useRef } from "react";

type CinematicCanvasProps = {
  progressRef: { current: number };
  onReady?: () => void;
};

const vertexShaderSource = `
  attribute vec2 aPosition;
  varying vec2 vUv;

  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;

  uniform sampler2D uBridge;
  uniform sampler2D uCloseup;
  uniform vec2 uResolution;
  uniform vec2 uBridgeResolution;
  uniform vec2 uCloseupResolution;
  uniform vec2 uPointer;
  uniform vec2 uDrag;
  uniform float uTime;
  uniform float uProgress;
  uniform float uImpact;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  vec2 coverUv(vec2 uv, vec2 viewport, vec2 image) {
    float viewportRatio = viewport.x / viewport.y;
    float imageRatio = image.x / image.y;
    vec2 scale = vec2(1.0);
    if (viewportRatio > imageRatio) {
      scale.y = imageRatio / viewportRatio;
    } else {
      scale.x = viewportRatio / imageRatio;
    }
    return (uv - 0.5) * scale + 0.5;
  }

  vec3 sampleScene(sampler2D textureMap, vec2 uv, vec2 textureResolution, float zoom, vec2 drift) {
    vec2 covered = coverUv(uv, uResolution, textureResolution);
    covered = (covered - 0.5) / zoom + 0.5 + drift;
    return texture2D(textureMap, covered).rgb;
  }

  void main() {
    vec2 uv = vUv;
    vec2 pointer = uPointer;
    vec2 delta = uv - pointer;
    delta.x *= uResolution.x / uResolution.y;
    float distanceToPointer = max(length(delta), 0.001);
    vec2 direction = normalize(delta);

    float pulse = sin(distanceToPointer * 78.0 - uTime * 4.2);
    float falloff = exp(-distanceToPointer * 8.5);
    float pointerField = smoothstep(0.48, 0.0, distanceToPointer);
    float ripple = pulse * falloff * (0.002 + uImpact * 0.005);
    vec2 distortion = direction * ripple;

    float proximity = smoothstep(0.12, 0.42, uProgress);
    float archive = smoothstep(0.42, 0.64, uProgress);
    float afterimage = smoothstep(0.66, 0.88, uProgress);
    float blend = clamp(proximity - archive * 0.22 + afterimage * 0.18, 0.0, 1.0);

    float slowBreath = sin(uTime * 0.34) * 0.004;
    vec2 bridgeDrift = vec2(uDrag.x * 0.16, uDrag.y * 0.10) + (uPointer - 0.5) * vec2(-0.012, -0.006);
    vec2 closeDrift = vec2(uDrag.x * -0.10, uDrag.y * -0.06) + (uPointer - 0.5) * vec2(0.008, 0.004);

    vec2 bridgeUv = uv + distortion * (1.0 - blend * 0.4);
    vec2 closeUv = uv - distortion * (0.75 + blend * 0.25);
    vec3 bridge = sampleScene(uBridge, bridgeUv, uBridgeResolution, 1.025 + slowBreath + uProgress * 0.035, bridgeDrift);
    vec3 closeup = sampleScene(uCloseup, closeUv, uCloseupResolution, 1.02 + blend * 0.11 - slowBreath, closeDrift);
    vec3 color = mix(bridge, closeup, smoothstep(0.05, 0.95, blend));

    float chroma = pointerField * (0.0012 + uImpact * 0.0035);
    vec2 redOffset = direction * chroma;
    vec3 bridgeRed = sampleScene(uBridge, bridgeUv + redOffset, uBridgeResolution, 1.025 + slowBreath + uProgress * 0.035, bridgeDrift);
    vec3 closeRed = sampleScene(uCloseup, closeUv + redOffset, uCloseupResolution, 1.02 + blend * 0.11 - slowBreath, closeDrift);
    vec3 shifted = mix(bridgeRed, closeRed, smoothstep(0.05, 0.95, blend));
    color.r = shifted.r;

    float grain = hash(gl_FragCoord.xy + floor(uTime * 18.0)) - 0.5;
    color += grain * 0.026;
    color.b *= 1.06;
    color.r *= 1.01 + uImpact * 0.025;

    float vignette = smoothstep(0.96, 0.22, distance(vUv, vec2(0.5)));
    color *= mix(0.52, 1.0, vignette);
    color *= 0.82 + pointerField * 0.12 + uImpact * falloff * 0.08;
    color = mix(color, vec3(dot(color, vec3(0.299, 0.587, 0.114))), afterimage * 0.18);
    color *= vec3(0.86, 0.94, 0.97);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function CinematicCanvas({ progressRef, onReady }: CinematicCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      onReady?.();
      return;
    }

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: "high-performance",
      premultipliedAlpha: false,
    });

    if (!gl) {
      onReady?.();
      return;
    }

    gl.clearColor(0.008, 0.016, 0.018, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let frame = 0;
    let disposed = false;
    let startedAt = performance.now();
    let impact = 0;
    let dragActive = false;
    let lastPointer = { x: 0, y: 0 };
    const pointer = { x: 0.5, y: 0.5 };
    const pointerTarget = { x: 0.5, y: 0.5 };
    const drag = { x: 0, y: 0 };
    const dragTarget = { x: 0, y: 0 };

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Unable to create WebGL shader");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader) ?? "Unknown shader error";
        gl.deleteShader(shader);
        throw new Error(message);
      }
      return shader;
    };

    let vertexShader: WebGLShader;
    let fragmentShader: WebGLShader;
    let program: WebGLProgram;

    try {
      vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
      fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
      const nextProgram = gl.createProgram();
      if (!nextProgram) throw new Error("Unable to create WebGL program");
      program = nextProgram;
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) ?? "Unable to link WebGL program");
      }
    } catch {
      onReady?.();
      return;
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    gl.useProgram(program);
    const positionLocation = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      resolution: gl.getUniformLocation(program, "uResolution"),
      bridgeResolution: gl.getUniformLocation(program, "uBridgeResolution"),
      closeupResolution: gl.getUniformLocation(program, "uCloseupResolution"),
      pointer: gl.getUniformLocation(program, "uPointer"),
      drag: gl.getUniformLocation(program, "uDrag"),
      time: gl.getUniformLocation(program, "uTime"),
      progress: gl.getUniformLocation(program, "uProgress"),
      impact: gl.getUniformLocation(program, "uImpact"),
      bridge: gl.getUniformLocation(program, "uBridge"),
      closeup: gl.getUniformLocation(program, "uCloseup"),
    };

    const createTexture = (url: string) => new Promise<{ texture: WebGLTexture; width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        const texture = gl.createTexture();
        if (!texture) {
          reject(new Error("Unable to create WebGL texture"));
          return;
        }
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        resolve({ texture, width: image.naturalWidth, height: image.naturalHeight });
      };
      image.onerror = reject;
      image.src = url;
    });

    const mobile = window.matchMedia("(max-width: 760px)").matches;
    const bridgeUrl = mobile ? "/cinematic/awakening-mobile.webp" : "/cinematic/bridge.webp";
    const closeupUrl = mobile ? "/cinematic/scene-mobile.webp" : "/cinematic/closeup.webp";
    let bridgeTexture: WebGLTexture | undefined;
    let closeupTexture: WebGLTexture | undefined;

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.25);
      const width = Math.max(1, Math.floor(canvas.clientWidth * pixelRatio));
      const height = Math.max(1, Math.floor(canvas.clientHeight * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerTarget.x = event.clientX / window.innerWidth;
      pointerTarget.y = 1 - event.clientY / window.innerHeight;
      if (!dragActive) return;
      const deltaX = (event.clientX - lastPointer.x) / window.innerWidth;
      const deltaY = (event.clientY - lastPointer.y) / window.innerHeight;
      dragTarget.x = Math.max(-0.17, Math.min(0.17, dragTarget.x + deltaX * 0.55));
      dragTarget.y = Math.max(-0.11, Math.min(0.11, dragTarget.y - deltaY * 0.4));
      lastPointer = { x: event.clientX, y: event.clientY };
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || event.pointerType === "touch" || (event.target as HTMLElement).closest("a,button")) return;
      dragActive = true;
      impact = 1;
      lastPointer = { x: event.clientX, y: event.clientY };
      document.documentElement.dataset.dragging = "true";
    };

    const onPointerUp = () => {
      dragActive = false;
      delete document.documentElement.dataset.dragging;
    };

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    Promise.all([createTexture(bridgeUrl), createTexture(closeupUrl)]).then(([bridgeAsset, closeupAsset]) => {
      if (disposed) return;
      bridgeTexture = bridgeAsset.texture;
      closeupTexture = closeupAsset.texture;
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, bridgeTexture);
      gl.uniform1i(uniforms.bridge, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, closeupTexture);
      gl.uniform1i(uniforms.closeup, 1);
      gl.uniform2f(uniforms.bridgeResolution, bridgeAsset.width, bridgeAsset.height);
      gl.uniform2f(uniforms.closeupResolution, closeupAsset.width, closeupAsset.height);
      startedAt = performance.now();

      const render = (now: number) => {
        if (disposed) return;
        resize();
        pointer.x += (pointerTarget.x - pointer.x) * 0.075;
        pointer.y += (pointerTarget.y - pointer.y) * 0.075;
        drag.x += (dragTarget.x - drag.x) * 0.065;
        drag.y += (dragTarget.y - drag.y) * 0.065;
        if (!dragActive) {
          dragTarget.x *= 0.975;
          dragTarget.y *= 0.975;
        }
        impact *= 0.94;

        gl.useProgram(program);
        gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
        gl.uniform2f(uniforms.pointer, pointer.x, pointer.y);
        gl.uniform2f(uniforms.drag, drag.x, drag.y);
        gl.uniform1f(uniforms.time, (now - startedAt) / 1000);
        gl.uniform1f(uniforms.progress, progressRef.current);
        gl.uniform1f(uniforms.impact, impact);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        frame = requestAnimationFrame(render);
      };

      canvas.dataset.ready = "true";
      onReady?.();
      frame = requestAnimationFrame(render);
    }).catch(() => onReady?.());

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      delete document.documentElement.dataset.dragging;
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      if (bridgeTexture) gl.deleteTexture(bridgeTexture);
      if (closeupTexture) gl.deleteTexture(closeupTexture);
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [onReady, progressRef]);

  return <canvas className="cinematic-canvas" ref={canvasRef} aria-hidden="true" />;
}
