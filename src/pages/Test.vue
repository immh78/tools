<template>
  <div class="pattern-container" @touchstart="start" @touchmove="move" @touchend="end">
    <div
      v-for="(dot, index) in dots"
      :key="index"
      :class="['dot', { active: selected.includes(index) }]"
      :style="{ left: dot.x + 'px', top: dot.y + 'px' }"
      ref="dotRefs"
    ></div>
    <canvas ref="canvas" class="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const selected = ref([])
const dots = ref([])
const dotRefs = ref([])
const canvas = ref(null)
const ctx = ref(null)

onMounted(() => {
  const spacing = 100
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      dots.value.push({ x: x * spacing + 50, y: y * spacing + 50 })
    }
  }
  ctx.value = canvas.value.getContext('2d')
  canvas.value.width = 300
  canvas.value.height = 300
})

const start = (e) => {
  selected.value = []
  draw()
  move(e)
}

const move = (e) => {
  const touch = e.touches[0]
  const { clientX, clientY } = touch
  dots.value.forEach((dot, index) => {
    const dx = dot.x - clientX + canvas.value.getBoundingClientRect().left
    const dy = dot.y - clientY + canvas.value.getBoundingClientRect().top
    if (Math.sqrt(dx * dx + dy * dy) < 30 && !selected.value.includes(index)) {
      selected.value.push(index)
      draw()
    }
  })
}

const end = () => {
  alert('패턴 입력 완료: ' + selected.value.join('-'))
}

const draw = () => {
  ctx.value.clearRect(0, 0, 300, 300)
  ctx.value.strokeStyle = 'blue'
  ctx.value.lineWidth = 5
  ctx.value.beginPath()
  selected.value.forEach((index, i) => {
    const dot = dots.value[index]
    if (i === 0) {
      ctx.value.moveTo(dot.x, dot.y)
    } else {
      ctx.value.lineTo(dot.x, dot.y)
    }
  })
  ctx.value.stroke()
}
</script>

<style scoped>
.pattern-container {
  position: relative;
  width: 300px;
  height: 300px;
  margin: auto;
  touch-action: none;
}

.dot {
  position: absolute;
  width: 30px;
  height: 30px;
  background: gray;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.dot.active {
  background: blue;
}

.canvas {
  position: absolute;
  top: 0;
  left: 0;
}
</style>
