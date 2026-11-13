import { ref } from 'vue';
import interact from 'interactjs';

export function useBallPhysics(ballElRef, containerElRef, options = {}) {
    const size = options.size || 64;
    const gravity = options.gravity ?? 0.6;
    const bounce = options.bounce ?? 0.75;
    const friction = options.friction ?? 0.99;

    const isDragging = ref(false);
    const isMoving = ref(false); // Летит ли мяч сейчас

    let x = options.startX || 50;  // Начальная позиция X
    let y = options.startY || 300; // Начальная позиция Y (например, у пола)
    let vx = 0;
    let vy = 0;
    let rotation = 0;
    let animFrameId = null;
    let lastMoveTime = 0;

    function updateTransform() {
        if (!ballElRef.value) return;
        ballElRef.value.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;

        // Передаем координаты наружу, если callback задан
        if (typeof options.onUpdate === 'function') {
            options.onUpdate(x, y, isMoving.value || isDragging.value);
        }
    }

    function step() {
        if (!isDragging.value && isMoving.value && containerElRef.value) {
            const bounds = containerElRef.value.getBoundingClientRect();
            const rightWallOffset = 12; // 👈 Увеличь до 12-15, если всё еще проваливается
            const maxX = bounds.width - size - rightWallOffset; // 👈 Обязательно отнимаем offset!
            const minX = 4;  // 👈 Слева тоже дадим небольшой отступ, чтобы не прилипал
            // Если задан фиксированный уровень пола в опциях, используем его, адаптируя под текущий scale
// Иначе считаем по-старому от высоты контейнера
            let maxY;
            if (options.floorY !== undefined) {
                // options.floorY — это точное положение пола в базовых пикселях (например, на холсте 270px)
                maxY = options.floorY - size;
            } else {
                const bottomOffset = bounds.height * 0.12;
                maxY = bounds.height - size - bottomOffset;
            }

            vy += gravity;
            vx *= friction;
            vy *= friction;

            x += vx;
            y += vy;
            rotation += vx * 1.5;


            // Отскок от стен
            if (x >= maxX) {
                x = maxX;             // Жестко стопорим до провала в текстуру
                vx = -vx * bounce;    // Отскок
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

                // Если мяч полностью остановился — выключаем анимационный цикл, чтобы не нагружать процессор
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
                    isMoving.value = false; // Останавливаем физику во время пальца
                    stop();
                    vx = 0;
                    vy = 0;
                    lastMoveTime = performance.now();
                },
                move(event) {
                    const now = performance.now();
                    const dt = Math.max(now - lastMoveTime, 1);

                    x += event.dx;
                    y += event.dy;

                    if (containerElRef.value) {
                        const bounds = containerElRef.value.getBoundingClientRect();
                        const rightWallOffset = 12; // 👈 Тот же отступ
                        const maxX = bounds.width - size - rightWallOffset; // 👈 И здесь отнимаем
                        const minX = 4;

                        x = Math.max(minX, Math.min(x, maxX));
                    }

                    vx = (event.dx / dt) * 16;
                    vy = (event.dy / dt) * 16;

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
                    // Запускаем физику полета/отскоков при отпускании!
                    startLoop();
                }
            }
        });
    }

    // Пнуть мяч по клику
    function kickBall() {
        if (isDragging.value) return;
        vx = (Math.random() - 0.5) * 10;
        vy = -12 - Math.random() * 4;
        startLoop();
    }

    function setupInitial() {
        if (containerElRef.value) {
            // Ставим мяч в переданные координаты или по умолчанию (например, слева снизу)
            updateTransform();
        }
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