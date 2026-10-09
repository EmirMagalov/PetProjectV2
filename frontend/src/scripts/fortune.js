import {ref, computed, onMounted, watch} from 'vue'
import axios from 'axios'
import { gameData } from "@/scripts/useGameStore.js"
import { API_URL, tgId } from "@/scripts/api.js"
import { APP_VERSION } from "@/scripts/constants.js"

export const isFortuneOpen = ref(false)
export const isSpinning = ref(false)
export const wheelRotation = ref(0)
export const now = ref(Date.now())

// ТАЙМЕР: запускаем его прямо при загрузке модуля
setInterval(() => {
    now.value = Date.now()
}, 1000)

export const fortuneRewards = [
    { id: 0, name: '50 Монет', icon: `/gamePlay/coin.webp?v=${APP_VERSION}` },
    { id: 1, name: '100 Монет', icon: `/gamePlay/coin.webp?v=${APP_VERSION}` },
    { id: 2, name: '500 Монет', icon: `/gamePlay/coin.webp?v=${APP_VERSION}` },
    { id: 3, name: '1500 Монет', icon: `/gamePlay/coin.webp?v=${APP_VERSION}` },
    { id: 4, name: 'Зелье здоровья', icon: `/other/health_potion.webp?v=${APP_VERSION}` },
    { id: 5, name: 'Бургер', icon: `/food/burger.webp?v=${APP_VERSION}` },
]

export const nextSpinTime = ref(Number(localStorage.getItem('pet_nextSpinAt')) || 0)

export const canSpin = computed(() => now.value >= nextSpinTime.value)

// ИСПРАВЛЕННЫЙ РАСЧЕТ ТАЙМЕРА (каждую секунду реагирует на изменение now.value)
export const formattedCooldown = computed(() => {
    const diff = Math.max(0, Math.floor((nextSpinTime.value - now.value) / 1000))
    const hours = String(Math.floor(diff / 3600)).padStart(2, '0')
    const minutes = String(Math.floor((diff % 3600) / 60)).padStart(2, '0')
    const seconds = String(diff % 60).padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
})

const totalSectors = fortuneRewards.length
const sectorAngle = 360 / totalSectors
const sectorColors = ['#8e44ad', '#2980b9', '#16a085', '#d35400', '#c0392b', '#27ae60']

export function getSectorStyle(index) {
    const halfAngleRad = (sectorAngle / 2) * (Math.PI / 180)
    const xOffset = (50 + 50 * Math.tan(halfAngleRad)).toFixed(2)
    const xStart = (50 - 50 * Math.tan(halfAngleRad)).toFixed(2)

    return {
        transform: `rotate(${index * sectorAngle}deg)`,
        backgroundColor: sectorColors[index % sectorColors.length],
        clipPath: `polygon(50% 50%, ${xStart}% 0%, ${xOffset}% 0%)`
    }
}

export async function spinWheel() {
    const SPIN_PRICE = 100

    if ((!canSpin.value && gameData.coins < SPIN_PRICE) || isSpinning.value) {
        alert("Недостаточно монет для платной прокрутки!")
        return
    }

    isSpinning.value = true

    try {
        const response = await axios.post(`${API_URL}/pet/spin-fortune/${tgId}`)

        if (!response.data.success) {
            alert(response.data.message)
            isSpinning.value = false
            return
        }

        const { reward, next_spin_at, coins_left } = response.data

        const winIndex = fortuneRewards.findIndex(r => r.id === reward.id)
        const targetIndex = winIndex !== -1 ? winIndex : 0

        // Расчет углов
        const targetCenterAngle = 360 - (targetIndex * sectorAngle)
        const safePadding = 5
        const maxOffset = (sectorAngle / 2) - safePadding
        const randomOffset = (Math.random() * (maxOffset * 2)) - maxOffset
        const targetAngle = targetCenterAngle + randomOffset

        const currentAngle = wheelRotation.value % 360
        let rotationDiff = targetAngle - currentAngle
        if (rotationDiff <= 0) {
            rotationDiff += 360
        }

        const totalRotation = wheelRotation.value + 1440 + rotationDiff
        wheelRotation.value = totalRotation

        setTimeout(() => {
            isSpinning.value = false

            // Сохраняем время
            nextSpinTime.value = next_spin_at * 1000
            localStorage.setItem('pet_nextSpinAt', nextSpinTime.value)

            if (coins_left !== undefined) {
                gameData.coins = coins_left
            }

            if (reward.type === 'potion' || reward.type === 'item' || reward.type === 'food') {
                const itemId = reward.itemId || reward.item_id || 'healthPotion'
                const amount = reward.amount || 1

                if (!gameData.cart[itemId]) {
                    gameData.cart[itemId] = 0
                }
                gameData.cart[itemId] += amount
            }

            alert(`🎉 Вы выиграли: ${reward.name}!`)
        }, 3500)

    } catch (error) {
        console.error("Ошибка при вращении колеса:", error)
        isSpinning.value = false
    }
}

onMounted(() => {
    if (canSpin.value) {
        isFortuneOpen.value = true
    }
})

// Если таймер закончился, пока пользователь был в игре — тоже открываем
watch(canSpin, (newValue) => {
    if (newValue) {
        isFortuneOpen.value = true
    }
})