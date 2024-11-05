<script setup lang="ts">
import { onMounted, ref } from "vue"
import { html } from "./assets/html"
const containerRef = ref<HTMLElement | null>(null)
const articleTextRef = ref<HTMLElement | null>(null)
const pageCount = ref<number>(0)
const columns = ref<number>(3)

const pageWidth = ref<number>(0)
const recaculate = () => {
  pageWidth.value = articleTextRef.value?.clientWidth || 0
  pageCount.value = Math.ceil(
    (articleTextRef.value?.clientHeight! / containerRef.value?.clientHeight!) / columns.value
  )
}
window.addEventListener('resize', () => {
  recaculate()
})
onMounted(() => {
  recaculate()
})

const articleTranslateX = ref<number>(0)
const fontSize = ref<number>(20)


let index = 0
const nextPage = () => {
  if (index === pageCount.value - 1) {
    return
  }
  index++
  articleTranslateX.value = -(pageWidth.value + fontSize.value) * index * columns.value
}

const prevPage = () => {
  if (index === 0) {
    return
  }
  index--
  articleTranslateX.value = -(pageWidth.value + fontSize.value) * index * columns.value
}

const useDebounce = (fn: Function, delay: number) => {
  let timer: any = null
  return (...args: any[]) => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}
const nextWhenWheel = useDebounce(nextPage, 200)
const prevWhenWheel = useDebounce(prevPage, 200)
document.addEventListener('wheel', (e) => {
  if (e.deltaY > 0) {
    nextWhenWheel()
  } else {
    prevWhenWheel()
  }
}, {passive: false})

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    nextPage()
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    prevPage()
  }
})

</script>

<template>
  <div :style="{ fontSize: fontSize + 'px', columns: columns }" class="article-container" ref='containerRef'>
    <article v-if="html" :style="{ 'transform': `translateX(${articleTranslateX}px)` }" class="article-text" ref="articleTextRef" v-html="html">
    </article>
    <button @click="nextPage" class="next-page-button">next page</button>
    <button @click="prevPage" class="prev-page-button">prev page</button>
  </div>
</template>

<style scoped>
.article-container {
  margin: 0;
  height: calc(100vh - 10px);
  width: calc(100vw - 10px);
  /* columns: 2; */
  /* column-gap: 10%; */
  padding: 5px;
  /* padding-bottom: 20px; */
  /* font-size: 20px; */
  line-height: 2;
  text-indent: 2em;
  font-family: 'Lucida Console', Courier, monospace;
  background-color: #f0f0f0;
  overflow: hidden;
  position: relative;
}

.next-page-button,
.prev-page-button {
  position: absolute;
  bottom: 0;
  right: 0;
  margin: 5px;
  padding: 5px;
  background-color: #f0f0f0;
  border: 1px solid #000;
  border-radius: 5px;
}

.prev-page-button {
  right: auto;
  left: 0;
}
</style>
