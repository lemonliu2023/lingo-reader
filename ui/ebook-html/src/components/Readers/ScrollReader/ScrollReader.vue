<script setup lang='ts'>
import { onBeforeMount, ref, useTemplateRef } from "vue"
import { useBookStore } from "../../../store"
import { EpubFile, initEpubFile, SpineItem } from "@svg-ebook-reader/epub-parser"
import { withPx } from "../../../utils"
import { Props } from "./ScollReader";

withDefaults(defineProps<Partial<Props>>(), {
  fontSize: 16,
  letterSpacing: 1,
  lineHeight: 2
})
const emits = defineEmits<{
  (e: 'infoDown'): void
}>()

/**
 * book
 */
const bookStore = useBookStore()

let epubFile: EpubFile | null = null
const chapterNums = ref<number>(0)
let toc: SpineItem[] = []
const currentChapterHTML = ref<string>()
const getChapterHTML = async (chapterIndex: number) => {
  return await epubFile!.getHTML(toc[chapterIndex].id)
}
const chapterIndex = defineModel('chapterIndex', {
  default: 14,
  type: Number
})

onBeforeMount(async () => {
  const book = bookStore.book as File
  epubFile = await initEpubFile(book)
  toc = epubFile.getToc()
  chapterNums.value = toc.length
  currentChapterHTML.value = await getChapterHTML(chapterIndex.value)
})

/**
 * chapter turning
 */
const prevChapter = async () => {
  if (chapterIndex.value > 0) {
    chapterIndex.value--
    currentChapterHTML.value = await getChapterHTML(chapterIndex.value)
  }
}
const nextChapter = async () => {
  if (chapterIndex.value < chapterNums.value - 1) {
    chapterIndex.value++
    currentChapterHTML.value = await getChapterHTML(chapterIndex.value)
  }
}

const containerRef = useTemplateRef('containerRef')
const articleTextRef = useTemplateRef('articleTextRef')

/**
 * move drag bar
 */
const paddingLeft = ref<number>(300)
const paddingRight = ref<number>(300)
const shouldSelect = ref<boolean>(true)
const rightBar = useTemplateRef('rightBar')

let isDragging = false
let startX = 0
let originPaddingRight = 0
let dragType = ''
const barDrag = (type: string, e: MouseEvent) => {
  emits('infoDown')
  isDragging = true
  startX = e.clientX
  originPaddingRight = paddingRight.value
  dragType = type
  shouldSelect.value = false
  document.addEventListener('mousemove', leftOnMouseMove);
  document.addEventListener('mouseup', leftOnMouseUp);
}

const leftOnMouseMove = (e: MouseEvent) => {
  const delta = e.clientX - startX
  if (dragType === 'left') {
    paddingLeft.value = startX + delta
  } else {
    paddingRight.value = originPaddingRight - delta
  }
}

const leftOnMouseUp = () => {
  isDragging = false
  shouldSelect.value = true
  document.removeEventListener('mousemove', leftOnMouseMove);
  document.removeEventListener('mouseup', leftOnMouseUp);
}


</script>

<template>
  <div :style="{ paddingLeft: withPx(paddingLeft), paddingRight: withPx(paddingRight) }" class="article-container"
    ref='containerRef'>
    <button @click.stop="prevChapter" :style="{ left: withPx(paddingLeft + 10) }" class="button">prev chapter</button>
    <button @click.stop="nextChapter" :style="{ right: withPx(paddingRight + 10) }" class="button">next chapter</button>
    <!-- book text -->
    <div @click.stop @mousedown="(e) => barDrag('left', e)" class="bar"></div>
    <article :style="{ lineHeight, fontSize: withPx(fontSize), letterSpacing: withPx(letterSpacing) }"
      :class="{ 'user-select-none': !shouldSelect }" ref="articleTextRef" v-html="currentChapterHTML"
      class="article-text">
    </article>
    <div ref="rightBar" @click.stop @mousedown="(e) => barDrag('right', e)" class="bar"></div>
  </div>
</template>

<style scoped>
.user-select-none {
  user-select: none;
}

.article-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  margin: 0;
  box-sizing: border-box;
  font-family: 'Lucida Console', Courier, monospace;
  background-color: #f0f0f0;
  position: relative;
  padding-left: 300px;
  padding-right: 300px;
}

.article-container button {
  position: fixed;
  top: 10px;
  margin: 5px;
  padding: 5px;
  background-color: #f0f0f0;
  border: 1px solid #000;
  border-radius: 5px;
  opacity: 0;

  &:hover {
    opacity: 1;
  }
}

.bar {
  flex: 0 0 5px;
  background-color: black;
  cursor: w-resize;
  /* opacity: 0; */
}


.article-text {
  flex: 1 0;
  box-sizing: border-box;
  min-width: 300px;
}

.article-text :deep(img) {
  /* display: block; */
  /* margin: auto; */
  /* make img fit to its parent */
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.article-text :deep(p) {
  text-indent: 2em;
  margin: 3px 0;
}

.article-text :deep(li p) {
  text-indent: 0;
}

.article-text :deep(ul) {
  padding-left: 2em;
}

.article-text :deep(figure) {
  text-align: center;
}
</style>
