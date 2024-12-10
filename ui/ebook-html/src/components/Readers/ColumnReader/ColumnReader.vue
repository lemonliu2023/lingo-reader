<script setup lang="ts">
import { nextTick, onUnmounted, onUpdated, ref, useTemplateRef, onMounted } from "vue"
import { useBookStore } from "../../../store"
import { EpubFile, initEpubFile, SpineItem } from "@svg-ebook-reader/epub-parser"
import { useDebounce, withPx } from "../../../utils"
import { Props } from "./ColumnReader.ts"
const bookStore = useBookStore()

/**
 * column layout
 */
let epubFile: EpubFile | null = null
const chapterNums = ref<number>(0)
// const chapterIndex = ref<number>(0)
let toc: SpineItem[] = []
const currentChapterHTML = ref<string>()
const getChapterHTML = async (chapterIndex: number) => {
  return await epubFile!.getHTML(toc[chapterIndex].id)
}
const chapterIndex = ref<number>(0)
// const chapterIndex = defineModel('chapterIndex', {
//   default: 0,
//   type: Number
// })
// watch(chapterIndex, async (newIndex) => {
//   currentChapterHTML.value = await getChapterHTML(newIndex)
// })
// page props
const props = withDefaults(defineProps<Partial<Props>>(), {
  columns: 2,
  fontSize: 20,
  letterSpacing: 1,
  paddingLeft: 10,
  paddingRight: 10,
  paddingTop: 10,
  paddingBottom: 10,
  lineHeight: 2,
  columnGap: 20
})

const emits = defineEmits<{
  (event: 'infoDown'): void
}>()

const containerRef = useTemplateRef<HTMLElement>('containerRef')
const articleTextRef = useTemplateRef<HTMLElement>('articleTextRef')
const maxPageIndex = ref<number>(0)
const index = ref<number>(0)
const oneColumnWidth = ref<number>(0)
const articleTranslateX = ref<number>(0)

// load book
onMounted(async () => {
  const book = bookStore.book as File
  epubFile = await initEpubFile(book)
  toc = epubFile.getToc()
  chapterNums.value = toc.length
  currentChapterHTML.value = await getChapterHTML(chapterIndex.value)
})
onUnmounted(() => {
  window.removeEventListener('resize', recaculateWithDebounce)
  document.removeEventListener('wheel', wheelEvent)
  document.removeEventListener('keydown', keyDownEvent)
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
  oneColumnWidth.value = Number.parseFloat(
    window.getComputedStyle(articleTextRef.value!).width
  ) || 0
  maxPageIndex.value = Math.floor(
    (
      articleTextRef.value?.clientHeight!
      /
      (containerRef.value?.clientHeight! - props.paddingTop - props.paddingBottom)
    )
    / props.columns
  )
}
const recaculateTranslateX = () => {
  articleTranslateX.value = -(oneColumnWidth.value + props.columnGap) * index.value * props.columns
}
const recaculate = () => {
  recaculatePage()
  recaculateTranslateX()
}
const recaculateWithDebounce = useDebounce(recaculate, 20)
onUpdated(recaculate)
window.addEventListener('resize', recaculateWithDebounce)

// page turning
const nextPage = async () => {
  if (index.value >= maxPageIndex.value) {
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
  if (index.value <= 0) {
    if (chapterIndex.value - 1 >= 0) {
      chapterIndex.value--
      currentChapterHTML.value = await getChapterHTML(chapterIndex.value)
      nextTick(() => {
        recaculatePage()
        index.value = Math.max(0, maxPageIndex.value)
        recaculateTranslateX()
      })
    }
  } else {
    index.value--
    recaculateTranslateX()
  }
}
const wheelEvent = useDebounce((e: WheelEvent) => {
  emits('infoDown')
  if (e.deltaY > 0) {
    nextPage()
  } else {
    prevPage()
  }
}, 150)
const keyDownEvent = useDebounce((e: KeyboardEvent) => {
  emits('infoDown')
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    nextPage()
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    prevPage()
  }
}, 150)
document.addEventListener('wheel', wheelEvent, { passive: false })
document.addEventListener('keydown', keyDownEvent)

</script>

<template>
  <div class="article-container" ref='containerRef' :style="{
    columns, lineHeight, fontSize: withPx(fontSize), columnGap: withPx(columnGap),
    paddingLeft: withPx(paddingLeft), paddingRight: withPx(paddingRight),
    paddingTop: withPx(paddingTop), paddingBottom: withPx(paddingBottom),
    letterSpacing: withPx(letterSpacing)
  }">
    <!-- book text -->
    <article ref="articleTextRef" v-if="currentChapterHTML" v-html="currentChapterHTML"
      :style="{ 'transform': `translateX(${articleTranslateX}px)` }" class="article-text">
    </article>
    <button @click.stop="nextPage" class="next-page-button">next page</button>
    <button @click.stop="prevPage" class="prev-page-button">prev page</button>
  </div>
</template>

<style scoped>
/* text */
.article-container {
  margin: 0;
  box-sizing: border-box;
  height: 100vh;
  width: 100vw;
  /* column-fill: auto; */
  font-family: 'Lucida Console', Courier, monospace;
  background-color: #f0f0f0;
  overflow: hidden;
  position: relative;
}

.article-text {
  display: block;
  box-sizing: border-box;
}

.article-text :deep(p) {
  text-indent: 2rem;
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
  /* Allow long words to wrap */
  white-space: normal;
  /* Ensure that the text can wrap */
  /* word-break: break-all; */
  /* Force line breaks in words */
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
