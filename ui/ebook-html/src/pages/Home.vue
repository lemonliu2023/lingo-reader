<script setup lang="ts">
import FileSelect from '../components/FileSelect.vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const processFile = (file: File) => {
  router.push('/book')
  console.log(file)
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