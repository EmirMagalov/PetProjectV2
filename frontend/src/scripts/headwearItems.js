import {APP_VERSION} from "@/scripts/api.js";

export const headItems = [
    {
        id: 'cowboy_hat',
        name: 'Ковбойская шляпа',
        image: `/headwear/cowboyhat.webp?v=${APP_VERSION}`,
        cost: 555,
        level:5
    },
    {
        id: 'incognito_hat',
        name: 'Инкогнито кепка',
        image: `/headwear/incognito.webp?v=${APP_VERSION}`,
        cost: 0,
        level:0
    },

    {
        id: 'pirate_hat',
        name: 'Пиратская шляпа',
        image: `/headwear/piratehat.webp?v=${APP_VERSION}`,
        cost: 1500,
        level:10
    },
    {
        id: 'mafia_hat',
        name: 'Розовая шляпа',
        image: `/headwear/mafiahat.webp?v=${APP_VERSION}`,
        cost: 1000,
        level:15
    },
    {
        id: 'sombrero_hat',
        name: 'Сомбреро',
        image: `/headwear/sombrerohat.webp?v=${APP_VERSION}`,
        cost: 2000,
        level:20
    },
    {
        id: 'flat_hat',
        name: 'Хулиганка',
        image: `/headwear/flathat.webp?v=${APP_VERSION}`,
        cost: 720,
        level:20
    },
    {
        id: 'women_hat',
        name: 'Дамская шляпа',
        image: `/headwear/womenhat.webp?v=${APP_VERSION}`,
        cost: 800,
        level:25
    },
    {
        id: 'native_hat',
        name: 'Шоляпа в индейском стиле',
        image: `/headwear/nativeamericanhat.webp?v=${APP_VERSION}`,
        cost: 1200,
        level:25
    },

]