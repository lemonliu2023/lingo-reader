<script setup lang="ts">
import { nextTick, onUnmounted, onUpdated, ref, useTemplateRef, onMounted, onBeforeUnmount, watch } from "vue"
import { useBookStore } from "../../../store"
import {
  type Config,
  generateAdjusterConfig,
  generateFontFamilyConfig,
  generateFontSizeConfig,
  generateLetterSpacingConfig,
  generateLineHeightConfig,
  generatePaddingConfig,
  generateParaSpacingConfig,
  handleATagHref,
} from "../sharedLogic"
import { useDebounce, useThrottle, withPx, withPxImportant } from "../../../utils"
import type { ResolvedHref } from "@blingo-reader/shared"

const emits = defineEmits<{
  (event: 'infoDown'): void
  (event: 'receiveConfig', configList: Config[]): void
}>()
const props = defineProps<{
  selectedTocItem: { id: string, selector: string }
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
  generateParaSpacingConfig(pSpacing),
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
let { chapterNums, getChapterHTML, resolveHref } = useBookStore()
const currentChapterHTML = ref<string>('')

// load book
onMounted(async () => {
  currentChapterHTML.value = await getChapterHTML()
})

const skipToChapter = async (newV: ResolvedHref) => {
  if (newV.id.length > 0) {
    currentChapterHTML.value = await bookStore.getChapterThroughId(newV.id)
  }
  if (newV.selector.length > 0) {
    nextTick(() => {
      const eleLeft = articleRef.value?.querySelector(newV.selector)?.getBoundingClientRect().left
      if (eleLeft) {
        index.value = Math.floor(eleLeft / delta.value)
        recaculateScroll()
      }
    })
  }
}

// load book when select toc item
watch(() => props.selectedTocItem, skipToChapter)

// handle a tag href, bind to article element
const handleATagHrefColumn = handleATagHref(resolveHref, skipToChapter)

onUnmounted(() => {
  window.removeEventListener('resize', recaculateWithDebounce)
  document.removeEventListener('wheel', wheelEvent)
  document.removeEventListener('keydown', keyDownEvent)
})

// template refs
const articleRef = useTemplateRef<HTMLElement>('articleRef')
const delta = ref<number>(0)
const maxPageIndex = ref<number>(0)
const index = ref<number>(0)
onUpdated(() => {
  recaculatePage()
})
const recaculatePage = () => {
  if (!articleRef.value) return

  const pageWidth = Number.parseFloat(
    window.getComputedStyle(articleRef.value!).width
  ) || 0
  delta.value = pageWidth + columnGap.value

  const articleScrollWidth = articleRef.value.scrollWidth
  maxPageIndex.value = Math.floor(articleScrollWidth / pageWidth) - 1
}
const recaculateScroll = () => {
  articleRef.value!.scrollTo({
    top: 0,
    left: index.value * delta.value,
  })
}
const recaculate = () => {
  recaculatePage()
  recaculateScroll()
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
      recaculateScroll()
    }
  }
  else {
    index.value++
    recaculateScroll()
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
        recaculateScroll()
      })
    }
  } else {
    index.value--
    recaculateScroll()
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
  <div class="container" :style="{
    fontFamily,
    paddingLeft: withPxImportant(paddingLeft),
    paddingRight: withPxImportant(paddingRight),
    paddingTop: withPxImportant(paddingTop),
    paddingBottom: withPxImportant(paddingBottom),
  }">
    <!-- nextPage and prevPage button -->
    <button @click.stop="nextPage" class="next-page-button">next page</button>
    <button @click.stop="prevPage" class="prev-page-button">prev page</button>

    <!-- text -->
    <article @click="handleATagHrefColumn" ref="articleRef" class="article" :style="{
      columns, lineHeight,
      fontSize: withPxImportant(fontSize),
      columnGap: withPx(columnGap),
      letterSpacing: withPx(letterSpacing),
      '--p-spacing': withPx(pSpacing),
    }">
      <div v-html="currentChapterHTML" class="article-text"></div>

      <!-- placeholder for making sure the scrolling logic working as expected -->
      <div style="width: 100%; height: 100%;"></div>
    </article>
  </div>
</template>

<style scoped>
/* text */
.container {
  margin: 0;
  box-sizing: border-box;
  height: 100vh;
  width: 100vw;
  background-color: #f0f0f0;
  overflow: hidden;
  position: relative;
}

.article {
  box-sizing: border-box;
  column-fill: auto;
  height: 100%;
  width: 100%;
  overflow: hidden;
  overflow-wrap: break-word;
}

/* To remove default css set by inline style */
.article-text * {
  font-family: inherit !important;
  font-size: inherit !important;
  line-height: inherit !important;
  letter-spacing: inherit !important;
}

.article-text :deep(p) {
  text-indent: 2rem;
  margin-bottom: var(--p-spacing, 0);
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
  opacity: 0.2;
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
