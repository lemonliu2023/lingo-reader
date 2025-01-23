<script setup lang="ts">
import { ref, defineAsyncComponent, useTemplateRef } from "vue"
import { useBookStore } from "../../store"
import { useRouter } from "vue-router"
import { flatToc, ReaderType } from "./Book"
import DropDown from "../../components/DropDown"
import { Config } from "../../components/Readers/sharedLogic"
import ConfigPannel from "./components/ConfigPannel.vue"
import { useClickOutside, withPx } from "../../utils"

const ColumnReader = defineAsyncComponent(
  () => import('../../components/Readers/ColumnReader/ColumnReader.vue')
)
const ScrollReader = defineAsyncComponent(
  () => import('../../components/Readers/ScrollReader/ScrollReader.vue')
)
const ScrollWithNote = defineAsyncComponent(
  () => import('../../components/Readers/ScrollWithNote/ScrollWithNote.vue')
)

const router = useRouter()
const bookStore = useBookStore()

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
const infoBarToggle = (e: Event) => {
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
const infoBarDown = () => {
  isInfoDown.value = false
}

/**
 * reader switch
 */
const readerModes = [
  { name: ReaderType.COLUMN, logo: "column.svg" },
  { name: ReaderType.SCROLL, logo: "scroll.svg" },
  { name: ReaderType.SCROLL_WITH_NOTE, logo: "scrollWithNote.svg" },
]
const modeName = ref<string>(ReaderType.COLUMN)

/**
 * receive config
 */
const receiveConfig = (configs: Config[]): void => {
  currentConfig.value = configs
}
const currentConfig = ref<Config[]>([])

/**
 * book toc
 */
const toc = flatToc(bookStore.getToc()!)
const showToc = ref<boolean>(false)
const showTocToggle = () => {
  showToc.value = !showToc.value
}
const tocUiContent = useTemplateRef<HTMLElement>('tocUiContent')
useClickOutside(tocUiContent, () => {
  showToc.value = false
})

</script>

<template>
  <!-- 
   info bar
   -->
  <div :class="{ 'top0': isInfoDown, 'topN80': !isInfoDown }" class="top-info-bar">
    <!-- 
      info bar left
     -->
    <div class="top-info-bar-left">
      <!-- back button -->
      <div class="back" @click="back">
        <img src="/leftArrow.svg" alt="leftArrow">
        <span>Back</span>
      </div>
      <DropDown class="bar-left-dropdown" :modes="readerModes" v-model:current-mode-name="modeName"></DropDown>
      <!-- configPanel -->
      <ConfigPannel :config="currentConfig"></ConfigPannel>
    </div>
    <!-- 
      info bar middle
     -->
    <div :title="bookStore.getFileName()" class="top-info-bar-middle text-ellipses">
      {{ bookStore.getFileName() }}
    </div>
    <!-- 
      info bar right
     -->
    <div class="top-info-bar-right">
      <!-- toc -->
      <div ref="tocUiContent" @click="showTocToggle" class="toc-tag">
        <img src="/toc.svg" alt="toc">
        <span>table of contents</span>
      </div>
      <div :class="{'hide-toc': !showToc, }" @wheel.stop class="toc">
        <ul>
          <li v-for="item in toc" :key="item.label" :style="{ paddingLeft: withPx(20 + item.level * 20) }">
            <span>{{ item.label }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <!--
    Reader show
   -->
  <div @mousedown="handleMouseDown" @click="infoBarToggle">
    <ColumnReader v-if="modeName === ReaderType.COLUMN" @receive-config="receiveConfig" @info-down="infoBarDown">
    </ColumnReader>
    <ScrollReader v-else-if="modeName === ReaderType.SCROLL" @receive-config="receiveConfig" @info-down="infoBarDown">
    </ScrollReader>
    <ScrollWithNote v-else-if="modeName === ReaderType.SCROLL_WITH_NOTE" @receive-config="receiveConfig"
      @info-down="infoBarDown">
    </ScrollWithNote>
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
  z-index: 1;
  display: flex;
  transition: top 0.2s;
}

.top-info-bar>div {
  background-color: #f0f0f0;
}

.top-info-bar-left {
  flex: 1;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-left: 20px;
}

.top-info-bar-left .back {
  margin: 0 10px;
  padding: 5px 10px 10px;
  font-size: 10px;
  text-align: center;
  color: #666;
  cursor: pointer;
  width: 25px;
}

.top-info-bar-left .back img {
  width: 25px;
  height: 25px;
}

.top-info-bar-left .bar-left-dropdown {
  flex: 1;
}

.top-info-bar-middle {
  flex: 1;
  text-align: center;
  padding: 30px;
  font-weight: 400;
}

/*
  * info bar right
*/
.top-info-bar-right {
  flex: 1;
  display: flex;
  align-items: center;
}

/* tag */
.top-info-bar-right .toc-tag {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.top-info-bar-right .toc-tag img {
  width: 25px;
  height: 25px;
}

.top-info-bar-right .toc-tag {
  font-size: 10px;
  color: #666;
  cursor: pointer;
}

/* content */
.toc {
  position: fixed;
  top: 80px;
  right: 0;
  width: 400px;
  height: calc(100% - 80px);
  background-color: #f0f0f0;
  overflow-y: scroll;
  transition: right 0.1s;
}

.hide-toc {
  right: -400px;
}

.toc ul {
  border-left: 1px solid #f0f0f0;
  font-size: 14px;
}

.toc li {
  padding: 10px 5px;
  cursor: pointer;
}

.toc li:hover {
  background-color: #e5e5e5;
}
</style>
