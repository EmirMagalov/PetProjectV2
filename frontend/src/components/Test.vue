<script setup lang="ts">
import { useDraggable } from '@vueuse/core'
import { useTemplateRef } from 'vue'

const el = useTemplateRef('el')

// `style` will be a helper computed for `left: ?px; top: ?px;`
const { x, y, style } = useDraggable(el, {
  preventDefault: true,
  initialValue: { x: 40, y: 40 },
  exact: true,
  capture: true,
})
</script>

<template>
  <div ref="el" :style="[style, { touchAction: 'none' }]" style="position: fixed">
    Drag me! I am at {{ x }}, {{ y }}
  </div>
</template>