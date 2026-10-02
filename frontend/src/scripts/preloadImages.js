const imagesToPreload = [
    '/gamePlay/logo_icons.webp',
    '/location/home.webp',
    '/location/bath.webp',
    '/gamePlay/fridge.webp',
    '/gamePlay/bath_icon.webp',
    '/gamePlay/sleep_icon.webp',
    '/gamePlay/sun_icon.webp',
    '/gamePlay/shower_icon.webp',
    '/gamePlay/shampoo_icon.webp',
    '/gamePlay/back_icon.webp',
    '/gamePlay/market.webp',
    '/gamePlay/fridge_empty.webp',

]

export function preloadImages() {
    const promises = imagesToPreload.map((src) => {
        return new Promise((resolve) => {
            const img = new Image()
            img.src = src
            img.onload = () => resolve(src)
            img.onerror = () => resolve(src) // Ошибка не блокирует всю загрузку
        })
    })

    return Promise.all(promises)
}