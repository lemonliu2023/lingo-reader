<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { streamDownload } from './FileSelect';

/**
 * i18n
 */
const { t } = useI18n()

const { width, height } = defineProps<{
  width?: number
  height?: number
}>()

const emits = defineEmits<{
  fileChange: [file: File]
}>()

/**
 * get file
 */
// process file, emit fileChange event
const processFile = (file: File) => {
  emits('fileChange', file)
}

// switch tag
const isShowSelectFile = ref(true)
const showSelectFile = () => {
  isShowSelectFile.value = true
}
const showUrlLoad = () => {
  isShowSelectFile.value = false
}

// select file
const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target && target.files) {
    const file = target.files[0]
    processFile(file)
  }
}

// url load
const fileUrl = ref<string>('')
const progressText = ref<string>('0%')
const progressBar = ref<number>(0)
const loadFileThroughtUrl = async () => {
  if (!fileUrl.value) {
    return
  }
  try {
    const file = await streamDownload(
      fileUrl.value,
      (p: string) => {
        progressText.value = p
        progressBar.value = parseFloat(p) * 100
      }
    )
    processFile(file)
  }
  catch (e) {
    console.log(e)
    progressText.value = 'Error'
    progressBar.value = 0
  }
}

// container drag and drop
const isDragging = ref(false)
const showSelectFileButton = ref(true)
const handleDragEnter = () => {
  isDragging.value = true
  showSelectFileButton.value = false
}
const handleDragOver = () => {
  isDragging.value = true
  showSelectFileButton.value = false
}
const handleDragLeave = () => {
  isDragging.value = false
  showSelectFileButton.value = true
}
const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  showSelectFileButton.value = true

  if (e.dataTransfer && e.dataTransfer.files) {
    const file = e.dataTransfer.files[0]
    processFile(file)
  }
}

</script>

<template>
  <div @dragenter.prevent="handleDragEnter" @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop" :style="{ width: width + 'rem', height: height + 'rem' }" class="file-upload-container">
    <!-- drag overlay -->
    <div v-show="isDragging" class="drag-overlay">
      <p>Release the file for parsing</p>
    </div>

    <!-- get file through input and url -->
    <div class="get-file-container">
      <div class="tabs">
        <span @click="showSelectFile" :class="{'active': isShowSelectFile}">{{ t('selectFile') }}</span>
        <span @click="showUrlLoad" :class="{'active': !isShowSelectFile}">{{ t('loadViaUrl') }}</span>
      </div>

      <!-- file select -->
      <div v-if="isShowSelectFile" class="get-file-content">
        <!-- file select button -->
        <label v-show="showSelectFileButton" for="fileInput" class="file-input-label">{{ t("selectFile") }}</label>
        <!-- hidden file input -->
        <input @change="handleFileChange" type="file" id="fileInput" class="file-input" accept=".epub,.mobi,.kf8,.kf8">
      </div>

      <!-- url load -->
      <div v-if="!isShowSelectFile" class="get-file-content">
        <div class="url-load-area">
          <input v-model="fileUrl" type="url" class="url-input" :placeholder="t('enterUrl')" />
          <button @click="loadFileThroughtUrl" class="url-load-btn">{{ t('loadUrlFile') }}</button>
        </div>
        <div class="progress">
          <span class="progress-text">{{ progressText }}</span>
          <div :style="{ width: `${progressBar}%` }" class="progress-bar"></div>
        </div>
      </div>
    </div>


    <!-- file support -->
    <span class="info">
      {{ t('supportedFileTypsPrefix') }}
      <b>.epub</b> <b>.mobi</b> <b>.azw3(.kf8)</b>
      {{ t('supportedFileTypsSuffix') }}
    </span>
  </div>
</template>

<style scoped>
/* main container */
.file-upload-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: 2px dashed #aaa;
  border-radius: 10px;
  width: 38rem;
  height: 32rem;
}

.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(76, 175, 80, 0.5);
  color: white;
  font-size: 18px;
  border-radius: 10px;
  z-index: 10;
  pointer-events: none;
}

.get-file-container {
  margin-bottom: 10px;
  width: 420px;
  height: 250px;
  display: flex;
  flex-direction: column;
}

.tabs {
  margin-bottom: 20px;
  display: flex;
}

.tabs span {
  display: block;
  text-align: center;
  flex: 1;
  padding: 12px;
  border: none;
  background-color: #f5f5f5;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  font-weight: 600;
  color: #333;
  transition: background-color 0.3s, box-shadow 0.3s, transform 0.3s;
}

.tabs span:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 12px rgba(255, 255, 255, 0.1);
}

.tabs span:active {
  transform: scale(0.95);
}

.tabs span.active {
  background-color: #f1f1f1;
}

.get-file-container .get-file-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.url-load-area {
  width: 75%;
}

.url-load-area .url-input {
  box-sizing: border-box;
  padding: 12px;
  width: 100%;
  line-height: 1.6;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.url-load-btn {
  padding: 12px 0;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  font-size: 16px;
  transition: background-color 0.2s, box-shadow 0.2s;
  margin-top: 15px;
}

.url-load-btn:hover {
  background-color: #45a049;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.progress {
  box-sizing: border-box;
  width: 100%;
  background-color: #f1f1f1;
  border-radius: 0 0 6px 6px;
  height: 46px;
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.progress-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  font-weight: 600;
}

.progress-bar {
  height: 100%;
  width: 50%;
  background-color: #4CAF50;
  opacity: 0.8;
  border-radius: 0 0 6px 6px;
}

/* file select button css */
.file-input-label {
  padding: 10px 20px;
  background-color: #4caf4f;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 10px;
}

.file-input {
  display: none;
  pointer-events: none;
}

.info {
  font-size: 12px;
  color: #aaa;
}
</style>