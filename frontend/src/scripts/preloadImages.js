import { APP_VERSION } from "@/scripts/constants.js";
// Импортируем сгенерированный массив всех картинок из public
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

            const handleLoad = () => {
                loadedCount++;
                if (typeof onProgress === "function") {
                    const percent = Math.round((loadedCount / total) * 100);
                    onProgress(percent);
                }
                resolve(src);
            };

            img.onload = handleLoad;
            img.onerror = handleLoad;
        });

    });

    return Promise.all(promises);
}