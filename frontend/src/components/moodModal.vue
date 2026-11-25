<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { showMoodModal } from "@/scripts/useGameStore.js";

const now = new Date();
const pad = (n) => String(n).padStart(2, "0");

const formatDate = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const maxYear = now.getFullYear();
const maxMonth = now.getMonth(); // 0..11
const maxDate = formatDate(now);

const selectedDate = ref(maxDate);
const selectedTime = ref(`${pad(now.getHours())}:${pad(now.getMinutes())}`);

// Черновики — применяются только по нажатию "Ok"
const draftDate = ref(selectedDate.value);
const draftTime = ref(selectedTime.value);

// Обёртка для отслеживания клика вне календаря и времени
const pickerWrapperRef = ref(null);

// Кастомный календарь
const showCalendar = ref(false);
const viewYear = ref(maxYear);
const viewMonth = ref(maxMonth);

// Кастомный выбор времени
const showTimePicker = ref(false);
const hours = Array.from({ length: 24 }, (_, i) => pad(i));
const minutes = Array.from({ length: 60 }, (_, i) => pad(i));

const draftHour = computed(() => draftTime.value.split(":")[0] || "00");
const draftMinute = computed(() => draftTime.value.split(":")[1] || "00");

const monthNames = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

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
});

onUnmounted(() => {
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
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
          v-if="showMoodModal"
          class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <div
            class="bg-[#fff6ef] border-2 border-green-400 rounded-3xl p-5 w-full max-w-xs min-h-[420px] max-h-[85vh] shadow-2xl relative flex flex-col justify-between gap-4 overflow-y-auto"
        >
          <!-- Дата и время -->
          <div ref="pickerWrapperRef" class="grid grid-cols-2 gap-2 w-full shrink-0 relative">
            <div class="flex flex-col gap-1 min-w-0">
              <span class="text-[11px] font-bold text-amber-900">Дата</span>
              <button
                  type="button"
                  @click="toggleCalendar"
                  class="w-full min-w-0 px-2 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-semibold text-gray-800 text-left truncate cursor-pointer hover:border-green-500"
              >
                {{ selectedDate }}
              </button>
            </div>

            <div class="flex flex-col gap-1 min-w-0">
              <span class="text-[11px] font-bold text-amber-900">Время</span>
              <button
                  type="button"
                  @click="toggleTimePicker"
                  class="w-full min-w-0 px-2 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-semibold text-gray-800 text-left truncate cursor-pointer hover:border-green-500"
              >
                {{ selectedTime }}
              </button>
            </div>

            <!-- Кастомное окно календаря -->
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
                Ok
              </button>
            </div>

            <!-- Кастомное окно выбора времени -->
            <div
                v-if="showTimePicker"
                class="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#fffaf5] border-2 border-green-400 rounded-2xl p-2.5 shadow-xl"
            >
              <div class="grid grid-cols-2 gap-2">
                <div class="flex flex-col gap-1">
                  <span class="text-[10px] font-bold text-center text-amber-900">Часы</span>
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
                  <span class="text-[10px] font-bold text-center text-amber-900">Минуты</span>
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
                Ok
              </button>
            </div>
          </div>

          <!-- Список настроений -->
          <div class="flex flex-col items-center justify-center gap-2 w-full">
            <div class="grid grid-cols-5 gap-1.5 w-full items-start text-center">
              <div class="flex flex-col items-center gap-1 min-w-0">
                <img src="/mood/emoji/great_mood.webp" alt="" class="w-15 h-15 object-contain shrink-0" />
                <span class="text-[10px] leading-tight font-medium break-words">Отличное</span>
              </div>
              <div class="flex flex-col items-center gap-1 min-w-0">
                <img src="/mood/emoji/good_mood.webp" alt="" class="w-15 h-15 object-contain shrink-0" />
                <span class="text-[10px] leading-tight font-medium break-words">Хорошее</span>
              </div>
              <div class="flex flex-col items-center gap-1 min-w-0">
                <img src="/mood/emoji/not_a_great_mood.webp" alt="" class="w-15 h-15 object-contain shrink-0" />
                <span class="text-[10px] leading-tight font-medium break-words">Не очень</span>
              </div>
              <div class="flex flex-col items-center gap-1 min-w-0">
                <img src="/mood/emoji/bad_mood.webp" alt="" class="w-15 h-15 object-contain shrink-0" />
                <span class="text-[10px] leading-tight font-medium break-words">Плохое</span>
              </div>
              <div class="flex flex-col items-center gap-1 min-w-0">
                <img src="/mood/emoji/terrible_mood.webp" alt="" class="w-15 h-15 object-contain shrink-0" />
                <span class="text-[10px] leading-tight font-medium break-words">Ужасное</span>
              </div>
            </div>
          </div>

          <!-- Кнопка в самом низу -->
          <button
              type="button"
              @click="showMoodModal = false"
              class="mt-auto w-full bg-green-400 hover:bg-[#f3b584] text-gray-800 font-bold py-2 rounded-2xl border border-[#3399FF]/10 transition-colors active:scale-95 shrink-0 cursor-pointer"
          >
            {{ $t("close") }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>