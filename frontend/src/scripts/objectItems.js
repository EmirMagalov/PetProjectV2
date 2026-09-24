// src/data/objectItems.js
export const foodList = [
    {
        id: 'pizza',
        name: 'Пицца',
        image: '/food/pizza.webp',
        category: 'food',
        subcategory:'fastfood',
        foodGain: 15, // сколько добавляет сытости
        cost: 12       // сколько стоит монет
    },
    {
        id: 'burger',
        name: 'Бургер',
        image: '/food/burger.webp',
        category: 'food',
        subcategory:'fastfood',
        foodGain: 20,
        cost: 19
    },
    {
        id: 'hotdog',
        name: 'Хотдог',
        image: '/food/hotdog.webp',
        category: 'food',
        subcategory:'fastfood',
        foodGain: 10,
        cost: 9
    },
    {
        id: 'banana',
        name: 'Банан',
        image: '/food/banana.webp',
        category: 'food',
        subcategory:'fruits',
        foodGain: 2,
        cost: 11
    },
    {
        id: 'kiwi',
        name: 'Киви',
        image: '/food/kiwi.webp',
        category: 'food',
        subcategory:'fruits',
        foodGain: 1,
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
    {
        id: 'shampoo',
        name: 'Шампунь',
        image: '/gamePlay/shampoo_icon.webp',
        category: 'bath accessories',
        subcategory:'shampoo',
        cost: 70,

    },
    {
        id: 'soap',
        name: 'Мыло',
        image: '/gamePlay/soap_icon.webp',
        category: 'bath accessories',
        subcategory:'soap',
        cost: 70,

    },
]