import {APP_VERSION} from "@/scripts/imageVersion.js";


export const ingredientList = [


    {
        id: 'health_spores',
        name: 'Лечебные споры',
        image: `/Laboratory/substances/health_spores.webp?v=${APP_VERSION}`,
        category: 'ingredients',
        subcategory:'ingredients',
        price: 200,

    },
    {
        id: 'nutrient_bio_gel',
        name: 'Питательный био-гель',
        image: `/Laboratory/substances/nutrient_bio_gel.webp?v=${APP_VERSION}`,
        category: 'ingredients',
        subcategory:'ingredients',
        price: 250,


    },

    {
        id: 'stimulating_crystalloid',
        name: 'Стимулирующий кристаллоид',
        image: `/Laboratory/substances/stimulating_crystalloid.webp?v=${APP_VERSION}`,
        category: 'ingredients',
        subcategory:'ingredients',
        price: 350,


    },
    {
        id: 'saline',
        name: 'Физраствор',
        image: `/Laboratory/substances/saline.webp?v=${APP_VERSION}`,
        category: 'ingredients',
        subcategory:'ingredients',
        price: 200,


    },

]