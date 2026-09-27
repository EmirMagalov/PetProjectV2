import { computed, ref, watch } from "vue";
import { gameData } from "@/scripts/useGameStore.js";
import { syncToBackend } from "@/scripts/api.js";

export const pupilOffset = ref({ x: 0, y: 0 });
export const isDealing = ref(false);
export const deck = ref([]);
export const playerCards = ref([]);
export const dealerCards = ref([]);

export const gameStarted = ref(false);
export const bettingPhase = ref(false);
export const gameFinished = ref(false);
export const result = ref("");
export const deckRef = ref(null);

export const currentBet = ref(0);

export const suits = ["hearts", "diamonds", "clubs", "spades"];

const characterImages = [
    '/saloon/characters/Fluffy_body.webp',
    '/saloon/characters/Rozi_body.webp',
    '/saloon/characters/Sanny_body.webp',
];

// Код за пределами функций выполняется строго 1 раз при загрузке приложения
const getRandomImage = () => characterImages[Math.floor(Math.random() * characterImages.length)];

export const randomCharacterImage = ref(getRandomImage());





export const cardTypes = [
    { name: "6", value: 6 },
    { name: "7", value: 7 },
    { name: "8", value: 8 },
    { name: "9", value: 9 },
    { name: "10", value: 10 },
    { name: "jack", value: 2 },
    { name: "queen", value: 3 },
    { name: "king", value: 4 },
    { name: "ace", value: 11 }
];


export function preloadCardImages() {
    suits.forEach((suit) => {
        cardTypes.forEach((card) => {
            const img = new Image();
            // Точный путь, как в createDeck()
            img.src = `/saloon/svg-cards/${card.name}_of_${suit}.svg`;
        });
    });
}

// ИСПРАВЛЕНИЕ 2: Вызываем предзагрузку сразу при импорте модуля
preloadCardImages();

function createDeck() {
    const newDeck = [];
    for (const suit of suits) {
        for (const card of cardTypes) {
            newDeck.push({
                name: card.name,
                value: card.value,
                suit,
                image: `/saloon/svg-cards/${card.name}_of_${suit}.svg`
            });
        }
    }
    return shuffle(newDeck);
}

function shuffle(cards) {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function drawCard() {
    if (deck.value.length === 0) {
        deck.value = createDeck();
    }
    return deck.value.pop();
}

function calculateScore(cards) {
    let score = 0;
    let aces = 0;

    for (const card of cards) {
        score += card.value;
        if (card.name === "ace") aces++;
    }

    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }

    return score;
}

export const playerScore = computed(() => calculateScore(playerCards.value));
export const dealerScore = computed(() => calculateScore(dealerCards.value));

export function startGame() {
    deck.value = createDeck();
    playerCards.value = [];
    dealerCards.value = [];

    gameStarted.value = true;
    bettingPhase.value = false;
    gameFinished.value = false;
    result.value = "";
}

export function addPlayerCard() {
    playerCards.value.push(drawCard());
}

export function addDealerCard() {
    dealerCards.value.push(drawCard());
}

// 1. Исправленный свал денег при ставке
export async function placeBet(amount) {
    if (gameData.value ? gameData.value.coins < amount : gameData.coins < amount) {
        return false;
    }

    currentBet.value = amount;

    // Проверяем, является ли gameData реактивным ref или обычным объектом
    if (gameData.value !== undefined) {
        gameData.value.coins -= amount;
    } else {
        gameData.coins -= amount;
    }

    bettingPhase.value = false;
    result.value = ""; // Очищаем текст "Сделайте ставку!" после клика

    // Сохраняем списание ставки на бэкенд сразу
    await syncToBackend();
    return true;
}

export function hit() {
    if (!gameStarted.value || bettingPhase.value || gameFinished.value) return;

    playerCards.value.push(drawCard());

    if (playerScore.value > 21) {
        finishGame("bust");
    }
}

// 2. Добавлен синхронный/асинхронный расчет выигрыша и отправка на бэкенд
export async function finishGame(type) {
    gameFinished.value = true;

    const coinsRef = gameData.value !== undefined ? gameData.value : gameData;

    if (type === "bust") {
        result.value = "Перебор! Вы проиграли";
    } else if (type === "lose") {
        result.value = "Дилер выиграл!";
    } else if (type === "win") {
        result.value = "Ты выиграл!";
        coinsRef.coins += currentBet.value * 2;
    } else if (type === "push") {
        result.value = "Ничья!";
        coinsRef.coins += currentBet.value;
    }

    await syncToBackend();
}

export async function determineWinner() {
    // 1. Сначала проверяем перебор у игрока
    if (playerScore.value > 21) {
        await finishGame("bust");
    }
    // 2. Если у игрока нет перебора, но перебрал дилер — победа игрока
    else if (dealerScore.value > 21) {
        await finishGame("win");
    }
    // 3. Сравниваем очки, если у обоих нет перебора
    else if (playerScore.value > dealerScore.value) {
        await finishGame("win");
    } else if (playerScore.value < dealerScore.value) {
        await finishGame("lose");
    } else {
        await finishGame("push");
    }
}

watch(
    [gameStarted, bettingPhase],
    ([started, betting]) => {
        if (started && betting) {
            result.value = "Сделайте ставку!";
        }
    },
    { immediate: true }
);