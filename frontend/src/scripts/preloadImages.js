import { APP_VERSION } from "@/scripts/imageVersion.js";
import rawImages from "@/scripts/assetsList.json";

export const imagesToPreload = rawImages.map(path => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanPath}?v=${APP_VERSION}`;
});

export function preloadImages(onProgress) {
    let loadedCount = 0;
    const total = imagesToPreload.length;

    console.group("🖼️ [Preload] started");
    console.log(`Total images in the list: ${total}`);

    if (total === 0) {
        if (onProgress) onProgress(100);
        console.groupEnd();
        return Promise.resolve();
    }

    const promises = imagesToPreload.map((src) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = src;

            const handleFinish = (status) => {
                loadedCount++;
                const progress = Math.round((loadedCount / total) * 100);

                if (status === 'error') {
                    console.error(`❌ [Preload Fail]${src}`);
                } else {
                    console.log(`✅ [Preload OK] (${loadedCount}/${total} - ${progress}%)`);
                }

                if (typeof onProgress === "function") {
                    onProgress(progress);
                }
                resolve(src);
            };

            if ('decode' in img) {
                img.decode()
                    .then(() => handleFinish('ok'))
                    .catch(() => handleFinish('error'));
            } else {
                img.onload = () => handleFinish('ok');
                img.onerror = () => handleFinish('error');
            }
        });
    });

    return Promise.all(promises).then((results) => {
        console.log("[Preload] successfully loaded");
        console.groupEnd();
        return results;
    });
}