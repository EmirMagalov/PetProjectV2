<script setup>
import { ref, onMounted } from "vue";
import { initGameData, isLoading, isApiError, errorMessage } from "@/scripts/api.js";
import { imagesToPreload, preloadImages } from "@/scripts/preloadImages.js";
import { APP_VERSION } from "@/scripts/constants.js";

const homeBgUrl = `/location/home.webp?v=${APP_VERSION}`;
const bathBgUrl = `/location/bath.webp?v=${APP_VERSION}`;

// Функция с корректным порядком подписки и раскодирования
const waitForBackgroundsToRender = () => {
  const urls = [homeBgUrl, bathBgUrl];

  return Promise.all(
      urls.map((src) => {
        return new Promise((resolve) => {
          const img = new Image();

          const decodeAndResolve = () => {
            if ('decode' in img) {
              img.decode().then(resolve).catch(resolve);
            } else {
              resolve();
            }
          };

          // 1. Сначала подписываемся на события
          img.onload = decodeAndResolve;
          img.onerror = resolve; // Не ломаем приложение при ошибке сети

          // 2. И только потом задаем src для запуска скачивания
          img.src = src;

          // 3. Если картинка мгновенно подгрузилась из дискового кэша
          if (img.complete) {
            decodeAndResolve();
          }
        });
      })
  );
};

const loadGame = async () => {
  isLoading.value = true;
  isApiError.value = false;

  try {
    await Promise.all([
      initGameData(),
      preloadImages()
    ]);

    // Дожидаемся полного скачивания и раскодирования в GPU
    await waitForBackgroundsToRender();

  } catch (e) {
    console.error("Ошибка при первоначальной загрузке:", e);
  } finally {
    if (!isApiError.value) {
      // Двойной requestAnimationFrame заставляет браузер сначала
      // ВСТАВИТЬ И ОТРИСОВАТЬ фон компонента, а затем убрать лоадер
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isLoading.value = false;
        });
      });
    }
  }
};

onMounted(() => {
  loadGame();
});
</script>

<template>
  <Transition name="fade">
    <!-- 🛑 1. ЭКРАН ОШИБКИ -->
    <div
        v-if="isApiError"
        class="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-slate-900 to-black text-white p-6 text-center"
    >
      <div class="relative flex items-center justify-center mb-4">
        <div class="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-3xl animate-pulse">
          🌐
        </div>
      </div>

      <h2 class="text-xl font-extrabold text-red-400 mb-2 uppercase tracking-wide">
        Ошибка подключения
      </h2>

      <p class="text-sm text-gray-300 mb-6 max-w-xs leading-relaxed">
        {{ errorMessage || 'Не удалось получить данные с сервера. Проверьте интернет-соединение.' }}
      </p>

      <button
          @click="loadGame"
          class="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 active:scale-95 text-black font-extrabold rounded-2xl shadow-lg transition-all"
      >
        Повторить попытку
      </button>
    </div>

    <!-- ⏳ 2. ОВЕРЛЕЙ ЗАГРУЗКИ (Закрывается только после полной отрисовки фона) -->
    <div
        v-else-if="isLoading"
        class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-amber-950 via-red-950 to-black text-white"
    >
      <div class="relative flex items-center justify-center mb-4">
        <div class="absolute w-24 h-24 rounded-full bg-amber-500/20 animate-ping"></div>

        <div class="relative w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-2xl animate-bounce">
          <div class="w-full h-full bg-red-900 rounded-full flex items-center justify-center border border-amber-400/30">
            <img :src="`/gamePlay/logo_icons.webp?v=${APP_VERSION}`" class="w-10 h-10 object-contain drop-shadow-md" alt="Loading..." />
          </div>
        </div>
      </div>

      <span class="text-amber-200 font-extrabold tracking-widest text-sm uppercase drop-shadow-md animate-pulse">
        Загрузка...
      </span>

      <div class="mt-4 w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
    </div>

    <!-- 🎮 3. ИГРА -->
    <main v-else>
      <RouterView />
    </main>
  </Transition>
</template>