<script setup lang='ts'>
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue"
import { useBookStore } from "../../../store"
import { useDomSize, withPx } from "../../../utils"
import Resizer from "../../Resizer/Resizer.vue"
import {
  type Config,
  generateFontFamilyConfig,
  generateFontSizeConfig,
  generateLetterSpacingConfig,
  generateLineHeightConfig,
  generatePaddingConfig,
  generateParaSpacingConfig
} from "../sharedLogic"

const emits = defineEmits<{
  (e: 'infoDown'): void
  (event: 'receiveConfig', configList: Config[]): void
}>()
const fontFamily = ref<string>(`'Lucida Console', Courier, monospace`)
const fontSize = ref<number>(16)
const letterSpacing = ref<number>(0)
const lineHeight = ref<number>(2)
const textPaddingLeft = ref<number>(2)
const textPaddingRight = ref<number>(2)
const textPaddingTop = ref<number>(0)
const textPaddingBottom = ref<number>(300)
// Another way to implement dynamic paragraph spacing is to use dynamic injection of <style>
const pSpacing = ref<number>(5)
const configList: Config[] = [
  generateFontFamilyConfig(fontFamily),
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
/**
 * book
 */
const bookStore = useBookStore()
let { chapterNums, getChapterHTML } = useBookStore()
const currentChapterHTML = ref<string>()
onMounted(async () => {
  currentChapterHTML.value = await getChapterHTML()
})

/**
 * chapter turning
 */
const prevChapter = async () => {
  if (bookStore.chapterIndex > 0) {
    bookStore.chapterIndex--
    currentChapterHTML.value = await getChapterHTML()
    window.scrollTo({ top: 0 })
  }
}
const nextChapter = async () => {
  if (bookStore.chapterIndex < chapterNums - 1) {
    bookStore.chapterIndex++
    currentChapterHTML.value = await getChapterHTML()
    window.scrollTo({ top: 0 })
  }
}

/**
 * button positioning
 */
const containerRef = useTemplateRef('containerRef')
const { width: containerWidth } = useDomSize(containerRef)
/**
 * move drag bar
 */
const paddingLeft = ref<number>(200)
const paddingRight = ref<number>(200)
onMounted(() => {
  paddingLeft.value = 0.2 * containerWidth.value
  paddingRight.value = 0.2 * containerWidth.value
})
const isDragging = ref<boolean>(false)

let startX = 0
let dragType = ''
const barDrag = (type: string, e: MouseEvent) => {
  startX = e.clientX
  dragType = type
}
const onMouseMove = (e: MouseEvent) => {
  const delta = e.clientX - startX
  const maxPadding = containerWidth.value - 400
  isDragging.value = true
  emits('infoDown')

  if (dragType === 'left') {
    paddingLeft.value = Math.min(
      Math.max(0, paddingLeft.value + delta),
      maxPadding - paddingRight.value
    );
  } else {
    paddingRight.value = Math.min(
      Math.max(0, paddingRight.value - delta),
      maxPadding - paddingLeft.value
    );
  }

  startX = e.clientX;
}
const onMouseUp = () => {
  setTimeout(() => {
    isDragging.value = false
  }, 0)
}
// mouseevent will trigger other's element click event, 
//  so we need to stop it in this event loop.
const containerClick = (e: MouseEvent) => {
  if (isDragging.value) {
    e.stopPropagation()
  }
}
</script>

<template>
  <div @click="containerClick" :style="{ paddingLeft: withPx(paddingLeft), paddingRight: withPx(paddingRight) }"
    :class="{ 'user-select-none': isDragging }" class="article-container" ref='containerRef'>
    <button @click.stop="nextChapter" :style="{ left: withPx(containerWidth - paddingRight) }" class="button">
      next chapter
    </button>
    <button @click.stop="prevChapter" :style="{ right: withPx(containerWidth - paddingLeft) }" class="button">
      previous chapter
    </button>
    <!-- book text -->
    <Resizer @mousedown="(e) => barDrag('left', e)" @mousemove="onMouseMove" @mouseup="onMouseUp"></Resizer>

    <article :style="{
      fontFamily, lineHeight, paddingLeft: withPx(textPaddingLeft),
      paddingRight: withPx(textPaddingRight), paddingTop: withPx(textPaddingTop),
      paddingBottom: withPx(textPaddingBottom), fontSize: withPx(fontSize),
      letterSpacing: withPx(letterSpacing), '--p-spacing': withPx(pSpacing)
    }" v-html="currentChapterHTML" class="article-text">
    </article>

    <Resizer @mousedown="(e) => barDrag('right', e)" @mousemove="onMouseMove" @mouseup="onMouseUp"></Resizer>
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
}

.article-container button {
  position: fixed;
  top: 10px;
  margin: 5px;
  padding: 5px;
  background-color: #f0f0f0;
  border: 1px solid #000;
  border-radius: 5px;
  opacity: 0.2;

  &:hover {
    opacity: 1;
  }
}

.article-text {
  flex: 1 0;
  box-sizing: border-box;
  min-width: 300px;
  margin: 0 0 0 5px;
}

/* To remove default css set by inline style */
.article-text * {
  font-family: inherit !important;
  font-size: inherit !important;
  line-height: inherit !important;
  letter-spacing: inherit !important;
}

.article-text :deep(img) {
  /* display: block; */
  /* margin: auto; */
  /* make img fit to its parent */
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.article-text :deep(pre) {
  background-color: rgba(204, 201, 194, 0.3);
}

.article-text :deep(p) {
  text-indent: 2rem;
  margin-bottom: var(--p-spacing, 0);
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
