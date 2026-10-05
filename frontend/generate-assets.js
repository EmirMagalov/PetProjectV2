import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
const outputFile = path.resolve('src/scripts/assetsList.json');

function getFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getFiles(filePath, fileList);
        } else if (/\.(webp|png|jpg|jpeg|svg)$/i.test(file)) {
            // Преобразуем путь относительно папки public (например: /gamePlay/logo.webp)
            const relativePath = '/' + path.relative(publicDir, filePath).replace(/\\/g, '/');
            fileList.push(relativePath);
        }
    });

    return fileList;
}

const assets = getFiles(publicDir);

// Автоматически создаем папку src/scripts, если ее нет
fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(assets, null, 2));

console.log(`✅ [Assets Auto-Scan] Найдено и занесено в прелоадер картинок: ${assets.length}`);