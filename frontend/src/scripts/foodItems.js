// src/data/foodItems.js
export const foodList = [
    {
        id: 'pizza',
        name: 'Пицца',
        image: '/food/pizza.webp',
        category: 'food',
        subcategory:'fastfood',
        foodGain: 25, // сколько добавляет сытости
        cost: 12       // сколько стоит монет
    },
    {
        id: 'burger',
        name: 'Бургер',
        image: '/food/burger.webp',
        category: 'food',
        subcategory:'fastfood',
        foodGain: 40,
        cost: 19
    },
    {
        id: 'hotdog',
        name: 'Хотдог',
        image: '/food/hotdog.webp',
        category: 'food',
        subcategory:'fastfood',
        foodGain: 20,
        cost: 8
    },
    {
        id: 'banana',
        name: 'Банан',
        image: '/food/banana.webp',
        category: 'food',
        subcategory:'fruits',
        foodGain: 8,
        cost: 5
    },
    {
        id: 'kiwi',
        name: 'Киви',
        image: '/food/kiwi.webp',
        category: 'food',
        subcategory:'fruits',
        foodGain: 5,
        cost: 10
    },
    {
        id: 'pipe',
        name: 'Трубка Шамана',
        image: '/other/pipe.webp',
        category: 'shaman',
        subcategory:'pipe',
        energyGain: 80,
        cost: 350,

    },
    {
        id: 'lifePotion',
        name: 'Зелье жизни',
        image: '/other/life_potion.webp',
        category: 'shaman',
        subcategory:'potion',
        life:1,
        cost: 1000,

    },

    {
        id: 'healthPotion',
        name: 'Зелье здоровья',
        image: '/other/health_potion.webp',
        category: 'shaman',
        subcategory:'potion',
        health:1,
        cost: 300,

    },
]