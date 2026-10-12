// src/scripts/laboratoryScripts/recipes.js
import { APP_VERSION } from "@/scripts/imageVersion.js";

export const serumRecipes = [
    {
        id: 'life_serum',
        name: 'Сыворотка жизни',
        image: `/Laboratory/serums/life_serum.webp?v=${APP_VERSION}`, // поменяй путь под свои картинки сывороток
        // Рецепт: сколько и каких ингредиентов нужно положить на стол
        requirements: {
            health_spores: 2,
            nutrient_bio_gel: 1,
            saline: 2
        }
    },
    {
        id: 'health_serum',
        name: 'Сыворотка здоровья',
        image: `/Laboratory/serums/health_serum.webp?v=${APP_VERSION}`,
        requirements: {
            health_spores: 1,
            stimulating_crystalloid: 1
        }
    },
    {
        id: 'energy_serum',
        name: 'Сыворотка энергии',
        image: `/Laboratory/serums/energy_serum.webp?v=${APP_VERSION}`,
        requirements: {
            stimulating_crystalloid: 2,
            nutrient_bio_gel: 1
        }
    }
];