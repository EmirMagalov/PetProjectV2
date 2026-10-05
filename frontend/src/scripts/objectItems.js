import {APP_VERSION} from "@/scripts/constants.js";


export const foodList = [
    {
        id: 'french_fries',
        name: 'Картошка фри',
        image: `/food/fri.webp?v=${APP_VERSION}`,
        category: 'food',
        subcategory:'fastfood',
        foodGain: 15, // сколько добавляет сытости
        cost: 22       // сколько стоит монет
    },
    {
        id: 'pizza',
        name: 'Пицца',
        image: `/food/pizza.webp?v=${APP_VERSION}`,
        category: 'food',
        subcategory:'fastfood',
        foodGain: 15, // сколько добавляет сытости
        cost: 32       // сколько стоит монет
    },
    {
        id: 'hotdog',
        name: 'Хотдог',
        image: `/food/hotdog.webp?v=${APP_VERSION}`,
        category: 'food',
        subcategory:'fastfood',
        foodGain: 10,
        cost: 29
    },
    {
        id: 'burger',
        name: 'Бургер',
        image: `/food/burger.webp?v=${APP_VERSION}`,
        category: 'food',
        subcategory:'fastfood',
        foodGain: 25,
        energyGain:3,
        cost: 39,
        level:10
    },
    {
        id: 'tako',
        name: 'Тако',
        image: `/food/tako.webp?v=${APP_VERSION}`,
        category: 'food',
        subcategory:'fastfood',
        foodGain: 25,
        energyGain:3,
        cost: 29,
        level:10
    },
    {
        id: 'lasagna',
        name: 'Лазанья',
        image: `/food/lasagna.webp?v=${APP_VERSION}`,
        category: 'food',
        subcategory:'fastfood',
        energyGain:3,
        foodGain: 25,
        cost: 29,
        level:10
    },


    {
        id: 'banana',
        name: 'Банан',
        image: `/food/banana.webp?v=${APP_VERSION}`,
        category: 'food',
        subcategory:'fruits',
        foodGain: 5,
        cost: 25
    },
    {
        id: 'kiwi',
        name: 'Киви',
        image: `/food/kiwi.webp?v=${APP_VERSION}`,
        category: 'food',
        subcategory:'fruits',
        foodGain: 5,
        cost: 25
    },
    {
        id: 'grape',
        name: 'Виноград',
        image: `/food/grape.webp?v=${APP_VERSION}`,
        category: 'food',
        subcategory:'fruits',
        foodGain: 5,
        cost: 25
    },
    {
        id: 'pineapple',
        name: 'Ананас',
        image: `/food/pineapple.webp?v=${APP_VERSION}`,
        category: 'food',
        subcategory:'fruits',
        foodGain: 10,
        energyGain: 5,
        cost: 25,
        level: 10
    },

    {
        id: 'salmon_roll',
        name: 'Ролл из лосося',
        image: `/food/salmon_roll.webp?v=${APP_VERSION}`,
        category: 'food',
        subcategory:'sushi',
        foodGain: 12,
        cost: 60
    },
    {
        id: 'sake_nigir',
        name: 'Нигири с лососем',
        image: `/food/sake_nigir.webp?v=${APP_VERSION}`,
        category: 'food',
        subcategory:'sushi',
        foodGain: 15,
        cost: 80,
        level: 10
    },
    {
        id: 'ebi_nigiri',
        name: 'Нигири с креветкой',
        image: `/food/ebi_nigiri.webp?v=${APP_VERSION}`,
        category: 'food',
        subcategory:'sushi',
        foodGain: 12,
        cost: 80,
        level: 10
    },
    {
        id: 'california_roll',
        name: 'Ролл «Калифорния»',
        image: `/food/california.webp?v=${APP_VERSION}`,
        category: 'food',
        subcategory:'sushi',
        foodGain: 12,
        cost: 80,
        level: 10
    },

    {
        id: 'pipe',
        name: 'Трубка Шамана',
        image: `/other/pipe.webp?v=${APP_VERSION}`,
        category: 'shaman',
        subcategory:'pipe',
        energyGain: 80,
        cost: 350,

    },
    {
        id: 'lifePotion',
        name: 'Зелье жизни',
        image: `/other/life_potion.webp?v=${APP_VERSION}`,
        category: 'shaman',
        subcategory:'potion',
        life:1,
        cost: 1000,

    },

    {
        id: 'healthPotion',
        name: 'Зелье здоровья',
        image: `/other/health_potion.webp?v=${APP_VERSION}`,
        category: 'shaman',
        subcategory:'potion',
        health:1,
        cost: 300,

    },
    {
        id: 'shampoo',
        name: 'Шампунь',
        image: `/gamePlay/shampoo_icon.webp?v=${APP_VERSION}`,
        category: 'bath accessories',
        subcategory:'shampoo',
        cost: 70,

    },
    {
        id: 'soap',
        name: 'Мыло',
        image: `/gamePlay/soap_icon.webp?v=${APP_VERSION}`,
        category: 'bath accessories',
        subcategory:'soap',
        cost: 70,

    },
]