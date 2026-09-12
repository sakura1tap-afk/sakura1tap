import { useEffect, useRef } from "react";

type CinematicCanvasProps = {
  progressRef: { current: number };
  /** 0..1 scroll speed, so the scene reacts while the page is moving. */
  velocityRef?: { current: number };
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

  uniform sampler2D uAwakening;
  uniform sampler2D uBridge;
  uniform sampler2D uCloseup;
  uniform vec2 uResolution;
  uniform vec2 uAwakeningResolution;
  uniform vec2 uBridgeResolution;
  uniform vec2 uCloseupResolution;
  uniform vec2 uPointer;
  uniform vec2 uDrag;
  uniform float uTime;
  uniform float uProgress;
  uniform float uImpact;
  uniform float uVelocity;
  varying vec2 vUv;

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

  /* Distance from uv to a point, corrected so ripples stay circular on any viewport. */
  float radialDistance(vec2 uv, vec2 point) {
    vec2 delta = uv - point;
    delta.x *= uResolution.x / uResolution.y;
    return length(delta);
  }

  void main() {
    vec2 uv = vUv;
    vec2 pointer = uPointer;
    vec2 delta = uv - pointer;
    delta.x *= uResolution.x / uResolution.y;
    float distanceToPointer = max(length(delta), 0.001);
    vec2 direction = normalize(delta);

    /*
     * "Rhythm" layer: a slow wave travels out from a focal point that itself drifts
     * around the frame, so the still image keeps breathing instead of sitting flat.
     */
    vec2 focal = vec2(0.5 + 0.2 * sin(uTime * 0.11), 0.46 + 0.13 * cos(uTime * 0.09));
    float focalDistance = radialDistance(uv, focal);
    vec2 focalDirection = normalize(vec2(uv.x - focal.x, (uv.y - focal.y) * 0.72) + 0.0001);
    float swell = 0.55 + 0.45 * sin(uTime * 0.21);
    float wave = sin(focalDistance * 20.0 - uTime * 1.15);
    // Scrolling drives the rhythm: the faster the page moves, the stronger the swell and
    // the shorter the wavelength, which reads as the world rushing past.
    float speed = clamp(uVelocity, 0.0, 1.0);
    float waveField = exp(-focalDistance * (2.35 + speed * 0.9)) * swell * (1.0 + speed * 2.4);
    vec2 rhythm = focalDirection * wave * waveField * 0.0062;

    /* Cursor ripple: concentric rings that ride the pointer. */
    float pointerRing = sin(distanceToPointer * 46.0 - uTime * 3.1);
    float pointerField = exp(-distanceToPointer * 5.4);
    vec2 cursorRipple = direction * pointerRing * pointerField * (0.006 + uImpact * 0.016);

    float archive = smoothstep(0.34, 0.58, uProgress);
    float afterimage = smoothstep(0.6, 0.66, uProgress);
    // A touch of vertical smear at speed, so fast scrolling is not a hard jump.
    vec2 smear = vec2(0.0, (uv.y - 0.5) * speed * 0.006);
    vec2 distortion = rhythm + cursorRipple + smear;

    float slowBreath = sin(uTime * 0.34) * 0.005;
    vec2 bridgeDrift = vec2(uDrag.x * 0.16, uDrag.y * 0.10) + (uPointer - 0.5) * vec2(-0.012, -0.006);
    vec2 closeDrift = vec2(uDrag.x * -0.10, uDrag.y * -0.06) + (uPointer - 0.5) * vec2(0.008, 0.004);
    vec2 wakeDrift = vec2(uDrag.x * 0.07, uDrag.y * 0.05) + (uPointer - 0.5) * vec2(-0.006, -0.003);

    /*
     * Scroll-bound background switching.
     *
     * The point here is the *seam*, not the frames: a plain cross-fade ghosts two images
     * through each other and washes out in the middle. So each switch is a soft diagonal
     * wipe blended with a dissolve — the eye follows a moving edge instead of a flat
     * opacity ramp — plus a warm bloom exactly at the crossing and a small chromatic
     * split across that edge.
     */
    float toBridge = smoothstep(0.06, 0.32, uProgress);
    float toCloseup = smoothstep(0.50, 0.90, uProgress);

    float seamSweep = uv.x * 0.86 + uv.y * 0.14;
    float seamWidth = 0.26;

    float seamEdgeBridge = mix(-0.35, 1.35, toBridge);
    float seamMaskBridge = 1.0 - smoothstep(seamEdgeBridge - seamWidth, seamEdgeBridge + seamWidth, seamSweep);
    float seamBridge = mix(toBridge, seamMaskBridge, 0.72);

    float seamEdgeCloseup = mix(-0.35, 1.35, toCloseup);
    float seamMaskCloseup = 1.0 - smoothstep(seamEdgeCloseup - seamWidth, seamEdgeCloseup + seamWidth, seamSweep);
    float seamCloseup = mix(toCloseup, seamMaskCloseup, 0.72);

    // peaks at the midpoint of each switch, zero either side
    float midBridge = 4.0 * toBridge * (1.0 - toBridge);
    float midCloseup = 4.0 * toCloseup * (1.0 - toCloseup);
    float seamBloom = midBridge + midCloseup;
    vec2 seamShift = vec2(0.0042, 0.0026) * seamBloom;

    vec2 wakeUv = uv + distortion * 0.6;
    vec2 bridgeUv = uv + distortion * (1.0 - archive * 0.35) + seamShift;
    vec2 closeUv = uv - distortion * (0.8 + afterimage * 0.2) - seamShift;

    vec3 wake = sampleScene(uAwakening, wakeUv, uAwakeningResolution, 1.015 + slowBreath * 0.6, wakeDrift);
    vec3 bridge = sampleScene(uBridge, bridgeUv, uBridgeResolution, 1.03 + slowBreath + uProgress * 0.04, bridgeDrift);
    vec3 closeup = sampleScene(uCloseup, closeUv, uCloseupResolution, 1.02 + toCloseup * 0.12 - slowBreath, closeDrift);

    vec3 color = mix(wake, bridge, seamBridge);
    color = mix(color, closeup, seamCloseup);

    // lifts the washed-out midpoint and reads as light passing through the cut
    color += vec3(0.105, 0.088, 0.062) * seamBloom;

    /* Chromatic fringe near the pointer keeps the ripple legible on dark frames. */
    float chroma = pointerField * (0.0016 + uImpact * 0.0045);
    vec2 redOffset = direction * chroma;
    vec3 redLayer = mix(
      sampleScene(uAwakening, wakeUv + redOffset * 0.6, uAwakeningResolution, 1.015, wakeDrift),
      sampleScene(uBridge, bridgeUv + redOffset, uBridgeResolution, 1.03 + slowBreath, bridgeDrift),
      seamBridge
    );
    color.r = mix(redLayer.r, sampleScene(uCloseup, closeUv + redOffset, uCloseupResolution, 1.02, closeDrift).r, seamCloseup);

    color.b *= 1.06;
    color.r *= 1.01 + uImpact * 0.025;

    /* A faint travelling highlight marking the crest of the rhythm wave. */
    color += vec3(0.055, 0.062, 0.058) * smoothstep(0.55, 1.0, wave) * waveField;

    float vignette = smoothstep(0.96, 0.22, distance(vUv, vec2(0.5)));
    color *= mix(0.52, 1.0, vignette);
    color *= 0.82 + (1.0 - pointerField) * 0.12 + uImpact * pointerField * 0.08;
    color = mix(color, vec3(dot(color, vec3(0.299, 0.587, 0.114))), afterimage * 0.18);
    color *= vec3(0.86, 0.94, 0.97);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function CinematicCanvas({ progressRef, velocityRef, onReady }: CinematicCanvasProps) {
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

    const rendererInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(gl.getParameter(rendererInfo?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER));
    if (/swiftshader|software|llvmpipe/i.test(renderer)) {
      onReady?.();
      return;
    }

    gl.clearColor(0.008, 0.016, 0.018, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let frame = 0;
    let disposed = false;
    let startedAt = performance.now();
    let lastRenderedAt = 0;
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
      awakeningResolution: gl.getUniformLocation(program, "uAwakeningResolution"),
      bridgeResolution: gl.getUniformLocation(program, "uBridgeResolution"),
      closeupResolution: gl.getUniformLocation(program, "uCloseupResolution"),
      pointer: gl.getUniformLocation(program, "uPointer"),
      drag: gl.getUniformLocation(program, "uDrag"),
      time: gl.getUniformLocation(program, "uTime"),
      progress: gl.getUniformLocation(program, "uProgress"),
      impact: gl.getUniformLocation(program, "uImpact"),
      velocity: gl.getUniformLocation(program, "uVelocity"),
      awakening: gl.getUniformLocation(program, "uAwakening"),
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
    // Three frames of the same take, cross-faded by scroll progress: establishing shot at
    // act 1, the character through the middle acts, close-up at the end. Acts 1 and 5 keep
    // the frames the scene already used, so the middle movement is the only addition.
    // The mobile list is the portrait crop of each moment.
    const sceneUrls = mobile
      ? ["/cinematic/awakening-mobile.webp", "/cinematic/entry-v2-mobile.webp", "/cinematic/scene-mobile.webp"]
      : ["/cinematic/bridge.webp", "/cinematic/awakening.webp", "/cinematic/closeup.webp"];
    let awakeningTexture: WebGLTexture | undefined;
    let bridgeTexture: WebGLTexture | undefined;
    let closeupTexture: WebGLTexture | undefined;

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
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

    const onContextLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      canvas.dataset.ready = "false";
    };

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("webglcontextlost", onContextLost);

    Promise.all(sceneUrls.map((url) => createTexture(url))).then(([awakeningAsset, bridgeAsset, closeupAsset]) => {
      if (disposed) return;
      awakeningTexture = awakeningAsset.texture;
      bridgeTexture = bridgeAsset.texture;
      closeupTexture = closeupAsset.texture;
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, awakeningTexture);
      gl.uniform1i(uniforms.awakening, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, bridgeTexture);
      gl.uniform1i(uniforms.bridge, 1);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, closeupTexture);
      gl.uniform1i(uniforms.closeup, 2);
      gl.uniform2f(uniforms.awakeningResolution, awakeningAsset.width, awakeningAsset.height);
      gl.uniform2f(uniforms.bridgeResolution, bridgeAsset.width, bridgeAsset.height);
      gl.uniform2f(uniforms.closeupResolution, closeupAsset.width, closeupAsset.height);
      resize();
      startedAt = performance.now();

      const render = (now: number) => {
        if (disposed) return;
        if (now - lastRenderedAt < 25) {
          frame = requestAnimationFrame(render);
          return;
        }
        lastRenderedAt = now;
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
        gl.uniform1f(uniforms.velocity, velocityRef?.current ?? 0);
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
      canvas.removeEventListener("webglcontextlost", onContextLost);
      if (awakeningTexture) gl.deleteTexture(awakeningTexture);
      if (bridgeTexture) gl.deleteTexture(bridgeTexture);
      if (closeupTexture) gl.deleteTexture(closeupTexture);
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [onReady, progressRef, velocityRef]);

  return <canvas className="cinematic-canvas" ref={canvasRef} aria-hidden="true" />;
}
