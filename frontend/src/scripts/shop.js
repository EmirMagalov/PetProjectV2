import {computed, ref} from "vue";
import {activeTab, gameData} from "@/scripts/useGameStore.js";
import {foodList} from "@/scripts/objectItems.js";
import {clothesItems} from "@/scripts/clothesItems.js";
import {headItems} from "@/scripts/headwearItems.js";
import {addToCart, buyClothes, buyHeadwear} from "@/scripts/basket.js";
import {syncToBackend} from "@/scripts/api.js";
import i18n from "@/scripts/locales/i18n.js";

export const wardrobeTab = ref('hats')
export const lastBought = ref(null)
export const lastBoughtQuantity = ref(1)
let notificationTimer = null
// Подкатегории для Еды: 'all', 'fastfood', 'fruits', 'sushi'
export const foodTab = ref('all')

// Хелпер для получения локализованного названия любого предмета по его категории/типу
export function getItemName(item) {
    if (!item) return ''

    // Определяем секцию локализации по категории или активной вкладке
    if (activeTab.value === 'food' || item.category === 'food' || item.category === 'bath accessories') {
        return i18n.global.t(`items.${item.id}`)
    } else if (activeTab.value === 'laboratory' || item.category === 'laboratory' || item.subcategory === 'ingredients') {
        return i18n.global.t(`ingredients.${item.id}`, i18n.global.t(`serums.${item.id}`))
    } else if (wardrobeTab.value === 'clothes' || item.category === 'costumes') {
        return i18n.global.t(`clothes.${item.id}`)
    } else {
        return i18n.global.t(`heads.${item.id}`)
    }
}

// Динамический список товаров с автоматическим переводом поля name
export const currentList = computed(() => {
    let list = []

    if (activeTab.value === 'food') {
        const fullList = foodList.filter(item => item.category === 'food')
        list = foodTab.value === 'all'
            ? fullList
            : fullList.filter(item => item.subcategory === foodTab.value)
    } else if (activeTab.value === 'laboratory') {
        list = foodList.filter(item => item.category === 'laboratory')
    } else if (activeTab.value === 'bath') {
        list = foodList.filter(item => item.category === 'bath accessories')
    } else {
        // Активен Гардероб
        if (wardrobeTab.value === 'clothes') {
            list = clothesItems.map(item => ({
                ...item,
                image: item.preview || item.image_normal
            }))
        } else {
            list = headItems
        }
    }

    // Подставляем переведенное имя для каждого предмета
    return list.map(item => ({
        ...item,
        name: getItemName(item)
    }))
})

// Функция определения количества товара в инвентаре
export function getItemQuantity(item) {
    if (activeTab.value === 'food' || activeTab.value === 'laboratory' || activeTab.value === 'bath') {
        return gameData.cart?.[item.id] || 0
    }
    return 0
}

// Универсальная проверка блокировки товара по уровню
export function isItemLocked(item) {
    // Убираем условие с isUnlocked, чтобы купленные вещи тоже проверялись по уровню!

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
export async function handleItemClick(item) {
    // 🛑 Блокируем любое взаимодействие, если предмет не подходит по уровню!
    if (isItemLocked(item)) return

    const isConsumable = activeTab.value === 'food' || activeTab.value === 'laboratory' || activeTab.value === 'bath' || item.category === 'laboratory' || item.category === 'ingredients';

    if (isConsumable && getItemQuantity(item) >= 10) {
        alert(i18n.global.t('the_maximum_quantity_for_this_item'))
        return;
    }

    const itemCost = getItemCost(item)

    // 🛒 ЛОГИКА ДЛЯ РАСХОДНИКОВ
    if (isConsumable) {
        if (gameData.coins >= itemCost) {
            gameData.coins -= itemCost
            addToCart(item.id)

            const currentQty = gameData.cart[item.id] || 1
            showNotification(item, currentQty)
        } else {
            alert(i18n.global.t('not_enough_coins'))
        }
        return;
    }

    // 👗 ЛОГИКА ДЛЯ ГАРДЕРОБА
    if (isUnlocked(item.id)) {
        if (wardrobeTab.value === 'clothes') {
            selectClothes(item.id)
        } else {
            selectHeadwear(item.id)
        }
    } else {
        if (gameData.coins >= itemCost) {
            gameData.coins -= itemCost

            if (wardrobeTab.value === 'clothes') {
                if (!gameData.unlockedClothes) gameData.unlockedClothes = []
                buyClothes(item.id)
            } else {
                buyHeadwear(item.id)
            }

            showNotification(item, 1)
            await syncToBackend()
        } else {
            alert(i18n.global.t('not_enough_coins'))
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
    lastBought.value = {
        ...item,
        name: getItemName(item)
    }
    lastBoughtQuantity.value = quantity
    if (notificationTimer) clearTimeout(notificationTimer)
    notificationTimer = setTimeout(() => {
        lastBought.value = null
    }, 2500)
}

// Локализованные бонусы предметов
export const getItemBonuses = (item) => {
    const bonuses = []

    if (item.foodGain) bonuses.push({text: `+ ${item.foodGain} ${i18n.global.t('satiety')}`, color: 'text-amber-400'})
    if (item.energyGain) bonuses.push({text: `+ ${item.energyGain} ${i18n.global.t('energy')}`, color: 'text-blue-400'})
    if (item.life) bonuses.push({text: `+ ${item.life} ${i18n.global.t('prize')}`, color: 'text-red-400'})
    if (item.health) bonuses.push({text: i18n.global.t('store.gain_life'), color: 'text-emerald-400'})
    return bonuses
}

export function getItemCost(item) {
    if (!item) return 0
    const baseCost = item.baseCost ?? item.price ?? 0

    if (item.category === 'food' ) {
        const rawLevel = gameData.level || 1
        const effectiveLevel = Math.min(rawLevel, 50)
        return baseCost + (effectiveLevel)
    }

    return baseCost
}