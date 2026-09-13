<script setup>
const props = defineProps({
  status: Boolean,
  text: String,
  image: String,
  additional: String,
  bgColor: {
    type: String,
    default: 'bg-green-500/50'
  }
})
</script>

<template>
  <div
      v-show="props.status"
      class="absolute text-yellow-300 text-shadow-sm text-shadow-black inset-0 -mt-5  rounded-2xl flex flex-col items-center justify-center  font-bold text-2xl z-150"
      :class="[bgColor]"
  >

    <p>{{ props.text }}</p>
    <div class="flex flex-col items-center justify-center">
      <div class="flex gap-1">
        <img v-show="props.image" :src="props.image" class="w-10" alt="">
        <p>{{ props.additional }}</p>

      </div>

    </div>

  </div>
</template>

<style scoped>

</style>