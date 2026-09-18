const imagesToPreload = [
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
    '/gamePlay/fridge_empty.webp'
]

export function preloadImages() {
    imagesToPreload.forEach((src) => {
        const img = new Image()
        img.src = src
    })
}

console.log('Предзагружено картинок:', imagesToPreload.length)