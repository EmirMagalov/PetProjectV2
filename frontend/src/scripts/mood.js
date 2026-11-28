import { ref, computed } from "vue";

const MOOD_COOLDOWN_MS = 86400 * 1000; // 24 часа

export const now = ref(Date.now());
export const nextMoodTime = ref(Number(localStorage.getItem("pet_nextMoodAt")) || 0);

function setNextMoodTime(targetMs) {
    const safeMs = Math.max(0, Number(targetMs) || 0);
    nextMoodTime.value = safeMs;
    localStorage.setItem("pet_nextMoodAt", String(safeMs));
}

export function syncMoodTime(serverUpdatedAt) {
    const raw = Number(serverUpdatedAt || 0);
    if (Number.isFinite(raw) && raw > 0) {
        const ms = raw > 1e12 ? raw : raw * 1000;
        const serverNextMs = ms + MOOD_COOLDOWN_MS;
        if (serverNextMs > nextMoodTime.value) {
            setNextMoodTime(serverNextMs);
        }
    } else if (!localStorage.getItem("pet_nextMoodAt")) {
        setNextMoodTime(0);
    }
}

export function snoozeMood(cooldownMs = MOOD_COOLDOWN_MS) {
    setNextMoodTime(Date.now() + cooldownMs);
}

setInterval(() => {
    now.value = Date.now();
}, 1000);

export const canOpenMood = computed(() => now.value >= nextMoodTime.value);
