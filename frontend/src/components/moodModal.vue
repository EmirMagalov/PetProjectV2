<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { gameData, showMoodModal, isTutorialCompleted } from "@/scripts/useGameStore.js";
import { canOpenMood, snoozeMood, syncMoodTime } from "@/scripts/mood.js";
import { activeModal, requestModal, releaseModal } from "@/scripts/modalQueue.js";
import { APP_VERSION } from "@/scripts/imageVersion.js";
import axios from "axios";
import { API_URL, tgId as importedTgId } from "@/scripts/api.js";

const { t } = useI18n();

const canShowMood = computed(() =>
    Boolean(isTutorialCompleted.value && !gameData.isGameOver && gameData.level > 1)
);

const isMoodVisible = computed(() =>
    Boolean(showMoodModal.value && activeModal.value === "mood" && canShowMood.value)
);

let openMoodTimer = null;

function scheduleMoodQueue() {
  if (openMoodTimer) {
    clearTimeout(openMoodTimer);
    openMoodTimer = null;
  }

  if (canOpenMood.value && canShowMood.value) {
    openMoodTimer = setTimeout(() => {
      if (canOpenMood.value && canShowMood.value) {
        showMoodModal.value = true;
        requestModal("mood");
      }
    }, 1000);
  }
}

function closeMoodModal() {
  snoozeMood();
  showMoodModal.value = false;
  releaseModal("mood");
}

const now = new Date();
const pad = (n) => String(n).padStart(2, "0");

const formatIsoDate = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function formatDmyFromParts(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!y || !m || !d) return null;
  return `${d}.${m}.${y}`;
}

function formatDisplayDate(rawValue) {
  if (!rawValue) return "—";
  const str = String(rawValue).trim();

  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s]+(.+))?$/);
  if (isoMatch) {
    const formattedDate = formatDmyFromParts(isoMatch[1], isoMatch[2], isoMatch[3]);
    if (!formattedDate) return str;
    return isoMatch[4] ? `${formattedDate} ${isoMatch[4]}` : formattedDate;
  }

  const dmyMatch = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(.+))?$/);
  if (dmyMatch) {
    const formattedDate = formatDmyFromParts(dmyMatch[3], dmyMatch[2], dmyMatch[1]);
    if (!formattedDate) return str;
    return dmyMatch[4] ? `${formattedDate} ${dmyMatch[4]}` : formattedDate;
  }

  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getDate()}.${parsed.getMonth() + 1}.${parsed.getFullYear()}`;
  }

  return str;
}

const maxYear = now.getFullYear();
const maxMonth = now.getMonth();
const maxDate = formatIsoDate(now);

const selectedDate = ref(maxDate);
const formattedSelectedDate = computed(() => formatDisplayDate(selectedDate.value));
const selectedTime = ref(`${pad(now.getHours())}:${pad(now.getMinutes())}`);

const draftDate = ref(selectedDate.value);
const draftTime = ref(selectedTime.value);

const activeTab = ref("entry");
const step = ref("mood");
const selectedMoodState = ref(null);
const selectedEmotion = ref(null);
const isSubmitting = ref(false);
const submitError = ref("");
let stepTimer = null;

const statsLoading = ref(false);
const statsError = ref("");
const moodStats = ref(null);

const moodBaseItems = [
  { state: "great", labelKey: "mood.mood_great", color: "#9933FF", image: `/mood/emoji/great_mood.webp?v=${APP_VERSION}` },
  { state: "good", labelKey: "mood.mood_good", color: "#33FF33", image: `/mood/emoji/good_mood.webp?v=${APP_VERSION}` },
  { state: "not a great", labelKey: "mood.mood_not_a_great", color: "#0080FF", image: `/mood/emoji/not_a_great_mood.webp?v=${APP_VERSION}` },
  { state: "bad", labelKey: "mood.mood_bad", color: "#f97316", image: `/mood/emoji/bad_mood.webp?v=${APP_VERSION}` },
  { state: "terrible", labelKey: "mood.mood_terrible", color: "#ef4444", image: `/mood/emoji/terrible_mood.webp?v=${APP_VERSION}` },
];

const emotionBaseItems = [
  { value: "happiness", labelKey: "mood.emotion_happiness", image: `/mood/emotions/happiness_icon.webp?v=${APP_VERSION}` },
  { value: "excitement", labelKey: "mood.emotion_excitement", image: `/mood/emotions/excitement_icon.webp?v=${APP_VERSION}` },
  { value: "relaxation", labelKey: "mood.emotion_relaxation", image: `/mood/emotions/relaxation_icon.webp?v=${APP_VERSION}` },
  { value: "tiredness", labelKey: "mood.emotion_tiredness", image: `/mood/emotions/tiredness_icon.webp?v=${APP_VERSION}` },
  { value: "insecurity", labelKey: "mood.emotion_insecurity", image: `/mood/emotions/insecurity_icon.webp?v=${APP_VERSION}` },
  { value: "boredom", labelKey: "mood.emotion_boredom", image: `/mood/emotions/boredom_icon.webp?v=${APP_VERSION}` },
  { value: "anxiety", labelKey: "mood.emotion_anxiety", image: `/mood/emotions/anxiety_icon.webp?v=${APP_VERSION}` },
  { value: "anger", labelKey: "mood.emotion_anger", image: `/mood/emotions/anger_icon.webp?v=${APP_VERSION}` },
  { value: "sadness", labelKey: "mood.emotion_sadness", image: `/mood/emotions/sadness_icon.webp?v=${APP_VERSION}` },
  { value: "despair", labelKey: "mood.emotion_despair", image: `/mood/emotions/despair_icon.webp?v=${APP_VERSION}` },
];

const moodItems = computed(() =>
    moodBaseItems.map((m) => ({
      ...m,
      label: t(m.labelKey),
    }))
);

const emotionItems = computed(() =>
    emotionBaseItems.map((e) => ({
      ...e,
      label: t(e.labelKey),
    }))
);

const pickerWrapperRef = ref(null);
const showCalendar = ref(false);
const viewYear = ref(maxYear);
const viewMonth = ref(maxMonth);

const showTimePicker = ref(false);
const hours = Array.from({ length: 24 }, (_, i) => pad(i));
const minutes = Array.from({ length: 60 }, (_, i) => pad(i));

const draftHour = computed(() => draftTime.value.split(":")[0] || "00");
const draftMinute = computed(() => draftTime.value.split(":")[1] || "00");

const monthNames = computed(() => [
  t("mood.month_january"),
  t("mood.month_february"),
  t("mood.month_march"),
  t("mood.month_april"),
  t("mood.month_may"),
  t("mood.month_june"),
  t("mood.month_july"),
  t("mood.month_august"),
  t("mood.month_september"),
  t("mood.month_october"),
  t("mood.month_november"),
  t("mood.month_december"),
]);

const weekDays = computed(() => [
  t("mood.weekday_mon"),
  t("mood.weekday_tue"),
  t("mood.weekday_wed"),
  t("mood.weekday_thu"),
  t("mood.weekday_fri"),
  t("mood.weekday_sat"),
  t("mood.weekday_sun"),
]);

const isNextMonthDisabled = computed(
    () => viewYear.value > maxYear || (viewYear.value === maxYear && viewMonth.value >= maxMonth)
);

const calendarDays = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const value = `${viewYear.value}-${pad(viewMonth.value + 1)}-${pad(day)}`;
    const isFuture = value > maxDate;
    cells.push({ day, value, isFuture });
  }
  return cells;
});

const moodStatsRows = computed(() => {
  const counts = moodStats.value?.counts || {};
  return moodItems.value.map((m) => ({
    ...m,
    count: Number(counts[m.state] ?? 0),
  }));
});

const emotionStatsRows = computed(() => {
  const counts = moodStats.value?.emotion_counts || {};
  return emotionItems.value.map((e) => ({
    ...e,
    count: Number(counts[e.value] ?? 0),
  }));
});

const activeMoodState = computed(() => {
  if (moodStats.value?.state) return moodStats.value.state;
  if (typeof gameData.user_mood === "string") return gameData.user_mood;
  if (gameData.user_mood && typeof gameData.user_mood === "object") {
    return gameData.user_mood.state || null;
  }
  return null;
});

const activeEmotionValue = computed(() => {
  if (moodStats.value?.emotion) return moodStats.value.emotion;
  if (gameData.user_mood && typeof gameData.user_mood === "object") {
    return gameData.user_mood.emotion || null;
  }
  return null;
});

const activeMoodItem = computed(() => {
  const state = activeMoodState.value;
  if (!state) return null;
  return moodItems.value.find((m) => m.state === state) || null;
});

const activeEmotionItem = computed(() => {
  const emotion = activeEmotionValue.value;
  if (!emotion) return null;
  return emotionItems.value.find((e) => e.value === emotion) || null;
});

const formattedLastMood = computed(() => {
  if (activeMoodItem.value) return activeMoodItem.value.label;
  return activeMoodState.value || "—";
});

const formattedLastEmotion = computed(() => {
  if (activeEmotionItem.value) return activeEmotionItem.value.label;
  return activeEmotionValue.value || "—";
});

const formattedClientRecordedAt = computed(() => {
  if (moodStats.value?.client_recorded_at) {
    return formatDisplayDate(moodStats.value.client_recorded_at);
  }
  return `${formattedSelectedDate.value} ${selectedTime.value}`;
});

const totalMoodCount = computed(() =>
    moodStatsRows.value.reduce((acc, row) => acc + row.count, 0)
);

const DONUT_RADIUS = 28;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

const moodChartSegments = computed(() => {
  const total = totalMoodCount.value;
  if (!total) return [];

  let offsetAcc = 0;
  return moodStatsRows.value
      .filter((row) => row.count > 0)
      .map((row) => {
        const fraction = row.count / total;
        const length = fraction * DONUT_CIRCUMFERENCE;
        const segment = {
          ...row,
          percent: Math.round(fraction * 100),
          dashArray: `${length} ${DONUT_CIRCUMFERENCE}`,
          dashOffset: -offsetAcc,
        };
        offsetAcc += length;
        return segment;
      });
});

function clearStepTimer() {
  if (stepTimer) {
    clearTimeout(stepTimer);
    stepTimer = null;
  }
}

function resetModalState() {
  clearStepTimer();
  activeTab.value = "entry";
  step.value = "mood";
  selectedMoodState.value = null;
  selectedEmotion.value = null;
  submitError.value = "";
  statsError.value = "";
  isSubmitting.value = false;
  showCalendar.value = false;
  showTimePicker.value = false;
}

watch(showMoodModal, (isOpen) => {
  if (isOpen) {
    resetModalState();
    requestModal("mood");
  } else {
    clearStepTimer();
    releaseModal("mood");
  }
});

watch([canOpenMood, canShowMood], () => {
  scheduleMoodQueue();
});

function closePickers() {
  draftDate.value = selectedDate.value;
  draftTime.value = selectedTime.value;
  showCalendar.value = false;
  showTimePicker.value = false;
}

function handleOutsideClick(event) {
  if (!showCalendar.value && !showTimePicker.value) return;
  if (pickerWrapperRef.value && !pickerWrapperRef.value.contains(event.target)) {
    closePickers();
  }
}

onMounted(() => {
  document.addEventListener("pointerdown", handleOutsideClick);
  fetchStats();
  scheduleMoodQueue();
});

onUnmounted(() => {
  clearStepTimer();
  if (openMoodTimer) {
    clearTimeout(openMoodTimer);
    openMoodTimer = null;
  }
  releaseModal("mood");
  document.removeEventListener("pointerdown", handleOutsideClick);
});

function toggleCalendar() {
  showTimePicker.value = false;
  if (!showCalendar.value) {
    const baseDate = selectedDate.value > maxDate ? maxDate : selectedDate.value;
    draftDate.value = baseDate;
    const [y, m] = baseDate.split("-").map(Number);
    viewYear.value = Math.min(y || maxYear, maxYear);
    const clampedMonth = (m || maxMonth + 1) - 1;
    viewMonth.value =
        viewYear.value === maxYear ? Math.min(clampedMonth, maxMonth) : clampedMonth;
    showCalendar.value = true;
  } else {
    closePickers();
  }
}

function toggleTimePicker() {
  showCalendar.value = false;
  if (!showTimePicker.value) {
    draftTime.value = selectedTime.value;
    showTimePicker.value = true;
  } else {
    closePickers();
  }
}

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11;
    viewYear.value -= 1;
  } else {
    viewMonth.value -= 1;
  }
}

function nextMonth() {
  if (isNextMonthDisabled.value) return;
  if (viewMonth.value === 11) {
    viewMonth.value = 0;
    viewYear.value += 1;
  } else {
    viewMonth.value += 1;
  }
}

function pickDraftDay(cell) {
  if (!cell || cell.isFuture) return;
  draftDate.value = cell.value;
}

function confirmDate() {
  if (draftDate.value && draftDate.value <= maxDate) {
    selectedDate.value = draftDate.value;
  }
  showCalendar.value = false;
}

function setDraftHour(h) {
  draftTime.value = `${h}:${draftMinute.value}`;
}

function setDraftMinute(m) {
  draftTime.value = `${draftHour.value}:${m}`;
}

function confirmTime() {
  selectedTime.value = draftTime.value;
  showTimePicker.value = false;
}

const clientDateTime = computed(() =>
    selectedTime.value ? `${selectedDate.value}T${selectedTime.value}` : selectedDate.value
);

function selectMood(state) {
  if (isSubmitting.value) return;
  clearStepTimer();
  selectedMoodState.value = state;
  submitError.value = "";
  stepTimer = setTimeout(() => {
    step.value = "emotion";
  }, 140);
}

function backToMood() {
  if (isSubmitting.value) return;
  clearStepTimer();
  submitError.value = "";
  step.value = "mood";
}

function resolveTgId() {
  const raw =
      importedTgId?.value ??
      importedTgId ??
      gameData?.tg_id ??
      gameData?.tgId ??
      gameData?.pet_id ??
      window?.Telegram?.WebApp?.initDataUnsafe?.user?.id ??
      localStorage.getItem("tg_id");

  const num = Number(raw);
  return Number.isFinite(num) && num > 0 ? num : null;
}

const statsCache = new Map();
const CACHE_TTL_MS = 60_000;

async function fetchStats({ force = false } = {}) {
  const userId = resolveTgId();
  if (!userId) {
    statsError.value = t("mood.tg_id_not_found");
    return;
  }

  const cached = statsCache.get(userId);
  const isFresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;

  if (!force && isFresh) {
    moodStats.value = cached.data;
    statsError.value = "";
    statsLoading.value = false;
    syncMoodTime(cached.data?.updated_at);
    return;
  }

  statsLoading.value = true;
  statsError.value = "";

  try {
    const response = await axios.get(`${API_URL}/mood`, {
      params: { tg_id: userId },
    });
    moodStats.value = response.data;
    statsCache.set(userId, {
      data: response.data,
      fetchedAt: Date.now(),
    });
    syncMoodTime(response.data?.updated_at);
  } catch (err) {
    statsError.value =
        err?.response?.data?.detail || err?.message || t("mood.stats_load_error");
  } finally {
    statsLoading.value = false;
  }
}

function switchTab(tab) {
  if (isSubmitting.value) return;
  showCalendar.value = false;
  showTimePicker.value = false;
  activeTab.value = tab;
  if (tab === "stats") {
    fetchStats();
  }
}

async function selectEmotionAndSubmit(emotionValue) {
  if (isSubmitting.value || !selectedMoodState.value) return;

  const userId = resolveTgId();
  if (!userId) {
    submitError.value = t("mood.tg_id_not_found");
    return;
  }

  selectedEmotion.value = emotionValue;
  isSubmitting.value = true;
  submitError.value = "";

  try {
    const response = await axios.post(`${API_URL}/mood`, null, {
      params: {
        tg_id: userId,
        state: selectedMoodState.value,
        emotion: emotionValue,
        client_time: clientDateTime.value,
      },
    });

    if (response.data && typeof response.data === "object") {
      moodStats.value = response.data;
      statsCache.set(userId, {
        data: response.data,
        fetchedAt: Date.now(),
      });
      syncMoodTime(response.data?.updated_at || Math.floor(Date.now() / 1000));
    } else {
      syncMoodTime(Math.floor(Date.now() / 1000));
    }

    if (gameData.user_mood && typeof gameData.user_mood === "object") {
      gameData.user_mood.state = selectedMoodState.value;
      gameData.user_mood.emotion = emotionValue;
    } else {
      gameData.user_mood = selectedMoodState.value;
    }

    activeTab.value = "stats";
    step.value = "mood";
    selectedMoodState.value = null;
  } catch (err) {
    submitError.value =
        err?.response?.data?.detail || err?.message || t("mood.submit_error");
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
          v-if="isMoodVisible"
          class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <div
            class="bg-[#fff6ef] border-2 border-green-400 rounded-3xl pt-9 px-5 pb-5 w-full max-w-xs h-[520px] max-h-[85vh] shadow-2xl relative flex flex-col justify-between gap-3 overflow-hidden"
        >
          <button
              type="button"
              :disabled="isSubmitting"
              @click="closeMoodModal"
              aria-label="Close"
              class="absolute top-2 right-3 text-3xl leading-none text-red-600 font-bold hover:text-red-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            X
          </button>

          <!-- Верхняя панель вкладок -->
          <div class="grid grid-cols-2 gap-1.5 w-full shrink-0 bg-amber-100/80 p-1 rounded-2xl border border-amber-200">
            <button
                type="button"
                @click="switchTab('entry')"
                :class="[
                'py-1.5 rounded-xl text-xs font-bold transition cursor-pointer',
                activeTab === 'entry'
                  ? 'bg-green-400 text-gray-900 shadow-sm'
                  : 'text-amber-950/75 hover:text-amber-950',
              ]"
            >
              {{ $t("mood.tab_entry") }}
            </button>
            <button
                type="button"
                @click="switchTab('stats')"
                :class="[
                'py-1.5 rounded-xl text-xs font-bold transition cursor-pointer',
                activeTab === 'stats'
                  ? 'bg-green-400 text-gray-900 shadow-sm'
                  : 'text-amber-950/75 hover:text-amber-950',
              ]"
            >
              {{ $t("mood.tab_stats") }}
            </button>
          </div>

          <!-- Вкладка 1: Ввод настроения и эмоции -->
          <template v-if="activeTab === 'entry'">

            <div
                v-if="step === 'mood'"
                class="flex-1 min-h-0 overflow-y-auto flex flex-col justify-start gap-3 pr-0.5"
            >
              <span class="text-xl text-center font-bold text-amber-950 shrink-0">{{ $t("mood.question") }}</span>

              <div ref="pickerWrapperRef" class="grid grid-cols-2 gap-2 w-full shrink-0 relative mb-10">
                <div class="flex flex-col gap-1 min-w-0">
                  <span class="text-[11px] font-bold text-amber-900">{{ $t("mood.date") }}</span>
                  <button
                      type="button"
                      @click="toggleCalendar"
                      class="w-full min-w-0 px-2 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-semibold text-gray-800 text-left truncate cursor-pointer hover:border-green-500"
                  >
                    {{ formattedSelectedDate }}
                  </button>
                </div>

                <div class="flex flex-col gap-1 min-w-0">
                  <span class="text-[11px] font-bold text-amber-900">{{ $t("mood.time") }}</span>
                  <button
                      type="button"
                      @click="toggleTimePicker"
                      class="w-full min-w-0 px-2 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-semibold text-gray-800 text-left truncate cursor-pointer hover:border-green-500"
                  >
                    {{ selectedTime }}
                  </button>
                </div>

                <div
                    v-if="showCalendar"
                    class="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#fffaf5] border-2 border-green-400 rounded-2xl p-2.5 shadow-xl"
                >
                  <div class="flex items-center justify-between mb-2">
                    <button
                        type="button"
                        @click="prevMonth"
                        class="w-6 h-6 rounded-lg bg-amber-100 hover:bg-green-200 text-amber-950 font-bold text-xs cursor-pointer"
                    >
                      ‹
                    </button>
                    <span class="text-xs font-bold text-amber-950">
                      {{ monthNames[viewMonth] }} {{ viewYear }}
                    </span>
                    <button
                        type="button"
                        :disabled="isNextMonthDisabled"
                        @click="nextMonth"
                        :class="[
                        'w-6 h-6 rounded-lg font-bold text-xs',
                        isNextMonthDisabled
                          ? 'bg-amber-100/40 text-amber-950/30 cursor-not-allowed'
                          : 'bg-amber-100 hover:bg-green-200 text-amber-950 cursor-pointer',
                      ]"
                    >
                      ›
                    </button>
                  </div>

                  <div class="grid grid-cols-7 gap-1 text-center mb-1">
                    <span
                        v-for="wd in weekDays"
                        :key="wd"
                        class="text-[10px] font-bold text-amber-800/70"
                    >
                      {{ wd }}
                    </span>
                  </div>

                  <div class="grid grid-cols-7 gap-1 text-center">
                    <span v-for="(cell, idx) in calendarDays" :key="idx" class="h-6">
                      <button
                          v-if="cell"
                          type="button"
                          :disabled="cell.isFuture"
                          @click="pickDraftDay(cell)"
                          :class="[
                          'w-full h-full rounded-lg text-[11px] font-semibold transition-colors',
                          cell.isFuture
                            ? 'text-amber-950/25 cursor-not-allowed'
                            : draftDate === cell.value
                              ? 'bg-green-400 text-gray-900 font-bold cursor-pointer'
                              : 'hover:bg-amber-200/70 text-amber-950 cursor-pointer',
                        ]"
                      >
                        {{ cell.day }}
                      </button>
                    </span>
                  </div>

                  <button
                      type="button"
                      @click="confirmDate"
                      class="mt-2 w-full bg-green-400 hover:bg-green-500 text-gray-900 font-bold py-1.5 rounded-xl text-xs transition-colors active:scale-95 cursor-pointer"
                  >
                    {{ $t("mood.ok") }}
                  </button>
                </div>

                <div
                    v-if="showTimePicker"
                    class="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#fffaf5] border-2 border-green-400 rounded-2xl p-2.5 shadow-xl"
                >
                  <div class="grid grid-cols-2 gap-2">
                    <div class="flex flex-col gap-1">
                      <span class="text-[10px] font-bold text-center text-amber-900">{{ $t("mood.hours") }}</span>
                      <div class="max-h-36 overflow-y-auto flex flex-col gap-0.5 pr-0.5">
                        <button
                            v-for="h in hours"
                            :key="h"
                            type="button"
                            @click="setDraftHour(h)"
                            :class="[
                            'w-full py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors',
                            draftHour === h
                              ? 'bg-green-400 text-gray-900 font-bold'
                              : 'hover:bg-amber-200/70 text-amber-950',
                          ]"
                        >
                          {{ h }}
                        </button>
                      </div>
                    </div>

                    <div class="flex flex-col gap-1">
                      <span class="text-[10px] font-bold text-center text-amber-900">{{ $t("mood.minutes") }}</span>
                      <div class="max-h-36 overflow-y-auto flex flex-col gap-0.5 pr-0.5">
                        <button
                            v-for="m in minutes"
                            :key="m"
                            type="button"
                            @click="setDraftMinute(m)"
                            :class="[
                            'w-full py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors',
                            draftMinute === m
                              ? 'bg-green-400 text-gray-900 font-bold'
                              : 'hover:bg-amber-200/70 text-amber-950',
                          ]"
                        >
                          {{ m }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                      type="button"
                      @click="confirmTime"
                      class="mt-2 w-full bg-green-400 hover:bg-green-500 text-gray-900 font-bold py-1.5 rounded-xl text-xs transition-colors active:scale-95 cursor-pointer"
                  >
                    {{ $t("mood.ok") }}
                  </button>
                </div>
              </div>

              <div class="flex flex-col items-center justify-center gap-2 w-full shrink-0">
                <div class="grid grid-cols-5 w-full items-stretch text-center">
                  <button
                      v-for="item in moodItems"
                      :key="item.state"
                      type="button"
                      @click="selectMood(item.state)"
                      :class="[
                          'flex flex-col items-center justify-between gap-1 h-full min-w-0 p-1 rounded-xl transition cursor-pointer',
                          selectedMoodState === item.state
                            ? 'bg-white/20 scale-105 opacity-100'
                            : selectedMoodState
                              ? 'opacity-25 hover:opacity-60 active:scale-95'
                              : 'active:scale-95',
                        ]"
                  >
                    <img
                        :src="item.image"
                        :alt="item.label"
                        :class="[
                        'w-12 h-12 object-contain shrink-0 transition-transform',
                        selectedMoodState === item.state ? 'scale-105' : '',
                      ]"
                    />
                    <span
                        :class="[
                        'min-h-[28px] w-full flex items-center justify-center text-[9px] leading-tight',
                        selectedMoodState === item.state ? 'font-bold text-gray-950' : 'font-medium text-gray-800',
                      ]"
                    >
                      {{ item.label }}
                    </span>
                  </button>
                </div>
              </div>
              <div v-show="activeMoodItem" class="mt-auto bg-white rounded-2xl px-3 py-2 border border-amber-200 flex flex-col gap-1 shrink-0">
                <div class="flex items-center justify-between text-[11px] gap-2">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <img
                        v-if="activeMoodItem"
                        :src="activeMoodItem.image"
                        :alt="formattedLastMood"
                        class="w-13 h-13 object-contain shrink-0"
                    />
                    <div class="flex flex-col gap-2 min-w-0">
                      <span class="font-semibold text-gray-700 truncate tabular-nums">{{ formattedClientRecordedAt }}</span>
                      <span class="font-bold text-gray-900 truncate text-lg">{{ formattedLastMood }}</span>
                    </div>
                  </div>
                </div>

                <div class="self-end w-fit inline-flex items-center text-[11px] border border-black/30 rounded-2xl px-2 py-0.5 gap-2">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <img
                        v-if="activeEmotionItem"
                        :src="activeEmotionItem.image"
                        :alt="formattedLastEmotion"
                        class="w-4 h-4 object-contain shrink-0"
                    />
                    <span class="font-bold text-gray-900 truncate">{{ formattedLastEmotion }}</span>
                  </div>
                </div>
              </div>

            </div>

            <div
                v-else
                class="flex-1 min-h-0 overflow-y-auto flex flex-col justify-start gap-2 w-full pr-0.5"
            >
              <div class="flex items-center justify-between w-full shrink-0 py-0.5">
                <button
                    type="button"
                    :disabled="isSubmitting"
                    @click="backToMood"
                    class="text-xs font-bold text-amber-900 hover:underline cursor-pointer disabled:opacity-40 shrink-0"
                >
                  ‹ {{ $t("mood.back") }}
                </button>
                <div class="flex items-center justify-center gap-1">
                  <img class="w-8" :src="`/mood/emoji/${selectedMoodState}_mood.webp?v=${APP_VERSION}`" alt="">
                  <span class="text-sm font-bold text-amber-950 text-center">{{ $t("mood.select_emotion") }}</span>
                  <span class="w-12 shrink-0"></span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-1.5 w-full shrink-0">
                <button
                    v-for="emo in emotionItems"
                    :key="emo.value"
                    type="button"
                    :disabled="isSubmitting"
                    @click="selectEmotionAndSubmit(emo.value)"
                    :class="[
                    'flex flex-col items-center justify-center gap-1 p-1.5 rounded-xl border text-center transition active:scale-95 cursor-pointer disabled:opacity-50 min-w-0',
                    selectedEmotion === emo.value
                      ? 'bg-green-400 border-green-600 ring-2 ring-green-500/50 text-gray-900 font-bold'
                      : 'bg-white border-amber-200 hover:border-green-400 text-gray-800',
                  ]"
                >
                  <img :src="emo.image" :alt="emo.label" class="w-10 h-10 object-contain shrink-0" />
                  <span class="text-[10px] leading-tight font-semibold truncate w-full">
                    {{ emo.label }}
                  </span>
                </button>
              </div>

              <p v-if="submitError" class="text-[11px] font-semibold text-red-600 text-center shrink-0">
                {{ submitError }}
              </p>
            </div>
          </template>

          <!-- Вкладка 2: Статистика -->
          <div v-else class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 pr-0.5">
            <div v-if="statsLoading" class="flex-1 flex items-center justify-center text-xs font-semibold text-amber-900">
              {{ $t("mood.stats_loading") }}
            </div>

            <div v-else-if="statsError" class="flex-1 flex flex-col items-center justify-center gap-2 text-center">
              <p class="text-xs font-semibold text-red-600">{{ statsError }}</p>
              <button
                  type="button"
                  @click="fetchStats({ force: true })"
                  class="px-3 py-1 rounded-xl bg-amber-100 hover:bg-green-200 text-xs font-bold text-amber-950 cursor-pointer"
              >
                {{ $t("mood.stats_retry") }}
              </button>
            </div>

            <template v-else>
              <div class="bg-white rounded-2xl p-2.5 border border-amber-200 flex flex-col gap-2 shrink-0">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold text-amber-900">{{ $t("mood.chart_title") }}</span>
                </div>

                <div v-if="totalMoodCount > 0" class="flex items-center justify-between gap-2">
                  <div class="relative w-20 h-20 shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 72 72" class="w-20 h-20 -rotate-90">
                      <circle
                          cx="36"
                          cy="36"
                          :r="DONUT_RADIUS"
                          fill="none"
                          stroke="#fef3c7"
                          stroke-width="9"
                      />
                      <circle
                          v-for="seg in moodChartSegments"
                          :key="seg.state"
                          cx="36"
                          cy="36"
                          :r="DONUT_RADIUS"
                          fill="none"
                          :stroke="seg.color"
                          stroke-width="9"
                          :stroke-dasharray="seg.dashArray"
                          :stroke-dashoffset="seg.dashOffset"
                      />
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span class="text-xs font-extrabold text-gray-900 tabular-nums leading-none">
        {{ totalMoodCount }}
      </span>
                      <span class="text-[8px] text-gray-500 mt-0.5">{{ $t("mood.chart_total") }}</span>
                    </div>
                  </div>

                  <div class="flex flex-col gap-1 min-w-0">
                    <div
                        v-for="seg in moodChartSegments"
                        :key="seg.state"
                        class="flex items-center text-[10px] gap-1"
                    >
                      <div class="flex items-center gap-1.5 min-w-0">
        <span
            class="w-2 h-2 rounded-full shrink-0"
            :style="{ backgroundColor: seg.color }"
        />
                        <span class="truncate text-gray-700">{{ seg.label }}</span>
                      </div>
                      <span class="font-bold text-gray-900 tabular-nums shrink-0">
        {{ seg.percent }}%
      </span>
                    </div>
                  </div>
                </div>

                <div v-else class="py-3 text-center text-[11px] text-gray-500">
                  {{ $t("mood.chart_empty") }}
                </div>
              </div>

              <div class="bg-white rounded-2xl p-2.5 border border-amber-200 flex flex-col gap-1 shrink-0">
                <span class="text-[11px] font-bold text-amber-900">{{ $t("mood.last_entry") }}</span>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-gray-600">{{ $t("mood.last_mood") }}</span>
                  <span class="font-bold text-gray-900">{{ formattedLastMood }}</span>
                </div>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-gray-600">{{ $t("mood.last_emotion") }}</span>
                  <span class="font-bold text-gray-900">{{ formattedLastEmotion }}</span>
                </div>
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-gray-500">{{ $t("mood.last_client_time") }}</span>
                  <span class="font-semibold text-gray-700 truncate max-w-[150px]">
                    {{ formattedClientRecordedAt }}
                  </span>
                </div>
              </div>

              <div class="bg-white rounded-2xl p-2.5 border border-amber-200 flex flex-col gap-1.5 shrink-0">
                <span class="text-[11px] font-bold text-amber-900">{{ $t("mood.moods_section") }}</span>
                <div
                    v-for="row in moodStatsRows"
                    :key="row.state"
                    class="flex items-center justify-between text-xs"
                >
                  <div class="flex items-center gap-1.5 min-w-0">
                    <img :src="row.image" :alt="row.label" class="w-5 h-5 object-contain shrink-0" />
                    <span class="truncate text-gray-800">{{ row.label }}</span>
                  </div>
                  <span class="font-bold text-gray-950 tabular-nums">{{ row.count }}</span>
                </div>
              </div>

              <div class="bg-white rounded-2xl p-2.5 border border-amber-200 flex flex-col gap-1.5 shrink-0">
                <span class="text-[11px] font-bold text-amber-900">{{ $t("mood.emotions_section") }}</span>
                <div
                    v-for="emo in emotionStatsRows"
                    :key="emo.value"
                    class="flex items-center justify-between text-xs"
                >
                  <div class="flex items-center gap-1.5 min-w-0">
                    <img :src="emo.image" :alt="emo.label" class="w-5 h-5 object-contain shrink-0" />
                    <span class="truncate text-gray-800">{{ emo.label }}</span>
                  </div>
                  <span class="font-bold text-gray-950 tabular-nums">{{ emo.count }}</span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>