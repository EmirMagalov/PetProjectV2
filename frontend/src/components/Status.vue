<script setup>
const props = defineProps({
  status: Boolean,
  text: String,
  image: String,
  additional: String,
  energyAdditional: String,
  energyImage: String,
  bgColor: {
    type: String,
    default: 'bg-green-500/40'
  }
})
</script>

<template>
  <div
      v-show="props.status"
      class="absolute text-yellow-300 top-0 text-shadow-sm text-shadow-black w-full h-full rounded-2xl flex flex-col items-center justify-center font-bold text-2xl z-50 pointer-events-none"
      :class="[bgColor]"
  >
    <p>{{ props.text }}</p>

    <div class="flex flex-col items-center justify-center gap-1 mt-1">
      <!-- Блок Сытости -->
      <div v-if="props.image" class="flex items-center gap-1">
        <img :src="props.image" class="w-8 h-8 object-contain" alt="">
        <p>{{ props.additional }}</p>
      </div>

      <!-- Блок Энергии (показывается только если прибавилась энергия) -->
      <div v-if="props.energyImage" class="flex items-center gap-1 text-sky-300">
        <img :src="props.energyImage" class="w-8 h-8 object-contain" alt="">
        <p>{{ props.energyAdditional }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>