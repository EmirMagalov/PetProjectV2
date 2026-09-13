// src/data/foodItems.js
export const foodList = [
    {
        id: 'pizza',
        name: 'Пицца',
        image: '/food/pizza.webp',
        category: 'fastfood',
        foodGain: 25, // сколько добавляет сытости
        cost: 15       // сколько стоит монет
    },
    {
        id: 'burger',
        name: 'Бургер',
        image: '/food/burger.webp',
        category: 'fastfood',
        foodGain: 40,
        cost: 19
    },
    {
        id: 'hotdog',
        name: 'Хотдог',
        image: '/food/hotdog.webp',
        category: 'fastfood',
        foodGain: 20,
        cost: 10
    },
    {
        id: 'banana',
        name: 'Банан',
        image: '/food/banana.webp',
        category: 'fruits',
        foodGain: 8,
        cost: 5
    },
    {
        id: 'kiwi',
        name: 'Киви',
        image: '/food/kiwi.webp',
        category: 'fruits',
        foodGain: 20,
        cost: 10
    },
    {
        id: 'pipe',
        name: 'Трубка Шамана',
        image: '/other/pipe.webp',
        category: 'shaman',
        energyGain: 80,
        cost: 50,

    },
]