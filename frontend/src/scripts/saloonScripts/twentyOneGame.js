import { computed, ref, watch } from "vue";
import { gameData } from "@/scripts/useGameStore.js";
import { syncToBackend } from "@/scripts/api.js";
import {addExp} from "@/scripts/level.js";
import {addCoin} from "@/scripts/actions.js";

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
export const selectedBet = ref(50);
export const betOptions = [50, 100,250 ,500,1000];


watch(
    [playerCards, dealerCards, gameStarted, bettingPhase, gameFinished, currentBet, result],
    () => {
        localStorage.setItem('saloon_game_state', JSON.stringify({
            playerCards: playerCards.value,
            dealerCards: dealerCards.value,
            gameStarted: gameStarted.value,
            currentBet: currentBet.value,
            bettingPhase: bettingPhase.value,
            gameFinished: gameFinished.value,
            result: result.value,
        }));
    },
    { deep: true }
);
// При загрузке скрипта — восстанавливаем
const savedState = localStorage.getItem('saloon_game_state');
if (savedState) {
    try {
        const parsed = JSON.parse(savedState);
        playerCards.value = parsed.playerCards || [];
        dealerCards.value = parsed.dealerCards || [];
        gameStarted.value = parsed.gameStarted || false;
        currentBet.value = parsed.currentBet || null;
        bettingPhase.value = parsed.bettingPhase || false;
        gameFinished.value = parsed.gameFinished || false;
        result.value = parsed.result || "";
    } catch (e) {
        console.error("Ошибка при восстановлении состояния игры:", e);
    }
}

const characterImages = [
    '/saloonPhotos/characters/Fluffy_body.webp',
    '/saloonPhotos/characters/Rozi_body.webp',
    '/saloonPhotos/characters/Sanny_body.webp',
];

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
            img.src = `/saloonPhotos/svg-cards/${card.name}_of_${suit}.svg`;
        });
    });
}

preloadCardImages();

function createDeck() {
    const newDeck = [];
    for (const suit of suits) {
        for (const card of cardTypes) {
            newDeck.push({
                name: card.name,
                value: card.value,
                suit,
                image: `/saloonPhotos/svg-cards/${card.name}_of_${suit}.svg`
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

    // Если на руках ровно 2 туза и всего 2 карты — это "Золотое очко" (автопобеда)
    if (aces === 2 && cards.length === 2) {
        return 21;
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

export async function placeBet(amount) {
    if (gameData.value ? gameData.value.coins < amount : gameData.coins < amount) {
        return false;
    }

    currentBet.value = amount;

    if (gameData.value !== undefined) {
        gameData.value.coins -= amount;
    } else {
        gameData.coins -= amount;
    }

    bettingPhase.value = false;
    result.value = "";

    await syncToBackend();
    return true;
}

export function hit() {
    if (!gameStarted.value || bettingPhase.value || gameFinished.value) return;

    playerCards.value.push(drawCard());

    const currentScore = playerScore.value;
    const acesCount = playerCards.value.filter(c => c.name === "ace").length;

    // 1. Проверка на "Золотое очко" (2 туза) или 21 очко
    if ((acesCount === 2 && playerCards.value.length === 2) || currentScore === 21) {
        finishGame("win");
    }
    // 2. Перебор
    else if (currentScore > 21) {
        finishGame("bust");
    }
}

export async function finishGame(type) {
    gameFinished.value = true;



    if (type === "bust") {
        result.value = "Перебор! Ты проиграл";
        addExp(1)
    } else if (type === "lose") {
        result.value = "Дилер выиграл!";
        addExp(1)
    } else if (type === "win") {
        result.value = "Поздравляю! Ты выиграл!";
        addCoin(currentBet.value * 2) ;
        addExp(10)
    } else if (type === "push") {
        result.value = "Ничья!";
        addCoin(currentBet.value);
        addExp(5)
    }

    await syncToBackend();
}

export async function determineWinner() {
    if (playerScore.value > 21) {
        await finishGame("bust");
    } else if (dealerScore.value > 21) {
        await finishGame("win");
    } else if (playerScore.value > dealerScore.value) {
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
        if (started && betting && !gameFinished.value) {
            result.value = "Сделайте ставку!";
        }
    }
);