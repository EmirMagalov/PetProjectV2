import { computed, ref } from "vue";
import { laboratoryIngredientsList } from "@/scripts/basket.js";
import { serumRecipes } from "@/scripts/laboratoryScripts/recipes.js";
import {gameData} from "@/scripts/useGameStore.js";
import { ingredientList } from "@/scripts/laboratoryScripts/ingredientItems.js";
import {incrementTaskProgress} from "@/scripts/dealyTasks.js";


export const ingredientDropZoneRef = ref(null);
export const activeIngredient = ref([]); // Что лежит на столе сейчас
export const craftedSerumModal = ref(null); // Данные для всплывающего окна
export const lastCrafted = ref(null);
export const lastCraftedQuantity = ref(1);
let currentHoveredItem = null;
let craftTimer = null;
export function ingredientMove(event, item) {
    if (!ingredientDropZoneRef.value || typeof ingredientDropZoneRef.value.getBoundingClientRect !== 'function') return;

    const dropRect = ingredientDropZoneRef.value.getBoundingClientRect();
    const clientX = event.clientX;
    const clientY = event.clientY;

    const isInside = (
        clientX >= dropRect.left &&
        clientX <= dropRect.right &&
        clientY >= dropRect.top &&
        clientY <= dropRect.bottom
    );

    currentHoveredItem = isInside ? item : null;
}

export function ingredientEnd(item) {
    if (currentHoveredItem && currentHoveredItem.id === item.id) {
        const purchasedItem = laboratoryIngredientsList.value.find(i => i.id === item.id);
        const ownedCount = purchasedItem ? purchasedItem.count : 0;

        const existingOnTable = activeIngredient.value.find(i => i.id === item.id);
        const currentOnTableCount = existingOnTable ? existingOnTable.count : 0;

        if (currentOnTableCount < ownedCount) {
            if (existingOnTable) {
                existingOnTable.count++;
            } else {
                activeIngredient.value.push({
                    ...item,
                    count: 1
                });
            }
        }
    }
    currentHoveredItem = null;
}

// 📊 Вычисляем прогресс для подсказок
export const recipesProgress = computed(() => {
    return serumRecipes.map(recipe => {
        let hasAnyMatch = false;
        let hasAll = true;
        let totalRequired = 0;
        let totalCurrent = 0;

        const requirementsList = [];

        for (const [reqId, reqCount] of Object.entries(recipe.requirements)) {
            totalRequired += reqCount;
            const tableItem = activeIngredient.value.find(i => i.id === reqId);
            const currentCount = tableItem ? tableItem.count : 0;
            totalCurrent += Math.min(currentCount, reqCount);

            if (currentCount > 0) {
                hasAnyMatch = true;
            }

            const ingredientInfo = ingredientList.find(i => i.id === reqId);
            const isEnough = currentCount >= reqCount;

            if (!isEnough) {
                hasAll = false;
            }

            requirementsList.push({
                id: reqId,
                name: ingredientInfo?.name || reqId,
                image: ingredientInfo?.image || '',
                current: currentCount,
                required: reqCount,
                needed: Math.max(0, reqCount - currentCount),
                isEnough: isEnough
            });
        }

        return {
            ...recipe,
            hasAnyMatch,
            isReady: hasAll,
            requirementsList,
            progressPercent: Math.round((totalCurrent / totalRequired) * 100)
        };
    }).filter(recipe => recipe.hasAnyMatch);
});

// 🧪 Функция крафта (принимает переданный рецепт из кнопки)
export function craftSerum(targetRecipe) {
    const recipe = targetRecipe;
    if (!recipe || !recipe.isReady) return;

    // 1. Списываем ингредиенты из общей корзины (gameData.cart)
    const updatedCart = { ...gameData.cart };
    for (const [reqId, reqCount] of Object.entries(recipe.requirements)) {
        if (updatedCart[reqId]) {
            updatedCart[reqId] -= reqCount;
            if (updatedCart[reqId] <= 0) {
                delete updatedCart[reqId];
            }
        }
    }
    gameData.cart = updatedCart;
    incrementTaskProgress('serum', 1)
    // 2. Списываем ингредиенты СО СТОЛА
    for (const [reqId, reqCount] of Object.entries(recipe.requirements)) {
        const tableIndex = activeIngredient.value.findIndex(i => i.id === reqId);
        if (tableIndex !== -1) {
            const tableItem = activeIngredient.value[tableIndex];
            if (tableItem.count > reqCount) {
                tableItem.count -= reqCount;
            } else {
                activeIngredient.value.splice(tableIndex, 1);
            }
        }
    }

    // 3. Сохраняем готовую сыворотку в инвентарь
    const newCount = (gameData.cart[recipe.id] || 0) + 1;
    gameData.cart = {
        ...gameData.cart,
        [recipe.id]: newCount
    };

    // 4. Показываем модальное окно успешного крафта
    craftedSerumModal.value = recipe;

    // 5. Передаем точное количество из корзины в тост
    lastCrafted.value = recipe;
    lastCraftedQuantity.value = newCount;

    if (craftTimer) clearTimeout(craftTimer);
    craftTimer = setTimeout(() => {
        lastCrafted.value = null;
    }, 3000);
}
export function closeCraftModal() {
    craftedSerumModal.value = null;
}


export function getAvailableIngredientCount(ingredientId) {
    const purchasedItem = laboratoryIngredientsList.value.find(i => i.id === ingredientId);
    const purchasedCount = purchasedItem ? purchasedItem.count : 0;

    // Сколько штук этого же ингредиента сейчас лежит на столе
    const tableItem = activeIngredient.value.find(i => i.id === ingredientId);
    const onTableCount = tableItem ? tableItem.count : 0;

    // Возвращаем то, что осталось доступным для переноса
    return Math.max(0, purchasedCount - onTableCount);
}


// Во вспомогательной функции в dragAndDrop_2.js:
export function getTotalIngredientCount(ingredientId) {
    // Лимит 10 штук должен считаться по общему купленному количеству в корзине!
    return gameData.cart && gameData.cart[ingredientId] ? Number(gameData.cart[ingredientId]) : 0;
}