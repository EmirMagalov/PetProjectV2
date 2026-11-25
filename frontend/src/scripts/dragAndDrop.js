import interact from 'interactjs'
import { computed, ref } from "vue"
import { addCoin, feedPet, isLosingLife, otherFeedPet, updateEyeLook, resetEyeLook } from "@/scripts/actions.js"
import {
    colorFoam,
    currentDraggedItem,
    dropZoneRef,
    foamOffset,
    gameData,
    lifeStage,
    maxLives,
    nextTutorialStep,
    showTongue,
    statusFoam,
    statusShower
} from "@/scripts/useGameStore.js"

import { currentBathItem, currentFoodItem, removeFromCart } from "@/scripts/basket.js"
import { addExp } from "@/scripts/level.js"
import { incrementTaskProgress } from "@/scripts/dealyTasks.js"

const FOAM_BUBBLES_KEY = 'pet_foamBubbles'
const BUBBLE_STEP_PX = 24
const MIN_BUBBLE_DIST_PX = 10
const BATH_COOLDOWN = 5000

const MAX_FOAM_BUBBLES = computed(() => (lifeStage.value === 'baby' ? 13 : 20))

function getFoamBounds() {
    const isBaby = lifeStage.value === 'baby'
    return {
        minX: isBaby ? -25 : -45,
        maxX: isBaby ? 25 : 45,
        minY: isBaby ? -15 : -30,
        maxY: isBaby ? 35 : 55
    }
}

function loadSavedBubbles() {
    try {
        const raw = localStorage.getItem(FOAM_BUBBLES_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

function saveBubbles() {
    try {
        localStorage.setItem(FOAM_BUBBLES_KEY, JSON.stringify(foamBubbles.value))
    } catch {
        // игнорируем ошибки переполнения/доступа к localStorage
    }
}

let actionTimer = null

export const showerCount = ref(0)
export const isHovered = ref(false)
export const isDraggingMain = ref(false)
export const foodConsumedByPipe = ref(false)

export const foodEl = ref(null)
export const showerEl = ref(null)
export const foamEl = ref(null)

export const statusSmoke = ref(false)
export const batheStatus = ref(false)

export const showerX = ref(0)
export const showerY = ref(0)

const initialBubbles = loadSavedBubbles()
export const foamBubbles = ref(initialBubbles)
export const latherProgress = ref(0)

let pendingShampooItem = null
let lastFoamPos = null
let bubbleIdCounter = initialBubbles.reduce((maxId, b) => Math.max(maxId, Number(b.id) || 0), 0)
let distanceSinceLastBubble = 0
let lastBathTime = 0
let foamCompletedInGesture = false
latherProgress.value = Math.min(
    100,
    Math.round((foamBubbles.value.length / MAX_FOAM_BUBBLES.value) * 100)
)

function clearActionTimer() {
    if (actionTimer) {
        clearInterval(actionTimer)
        actionTimer = null
    }
}

function resetLatherState() {
    lastFoamPos = null
    pendingShampooItem = null
    distanceSinceLastBubble = 0
    latherProgress.value = 0
    foamBubbles.value = []
    localStorage.removeItem(FOAM_BUBBLES_KEY)
}

function setupInteract(el, itemType, getItemFn) {
    if (!el) return
    if (el.dataset.interactInitialized) return
    el.dataset.interactInitialized = 'true'

    interact(el).draggable({
        inertia: false,
        listeners: {
            start(event) {
                clearActionTimer()
                pendingShampooItem = null
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
                const item = getItemFn()
                handleEnd(itemType, item)
                resetEyeLook(600)

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
    const isSerum = itemType === 'food' && Item?.subcategory === 'serum'
    if (!isSerum) {
        isDraggingMain.value = true
    }
    if (itemType === 'food' && foodConsumedByPipe.value) return
    if (!dropZoneRef.value) return

    const dropRect = dropZoneRef.value.getBoundingClientRect()
    const clientX = event.clientX || (event.touches && event.touches[0]?.clientX) || 0
    const clientY = event.clientY || (event.touches && event.touches[0]?.clientY) || 0

    const inOuterBox =
        clientX >= dropRect.left - 30 &&
        clientX <= dropRect.right + 30 &&
        clientY >= dropRect.top - 30 &&
        clientY <= dropRect.bottom + 200

    if (!inOuterBox) {
        return
    }

    const offsetY = itemType === 'shower' ? 0 : lifeStage.value === 'baby' ? 100 : 80
    const centerX = dropRect.left + dropRect.width / 2
    const centerY = dropRect.top + dropRect.height / 2 + offsetY

    const radiusX = itemType === 'foam' ? 175 : 45
    const radiusY = itemType === 'shower' ? 175 : 75

    const isInside =
        clientX >= centerX - radiusX &&
        clientX <= centerX + radiusX &&
        clientY >= centerY - radiusY &&
        clientY <= centerY + radiusY

    if (isInside) {
        isHovered.value = true
        gameData.sleep = false

        if (itemType === 'shower') {
            batheStatus.value = true

            if (statusFoam.value === true || foamBubbles.value.length > 0) {
                statusShower.value = true

                if (!actionTimer) {
                    const maxBubbles = MAX_FOAM_BUBBLES.value
                    const latherRatio = statusFoam.value
                        ? 1
                        : foamBubbles.value.length / maxBubbles
                    const countAsBath = latherRatio > 0.8

                    actionTimer = setInterval(() => {
                        if (isHovered.value && currentDraggedItem.value === 'shower') {
                            foamOffset.value += 1.5

                            if (foamOffset.value >= 60) {
                                if (countAsBath) {
                                    if (gameData.sick) {
                                        isLosingLife()
                                    }
                                    const now = Date.now()
                                    if (now - lastBathTime < BATH_COOLDOWN) {
                                        gameData.sick = true
                                    }
                                    lastBathTime = now

                                    showerCount.value += 1
                                    gameData.stinky = false
                                    nextTutorialStep()
                                    addCoin(2)
                                    addExp(25)
                                    incrementTaskProgress('wash', 1)
                                    gameData.feedCount = 0
                                }

                                statusShower.value = false
                                statusFoam.value = false
                                foamOffset.value = 0
                                resetLatherState()

                                localStorage.removeItem('pet_statusFoam')
                                localStorage.removeItem('pet_foamOffset')
                                localStorage.removeItem('pet_colorFoam')

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

            if (Item?.subcategory === 'shampoo') {
                pendingShampooItem = Item
                lastFoamPos = { x: clientX, y: clientY }
                return
            }

            if (!statusFoam.value) {
                const maxBubbles = MAX_FOAM_BUBBLES.value
                const bounds = getFoamBounds()

                if (lastFoamPos) {
                    const dist = Math.hypot(clientX - lastFoamPos.x, clientY - lastFoamPos.y)

                    if (dist > 0) {
                        distanceSinceLastBubble += dist
                        let added = false

                        while (
                            distanceSinceLastBubble >= BUBBLE_STEP_PX &&
                            foamBubbles.value.length < maxBubbles
                            ) {
                            distanceSinceLastBubble -= BUBBLE_STEP_PX

                            const jitterX = Math.random() * 6 - 3
                            const jitterY = Math.random() * 6 - 3
                            const size = Math.round(24 + Math.random() * 12)

                            const rawX = (clientX - centerX) + jitterX
                            const rawY = (clientY - centerY) + jitterY

                            const clampedX = Math.round(
                                Math.min(bounds.maxX, Math.max(bounds.minX, rawX))
                            )
                            const clampedY = Math.round(
                                Math.min(bounds.maxY, Math.max(bounds.minY, rawY))
                            )

                            const isTooClose = foamBubbles.value.some(
                                (b) => Math.hypot(b.x - clampedX, b.y - clampedY) < MIN_BUBBLE_DIST_PX
                            )

                            if (isTooClose) {
                                continue
                            }

                            foamBubbles.value.push({
                                id: ++bubbleIdCounter,
                                x: clampedX,
                                y: clampedY,
                                size,
                                color: Item?.color || colorFoam.value || null
                            })
                            added = true
                        }

                        if (added) {
                            saveBubbles()
                        }

                        latherProgress.value = Math.min(
                            100,
                            Math.round((foamBubbles.value.length / maxBubbles) * 100)
                        )
                    }
                }
                lastFoamPos = { x: clientX, y: clientY }

                if (foamBubbles.value.length >= maxBubbles) {
                    statusFoam.value = true
                    latherProgress.value = 100
                    saveBubbles()

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
    } else {
        isHovered.value = false
        statusShower.value = false
        statusSmoke.value = false
        lastFoamPos = null
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
        pendingShampooItem = null
        return
    }

    lastFoamPos = null
    distanceSinceLastBubble = 0
    console.log(latherProgress.value)
    if(latherProgress.value>=80){
        statusFoam.value = true
        latherProgress.value = 100
        saveBubbles()

        if (Item?.color) {
            colorFoam.value = Item.color
            localStorage.setItem('pet_colorFoam', Item.color)
        }

        nextTutorialStep()
        if (Item?.id) {
            removeFromCart(Item.id)
        }
    }
    if (isHovered.value && itemType === 'food') {
        if (Item?.category === 'food') {
            feedPet(Item.id)
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
    }

    if (pendingShampooItem) {
        const shampooItem = pendingShampooItem
        pendingShampooItem = null

        if (isHovered.value) {
            batheStatus.value = true

            if (shampooItem?.color) {
                colorFoam.value = shampooItem.color
                localStorage.setItem('pet_colorFoam', shampooItem.color)
            }

            const bounds = getFoamBounds()
            const maxBubbles = MAX_FOAM_BUBBLES.value

            while (foamBubbles.value.length < maxBubbles) {
                const size = Math.round(24 + Math.random() * 12)
                const randX = Math.round(
                    bounds.minX + Math.random() * (bounds.maxX - bounds.minX)
                )
                const randY = Math.round(
                    bounds.minY + Math.random() * (bounds.maxY - bounds.minY)
                )

                foamBubbles.value.push({
                    id: ++bubbleIdCounter,
                    x: randX,
                    y: randY,
                    size,
                    color: shampooItem?.color || colorFoam.value || null
                })
            }
            statusFoam.value = true
            latherProgress.value = 100
            saveBubbles()
            localStorage.setItem('pet_statusFoam', 'true')
            localStorage.setItem('pet_latherProgress', '100')

            nextTutorialStep()
            if (shampooItem?.id) {
                removeFromCart(shampooItem.id)
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