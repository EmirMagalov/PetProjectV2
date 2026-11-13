import interact from 'interactjs'
import {ref} from "vue";
import {addCoin, feedPet, isLosingLife, otherFeedPet, updateEyeLook, resetEyeLook} from "@/scripts/actions.js";
import {
    colorFoam,
    currentDraggedItem,
    dropZoneRef, foamOffset,
    gameData, maxLives, nextTutorialStep, showTongue,
    statusFoam,
    statusShower
} from "@/scripts/useGameStore.js";

import {currentBathItem, currentFoodItem, removeFromCart} from "@/scripts/basket.js";
import {addExp} from "@/scripts/level.js";
import {incrementTaskProgress} from "@/scripts/dealyTasks.js";

let actionTimer = null

export const showerCount = ref(0)
export const isHovered = ref(false)
export const isDraggingMain = ref(false);
export const foodConsumedByPipe = ref(false)

export const foodEl = ref(null)
export const showerEl = ref(null)
export const foamEl = ref(null)

export const statusSmoke = ref(false)

export const batheStatus = ref(false)

export const showerX = ref(0)
export const showerY = ref(0)

let lastBathTime = 0
const BATH_COOLDOWN = 5000

function clearActionTimer() {
    if (actionTimer) {
        clearTimeout(actionTimer)
        actionTimer = null
    }
}

// Универсальная настройка interact.js для перетаскивания с мгновенным возвратом
function setupInteract(el, itemType, getItemFn) {
    if (!el) return
    if (el.dataset.interactInitialized) return
    el.dataset.interactInitialized = 'true'

    interact(el).draggable({
        inertia: false, // ОТКЛЮЧАЕМ ИНЕРЦИЮ ДЛЯ МГНОВЕННОГО ОТКЛИКА
        listeners: {
            start(event) {
                clearActionTimer()
                currentDraggedItem.value = itemType
                if (itemType === 'food') {
                    foodConsumedByPipe.value = false
                }
                event.target.style.zIndex = '150'
            },
            move(event) {
                const target = event.target
                const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
                const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

                target.style.transform = `translate(${x}px, ${y}px)`
                target.setAttribute('data-x', x)
                target.setAttribute('data-y', y)

                // ЕСЛИ ЭТО ДУШ — ОБНОВЛЯЕМ ЕГО КООРДИНАТЫ ДЛЯ ВОДЫ
                if (itemType === 'shower') {
                    const rect = target.getBoundingClientRect()
                    showerX.value = rect.left
                    showerY.value = rect.top
                }

                const fakeEvent = {
                    clientX: event.clientX,
                    clientY: event.clientY,
                    touches: [{ clientX: event.clientX, clientY: event.clientY }]
                }
                updateEyeLook(fakeEvent)
                handleMove(fakeEvent, itemType, getItemFn())
            },
            end(event) {
                const target = event.target
                // target.style.zIndex = '150'

                const item = getItemFn()
                handleEnd(itemType, item)
                resetEyeLook(600)

                // Мгновенный возврат на исходную позицию без задержки и анимации
                target.style.transition = 'none'
                target.style.transform = 'translate(0px, 0px)'
                target.setAttribute('data-x', 0)
                target.setAttribute('data-y', 0)
            }
        }
    })
}

export function initFoodInteract(el) {
    setupInteract(el, 'food', () => currentFoodItem.value)
}

export function initFoamInteract(el) {
    setupInteract(el, 'foam', () => currentBathItem.value)
}
export function initShowerInteract(el) {
    setupInteract(el, 'shower', () => null)
}

export function handleMove(event, itemType, Item) {
    isDraggingMain.value = true
    if (itemType === 'food' && foodConsumedByPipe.value) return
    if (!dropZoneRef.value) return

    const dropRect = dropZoneRef.value.getBoundingClientRect()
    const clientX = event.clientX || (event.touches && event.touches[0]?.clientX) || 0
    const clientY = event.clientY || (event.touches && event.touches[0]?.clientY) || 0

    let isInside = (
        clientX >= dropRect.left &&
        clientX <= dropRect.right &&
        clientY >= dropRect.top &&
        clientY <= dropRect.bottom
    )

    if (isInside && (itemType === 'shower' || itemType === 'foam')) {
        const centerX = dropRect.left + dropRect.width / 2
        const centerY = dropRect.top + dropRect.height / 2
        const radiusX = 80
        const radiusY = 80

        isInside = (
            clientX >= centerX - radiusX &&
            clientX <= centerX + radiusX &&
            clientY >= centerY - radiusY &&
            clientY <= centerY + radiusY
        )
    }

    if (isInside) {
        isHovered.value = true
        gameData.sleep = false

        if (itemType === 'shower') {
            batheStatus.value = true

            if (statusFoam.value === true) {
                statusShower.value = true

                if (!actionTimer) {
                    actionTimer = setInterval(() => {
                        if (isHovered.value && currentDraggedItem.value === 'shower') {
                            foamOffset.value += 1.5

                            if (foamOffset.value >= 60) {
                                if (gameData.sick) {
                                    isLosingLife()
                                }
                                const now = Date.now()
                                if (now - lastBathTime < BATH_COOLDOWN) {
                                    gameData.sick = true
                                }
                                lastBathTime = now

                                statusShower.value = false
                                statusFoam.value = false
                                foamOffset.value = 0
                                localStorage.removeItem('pet_statusFoam')
                                localStorage.removeItem('pet_foamOffset')
                                localStorage.removeItem('pet_colorFoam')
                                showerCount.value += 1
                                gameData.stinky = false
                                nextTutorialStep()
                                addCoin(2)
                                addExp(25)
                                incrementTaskProgress('wash', 1)
                                gameData.feedCount = 0
                                clearActionTimer()
                            }
                        } else {
                            statusShower.value = false
                            clearActionTimer()
                        }
                    }, 50)
                }
            } else {
                statusShower.value = false
                clearActionTimer()
            }
        } else if (itemType === 'foam') {
            batheStatus.value = true
        }
    } else {
        isHovered.value = false
        statusShower.value = false
        statusSmoke.value = false
        clearActionTimer()
    }
}

export function handleEnd(itemType, Item) {
    isDraggingMain.value = false
    clearActionTimer()
    statusShower.value = false
    if (foodConsumedByPipe.value || Item?.category === 'pipe') {
        statusSmoke.value = false
        foodConsumedByPipe.value = false
        isHovered.value = false
        currentDraggedItem.value = null
        return
    }

    if (isHovered.value) {
        if (itemType === 'food') {
            if (Item?.category === 'food') {
                feedPet(Item.id)
                nextTutorialStep()
            } else if (Item) {
                const isFullLives = (Item.id === 'life_serum' && gameData.lives >= maxLives.value)
                const isUnneededHealth = (Item.id === 'health_serum' && !gameData.sick)
                const isUnneededEnergy = (Item.id === 'energy_serum' && gameData.energy >= 80)

                if (!isFullLives && !isUnneededHealth && !isUnneededEnergy) {
                    otherFeedPet(Item.id)
                } else {
                    showTongue.value = true
                    setTimeout(() => {
                        showTongue.value = false
                    }, 800)
                }
            }
        } else if (itemType === 'foam') {
            if (!statusFoam.value) {
                statusFoam.value = true

                if (Item?.color) {
                    colorFoam.value = Item.color
                    localStorage.setItem('pet_colorFoam', Item.color)
                }

                nextTutorialStep()
                if (Item?.id) {
                    removeFromCart(Item.id)
                }
            }
        }
    }

    batheStatus.value = false
    isHovered.value = false
    statusShower.value = false
    currentDraggedItem.value = null
    statusSmoke.value = false
    foodConsumedByPipe.value = false

    window.getSelection()?.removeAllRanges()
    document.activeElement?.blur()
}