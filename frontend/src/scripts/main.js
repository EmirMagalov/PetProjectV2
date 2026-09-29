import '../assets/main.css'
import { createWebHistory, createRouter } from 'vue-router'
import PetMain from "@/components/PetMain.vue";
import SaloonMain from "@/components/Saloon/SaloonMain.vue";
import { createApp } from 'vue'
import App from '../App.vue'

// 1. Принудительный сброс кэша для iOS Safari / Telegram WebApp
const APP_VERSION = '1.0.2'; // Меняй версию при каждом обновлении
const currentVersion = localStorage.getItem('app_version');

async function clearCacheAndReload() {
    if (currentVersion !== APP_VERSION) {
        const tasks = [];

        // Очищаем Cache Storage
        if ('caches' in window) {
            tasks.push(
                caches.keys().then((names) =>
                    Promise.all(names.map((name) => caches.delete(name)))
                )
            );
        }

        // Отключаем Service Workers
        if ('serviceWorker' in navigator) {
            tasks.push(
                navigator.serviceWorker.getRegistrations().then((registrations) =>
                    Promise.all(registrations.map((r) => r.unregister()))
                )
            );
        }

        // Ждем полного удаления из памяти
        await Promise.all(tasks);

        // Обновляем метку и перезагружаем чистую страницу
        localStorage.setItem('app_version', APP_VERSION);
        window.location.reload();
    }
}

// Запускаем очистку перед инициализацией Vue
clearCacheAndReload();

// 2. Инициализация роутера и приложения
const routes = [
    { path: '/', component: PetMain },
    { path: '/saloon', component: SaloonMain },
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});

const app = createApp(App);
app.use(router);
app.mount('#app');