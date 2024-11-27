<script setup lang="ts">
import { onBeforeMount, nextTick, onUnmounted, onUpdated, ref, useTemplateRef } from "vue"
import { useBookStore } from "../store"
import { EpubFile, initEpubFile, SpineItem } from "@svg-ebook-reader/epub-parser"
import { useRouter } from "vue-router"
import { useDebounce } from "../utils"
const router = useRouter()
const bookStore = useBookStore()

/**
 * column layout
 */
let epubFile: EpubFile | null = null
const chapterNums = ref<number>(0)
const chapterIndex = ref<number>(0)
let toc: SpineItem[] = []
const currentChapterHTML = ref<string>()
const getChapterHTML = async (chapterIndex: number) => {
  return await epubFile!.getHTML(toc[chapterIndex].id)
}
// page
const columns = ref<number>(2)
const fontSize = ref<number>(20)
const letterSpacing = ref<number>(0)
const paddingLeft = ref<number>(10)
const paddingRight = ref<number>(10)
const paddingTop = ref<number>(10)
const paddingBottom = ref<number>(10)
const lineHeight = ref<number>(2)
const columnGap = ref<number>(10)

const containerRef = useTemplateRef<HTMLElement>('containerRef')
const articleTextRef = useTemplateRef<HTMLElement>('articleTextRef')
const pageNums = ref<number>(0)
const index = ref<number>(0)
const pageWidth = ref<number>(0)
const articleTranslateX = ref<number>(0)

// load book
onBeforeMount(async () => {
  const book = bookStore.book as File
  epubFile = await initEpubFile(book)
  toc = epubFile.getToc()
  chapterNums.value = toc.length
  currentChapterHTML.value = await getChapterHTML(chapterIndex.value)
})
onUnmounted(() => {
  bookStore.reset()
})
// recalculate page width and height, index ...
const recaculatePage = () => {
  if (!articleTextRef.value) {
    return
  }
  // the element width obtained from `ele.clientWidth` is an integer, 
  //  it is obtained by rounding down the actual width. In this,
  //  we use `window.getComputedStyle()` to get the more accurate width. And
  //  if pursuing more precise values, we could use `ele.getBoundingClientRect()`
  pageWidth.value = Number.parseFloat(
    window.getComputedStyle(articleTextRef.value!).width
  ) || 0
  pageNums.value = Math.floor(
    (articleTextRef.value?.clientHeight! / containerRef.value?.clientHeight!) / columns.value
  )
}
const recaculateTranslateX = () => {
  articleTranslateX.value = -(pageWidth.value + fontSize.value) * index.value * columns.value
}
const recaculate = () => {
  recaculatePage()
  recaculateTranslateX()
}
onUpdated(recaculate)
window.addEventListener('resize', useDebounce(recaculate, 200))

const nextPage = async () => {
  if (index.value === pageNums.value) {
    if (chapterIndex.value + 1 < chapterNums.value) {
      chapterIndex.value++
      currentChapterHTML.value = await getChapterHTML(chapterIndex.value)
      recaculatePage()
      index.value = 0
      articleTranslateX.value = 0
    }
  } else {
    index.value++
    recaculateTranslateX()
  }
}
const prevPage = async () => {
  if (index.value === 0) {
    if (chapterIndex.value - 1 >= 0) {
      chapterIndex.value--
      currentChapterHTML.value = await getChapterHTML(chapterIndex.value)
      nextTick(() => {
        recaculatePage()
        index.value = Math.max(0, pageNums.value)
        recaculateTranslateX()
      })
    }
  } else {
    index.value--
    recaculateTranslateX()
  }
}
document.addEventListener('wheel', useDebounce((e: WheelEvent) => {
  isInfoDown.value = false
  if (e.deltaY > 0) {
    nextPage()
  } else {
    prevPage()
  }
}, 150), { passive: false })
document.addEventListener('keydown', useDebounce((e: KeyboardEvent) => {
  isInfoDown.value = false
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    nextPage()
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    prevPage()
  }
}, 150))

/**
 * info bar show or hide
 */
const isInfoDown = ref<boolean>(false)
const back = () => {
  bookStore.reset()
  router.push('/')
}
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
  <div :class="{ 'top0': isInfoDown, 'topN80': !isInfoDown }" class="top-info-bar">
    <div class="top-info-bar-left">
      <!-- back button -->
      <span @click="back"><img src="/leftArrow.svg" alt="leftArrow">返回</span>
    </div>
    <div class="top-info-bar-middle"></div>
    <div class="top-info-bar-right"></div>
  </div>
  <div @mousedown="handleMouseDown" @click="infoDown" :style="{ fontSize: fontSize + 'px', columns: columns }"
    class="article-container" ref='containerRef'>
    <!-- book text -->
    <article ref="articleTextRef" v-if="currentChapterHTML" v-html="currentChapterHTML"
      :style="{ 'transform': `translateX(${articleTranslateX}px)` }" class="article-text">
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
  /* column-fill: auto; */
  padding: 10px;
  line-height: 2;
  font-family: 'Lucida Console', Courier, monospace;
  background-color: #f0f0f0;
  overflow: hidden;
  position: relative;
}

.article-text {
  display: block;
  box-sizing: border-box;
  letter-spacing: 1px;
}

.article-text :deep(p) {
  text-indent: 2em;
}

.article-text :deep(li p) {
  text-indent: 0;
}

.article-text :deep(figure p) {
  text-indent: 0;
}

.article-text :deep(figure) {
  text-align: center;
}

.article-text :deep(img) {
  display: block;
  margin: auto;
  /* make img fit to its parent */
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.article-text :deep(pre) {
  background-color: turquoise;
}

/* allow text in code to wrap */
.article-text :deep(code) {
  white-space: pre-wrap;
  /* Keep whitespace, but allow auto wrap */
  word-wrap: break-word;
  /* Wrap lines at long words (old standard) */
  word-break: break-word;
  /* Handling line breaks for long words (better compatibility) */
}

.article-text :deep(a) {
  word-wrap: break-word;
  /* 允许长单词换行 */
  white-space: normal;
  /* 确保文本可以换行 */
  /* word-break: break-all; */
  /* 强制在单词之间换行 */
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
