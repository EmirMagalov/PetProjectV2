import {
    gameData


} from "@/scripts/useGameStore.js";
import {computed, ref, watch} from "vue";

export const levelStatus = ref(false)
export const expNeeded = gameData.level * 100
export const expPercentage = computed(() => {
    const needed = gameData.level * 100 // Сколько нужно для следующего уровня
    const percent = (gameData.exp / needed) * 100
    return Math.min(100, Math.max(0, percent)) // Ограничиваем от 0 до 100%
})
export function addExp(amount) {
    gameData.exp += amount

    // Порог опыта для перехода на следующий уровень (например, 100 очков для 1 уровня, 200 для 2 и т.д.)

    if (gameData.exp >= expNeeded) {
        gameData.exp -= expNeeded
        gameData.level += 1
        levelStatus.value = true
        setTimeout(()=>{
            levelStatus.value = false
        },800)
        // Тут можно выдать бонус за повышение уровня, например, монетки!
        gameData.coins += 50


    }
}