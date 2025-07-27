<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

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

// select file
const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target && target.files) {
    const file = target.files[0]
    processFile(file)
  }
}

// container drag and drop
const isDragging = ref(false)
const handleDragEnter = () => {
  isDragging.value = true
}
const handleDragOver = () => {
  isDragging.value = true
}
const handleDragLeave = () => {
  isDragging.value = false
}
const handleDrop = (e: DragEvent) => {
  isDragging.value = false

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

    <!-- file select -->
    <div class="get-file-content">
      <!-- file select button -->
      <label v-show="!isDragging" for="fileInput" class="file-input-label">{{ t("selectFile") }}</label>
      <!-- hidden file input -->
      <input @change="handleFileChange" type="file" id="fileInput" class="file-input" accept=".epub,.mobi,.kf8,.azw3,.fb2">
    </div>

    <!-- file support -->
    <span v-show="!isDragging" class="info">
      {{ t('supportedFileTypsPrefix') }}
      <b>.epub</b> <b>.mobi</b> <b>.azw3(.kf8)</b> <b>.fb2</b>
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

.get-file-content {
  display: flex;
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
  pointer-events: none;
}
</style>