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
    <div class="left">
      <img class="logo" src="/logo.jpg" alt="logo">
      <span class="lingo-reader">lingo reader</span>
    </div>
    <div class="middle"></div>
    <div class="right">
      <a href="https://github.com/hhk-png/lingo-reader" target="_blank" class="github" title="GitHub"></a>
    </div>
  </header>
  <section class="section">
    <FileSelect @file-change="processFile"></FileSelect>
  </section>
</template>

<style scoped>
.header {
  height: 64px;
  line-height: 64px;
  display: flex;
}

.header .left {
  height: 100%;
  display: flex;
  flex: 1 1;
  padding-left: 5px;
}

.logo {
  display: inline-block;
  height: 100%;
}

/* logo font style */
@keyframes neonGlow {
  0% {
    text-shadow: 0 0 3px #00eaff, 0 0 8px #00eaff, 0 0 12px #00eaff;
  }

  50% {
    text-shadow: 0 0 5px #00ffea, 0 0 12px #00ffea, 0 0 18px #00ffea;
  }

  100% {
    text-shadow: 0 0 3px #00eaff, 0 0 8px #00eaff, 0 0 12px #00eaff;
  }
}

.lingo-reader {
  font-family: Comic Sans MS, sans-serif;
  font-size: 32px;
  font-weight: bold;
  color: #00eaff;
  text-transform: uppercase;
  letter-spacing: 3px;
  padding: 5px 10px;
  border-radius: 5px;
  animation: neonGlow 1.5s infinite alternate;
  display: inline-block;
}

.header .right {
  flex: 0.3 1;
  padding-top: 8px;
}

.github {
  display: inline-block;
  width: 50px;
  height: 50px;
  background: url('/public/github.svg') no-repeat center center;
  background-size: contain;
}

.section {
  height: calc(100vh - 64px);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>