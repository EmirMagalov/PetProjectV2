<script setup>
import PetMain from "@/components/PetMain.vue";
import Test from "@/components/Test.vue";
import {onMounted} from "vue";
import {initGameData, isLoading} from "@/scripts/api.js";
onMounted(async () => {
  // 👉 САМОЕ ГЛАВНОЕ: Обязательно загружаем данные с бэкенда при самом первом открытии!
  try {
    await initGameData()
  } catch (e) {
    console.error("Ошибка при первоначальной загрузке:", e)
  }
})
</script>

<template>
  <!-- 🛑 ОВЕРЛЕЙ ЗАГРУЗКИ (БЛОКИРУЕТ ИНТЕРФЕЙС, ПОКА ДАННЫЕ НЕ ПРИШЛИ) -->
  <Transition name="fade">
    <div
        v-if="isLoading"
        class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-amber-950 via-red-950 to-black text-white"
    >
      <div class="relative flex items-center justify-center mb-4">
        <!-- Пульсирующее свечение -->
        <div class="absolute w-24 h-24 rounded-full bg-amber-500/20 animate-ping"></div>

        <!-- Анимированный логотип/иконка -->
        <div class="relative w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-2xl animate-bounce">
          <div class="w-full h-full bg-red-900 rounded-full flex items-center justify-center border ">
            <img src="/gamePlay/logo_icons.webp" class="w-10 h-10 object-contain drop-shadow-md" alt="Loading..." />
          </div>
        </div>
      </div>

      <!-- Текст загрузки -->
      <span class="text-amber-200 font-extrabold tracking-widest text-sm uppercase drop-shadow-md animate-pulse">
          Загрузка игры...
        </span>

      <!-- Спиннер -->
      <div class="mt-4 w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
    </div>
    <main v-else>

      <RouterView />
    </main>
  </Transition>


</template>