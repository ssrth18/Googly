import React, { useEffect, useRef } from 'react';
import { AppLooks, AmbientEffect } from '../types';
import { hexHue, lum } from '../utils/colors';

interface Props {
  looks: AppLooks;
  isDark: boolean;
}

export const AmbientCanvas: React.FC<Props> = ({ looks, isDark }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // WebGL Shaderwaves
  useEffect(() => {
    if (looks.bgfx !== 'shaderwaves') return;
    const canvas = webglCanvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return;

    const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
    const FS = `precision mediump float;
uniform vec2 r;uniform float t;
const vec3 CD=vec3(.082,.137,.122),CB=vec3(.133,.337,.902),CL=vec3(.247,.490,1.),CV=vec3(.725,.741,.969),CW=vec3(.969,.965,1.);
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
void main(){
 vec2 uv=gl_FragCoord.xy/r;vec2 p=(uv-.5)*vec2(r.x/r.y,1.);
 float w=sin(p.x*1.6+t*.25+n(p*1.2+t*.06)*2.5)*.12+sin(p.x*3.+p.y*1.5-t*.35)*.05+(n(p*2.2+vec2(t*.07,-t*.05))-.5)*.28;
 float s=clamp(uv.y+w,0.,1.);
 vec3 c=mix(CD,CB,smoothstep(.0,.3,s));
 c=mix(c,CL,smoothstep(.28,.56,s));
 c=mix(c,CV,smoothstep(.52,.8,s));
 c=mix(c,CW,smoothstep(.76,.97,s));
 float g=floor(t*14.);
 vec3 gr=vec3(h(gl_FragCoord.xy+g*7.1),h(gl_FragCoord.xy*1.3+g*3.7+11.),h(gl_FragCoord.xy*.7+g*5.3+29.))-.5;
 c+=gr.x*.15+gr*.07;
 gl_FragColor=vec4(clamp(c,0.,1.),1.);}`;

    function createShader(type: number, src: string) {
      const shader = gl!.createShader(type)!;
      gl!.shaderSource(shader, src);
      gl!.compileShader(shader);
      return shader;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, createShader(gl.VERTEX_SHADER, VS));
    gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'a');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uR = gl.getUniformLocation(program, 'r');
    const uT = gl.getUniformLocation(program, 't');

    let animId = 0;
    let T = 0;
    let lastTime = performance.now();

    const resize = () => {
      const d = Math.min(window.devicePixelRatio || 1, 1.5) * 0.75;
      const w = Math.round(window.innerWidth * d);
      const h = Math.round(window.innerHeight * d);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const render = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      T += dt * (looks.speed / 100) * 0.8;
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform1f(uT, T);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [looks.bgfx, looks.speed]);

  // 2D Canvas Ambient Overlays (Aurora, Fireflies, Orbs, Stars, Bubbles, Net)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const TAU = Math.PI * 2;
    const R = (a: number, b: number) => a + Math.random() * (b - a);
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    let W = 0;
    let H = 0;
    const particles: any[] = [];
    let shootingStar: any = null;
    let animId = 0;
    let T = 0;
    let lastTime = performance.now();

    const hue = hexHue(looks.accent);
    const getHsla = (dh: number, alpha: number, light?: number) => {
      const h = (hue + dh + 360) % 360;
      const s = 65;
      const l = light ?? (isDark ? 66 : 50);
      return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      initParticles();
    };

    const initParticles = () => {
      particles.length = 0;
      const area = W * H;
      const effect = looks.amb;

      if (effect === 'fireflies') {
        const count = clamp(Math.round(area / 16000), 16, 50);
        for (let i = 0; i < count; i++) {
          particles.push({
            x: R(0, W),
            y: R(0, H),
            vx: 0,
            vy: 0,
            r: R(3, 8),
            ph: R(0, TAU),
            sp: R(0.5, 1.2),
            h: R(-30, 30),
          });
        }
      } else if (effect === 'stars') {
        const count = clamp(Math.round(area / 6000), 40, 120);
        for (let i = 0; i < count; i++) {
          particles.push({
            x: R(0, W),
            y: R(0, H),
            z: R(0.2, 1),
            ph: R(0, TAU),
            tw: R(0.6, 1.6),
          });
        }
      } else if (effect === 'bubbles') {
        const count = clamp(Math.round(area / 24000), 12, 30);
        for (let i = 0; i < count; i++) {
          particles.push({
            x: R(0, W),
            y: R(0, H),
            r: R(6, 22),
            sp: R(14, 38),
            sw: R(0.4, 1.1),
            ph: R(0, TAU),
            h: R(-25, 25),
          });
        }
      } else if (effect === 'orbs') {
        for (let i = 0; i < 6; i++) {
          particles.push({
            fx: R(0.08, 0.18),
            fy: R(0.07, 0.16),
            px: R(0, TAU),
            py: R(0, TAU),
            r: R(0.2, 0.38),
            h: i * 32 - 40,
          });
        }
      } else if (effect === 'net') {
        const count = clamp(Math.round(area / 20000), 20, 50);
        for (let i = 0; i < count; i++) {
          particles.push({
            x: R(0, W),
            y: R(0, H),
            vx: R(-15, 15),
            vy: R(-15, 15),
          });
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (looks.amb === 'off' || looks.level === 0) {
        ctx.clearRect(0, 0, W, H);
        return;
      }

      const spd = (looks.speed / 100) * 0.8;
      T += dt * spd;
      const alphaScale = (looks.level / 100) * 0.85;

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = isDark ? 'lighter' : 'source-over';

      if (looks.amb === 'aurora') {
        for (let b = 0; b < 3; b++) {
          const base = H * (0.16 + b * 0.12);
          const amp = H * (0.05 + 0.02 * b);
          const dh = b * 30 - 20;

          ctx.beginPath();
          for (let x = 0; x <= W + 20; x += 20) {
            const y =
              base +
              Math.sin(x * 0.003 + T * 0.4 + b * 1.8) * amp +
              Math.sin(x * 0.008 - T * 0.5 + b) * amp * 0.5;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          for (let x = W + 20; x >= 0; x -= 20) {
            ctx.lineTo(x, base + H * 0.32 + Math.sin(x * 0.003 + T * 0.3 + b * 2) * amp * 0.7);
          }
          ctx.closePath();

          const grad = ctx.createLinearGradient(0, base - amp, 0, base + H * 0.36);
          grad.addColorStop(0, getHsla(dh, 0));
          grad.addColorStop(0.3, getHsla(dh, 0.28 * alphaScale));
          grad.addColorStop(1, getHsla(dh + 35, 0));
          ctx.fillStyle = grad;
          ctx.fill();
        }
      } else if (looks.amb === 'orbs') {
        for (const o of particles) {
          const x = W * (0.5 + 0.4 * Math.sin(T * o.fx + o.px));
          const y = H * (0.5 + 0.4 * Math.cos(T * o.fy + o.py));
          const r = Math.max(W, H) * o.r * 0.75;
          const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
          grad.addColorStop(0, getHsla(o.h, 0.3 * alphaScale));
          grad.addColorStop(1, getHsla(o.h, 0));
          ctx.fillStyle = grad;
          ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
      } else if (looks.amb === 'fireflies') {
        const decay = Math.exp(-dt * 1.1);
        for (const p of particles) {
          p.ph += dt * p.sp * spd;
          const angle = Math.sin(p.ph * 0.7 + p.x * 0.003) * 2 + Math.cos(p.ph * 0.5 + p.y * 0.004) * 2;
          p.vx += Math.cos(angle) * dt * 20 * spd;
          p.vy += Math.sin(angle) * dt * 20 * spd;
          p.vx *= decay;
          p.vy *= decay;
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          if (p.x < -30) p.x = W + 30;
          else if (p.x > W + 30) p.x = -30;
          if (p.y < -30) p.y = H + 30;
          else if (p.y > H + 30) p.y = -30;

          const pulse = 0.5 + 0.5 * Math.sin(p.ph * 2.2);
          const r = p.r * 2.2;
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
          grad.addColorStop(0, getHsla(p.h, (0.3 + 0.6 * pulse) * alphaScale, isDark ? 75 : 55));
          grad.addColorStop(0.35, getHsla(p.h, (0.12 + 0.2 * pulse) * alphaScale));
          grad.addColorStop(1, getHsla(p.h, 0));

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, TAU);
          ctx.fill();
        }
      } else if (looks.amb === 'stars') {
        for (const p of particles) {
          p.x += dt * 8 * p.z * spd;
          p.y += dt * 3 * p.z * spd;
          if (p.x > W + 4) p.x = -4;
          if (p.y > H + 4) p.y = -4;

          const twinkle = (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(T * 1.6 * p.tw + p.ph))) * alphaScale * (0.35 + 0.65 * p.z);
          ctx.fillStyle = getHsla(0, twinkle, isDark ? 90 : 45);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 0.8 + p.z * 1.4, 0, TAU);
          ctx.fill();
        }

        if (!shootingStar && Math.random() < dt * 0.2 * spd) {
          shootingStar = { x: R(0, W * 0.8), y: R(0, H * 0.4), t: 0 };
        }
        if (shootingStar) {
          shootingStar.t += dt;
          shootingStar.x += dt * 500;
          shootingStar.y += dt * 250;
          const fade = 1 - shootingStar.t / 1;
          if (fade <= 0) {
            shootingStar = null;
          } else {
            const grad = ctx.createLinearGradient(
              shootingStar.x,
              shootingStar.y,
              shootingStar.x - 100,
              shootingStar.y - 50
            );
            grad.addColorStop(0, getHsla(0, 0.9 * fade * alphaScale, isDark ? 95 : 55));
            grad.addColorStop(1, getHsla(0, 0));
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(shootingStar.x, shootingStar.y);
            ctx.lineTo(shootingStar.x - 100, shootingStar.y - 50);
            ctx.stroke();
          }
        }
      } else if (looks.amb === 'bubbles') {
        for (const p of particles) {
          p.y -= dt * p.sp * spd;
          p.x += Math.sin(T * p.sw + p.ph) * dt * 18;
          if (p.y < -p.r * 2) {
            p.y = H + p.r * 2;
            p.x = R(0, W);
          }
          ctx.fillStyle = getHsla(p.h, 0.08 * alphaScale);
          ctx.strokeStyle = getHsla(p.h, 0.45 * alphaScale, isDark ? 75 : 50);
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, TAU);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = getHsla(0, 0.55 * alphaScale, isDark ? 95 : 80);
          ctx.beginPath();
          ctx.arc(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.2, 0, TAU);
          ctx.fill();
        }
      } else if (looks.amb === 'net') {
        for (const p of particles) {
          p.x += p.vx * dt * spd;
          p.y += p.vy * dt * spd;
          if (p.x < 0 || p.x > W) p.vx *= -1;
          if (p.y < 0 || p.y > H) p.vy *= -1;
        }
        const maxDist = clamp(Math.min(W, H) * 0.28, 80, 130);
        for (let i = 0; i < particles.length; i++) {
          const a = particles[i];
          for (let j = i + 1; j < particles.length; j++) {
            const b = particles[j];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (dist < maxDist) {
              ctx.strokeStyle = getHsla(0, (1 - dist / maxDist) * 0.35 * alphaScale);
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
          ctx.fillStyle = getHsla(0, 0.6 * alphaScale, isDark ? 80 : 48);
          ctx.beginPath();
          ctx.arc(a.x, a.y, 2, 0, TAU);
          ctx.fill();
        }
      }

      ctx.globalCompositeOperation = 'source-over';
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [looks.amb, looks.accent, looks.speed, looks.level, isDark]);

  return (
    <>
      <canvas
        ref={webglCanvasRef}
        className={`fixed inset-0 pointer-events-none z-[-2] w-full h-full transition-opacity duration-500 ${
          looks.bgfx === 'shaderwaves' ? 'block' : 'hidden'
        }`}
        style={{ opacity: looks.bgs / 100 }}
      />
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[-1] w-full h-full"
      />
    </>
  );
};
