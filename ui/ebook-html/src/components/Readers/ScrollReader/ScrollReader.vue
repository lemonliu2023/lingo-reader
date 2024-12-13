<script setup lang='ts'>
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue"
import { useBookStore } from "../../../store"
import { useDomSize, withPx } from "../../../utils"
import Resizer from "../../Resizer/Resizer.vue"
import { Config, generateAdjusterConfig, generateSelectionConfig } from "../sharedLogic"

const emits = defineEmits<{
  (e: 'infoDown'): void
  (event: 'receiveConfig', configList: Config[]): void
}>()
const fontFamily = ref<string>(`'Lucida Console', Courier, monospace`)
const fontSize = ref<number>(16)
const letterSpacing = ref<number>(0)
const lineHeight = ref<number>(2)
const configList: Config[] = [
  generateSelectionConfig(
    'fontFamily',
    [
      { name: `'Lucida Console', Courier, monospace` },
      { name: `'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif` },
    ],
    fontFamily
  ),
  generateAdjusterConfig('fontSize', 50, 5, 1, fontSize),
  generateAdjusterConfig('letterSpacing', 10, 0, 0.5, letterSpacing),
  generateAdjusterConfig('lineHeight', 10, 0, 0.1, lineHeight),
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
const paddingLeft = ref<number>(300)
const paddingRight = ref<number>(300)
const isDragging = ref<boolean>(false)

let startX = 0
let dragType = ''
const barDrag = (type: string, e: MouseEvent) => {
  emits('infoDown')
  startX = e.clientX
  dragType = type
  isDragging.value = true
}
const onMouseMove = (e: MouseEvent) => {
  const delta = e.clientX - startX
  const maxPadding = containerWidth.value - 400

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
  <div @click="containerClick"
    :style="{ paddingLeft: withPx(paddingLeft), paddingRight: withPx(paddingRight) }"
    :class="{ 'user-select-none': isDragging }" class="article-container" ref='containerRef'>
    <button @click.stop="nextChapter" :style="{ left: withPx(containerWidth - paddingRight) }" class="button">
      next chapter
    </button>
    <button @click.stop="prevChapter" :style="{ right: withPx(containerWidth - paddingLeft) }" class="button">
      previous chapter
    </button>
    <!-- book text -->
    <Resizer @mousedown="(e) => barDrag('left', e)" @mousemove="onMouseMove" @mouseup="onMouseUp"></Resizer>

    <article :style="{ fontFamily, lineHeight, fontSize: withPx(fontSize), letterSpacing: withPx(letterSpacing) }"
      v-html="currentChapterHTML" class="article-text">
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

.article-text :deep(img) {
  /* display: block; */
  /* margin: auto; */
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
