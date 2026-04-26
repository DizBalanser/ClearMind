import { useEffect, useRef } from 'react';

type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    phase: number;
};

const PARTICLE_COUNT = 72;
const CONNECTION_DISTANCE = 150;

const SpatialBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frameId = 0;
        let width = 0;
        let height = 0;
        let particles: Particle[] = [];

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            particles = Array.from({ length: PARTICLE_COUNT }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.16,
                vy: (Math.random() - 0.5) * 0.16,
                radius: 0.8 + Math.random() * 1.8,
                phase: Math.random() * Math.PI * 2,
            }));
        };

        const draw = (time: number) => {
            ctx.clearRect(0, 0, width, height);

            const gradient = ctx.createRadialGradient(width * 0.72, height * 0.12, 0, width * 0.72, height * 0.12, Math.max(width, height) * 0.75);
            gradient.addColorStop(0, 'rgba(20, 184, 166, 0.14)');
            gradient.addColorStop(0.45, 'rgba(124, 58, 237, 0.08)');
            gradient.addColorStop(1, 'rgba(13, 17, 23, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            for (const particle of particles) {
                particle.x += particle.vx;
                particle.y += particle.vy;

                if (particle.x < -20) particle.x = width + 20;
                if (particle.x > width + 20) particle.x = -20;
                if (particle.y < -20) particle.y = height + 20;
                if (particle.y > height + 20) particle.y = -20;
            }

            for (let i = 0; i < particles.length; i += 1) {
                for (let j = i + 1; j < particles.length; j += 1) {
                    const a = particles[i];
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < CONNECTION_DISTANCE) {
                        const alpha = (1 - distance / CONNECTION_DISTANCE) * 0.18;
                        ctx.strokeStyle = `rgba(88, 166, 255, ${alpha})`;
                        ctx.lineWidth = 0.6;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }

            for (const particle of particles) {
                const pulse = 0.55 + Math.sin(time * 0.001 + particle.phase) * 0.25;
                ctx.fillStyle = `rgba(230, 237, 243, ${0.28 + pulse * 0.18})`;
                ctx.shadowColor = 'rgba(20, 184, 166, 0.45)';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius + pulse * 0.7, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.shadowBlur = 0;

            frameId = window.requestAnimationFrame(draw);
        };

        resize();
        window.addEventListener('resize', resize);
        frameId = window.requestAnimationFrame(draw);

        return () => {
            window.removeEventListener('resize', resize);
            window.cancelAnimationFrame(frameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0 opacity-80" aria-hidden="true" />;
};

export default SpatialBackground;
