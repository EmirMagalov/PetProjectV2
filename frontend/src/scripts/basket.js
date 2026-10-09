import {computed, reactive, ref, watch} from "vue";
import {
    activeTab,
    gameData,
    isShopOpen
} from "@/scripts/useGameStore.js";
import {foodList} from "@/scripts/objectItems.js";
import {headItems} from "@/scripts/headwearItems.js";

import {syncToBackend} from "@/scripts/api.js";

export const currentIndex = ref(0)
export const currentBathIndex = ref(0) // Индекс для банных принадлежностей
import {costumeItems} from "@/scripts/costumeItems.js";
import {APP_VERSION} from "@/scripts/imageVersion.js"; // 1. Импортируем костюмы
// Вычисляемый список ВСЕХ товаров в корзине с подробной информацией
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

// Отдельный список только для еды и шамана (исключаем баню)
export const foodCartList = computed(() => {
    return cartItemsList.value.filter(item => item.category !== 'bath accessories')
})

// Отдельный список только для банных принадлежностей
export const bathCartList = computed(() => {
    return cartItemsList.value.filter(item => item.category === 'bath accessories')
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

export const currentCostumeItem = computed(() => {
    if (!gameData.equippedCostume) return null
    return costumeItems.find(item => item.id === gameData.equippedCostume)
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

export function buyCostume(costumeId) {
    if (!gameData.unlockedCostumes) {
        gameData.unlockedCostumes = []
    }
    if (!gameData.unlockedCostumes.includes(costumeId)) {
        gameData.unlockedCostumes.push(costumeId)
    }
    gameData.equippedCostume = costumeId
}

watch(foodCartList, (newList) => {
    newList.forEach(item => {
        if (item?.image) {
            const img = new Image()
            img.src = `${item.image}?v=${APP_VERSION}`
        }
    })
}, { immediate: true })