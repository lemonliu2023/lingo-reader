<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue"

// Reading mode interface
interface ReadingMode {
  name: string
  logo: string
}

const props = defineProps<{
  readerModes: ReadingMode[]
}>()

const modeIndex = defineModel('currentModeIndex', {
  type: Number,
  default: 0
})

const currentMode = ref<ReadingMode>(props.readerModes[modeIndex.value])

// Select the mode and close the menu
const selectMode = (mode: ReadingMode) => {
  currentMode.value = mode
  modeIndex.value = props.readerModes.indexOf(currentMode.value)
  isDropdownOpen.value = false
}

// Toggle the drop-down menu display
const isDropdownOpen = ref(false)
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

// close drop-down menu when clicking outside
const dropdownRef = useTemplateRef('dropdownRef')
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(<Node>event.target)) {
    isDropdownOpen.value = false;
  }
}
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div class="reading-mode-selector" ref="dropdownRef">
    <!-- The current mode display area -->
    <div class="dropdown" @click="toggleDropdown">
      <div class="current-mode">
        <img :src="currentMode.logo" :alt="currentMode.name + ' Mode'" class="mode-logo" />
        <span>{{ currentMode.name }}</span>
        <i class="arrow" :class="{ open: isDropdownOpen }"></i>
      </div>
    </div>
    <!-- drop down menu -->
    <ul v-show="isDropdownOpen" class="dropdown-menu">
      <li v-for="mode in readerModes" :key="mode.name" class="dropdown-item" @click="selectMode(mode)">
        <img :src="mode.logo" :alt="currentMode.name + ' Mode'" class="mode-logo" />
        <span>{{ mode.name }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.reading-mode-selector {
  position: relative;
}

.dropdown {
  cursor: pointer;
  border-radius: 4px;
  padding: 8px;
  background: #fefefe;
}

.current-mode {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mode-logo {
  width: 20px;
  height: 20px;
}

/* arrow */
.arrow {
  border: solid black;
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding: 3px;
  transform: rotate(45deg);
  transition: transform 0.2s ease;
}

.arrow.open {
  transform: rotate(-135deg) translate(-3px, -3px);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  border-radius: 4px;
  background: #fefefe;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 6px;
  padding: 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background: #f0f0f0;
}
</style>
