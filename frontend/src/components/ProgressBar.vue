<script setup>
const props = defineProps({
  image: String,
  name: String,
  value: Number,
  color: String,
})
</script>

<template>
  <div class="flex justify-center items-center gap-1">
    <div class="flex justify-between text-xs w-5 font-semibold">
      <img :src="props.image" alt="">
      <!--      <span class="flex items-center gap-1">{{props.name}}</span>-->

    </div>
    <div class="w-40 h-3 bg-slate-700 rounded-full overflow-hidden p-0.5 shadow-inner">
      <!-- Динамическая полоска (ширина привязывается к числу, например health.value) -->
      <div class="h-full rounded-full"
           :style="{ width: props.value + '%' ,
           backgroundColor: props.color}"></div>
    </div>
    <!--    <span>90%</span>-->
  </div>
</template>

<style scoped>

</style>