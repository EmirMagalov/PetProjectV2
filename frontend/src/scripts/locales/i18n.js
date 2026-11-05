import { createI18n } from 'vue-i18n'
import ru from './ru.js'
import en from './en.js'
import {gameData} from "@/scripts/useGameStore.js";

// Проверяем, есть ли сохраненный язык в localStorage, иначе по умолчанию 'ru'
const savedLocale = localStorage.getItem('pet_language') || 'en'

const i18n = createI18n({
    legacy: false, // Режим Composition API
    locale: savedLocale,
    fallbackLocale: 'en',
    missingWarn: false,  // 👈 Отключает варнинги об отсутствующих ключах
    fallbackWarn: false, // 👈 Отключает варнинги о фоллбеках
    messages: {
        en,
        ru
    }
})

export default i18n