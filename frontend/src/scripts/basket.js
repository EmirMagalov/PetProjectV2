import {computed, reactive, ref, watch} from "vue";
import {
    gameData,

    isShopOpen


} from "@/scripts/useGameStore.js";
import {foodList} from "@/scripts/foodItems.js";
import {headItems} from "@/scripts/headwearItems.js";

import {syncToBackend} from "@/scripts/api.js";

// export const cart = reactive(
//     JSON.parse(localStorage.getItem('cart')) || {
//         'burger': 1
//     }
// )

// Инвентарь купленной одежды (массив ID купленных шапок)
// export const unlockedHeads = reactive(
//     JSON.parse(localStorage.getItem('unlockedHeads')) || []
// )

export const currentIndex = ref(0)

// Вычисляемый список товаров в корзине с подробной информацией
export const cartItemsList = computed(() => {
    return Object.entries(gameData.cart).map(([foodId, count]) => {
        const foodInfo = foodList.find(item => item.id === foodId)
        return {
            id: foodId,
            count: count,
            name: foodInfo?.name || 'Неизвестно',
            category: foodInfo?.category || 'Неизвестно',
            subcategory: foodInfo?.subcategory || 'Неизвестно',
            image: foodInfo?.image || '',
            foodGain: foodInfo?.foodGain || 0,
            cost: foodInfo?.cost || 0
        }
    })
})

export const currentFoodItem = computed(() => {
    return cartItemsList.value[currentIndex.value] || null
})

export const currentHeadItem = computed(() => {
    if (!gameData.equippedHead) return null
    return headItems.find(item => item.id === gameData.equippedHead)
})


watch(() => gameData.cart, () => {
    // Обернули в асинхронный самовызывающийся блок (IIFE) и добавили обработку ошибок
    (async () => {
        try {
            await syncToBackend()
        } catch (e) {
            console.error("Ошибка синхронизации корзины:", e)
        }
    })()
}, { deep: true })
// Сохранение купленной одежды
watch(gameData.unlockedHeads, (newList) => {
    localStorage.setItem('unlockedHeads', JSON.stringify(newList))
}, {deep: true})

// Управление корзиной еды
export function addToCart(foodId) {
    gameData.cart[foodId] = (gameData.cart[foodId] || 0) + 1
}

export function removeFromCart(targetId) {
    if (gameData.cart[targetId] > 0) {
        gameData.cart[targetId]--

        if (gameData.cart[targetId] <= 0) {
            delete gameData.cart[targetId]

            // Берём актуальную длину напрямую из объекта, а не из computed
            const newLength = Object.keys(gameData.cart).length

            if (currentIndex.value >= newLength) {
                currentIndex.value = Math.max(0, newLength - 1)
            }
        }
    }
}

// Переключение товаров в холодильнике

export function nextItem() {
    if (!cartItemsList.value || cartItemsList.value.length === 0) {
        isShopOpen.value = true
    } else {
        currentIndex.value = (currentIndex.value + 1) % cartItemsList.value.length
    }

}


// Покупка и разблокировка одежды
export function buyHeadwear(headId) {
    if (!gameData.unlockedHeads.includes(headId)) {
        gameData.unlockedHeads.push(headId)
    }
    gameData.equippedHead = headId
}



