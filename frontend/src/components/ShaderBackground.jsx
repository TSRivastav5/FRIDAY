import React, { useEffect, useRef } from 'react';

/**
 * Soft flowing WebGL gradient (white → mint → sky blue) behind the login
 * screen. Falls back to a plain background silently if WebGL isn't
 * available — this is ambience, never load-bearing.
 */
export function ShaderBackground({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    function syncSize() {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }
    const resizeObserver = new ResizeObserver(syncSize);
    resizeObserver.observe(canvas);
    syncSize();

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
void main() {
  vec2 uv = v_texCoord;
  vec3 color1 = vec3(1.0, 1.0, 1.0);
  vec3 color2 = vec3(0.95, 0.99, 0.98);
  vec3 color3 = vec3(0.96, 0.97, 1.0);
  float noise = sin(uv.x * 2.0 + u_time * 0.5) * cos(uv.y * 2.0 + u_time * 0.3);
  float noise2 = sin(uv.y * 3.0 - u_time * 0.4) * cos(uv.x * 1.5 + u_time * 0.2);
  vec3 finalColor = mix(color1, color2, 0.5 + 0.5 * noise);
  finalColor = mix(finalColor, color3, 0.5 + 0.5 * noise2);
  gl_FragColor = vec4(finalColor, 1.0);
}`;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    const uTime = gl.getUniformLocation(program, 'u_time');

    let frameId;
    function render(t) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      frameId = requestAnimationFrame(render);
    }
    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none block w-full h-full ${className}`}
    />
  );
}

export default ShaderBackground;
