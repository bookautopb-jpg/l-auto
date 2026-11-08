import React, { useEffect, useRef } from 'react';

/**
 * BouncingCarsCanvas Component
 * Renders a sleek supercar continuously and smoothly cruising around the perimeter
 * of the central Login Card like an elegant racetrack, fully responsive on mobile, tablet, and desktop.
 */
export default function BouncingCarsCanvas({ cardRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Car state
    const isMobile = () => window.innerWidth < 640;
    let distance = 50; // Initial start near top
    let lastTime = performance.now();
    const trails = [];

    // Helper: Compute (x, y, angle) along rounded rectangle racetrack
    const getTrackPosition = (dist, left, top, right, bottom, r) => {
      const L_top = Math.max(10, (right - r) - (left + r));
      const L_right = Math.max(10, (bottom - r) - (top + r));
      const L_bottom = L_top;
      const L_left = L_right;
      const L_arc = (Math.PI / 2) * r;
      const totalPerimeter = L_top + L_arc + L_right + L_arc + L_bottom + L_arc + L_left + L_arc;

      const d = ((dist % totalPerimeter) + totalPerimeter) % totalPerimeter;

      let x = 0;
      let y = 0;
      let angle = 0;

      // 1. Top straight (moving left to right)
      if (d < L_top) {
        const t = d / L_top;
        x = (left + r) + t * L_top;
        y = top;
        angle = 0;
      }
      // 2. Top-right corner arc (curving down)
      else if (d < L_top + L_arc) {
        const t = (d - L_top) / L_arc;
        const a = -Math.PI / 2 + t * (Math.PI / 2);
        x = (right - r) + Math.cos(a) * r;
        y = (top + r) + Math.sin(a) * r;
        angle = a + Math.PI / 2;
      }
      // 3. Right straight (moving downwards)
      else if (d < L_top + L_arc + L_right) {
        const t = (d - (L_top + L_arc)) / L_right;
        x = right;
        y = (top + r) + t * L_right;
        angle = Math.PI / 2;
      }
      // 4. Bottom-right corner arc (curving left)
      else if (d < L_top + L_arc + L_right + L_arc) {
        const t = (d - (L_top + L_arc + L_right)) / L_arc;
        const a = t * (Math.PI / 2);
        x = (right - r) + Math.cos(a) * r;
        y = (bottom - r) + Math.sin(a) * r;
        angle = a + Math.PI / 2;
      }
      // 5. Bottom straight (moving right to left)
      else if (d < L_top + L_arc + L_right + L_arc + L_bottom) {
        const t = (d - (L_top + L_arc + L_right + L_arc)) / L_bottom;
        x = (right - r) - t * L_bottom;
        y = bottom;
        angle = Math.PI;
      }
      // 6. Bottom-left corner arc (curving up)
      else if (d < L_top + L_arc + L_right + L_arc + L_bottom + L_arc) {
        const t = (d - (L_top + L_arc + L_right + L_arc + L_bottom)) / L_arc;
        const a = Math.PI / 2 + t * (Math.PI / 2);
        x = (left + r) + Math.cos(a) * r;
        y = (bottom - r) + Math.sin(a) * r;
        angle = a + Math.PI / 2;
      }
      // 7. Left straight (moving upwards)
      else if (d < L_top + L_arc + L_right + L_arc + L_bottom + L_arc + L_left) {
        const t = (d - (L_top + L_arc + L_right + L_arc + L_bottom + L_arc)) / L_left;
        x = left;
        y = (bottom - r) - t * L_left;
        angle = -Math.PI / 2;
      }
      // 8. Top-left corner arc (curving right)
      else {
        const t = (d - (L_top + L_arc + L_right + L_arc + L_bottom + L_arc + L_left)) / L_arc;
        const a = Math.PI + t * (Math.PI / 2);
        x = (left + r) + Math.cos(a) * r;
        y = (top + r) + Math.sin(a) * r;
        angle = a + Math.PI / 2;
      }

      return { x, y, angle, totalPerimeter };
    };

    // Helper: Draw sleek Vector Supercar
    const drawSupercar = (x, y, angle, mobile) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      const w = mobile ? 38 : 46;
      const h = mobile ? 20 : 24;

      // 1. Soft Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(2, 2, w / 2 + 3, h / 2 + 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Soft Neon Underglow (Amber Gold)
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = mobile ? 10 : 16;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.beginPath();
      ctx.roundRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 3. Main Car Body (Aerodynamic wedge in amber/gold gradient)
      const bodyGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      bodyGrad.addColorStop(0, '#f59e0b');
      bodyGrad.addColorStop(0.3, '#fbbf24');
      bodyGrad.addColorStop(0.5, '#1e293b');
      bodyGrad.addColorStop(0.7, '#fbbf24');
      bodyGrad.addColorStop(1, '#d97706');
      ctx.fillStyle = bodyGrad;

      ctx.beginPath();
      ctx.moveTo(w / 2, 0); // Front nose
      ctx.lineTo(w / 4, -h / 2); // Front left
      ctx.lineTo(-w / 2 + 5, -h / 2); // Rear left
      ctx.lineTo(-w / 2, -h / 3);
      ctx.lineTo(-w / 2, h / 3);
      ctx.lineTo(-w / 2 + 5, h / 2); // Rear right
      ctx.lineTo(w / 4, h / 2); // Front right
      ctx.closePath();
      ctx.fill();

      // Fine golden highlight outline
      ctx.strokeStyle = 'rgba(254, 243, 199, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 4. Cockpit & Tinted Windshield
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.moveTo(w / 6, -h / 3.2);
      ctx.lineTo(-w / 4, -h / 3.2);
      ctx.lineTo(-w / 3, -h / 4.5);
      ctx.lineTo(-w / 3, h / 4.5);
      ctx.lineTo(-w / 4, h / 3.2);
      ctx.lineTo(w / 6, h / 3.2);
      ctx.closePath();
      ctx.fill();

      // Windshield reflection streak
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.moveTo(w / 8, -h / 4);
      ctx.lineTo(-w / 8, -h / 4);
      ctx.lineTo(-w / 6, 0);
      ctx.closePath();
      ctx.fill();

      // 5. Wheels (Black rubber with silver rim center)
      const wheelW = mobile ? 8 : 10;
      const wheelH = mobile ? 3.5 : 4;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(w / 4 - 2, -h / 2 - 2, wheelW, wheelH);
      ctx.fillRect(w / 4 - 2, h / 2 - 2, wheelW, wheelH);
      ctx.fillRect(-w / 3 - 2, -h / 2 - 2, wheelW, wheelH);
      ctx.fillRect(-w / 3 - 2, h / 2 - 2, wheelW, wheelH);

      // Silver alloy rims
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(w / 4 - 1, -h / 2 - 1.5, wheelW - 3, wheelH - 1.5);
      ctx.fillRect(w / 4 - 1, h / 2 - 1.5, wheelW - 3, wheelH - 1.5);
      ctx.fillRect(-w / 3 - 1, -h / 2 - 1.5, wheelW - 3, wheelH - 1.5);
      ctx.fillRect(-w / 3 - 1, h / 2 - 1.5, wheelW - 3, wheelH - 1.5);

      // 6. Dual LED Xenon Headlights + Forward Light Cones
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(w / 2 - 2, -h / 3, 2.5, 2.5);
      ctx.fillRect(w / 2 - 2, h / 3 - 2.5, 2.5, 2.5);

      const beamGrad = ctx.createRadialGradient(w / 2 + 15, 0, 2, w / 2 + 25, 0, mobile ? 45 : 65);
      beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      beamGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.2)');
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(w / 2, -h / 3);
      ctx.lineTo(w / 2 + (mobile ? 45 : 65), -h * 0.9);
      ctx.lineTo(w / 2 + (mobile ? 45 : 65), h * 0.9);
      ctx.lineTo(w / 2, h / 3);
      ctx.closePath();
      ctx.fill();

      // 7. Red LED Taillights
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#f87171';
      ctx.fillRect(-w / 2, -h / 3, 2.5, 3.5);
      ctx.fillRect(-w / 2, h / 3 - 3.5, 2.5, 3.5);

      ctx.restore();
    };

    // Main animation loop
    const render = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const now = performance.now();
      const dt = Math.min(35, Math.max(8, now - lastTime));
      lastTime = now;

      // 1. Get Login Card bounds
      let cLeft, cTop, cRight, cBottom;
      const mobile = isMobile();
      const offset = mobile ? 16 : 20;

      if (cardRef && cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        cLeft = rect.left - offset;
        cTop = rect.top - offset;
        cRight = rect.right + offset;
        cBottom = rect.bottom + offset;
      } else {
        // Fallback default
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const w = mobile ? 300 : 380;
        const h = mobile ? 460 : 520;
        cLeft = cx - w / 2 - offset;
        cTop = cy - h / 2 - offset;
        cRight = cx + w / 2 + offset;
        cBottom = cy + h / 2 + offset;
      }

      // Card rounded border radius (rounded-3xl is 24px)
      const r = 24 + offset;

      // 2. Subtle racetrack guide path (very soft neon glow)
      ctx.save();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.roundRect(cLeft, cTop, cRight - cLeft, cBottom - cTop, r);
      ctx.stroke();
      ctx.restore();

      // 3. Advance car along track
      const speed = mobile ? 1.7 : 2.1; // Smooth cruising speed
      distance += speed * (dt / 16.666);

      const { x, y, angle } = getTrackPosition(distance, cLeft, cTop, cRight, cBottom, r);

      // 4. Subtle glowing light trail behind the car
      trails.push({ x, y, alpha: 0.35 });
      if (trails.length > (mobile ? 10 : 16)) trails.shift();

      trails.forEach((trail, idx) => {
        trail.alpha *= 0.9;
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, (idx / trails.length) * (mobile ? 2 : 2.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${trail.alpha.toFixed(2)})`;
        ctx.fill();
      });

      // 5. Draw the Supercar
      drawSupercar(x, y, angle, mobile);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [cardRef]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-20 w-full h-full"
    />
  );
}
