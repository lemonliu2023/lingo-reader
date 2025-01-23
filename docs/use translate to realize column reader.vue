<script setup lang="ts">
import { nextTick, onUnmounted, onUpdated, ref, useTemplateRef, onMounted, onBeforeUnmount } from "vue"
import { useBookStore } from "../../../store"
import { useDebounce, useThrottle, withPx } from "../../../utils"
import {
  type Config,
  generateAdjusterConfig,
  generateFontFamilyConfig,
  generateFontSizeConfig,
  generateLetterSpacingConfig,
  generateLineHeightConfig,
  generatePaddingConfig
} from "../sharedLogic"

const emits = defineEmits<{
  (event: 'infoDown'): void
  (event: 'receiveConfig', configList: Config[]): void
}>()

/**
 * configs
 */
const fontFamily = ref<string>(`'Lucida Console', Courier, monospace`)
const columns = ref<number>(2)
const columnGap = ref<number>(20)
const fontSize = ref<number>(16)
const letterSpacing = ref<number>(0)
const pSpacing = ref<number>(5)
const paddingLeft = ref<number>(10)
const paddingRight = ref<number>(10)
const paddingTop = ref<number>(10)
const paddingBottom = ref<number>(10)
const lineHeight = ref<number>(2)
const configList: Config[] = [
  generateFontFamilyConfig(fontFamily),
  generateAdjusterConfig('columns', 4, 1, 1, columns),
  generateAdjusterConfig('columnGap', Infinity, 0, 2, columnGap),
  generateFontSizeConfig(fontSize),
  generateLetterSpacingConfig(letterSpacing),
  generatePaddingConfig('paddingLeft', paddingLeft),
  generatePaddingConfig('paddingRight', paddingRight),
  generatePaddingConfig('paddingTop', paddingTop),
  generatePaddingConfig('paddingBottom', paddingBottom),
  generateLineHeightConfig(lineHeight),
]
onMounted(() => {
  emits('receiveConfig', configList)
})
onBeforeUnmount(() => {
  emits('receiveConfig', [])
})
/**
 * book
 */
const bookStore = useBookStore()
let { chapterNums, getChapterHTML } = useBookStore()
const currentChapterHTML = ref<string>()

// refs for layout
const containerRef = useTemplateRef<HTMLElement>('containerRef')
const articleTextRef = useTemplateRef<HTMLElement>('articleTextRef')
const maxPageIndex = ref<number>(0)
const index = ref<number>(0)
const oneColumnWidth = ref<number>(0)
const articleTranslateX = ref<number>(0)

// load book
onMounted(async () => {
  currentChapterHTML.value = await getChapterHTML()
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
      (containerRef.value?.clientHeight! - paddingTop.value - paddingBottom.value)
    )
    / columns.value
  )
}
const recaculateTranslateX = () => {
  articleTranslateX.value = -(oneColumnWidth.value + columnGap.value) * index.value * columns.value
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
    if (bookStore.chapterIndex + 1 < chapterNums) {
      bookStore.chapterIndex++
      currentChapterHTML.value = await getChapterHTML()
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
    if (bookStore.chapterIndex - 1 >= 0) {
      bookStore.chapterIndex--
      currentChapterHTML.value = await getChapterHTML()
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
const wheelEvent = useThrottle((e: WheelEvent) => {
  e.preventDefault()
  emits('infoDown')
  if (e.deltaY > 0) {
    nextPage()
  } else {
    prevPage()
  }
}, 400)
const keyDownEvent = useDebounce((e: KeyboardEvent) => {
  e.preventDefault()
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    nextPage()
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    prevPage()
  } else {
    return
  }
  emits('infoDown')
}, 150)
document.addEventListener('wheel', wheelEvent, { passive: false })
document.addEventListener('keydown', keyDownEvent)

</script>

<template>
  <div class="article-container" ref='containerRef' :style="{
    columns, lineHeight, fontFamily,
    fontSize: withPx(fontSize), columnGap: withPx(columnGap),
    paddingLeft: withPx(paddingLeft), paddingRight: withPx(paddingRight),
    paddingTop: withPx(paddingTop), paddingBottom: withPx(paddingBottom),
    letterSpacing: withPx(letterSpacing), '--p-spacing': withPx(pSpacing),
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
  padding-bottom: var(--p-spacing, 0);
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
  max-width: 100%;
  max-height: 97vh;
  object-fit: contain;
}

.article-text :deep(pre) {
  background-color: rgba(204, 201, 194, 0.3);
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
