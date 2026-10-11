<!-- src/components/Laboratory/RecipeHints.vue -->
<script setup>
import { ref } from "vue";
import { recipesProgress, craftSerum } from "@/scripts/laboratoryScripts/dragAndDrop.js";

// Храним состояние шторки для каждой карточки по её id
const closedStates = ref({});

const toggleCurtain = (recipeId) => {
  closedStates.value[recipeId] = !closedStates.value[recipeId];
};

const isClosed = (recipeId) => {
  return !!closedStates.value[recipeId];
};
</script>

<template>
  <div class="absolute top-0 left-0  flex flex-col gap-1 z-20 min-h-[40px] pointer-events-none">
    <transition-group name="hint-fade">
      <div
          v-for="recipe in recipesProgress"
          :key="recipe.id"
          :class="[
            'flex items-center transition-transform duration-300 ease-in-out',
            isClosed(recipe.id) ? '-translate-x-[calc(100%-24px)]' : 'translate-x-0'
          ]"
      >
        <!-- Твоя оригинальная плашка -->
        <div
            :class="[
              'flex flex-col  rounded-2xl items-center border-2 w-65 h-15 justify-center  shadow-md',
              recipe.isReady
                ? 'bg-emerald-500/90 border-emerald-300 animate-pulse'
                : 'bg-slate-700/90 border-white/20'
            ]"
        >
          <!-- Верхняя часть: картинка и название сыворотки + кнопка крафта -->
          <div class="flex flex-col items-center relative">
            <span class="text-xs font-bold text-white leading-tight">{{ recipe.name }}</span>
          </div>

          <!-- Нижняя часть: ВСЕ требуемые ингредиенты -->
          <div class="flex items-center  flex-wrap ">
            <div class="flex items-center gap-1 flex-wrap">
              <div v-if="!recipe.isReady" class="flex items-center gap-1 flex-wrap">
                <span
                    v-for="req in recipe.requirementsList"
                    :key="req.id"
                    :class="[
                    'flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-bold border',
                    req.isEnough
                      ? 'bg-emerald-600/80 border-emerald-400 text-white'
                      : 'bg-red-500/80 border-red-400 text-white'
                  ]"
                    :title="`${req.name}: есть ${req.current} из ${req.required}`"
                >
                  <img :src="req.image" class="w-6 h-6 object-contain" />
                  <span>{{ req.current }}/{{ req.required }}</span>
                </span>
              </div>
            </div>

            <button
                v-if="recipe.isReady"
                @click="craftSerum(recipe)"
                class="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold px-3 py-1 rounded-xl shadow cursor-pointer pointer-events-auto shrink-0"
            >
              Синтезировать
            </button>
            <img :src="recipe.image" :alt="recipe.name" class="w-8 h-8 object-contain drop-shadow" />
          </div>
        </div>

        <!-- Кнопка-язычок, которая теперь жестко привязана к правому краю карточки и уезжает вместе с ней -->
        <button
            @click="toggleCurtain(recipe.id)"
            class="bg-slate-800/90 hover:bg-slate-700 text-white text-[10px] font-bold py-3 px-1  rounded-r-xl border-y-2 border-r-2 border-white/20 shadow-lg cursor-pointer flex items-center justify-center shrink-0 z-30 transition-colors"
            :title="isClosed(recipe.id) ? 'Открыть подсказку' : 'Закрыть подсказку'"
        >
          <span class="writing-mode-vertical pointer-events-auto">
            {{ isClosed(recipe.id) ? '▶' : '◀' }}
          </span>
        </button>

      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: all 0.3s ease;
}
.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>