// src/scripts/preloadImages.js
import { APP_VERSION } from "@/scripts/constants.js";
import rawImages from "@/scripts/assetsList.json";

export const imagesToPreload = rawImages.map(path => `${path}?v=${APP_VERSION}`);

export function preloadImages(onProgress) {
    let loadedCount = 0;
    const total = imagesToPreload.length;

    if (total === 0) {
        if (onProgress) onProgress(100);
        return Promise.resolve();
    }

    const promises = imagesToPreload.map((src) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = src;

            const handleLoad = async () => {
                try {
                    // 🚀 Заставляем Safari на iOS раскодировать WebP в GPU
                    if ('decode' in img) {
                        await img.decode();
                    }
                } catch (e) {
                    // Игнорируем возможные мелкие сбои раскодирования
                }

                loadedCount++;
                if (typeof onProgress === "function") {
                    onProgress(Math.round((loadedCount / total) * 100));
                }
                resolve(src);
            };

            img.onload = handleLoad;
            img.onerror = handleLoad;
        });
    });

    return Promise.all(promises);
}