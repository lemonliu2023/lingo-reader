<script setup lang="ts">
import { ref, useTemplateRef, onMounted, onBeforeUnmount } from 'vue'
import { useBookStore } from '../../../store'
import { withPx } from '../../../utils'
import Resizer from '../../Resizer/Resizer.vue'
import {
  type Config,
  generateFontSizeConfig,
  generateLetterSpacingConfig,
  generateLineHeightConfig,
  generatePaddingConfig,
  generateParaSpacingConfig
} from '../sharedLogic'

const emits = defineEmits<{
  (e: 'info-down'): void
  (event: 'receiveConfig', configList: Config[]): void
}>()
const fontSize = ref<number>(20)
const letterSpacing = ref<number>(0)
const lineHeight = ref<number>(2)
const pSpacing = ref<number>(5)
const textPaddingLeft = ref<number>(5)
const textPaddingRight = ref<number>(1)
const textPaddingTop = ref<number>(0)
const textPaddingBottom = ref<number>(300)
const configList: Config[] = [
  generateFontSizeConfig(fontSize),
  generateLetterSpacingConfig(letterSpacing),
  generateLineHeightConfig(lineHeight),
  generateParaSpacingConfig(pSpacing),
  generatePaddingConfig('textPaddingLeft', textPaddingLeft),
  generatePaddingConfig('textPaddingRight', textPaddingRight),
  generatePaddingConfig('textPaddingTop', textPaddingTop),
  generatePaddingConfig('textPaddingBottom', textPaddingBottom),
]
onMounted(() => {
  emits('receiveConfig', configList)
})
onBeforeUnmount(() => {
  emits('receiveConfig', [])
})
const articleWrapRef = useTemplateRef('articleWrapRef')

/**
 * book
 */
const bookStore = useBookStore()
let { chapterNums, getChapterHTML } = useBookStore()

const currentChapterHTML = ref<string>()

onMounted(async () => {
  currentChapterHTML.value = await getChapterHTML()
})
const prevChapter = async () => {
  if (bookStore.chapterIndex > 0) {
    bookStore.chapterIndex--
    currentChapterHTML.value = await getChapterHTML()
    articleWrapRef.value!.scrollTop = 0
  }
}
const nextChapter = async () => {
  if (bookStore.chapterIndex < chapterNums - 1) {
    bookStore.chapterIndex++
    currentChapterHTML.value = await getChapterHTML()
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
  if (isDragging.value || isBlur) {
    e.stopPropagation()
  }
  if (isBlur) {
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
const isDragging = ref<boolean>(false)
const noteBasis = ref<number>(0)
const articleBasis = ref<number>(0)

const onMouseMove = (e: MouseEvent) => {
  isDragging.value = true
  const delta = e.clientX - startX
  if (isReverse.value) {
    noteBasis.value -= delta * 2
    articleBasis.value += delta * 2
  } else {
    noteBasis.value += delta * 2
    articleBasis.value -= delta * 2
  }
  startX = e.clientX
}
const onMouseUp = () => {
  setTimeout(() => {
    isDragging.value = false
  }, 0)
}
const onMouseDown = (e: MouseEvent) => {
  startX = e.clientX
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
    <!-- this -->
    <div :style="{
      lineHeight, paddingLeft: withPx(textPaddingLeft), paddingRight: withPx(textPaddingRight),
      paddingTop: withPx(textPaddingTop), paddingBottom: withPx(textPaddingBottom),
      flexBasis: withPx(articleBasis), '--p-spacing': withPx(pSpacing)
    }" :class="{ 'user-select-none': isDragging }" class="article-wrap" ref="articleWrapRef">
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
  z-index: 1;

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
  padding: 2rem;
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
  overflow-y: auto;
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
  margin-bottom: var(--p-spacing, 5px);
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