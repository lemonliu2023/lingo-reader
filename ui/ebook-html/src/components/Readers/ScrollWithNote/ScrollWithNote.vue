<script setup lang="ts">
import { ref, useTemplateRef, onMounted } from 'vue'
import { useBookStore } from '../../../store'
import { initEpubFile, } from '@svg-ebook-reader/epub-parser'
import type { EpubFile, SpineItem } from '@svg-ebook-reader/epub-parser'
import { withPx } from '../../../utils';
import { Props } from './ScrollWithNote'
import Resizer from '../../Resizer/Resizer.vue'

withDefaults(defineProps<Partial<Props>>(), {
  fontSize: 20,
  letterSpacing: 0,
  lineHeight: 2,
  textPadding: 3
})

const emits = defineEmits<{
  (e: 'info-down'): void
}>()

const articleWrapRef = useTemplateRef('articleWrapRef')

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
  default: 4,
  type: Number
})

onMounted(async () => {
  const book = bookStore.book as File
  epubFile = await initEpubFile(book)
  toc = epubFile.getToc()
  chapterNums.value = toc.length
  currentChapterHTML.value = await getChapterHTML(chapterIndex.value)
})

const prevChapter = async () => {
  if (chapterIndex.value > 0) {
    chapterIndex.value--
    currentChapterHTML.value = await getChapterHTML(chapterIndex.value)
    articleWrapRef.value!.scrollTop = 0
  }
}

const nextChapter = async () => {
  if (chapterIndex.value < chapterNums.value - 1) {
    chapterIndex.value++
    currentChapterHTML.value = await getChapterHTML(chapterIndex.value)
    articleWrapRef.value!.scrollTop = 0
  }
}

/**
 * textarea blur
 */
let isBlur = false
const noteBlur = () => {
  isBlur = true
}
const noteFocus = () => {
  emits('info-down')
}
const containerClick = (e: MouseEvent) => {
  if (isBlur) {
    e.stopPropagation()
    isBlur = false
  }
}

/**
 * resize width of note and article
 */
// swap button
const isReverse = ref<boolean>(false)
const swap = () => {
  isReverse.value = !isReverse.value
}
// resize
let startX = 0
// ban select chapter content in <article>
const shouldSelectText = ref<boolean>(true)
const noteBasis = ref<number>(0)
const articleBasis = ref<number>(0)
// origin width in flex layout
let orginNoteBasis = 0
let originArticleBasis = 0

const onMouseMove = (e: MouseEvent) => {
  const delta = e.clientX - startX
  if (isReverse.value) {
    noteBasis.value = orginNoteBasis - delta * 2
    articleBasis.value = originArticleBasis + delta * 2
  } else {
    noteBasis.value = orginNoteBasis + delta * 2
    articleBasis.value = originArticleBasis - delta * 2
  }
}
const onMouseUp = () => {
  shouldSelectText.value = true
}
const onMouseDown = (e: MouseEvent) => {
  startX = e.clientX
  shouldSelectText.value = false
  orginNoteBasis = noteBasis.value
  originArticleBasis = articleBasis.value
}

</script>

<template>
  <button @click.stop="swap" class="swap-button">swap</button>
  <div :style="{ fontSize: withPx(fontSize), letterSpacing: withPx(letterSpacing) }"
    :class="{ 'flex-row-reverse': isReverse }" @click="(e) => containerClick(e)" class="article-container">
    <div :style="{ flexBasis: withPx(noteBasis) }" class="note">
      <textarea @blur="noteBlur" @focus="noteFocus" @click.stop name="note"></textarea>
    </div>
    <Resizer @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp"></Resizer>
    <div :style="{ lineHeight, flexBasis: withPx(articleBasis), padding: withPx(textPadding) }"
      :class="{ 'user-select-none': !shouldSelectText }" class="article-wrap" ref="articleWrapRef">
      <button @click.stop="prevChapter" class="button prev-chapter">prev chapter</button>
      <button @click.stop="nextChapter" class="button next-chapter">next chapter</button>
      <article class="article-text" v-html="currentChapterHTML">
      </article>
    </div>
  </div>
</template>

<style scoped>
.user-select-none {
  user-select: none;
}

.flex-row-reverse {
  flex-direction: row-reverse;
}

.swap-button {
  position: fixed;
  padding: 5px;
  font-family: Lucida Console;
  background-color: #f0f0f0;
  border: 1px solid #000;
  border-radius: 5px;
  opacity: 0.2;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);

  &:hover {
    opacity: 1;
  }
}

.article-container {
  height: 100vh;
  min-width: 100vh;
  display: flex;
  margin: 0;
  box-sizing: border-box;
  font-family: 'Lucida Console', Courier, monospace;
  font-size: 20px;
  background-color: #f0f0f0;
}

.note {
  flex: 1 1;
}

.note textarea {
  display: block;
  box-sizing: border-box;
  height: 100vh;
  width: 100%;
  padding: 2em;
  border: none;
  outline: none;
  resize: none;
}

.article-wrap {
  display: block;
  box-sizing: border-box;
  min-height: 100vh;
  min-width: 140px;
  flex: 1 1;
  overflow-y: scroll;
}

.prev-chapter {
  position: fixed;
  top: 10px;
  right: 10px;
  opacity: 0.2;
}

.next-chapter {
  position: fixed;
  bottom: 10px;
  right: 10px;
  opacity: 0.2;
}

.prev-chapter:hover,
.next-chapter:hover {
  opacity: 1;
}

.article-text :deep(img) {
  /* make img fit to its parent */
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.article-text :deep(p) {
  text-indent: 2rem;
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