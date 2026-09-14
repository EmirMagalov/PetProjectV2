import { gameData } from "@/scripts/useGameStore.js";
import { computed, ref } from "vue";

export const levelStatus = ref(false);

// Динамический расчет требуемого опыта для любого уровня
const getExpNeeded = (level) => level * 100;

// Реактивные проценты для заполнения шкалы (строго от 0 до 100)
export const expPercentage = computed(() => {
    const needed = getExpNeeded(gameData.level);
    if (!needed || needed <= 0) return 0;
    const percent = (gameData.exp / needed) * 100;
    return Math.min(100, Math.max(0, percent));
});

// Функция добавления опыта (вызывайте её там, где питомец получает экспу)
export function addExp(amount) {
    gameData.exp += amount;

    // Цикл while защищает от перескоков, если опыта дали сразу на несколько уровней
    while (gameData.exp >= getExpNeeded(gameData.level)) {
        const needed = getExpNeeded(gameData.level);
        gameData.exp -= needed;
        gameData.level += 1;

        levelStatus.value = true;
        setTimeout(() => {
            levelStatus.value = false;
        }, 800);

        gameData.coins += 50;    // Бонусные монетки при повышении уровня
    }
}