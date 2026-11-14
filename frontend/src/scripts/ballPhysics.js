import { ref } from 'vue';
import interact from 'interactjs';
import { scale } from '@/scripts/useGameStore.js';

export function useBallPhysics(ballElRef, containerElRef, options = {}) {
    const size = options.size || 64;
    const gravity = options.gravity ?? 0.6;
    const bounce = options.bounce ?? 0.75;
    const friction = options.friction ?? 0.99;

    const isDragging = ref(false);
    const isMoving = ref(false); // Летит ли мяч сейчас

    let x = options.startX || 50;  // Начальная позиция X
    let y = options.startY || 300; // Начальная позиция Y
    let vx = 0;
    let vy = 0;
    let rotation = 0;
    let animFrameId = null;
    let lastMoveTime = 0;

    // Фиксированная ширина холста в макетных пикселях (из .w-[300px])
    const CONTAINER_WIDTH = 320;

    function updateTransform() {
        if (!ballElRef.value) return;
        ballElRef.value.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;

        if (typeof options.onUpdate === 'function') {
            options.onUpdate(x, y, isMoving.value || isDragging.value);
        }
    }

    function step() {
        if (!isDragging.value && isMoving.value) {
            const rightWallOffset = 15; // Отступ от правой стены
            const minX = 4;
            const maxX = CONTAINER_WIDTH - size - rightWallOffset;

            let maxY;
            if (options.floorY !== undefined) {
                maxY = options.floorY - size;
            } else {
                maxY = 270 - size; // Высота холста по умолчанию 270px
            }

            vy += gravity;
            vx *= friction;
            vy *= friction;

            x += vx;
            y += vy;
            rotation += vx * 1.5;

            // Отскок от стен
            if (x >= maxX) {
                x = maxX;
                vx = -vx * bounce;
            } else if (x <= minX) {
                x = minX;
                vx = -vx * bounce;
            }

            // Отскок от пола/потолка
            if (y >= maxY) {
                y = maxY;
                vy = -vy * bounce;
                vx *= 0.98;
                if (Math.abs(vy) < gravity * 0.5) vy = 0;
                if (Math.abs(vx) < 0.01) vx = 0;

                if (vx === 0 && vy === 0) {
                    isMoving.value = false;
                    stop();
                }
            } else if (y <= 0) {
                y = 0;
                vy = -vy * bounce;
            }

            updateTransform();
        }

        if (isMoving.value) {
            animFrameId = requestAnimationFrame(step);
        }
    }

    function startLoop() {
        if (!animFrameId) {
            isMoving.value = true;
            animFrameId = requestAnimationFrame(step);
        }
    }

    function initInteract() {
        const el = ballElRef.value;
        if (!el || el.dataset.interactInitialized) return;
        el.dataset.interactInitialized = 'true';

        interact(el).draggable({
            inertia: false,
            listeners: {
                start() {
                    isDragging.value = true;
                    isMoving.value = false;
                    stop();
                    vx = 0;
                    vy = 0;
                    lastMoveTime = performance.now();
                },
                move(event) {
                    const now = performance.now();
                    const dt = Math.max(now - lastMoveTime, 1);
                    const currentScale = scale.value || 1;

                    // Важно: делим смещение на scale, чтобы компенсировать CSS-трансформацию экрана
                    x += event.dx / currentScale;
                    y += event.dy / currentScale;

                    const rightWallOffset = 15;
                    const minX = 4;
                    const maxX = CONTAINER_WIDTH - size - rightWallOffset;
                    x = Math.max(minX, Math.min(x, maxX));

                    vx = ((event.dx / currentScale) / dt) * 16;
                    vy = ((event.dy / currentScale) / dt) * 16;

                    const maxSpeed = 25;
                    vx = Math.max(-maxSpeed, Math.min(maxSpeed, vx));
                    vy = Math.max(-maxSpeed, Math.min(maxSpeed, vy));

                    lastMoveTime = now;
                    updateTransform();
                },
                end() {
                    isDragging.value = false;
                    if (performance.now() - lastMoveTime > 80) {
                        vx = 0;
                        vy = 0;
                    }
                    startLoop();
                }
            }
        });
    }

    function kickBall() {
        if (isDragging.value) return;
        vx = (Math.random() - 0.5) * 10;
        vy = -12 - Math.random() * 4;
        startLoop();
    }

    function setupInitial() {
        updateTransform();
        initInteract();
    }

    function stop() {
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
    }

    return {
        setupInitial,
        stop,
        kickBall,
        isDragging
    };
}