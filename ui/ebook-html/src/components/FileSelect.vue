<script setup lang="ts">
import { ref } from 'vue'

const { width, height } = defineProps<{
  width?: number
  height?: number
}>()

const emits = defineEmits<{
  fileChange: [file: File]
}>()

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
    <!-- 拖拽图层 -->
    <div v-show="isDragging" class="drag-overlay">
      <p>释放文件以进行上传</p>
    </div>
    <!-- 文件选择按钮 -->
    <label v-show="showSelectFileButton" for="fileInput" class="file-input-label">选择文件</label>
    <!-- 隐藏的文件输入 -->
    <input @change="handleFileChange" type="file" id="fileInput" class="file-input" accept=".epub">
  </div>
</template>

<style scoped>
/* 主容器样式 */
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

/* 文件选择按钮样式 */
.file-input-label {
  padding: 10px 20px;
  background-color: #4caf4f;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 15px;
}

/* 隐藏实际文件输入 */
.file-input {
  display: none;
  pointer-events: none;
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
</style>