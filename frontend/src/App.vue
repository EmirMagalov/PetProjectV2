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
  <div v-if="isLoading"
       class="fixed inset-0 z-200 bg-slate-950 backdrop-blur-md flex flex-col items-center justify-center gap-4">
    <div class="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
    <p class="text-white font-bold text-sm tracking-wide">Загрузка...</p>
  </div>

  <main v-else>

    <RouterView />
  </main>
</template>