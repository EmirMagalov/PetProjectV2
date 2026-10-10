import {gameData, isExpPopping, showStatus} from "@/scripts/useGameStore.js";
import { computed } from "vue";
import {addCoin, triggerExpAnimation} from "@/scripts/actions.js";


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
export function addExp(amount,x=180,y=130) {
    gameData.exp += amount;
    isExpPopping.value = true
    setTimeout(() => {
        isExpPopping.value = false

    }, 200)
    triggerExpAnimation(amount,x,y)
    // Цикл while защищает от перескоков, если опыта дали сразу на несколько уровней
    while (gameData.exp >= getExpNeeded(gameData.level)) {
        const needed = getExpNeeded(gameData.level);
        gameData.exp -= needed;
        gameData.level += 1;

        showStatus('levelUp')

        addCoin(50 + gameData.level)    // Бонусные монетки при повышении уровня
    }
}