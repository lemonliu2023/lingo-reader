<script setup lang="ts">
import { ref, defineAsyncComponent, Ref, reactive, watch, useTemplateRef, onMounted, onUnmounted, onBeforeUnmount } from "vue"
import { useBookStore } from "../../store"
import { useRouter } from "vue-router"
import { ReaderType } from "./Book"
import DropDown from "../../components/DropDown"
import { Config } from "../../components/Readers/sharedLogic"
import ValueAdjuster from "../../components/ValueAdjuster/ValueAdjuster.vue"
import ConfigPannel from "./components/ConfigPannel.vue"

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
const currentMode = ref(readerModes[0])

/**
 * receive config
 */
const receiveConfig = (configs: Config[]): void => {
  currentConfig.value = configs
}
const currentConfig = ref<Config[]>([])
const showConfigPannel = ref<boolean>(false)
const tooglePannelShow = () => {
  showConfigPannel.value = !showConfigPannel.value
}
const configArea = useTemplateRef('configArea')
const hiddenIfClickOutside = (e: MouseEvent) => {
  e.stopPropagation()
  if (!configArea.value!.contains(e.target as Node)) {
    showConfigPannel.value = false
  }
}
onMounted(() => {
  document.addEventListener('click', hiddenIfClickOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', hiddenIfClickOutside)
})
</script>

<template>
  <div :class="{ 'top0': isInfoDown, 'topN80': !isInfoDown }" class="top-info-bar">
    <div class="top-info-bar-left">
      <!-- back button -->
      <span class="back" @click="back"><img src="/leftArrow.svg" alt="leftArrow">Back</span>
      <DropDown class="bar-left-dropdown" :modes="readerModes" v-model:current-mode="currentMode"></DropDown>

      <div @click.stop="tooglePannelShow" class="config" ref="configArea" >
        <span class="tag"><img src="/config.svg" alt="config tag"></span>
        <div v-show="showConfigPannel" class="config-pannel">
          <div @click.stop v-for="item in currentConfig" class="pannel-item">
            <DropDown v-if="item.type === 'selection'" :key="item.name + '-selection'" :label="item.name"
              :modes="item.selectOptions" v-model:current-mode="item.selected" :label-width="120"></DropDown>
            <ValueAdjuster v-else-if="item.type === 'adjuster'" :key="item.name + '-adjuster'" :label="item.name"
              :max="item.max" :min="item.min" :delta="item.delta" v-model="item.value" :label-width="120">
            </ValueAdjuster>
          </div>
        </div>
      </div>

      <!-- <ConfigPannel :config="currentConfig"></ConfigPannel> -->
    </div>
    <div class="top-info-bar-middle">
      {{ bookStore.getFileName() }}
    </div>
    <div class="top-info-bar-right">
    </div>
  </div>
  <div @mousedown="handleMouseDown" @click="infoBarToggle">
    <ColumnReader v-if="currentMode.name === ReaderType.COLUMN" @receive-config="receiveConfig"
      @info-down="infoBarDown">
    </ColumnReader>
    <ScrollReader v-else-if="currentMode.name === ReaderType.SCROLL" @info-down="infoBarDown"></ScrollReader>
    <ScrollWithNote v-else-if="currentMode.name === ReaderType.SCROLL_WITH_NOTE" @info-down="infoBarDown">
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

.top-info-bar > div {
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
  padding: 5px 10px;
  font-size: 10px;
  text-align: center;
  color: #666;
  cursor: pointer;
  width: 25px;
  height: 25px;
}

.top-info-bar-left .back img {
  display: block;
  width: 25px;
  height: 25px;
}



.top-info-bar-left .bar-left-dropdown {
  flex: 1;
}

.top-info-bar-left .config {
  flex: 0;
  margin-left: 2rem;
  position: relative;
  height: 37px;
  display: flex;
  align-items: center;
}

.top-info-bar-left .config div {
  flex: 1;
}

.top-info-bar-left .config .tag {
  cursor: pointer;
  width: 25px;
  height: 25px;
}

.top-info-bar-left .config-pannel {
  position: absolute;
  top: 100%;
  left: 0;
  width: 400px;
  background-color: #fefefe;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-wrap: wrap;
}

.top-info-bar-left .pannel-item {
  padding: 10px;
}

.top-info-bar-middle {
  flex: 1;
  text-align: center;
  padding-top: 21px;
  font-weight: 400;
}

.top-info-bar-right {
  flex: 1;
}
</style>
