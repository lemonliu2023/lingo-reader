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
    <span class="logo">BlingGo Reader</span>
  </header>
  <section class="section">
    <FileSelect @file-change="processFile"></FileSelect>
  </section>
</template>

<style scoped>
.header {
  height: 64px;
  line-height: 64px;
  padding-left: 20px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
}

.logo {
  font-family: Verdana, Geneva, Tahoma, sans-serif;
  font-size: 2rem;
  font-weight: 600;
  color: #4CAF4F;
  letter-spacing: 0.05em;
  text-shadow: 1px -2px 2px rgba(0, 0, 0, 0.1);
}

.section {
  height: calc(100vh - 64px);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>