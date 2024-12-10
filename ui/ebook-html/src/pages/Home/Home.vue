<script setup lang="ts">
import FileSelect from '../../components/FileSelect/FileSelect.vue'
import { useRouter } from 'vue-router'
import { useBookStore } from '../../store'
const router = useRouter()
const bookStore = useBookStore()

const processFile = async (file: File) => {
  await bookStore.initBook(file)
  router.push('/book')
}

</script>

<template>
  <header class="header">
    home
  </header>
  <section class="section">
    <FileSelect @file-change="processFile"></FileSelect>
  </section>
</template>

<style scoped>
.header {
  height: 64px;
  /* border-bottom: 1px solid #ccc; */
}

.section {
  height: calc(100vh - 64px);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>