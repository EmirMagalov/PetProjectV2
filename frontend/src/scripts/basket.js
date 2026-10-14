import {computed, reactive, ref, watch} from "vue";
import {
    activeTab,
    gameData,
    isShopOpen
} from "@/scripts/useGameStore.js";
import {foodList} from "@/scripts/objectItems.js";
import {headItems} from "@/scripts/headwearItems.js";

import {syncToBackend} from "@/scripts/api.js";
import {clothesItems} from "@/scripts/clothesItems.js";
import {APP_VERSION} from "@/scripts/imageVersion.js";
import {ingredientList} from "@/scripts/laboratoryScripts/ingredientItems.js"; // 1. Импортируем костюмы

export const currentIndex = ref(0)
export const currentBathIndex = ref(0) // Индекс для банных принадлежностей
export const currentSerumIndex = ref(0)

// Вычисляемый список ВСЕХ товаров в корзине с подробной информацией
export const cartItemsList = computed(() => {
    return Object.entries(gameData.cart).map(([itemId, count]) => {
        const itemInfo = foodList.find(i => i.id === itemId) || ingredientList.find(i => i.id === itemId);
        return {
            id: itemId,
            count: count,
            color: itemInfo?.color || null,
            name: itemInfo?.name || 'Неизвестно',
            category: itemInfo?.category || 'Неизвестно',
            subcategory: itemInfo?.subcategory || 'Неизвестно',
            image: itemInfo?.image || '',
            foodGain: itemInfo?.foodGain || 0,
            price: itemInfo?.price || 0
        }
    })
})

// Отдельный список только для еды и шамана (исключаем баню)
export const foodCartList = computed(() => {
    return cartItemsList.value.filter(item => item.category !== 'bath accessories' &&  item.category !== 'ingredients')
})

// Отдельный список только для банных принадлежностей
export const bathCartList = computed(() => {
    return cartItemsList.value.filter(item => item.category === 'bath accessories')
})

export const ingredientCartList = computed(() => {
    return cartItemsList.value.filter(item => item.category === 'ingredients' || ingredientList.some(s => s.id === item.id))
})

export const currentFoodItem = computed(() => {
    return foodCartList.value[currentIndex.value] || null
})

export const currentBathItem = computed(() => {
    return bathCartList.value[currentBathIndex.value] || null
})

export const currentHeadItem = computed(() => {
    if (!gameData.equippedHead) return null
    return headItems.find(item => item.id === gameData.equippedHead)
})

export const currentClothesItem = computed(() => {
    if (!gameData.equippedClothes) return null
    return clothesItems.find(item => item.id === gameData.equippedClothes)
})


export const laboratoryIngredientsList = computed(() => {
    return ingredientCartList.value
})

// Отслеживание изменений корзины с автокоррекцией индексов и синхронизацией
watch(() => gameData.cart, () => {
    // Безопасно проверяем, чтобы индексы никогда не выходили за границы массивов
    const foodLength = foodCartList.value.length
    if (currentIndex.value >= foodLength) {
        currentIndex.value = Math.max(0, foodLength - 1)
    }

    const bathLength = bathCartList.value.length
    if (currentBathIndex.value >= bathLength) {
        currentBathIndex.value = Math.max(0, bathLength - 1)
    }

    (async () => {
        try {
            await syncToBackend()
        } catch (e) {
            console.error("Ошибка синхронизации корзины:", e)
        }
    })()
}, {deep: true})

// watch(gameData.unlockedHeads, (newList) => {
//     localStorage.setItem('unlockedHeads', JSON.stringify(newList))
// }, {deep: true})
//
//
// watch(() => gameData.unlockedCostumes, (newList) => {
//     if (newList) {
//         localStorage.setItem('unlockedCostumes', JSON.stringify(newList))
//     }
// }, {deep: true})

// Управление корзиной (через копирование объекта для реактивности Vue)
export function addToCart(foodId) {
    gameData.cart = {
        ...gameData.cart,
        [foodId]: (gameData.cart[foodId] || 0) + 1
    }

    // Корректируем индексы сразу при добавлении товара
    const foodLength = foodCartList.value.length
    if (currentIndex.value >= foodLength) {
        currentIndex.value = Math.max(0, foodLength - 1)
    }

    const bathLength = bathCartList.value.length
    if (currentBathIndex.value >= bathLength) {
        currentBathIndex.value = Math.max(0, bathLength - 1)
    }
}

export function removeFromCart(targetId) {
    if (gameData.cart[targetId] > 0) {
        // Создаем копию для корректного обновления реактивного объекта
        const updatedCart = {...gameData.cart}
        updatedCart[targetId]--

        if (updatedCart[targetId] <= 0) {
            delete updatedCart[targetId]
        }

        gameData.cart = updatedCart

        // Корректируем индекс еды
        const foodLength = foodCartList.value.length
        if (currentIndex.value >= foodLength) {
            currentIndex.value = Math.max(0, foodLength - 1)
        }

        // Корректируем индекс бани
        const bathLength = bathCartList.value.length
        if (currentBathIndex.value >= bathLength) {
            currentBathIndex.value = Math.max(0, bathLength - 1)
        }
    }
}

// Переключение товаров в холодильнике (еда/шаман)
export function nextItem() {
    if (!foodCartList.value || foodCartList.value.length === 0) {
        isShopOpen.value = true
        activeTab.value = 'food'
    } else {
        currentIndex.value = (currentIndex.value + 1) % foodCartList.value.length
    }
}

// Переключение банных принадлежностей
export function nextBathItem() {
    if (!bathCartList.value || bathCartList.value.length === 0) {
        isShopOpen.value = true
        activeTab.value = 'bath'
    } else {
        currentBathIndex.value = (currentBathIndex.value + 1) % bathCartList.value.length
    }
}

// Покупка и разблокировка одежды
export function buyHeadwear(headId) {
    if (!gameData.unlockedHeads.includes(headId)) {
        gameData.unlockedHeads.push(headId)
    }
    gameData.equippedHead = headId
}

export function buyClothes(clothesId) {
    if (!gameData.unlockedClothes) {
        gameData.unlockedClothes = []
    }
    if (!gameData.unlockedClothes.includes(clothesId)) {
        gameData.unlockedClothes.push(clothesId)
    }
    gameData.equippedClothes = clothesId
}

watch(foodCartList, (newList) => {
    newList.forEach(item => {
        if (item?.image) {
            const img = new Image()
            img.src = `${item.image}?v=${APP_VERSION}`
        }
    })
}, { immediate: true })