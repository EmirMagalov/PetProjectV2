import {computed, ref} from "vue";
import {activeTab, gameData} from "@/scripts/useGameStore.js";
import {foodList} from "@/scripts/objectItems.js";
import {clothesItems} from "@/scripts/clothesItems.js";
import {headItems} from "@/scripts/headwearItems.js";
import {addToCart, buyClothes, buyHeadwear} from "@/scripts/basket.js";

export const wardrobeTab = ref('hats')
export const lastBought = ref(null)
export const lastBoughtQuantity = ref(1)
let notificationTimer = null
// Подкатегории для Еды: 'all', 'fastfood', 'fruits', 'sushi'
export const foodTab = ref('all')

// Динамический список товаров в зависимости от выбранной вкладки и подкатегории
export const currentList = computed(() => {
    if (activeTab.value === 'food') {
        const list = foodList.filter(item => item.category === 'food')
        if (foodTab.value === 'all') return list
        return list.filter(item => item.subcategory === foodTab.value)
    } else if (activeTab.value === 'laboratory') {
        return foodList.filter(item => item.category === 'laboratory')
    } else if (activeTab.value === 'bath') {
        return foodList.filter(item => item.category === 'bath accessories')
    } else {
        // Активен Гардероб
        if (wardrobeTab.value === 'clothes') {
            return clothesItems.map(item => ({
                ...item,
                image: item.preview || item.image_normal
            }))
        }
        return headItems
    }
})



// Функция определения количества товара в инвентаре
export function getItemQuantity(item) {
    if (activeTab.value === 'food' || activeTab.value === 'laboratory' || activeTab.value === 'bath') {
        return gameData.cart?.[item.id] || 0
    }
    return 0
}

// Универсальная проверка блокировки товара по уровню
// Универсальная проверка блокировки товара по уровню
export function isItemLocked(item) {
    // Если предмет уже куплен, он никогда не должен быть заблокирован
    if (activeTab.value === 'clothes' && isUnlocked(item.id)) {
        return false
    }

    if (Boolean(item.level) && gameData.level < item.level) {
        return true
    }

    if (activeTab.value === 'clothes') {
        const isUnlockedItem = wardrobeTab.value === 'clothes'
            ? gameData.unlockedClothes?.includes(item.id)
            : gameData.unlockedHeads?.includes(item.id)

        if (!isUnlockedItem && Boolean(item.level) && gameData.level < item.level) {
            return true
        }
    }

    return false
}

// Проверка надета ли одежда/шляпа
export function isEquipped(itemId) {
    if (wardrobeTab.value === 'clothes') {
        return gameData.equippedClothes === itemId
    }
    return gameData.equippedHead === itemId
}

// Проверка куплен ли предмет
export function isUnlocked(itemId) {
    if (wardrobeTab.value === 'clothes') {
        return gameData.unlockedClothes?.includes(itemId)
    }
    return gameData.unlockedHeads?.includes(itemId)
}

// Универсальная логика клика по кнопке товара
export function handleItemClick(item) {
    if (activeTab.value !== 'clothes' && getItemQuantity(item) >= 10) {
        alert("Максимальное количество этого товара — 10 штук!");
        return;
    }
    if (isItemLocked(item)) return

    // Получаем динамическую цену предметов
    const itemCost = getItemCost(item)

    if (activeTab.value === 'food' || activeTab.value === 'laboratory' || activeTab.value === 'bath') {
        if (gameData.coins >= itemCost) {
            gameData.coins -= itemCost // 👈 Списываем с учетом уровня
            addToCart(item.id)

            const currentQty = gameData.cart[item.id] || 1
            showNotification(item, currentQty)
        } else {
            alert("Не хватает монет!")
        }
    } else {
        if (isUnlocked(item.id)) {
            if (wardrobeTab.value === 'clothes') {
                selectClothes(item.id)
            } else {
                selectHeadwear(item.id)
            }
        } else {
            if (gameData.coins >= itemCost) {
                gameData.coins -= itemCost // 👈 Списываем с учетом уровня

                if (wardrobeTab.value === 'clothes') {
                    if (!gameData.unlockedClothes) gameData.unlockedClothes = []
                    buyClothes(item.id)
                } else {
                    buyHeadwear(item.id)
                }

                showNotification(item, 1)
            } else {
                alert("Не хватает монет!")
            }
        }
    }
}

function selectHeadwear(headId) {
    if (gameData.equippedHead === headId) {
        gameData.equippedHead = null
    } else {
        gameData.equippedHead = headId
    }
}

function selectClothes(clothesId) {
    if (gameData.equippedClothes === clothesId) {
        gameData.equippedClothes = null
    } else {
        gameData.equippedClothes = clothesId
    }
}

function showNotification(item, quantity = 1) {
    lastBought.value = item
    lastBoughtQuantity.value = quantity
    if (notificationTimer) clearTimeout(notificationTimer)
    notificationTimer = setTimeout(() => {
        lastBought.value = null
    }, 2500)
}

export const getItemBonuses = (item) => {
    const bonuses = []

    if (item.foodGain) bonuses.push({text: `+ ${item.foodGain} сытости`, color: 'text-amber-400'})
    if (item.energyGain) bonuses.push({text: `+ ${item.energyGain} энергии`, color: 'text-blue-400'})
    if (item.life) bonuses.push({text: `+ ${item.life} жизнь`, color: 'text-red-400'})
    if (item.health) bonuses.push({text: `Восстановление здоровья`, color: 'text-emerald-400'})
    // if (item.subcategory === 'fruits') bonuses.push({text: `+ здоровье`, color: 'text-green-400'})
    return bonuses
}

export function getItemCost(item) {
    if (!item) return 0
    const baseCost = item.baseCost ?? item.price ?? 0

    // Повышаем цену на (level * 2) ТОЛЬКО для товаров категории 'food'
    if (item.category === 'food' ) {
        const rawLevel = gameData.level || 1

        // Ограничиваем уровень максимумом в 50
        const effectiveLevel = Math.min(rawLevel, 50)

        return baseCost + (effectiveLevel)
    }

    // Для всех остальных предметов возвращаем исходную цену
    return baseCost
}