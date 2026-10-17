import {ref, computed} from 'vue'
import axios from 'axios'
import {gameData} from "@/scripts/useGameStore.js"
import {API_URL, tgId} from "@/scripts/api.js"
import {APP_VERSION} from "@/scripts/imageVersion.js"

export const isFortuneOpen = ref(false)
export const isSpinning = ref(false)
export const wheelRotation = ref(0)
export const now = ref(Date.now())

export const paidSpinsCount = ref(Number(localStorage.getItem('pet_paidSpinsCount')) || 0)
export const nextSpinTime = ref(Number(localStorage.getItem('pet_nextSpinAt')) || 0)

export const currentSpinPrice = ref(
    (Number(localStorage.getItem('pet_nextSpinAt')) || 0) > Date.now()
        ? Math.min(500, 100 + (Number(localStorage.getItem('pet_paidSpinsCount')) || 0) * 100)
        : 0
)

export function syncFortuneTime(serverLastFortuneSpin, serverPaidCount, serverNextPrice) {
    const COOLDOWN_MS = 86400 * 1000

    if (serverLastFortuneSpin !== undefined && serverLastFortuneSpin > 0) {
        nextSpinTime.value = (serverLastFortuneSpin * 1000) + COOLDOWN_MS
        localStorage.setItem('pet_nextSpinAt', nextSpinTime.value)
    } else if (serverLastFortuneSpin === 0) {
        nextSpinTime.value = 0
        localStorage.setItem('pet_nextSpinAt', 0)
    }

    if (serverPaidCount !== undefined) {
        paidSpinsCount.value = serverPaidCount
        localStorage.setItem('pet_paidSpinsCount', serverPaidCount)
    }

    if (serverNextPrice !== undefined) {
        currentSpinPrice.value = serverNextPrice
    } else if (now.value >= nextSpinTime.value) {
        currentSpinPrice.value = 0
    } else {
        currentSpinPrice.value = Math.min(500, 100 + (paidSpinsCount.value * 100))
    }
}

setInterval(() => {
    now.value = Date.now()
    if (now.value >= nextSpinTime.value) {
        if (paidSpinsCount.value > 0) {
            paidSpinsCount.value = 0
            localStorage.setItem('pet_paidSpinsCount', 0)
        }
        currentSpinPrice.value = 0
    }
}, 1000)

export const fortuneRewards = [
    {id: 0, name: '50', type: 'coins', icon: `/gamePlay/coin.webp?v=${APP_VERSION}`},
    {id: 1, name: '100', type: 'coins', icon: `/gamePlay/coin.webp?v=${APP_VERSION}`},
    {id: 2, name: '500', type: 'coins', icon: `/gamePlay/coin.webp?v=${APP_VERSION}`},
    {id: 3, name: '1500', type: 'coins', icon: `/gamePlay/coin.webp?v=${APP_VERSION}`},
    {id: 4, name: '5000', type: 'coins', icon: `/gamePlay/coin.webp?v=${APP_VERSION}`},
    {id: 5, name: '', type: 'serums', icon: `/Laboratory/serums/health_serum.webp?v=${APP_VERSION}`},
    {id: 6, name: '', type: 'food', icon: `/food/burger.webp?v=${APP_VERSION}`},
    {id: 7, name: '', type: 'nothing', icon: '/gamePlay/poop.webp'},
]

export const canSpin = computed(() => now.value >= nextSpinTime.value)

export const formattedCooldown = computed(() => {
    const diff = Math.max(0, Math.floor((nextSpinTime.value - now.value) / 1000))
    const hours = String(Math.floor(diff / 3600)).padStart(2, '0')
    const minutes = String(Math.floor((diff % 3600) / 60)).padStart(2, '0')
    const seconds = String(diff % 60).padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
})

const totalSectors = fortuneRewards.length
const sectorAngle = 360 / totalSectors
const sectorColors = ['#8e44ad', '#2980b9', '#FF007F', '#16a085', '#d35400', '#c0392b', '#27ae60', '#7f8c8d']

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
    const SPIN_PRICE = canSpin.value ? 0 : currentSpinPrice.value

    if (!canSpin.value && gameData.coins < SPIN_PRICE) {
        alert(`Недостаточно монет! Нужно ${SPIN_PRICE} монет.`)
        return
    }

    if (isSpinning.value) return

    isSpinning.value = true
    const isPaidSpin = !canSpin.value

    // Сразу списываем стоимость платного спина для отклика интерфейса
    if (isPaidSpin) {
        gameData.coins -= SPIN_PRICE
    }

    try {
        const response = await axios.post(`${API_URL}/pet/spin-fortune/${tgId}`)

        if (!response.data.success) {
            alert(response.data.message)
            isSpinning.value = false
            if (isPaidSpin) {
                gameData.coins += SPIN_PRICE // Возвращаем монеты при ошибке
            }
            return
        }

        const responseData = response.data

        const winIndex = fortuneRewards.findIndex(r => r.id === responseData.reward.id)
        const targetIndex = winIndex !== -1 ? winIndex : 0

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

        wheelRotation.value += 1440 + rotationDiff

        // 🟢 ВСЕ НАГРАДЫ И ОБНОВЛЕНИЯ ПРИМЕНЯЕМ СТРОГО ПОСЛЕ ОКОНЧАНИЯ АНИМАЦИИ (3.5 сек)
        setTimeout(() => {
            isSpinning.value = false

            const { reward, next_spin_at, coins_left, paid_spins_count: serverPaidCount, next_spin_price: serverNextPrice } = responseData

            // 1. Применяем итоговый баланс монет от сервера (сюда уже входит выигрыш)
            if (coins_left !== undefined) {
                gameData.coins = coins_left
            }

            // 2. Обновляем таймер и состояние спинов
            if (next_spin_at) {
                nextSpinTime.value = next_spin_at * 1000
                localStorage.setItem('pet_nextSpinAt', nextSpinTime.value)
            }

            if (serverPaidCount !== undefined) {
                paidSpinsCount.value = serverPaidCount
                localStorage.setItem('pet_paidSpinsCount', serverPaidCount)
            }

            if (serverNextPrice !== undefined) {
                currentSpinPrice.value = serverNextPrice
            }

            // 3. Добавляем выигранный предмет в инвентарь (если это не монеты и не пусто)
            if (reward.type === 'serum' || reward.type === 'item' || reward.type === 'food') {
                const itemId = reward.itemId || reward.item_id || 'health_serum'
                const amount = reward.amount || 1

                if (!gameData.cart[itemId]) {
                    gameData.cart[itemId] = 0
                }
                gameData.cart[itemId] += amount
            }

            // 4. Показываем уведомление о выигрыше
            if (reward.type === 'nothing') {
                alert(`😢 К сожалению, в этот раз ничего не выпало...`)
            } else {
                alert(`🎉 Приз: ${reward.name}!`)
            }
        }, 3500)

    } catch (error) {
        console.error("Ошибка при вращении колеса:", error)
        isSpinning.value = false
        if (isPaidSpin) {
            gameData.coins += SPIN_PRICE
        }
    }
}