<script setup lang="ts">
import { onMounted, onUnmounted, onUpdated, ref } from "vue"
import { useBookStore } from "../store"
import { initEpubFile } from "@svg-ebook-reader/epub-parser"
import { html } from "../assets/html"
import { useRouter } from "vue-router"
const router = useRouter()

// load book
const bookStore = useBookStore()

onMounted(async () => {
  const book = bookStore.book as File
  const epubFile = await initEpubFile(book)
  const toc = epubFile.getToc()
  console.log(toc)
})

onUnmounted(() => {
  bookStore.reset()
})
const back = () => {
  bookStore.reset()
  router.push('/')
}

// page
const containerRef = ref<HTMLElement | null>(null)
const articleTextRef = ref<HTMLElement | null>(null)
const pageCount = ref<number>(0)
const columns = ref<number>(3)

const pageWidth = ref<number>(0)
const recaculate = () => {
  // the element width obtained from `ele.clientWidth` is an integer, 
  //  it is obtained by rounding down the actual width. In this,
  //  we use `window.getComputedStyle()` to get the more accurate width. And
  //  if pursuing more precise values, we could use `ele.getBoundingClientRect()`
  pageWidth.value = Number.parseFloat(
    window.getComputedStyle(articleTextRef.value!).width
  ) || 0
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
onUpdated(() => {
  recaculate()
})

const articleTranslateX = ref<number>(0)
const fontSize = ref<number>(20)


let index = 0
const nextPage = () => {
  if (index === pageCount.value) {
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
  isInfoDown.value = false
  if (e.deltaY > 0) {
    nextWhenWheel()
  } else {
    prevWhenWheel()
  }
}, { passive: false })

document.addEventListener('keydown', (e) => {
  isInfoDown.value = false
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    nextPage()
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    prevPage()
  }
})

// info bar show or hide
const isInfoDown = ref<boolean>(false)
// when mouse click outside the selection, the infor bar will be clicked.
//  but we don't want it to be clicked, so we need to prevent it when cancel
//  the selection.
let shouldTriggerClick = true
const infoDown = (e: Event) => {
  if (!shouldTriggerClick) {
    shouldTriggerClick = true
    return
  }
  const selection = window.getSelection()!.toString()
  if (selection.length > 0) {
    e.preventDefault()
    e.stopImmediatePropagation()
  } else {
    isInfoDown.value = !isInfoDown.value
  }
}

const handleMouseDown = () => {
  const selection = window.getSelection()!
  if (selection.toString().length > 0) {
    shouldTriggerClick = false
  }
}

</script>

<template>
  <div :class="{'top0': isInfoDown, 'topN80': !isInfoDown}" class="top-info-bar">
    <div class="top-info-bar-left">
      <!-- back button -->
      <span @click="back"><img src="/leftArrow.svg" alt="leftArrow">返回</span>
    </div>
    <div class="top-info-bar-middle"></div>
    <div class="top-info-bar-right"></div>
  </div>
  <div @mousedown="handleMouseDown" @click="infoDown" :style="{ fontSize: fontSize + 'px', columns: columns }" class="article-container" ref='containerRef'>
    <!-- book text -->
    <article v-if="html" :style="{ 'transform': `translateX(${articleTranslateX}px)` }" class="article-text"
      ref="articleTextRef" v-html="html">
    </article>
    <button @click.stop="nextPage" class="next-page-button">next page</button>
    <button @click.stop="prevPage" class="prev-page-button">prev page</button>
  </div>
</template>

<style scoped>
/* info bar */
.top0 {
  top: 0;
}
.topN80 {
  top: -80px;
}
.top-info-bar {
  position: fixed;
  width: 100%;
  height: 80px;
  box-sizing: border-box;
  background-color: #ebecee;
  z-index: 1;
  display: flex;
  transition: top 0.2s;
}
.top-info-bar div {
  flex: 1;
  background-color: #f0f0f0;
}
.top-info-bar-left {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-left: 20px;
}
.top-info-bar-left span {
  margin: 0 10px;
  padding: 5px 10px;
  font-size: 10px;
  text-align: center;
  color: #666;
  cursor: pointer;
}
.top-info-bar-left img {
  display: block;
  width: 25px;
  height: 25px;
}

/* text */
.article-container {
  margin: 0;
  box-sizing: border-box;
  height: 100vh;
  width: 100vw;
  /* columns: 2; */
  /* column-gap: 10%; */
  padding: 10px;
  /* padding-bottom: 20px; */
  /* font-size: 20px; */
  line-height: 2;
  text-indent: 2em;
  font-family: 'Lucida Console', Courier, monospace;
  background-color: #f0f0f0;
  overflow: hidden;
  position: relative;
}

.article-text {
  display: block;
  box-sizing: border-box;
}

/* prev and next page button */
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
  opacity: 0;
}

.next-page-button:hover,
.prev-page-button:hover {
  opacity: 1;
}

.prev-page-button {
  right: auto;
  left: 0;
}
</style>
