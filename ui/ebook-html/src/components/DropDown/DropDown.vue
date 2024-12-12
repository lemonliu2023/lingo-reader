<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue"
import { withPx } from "../../utils"

// Reading mode interface
export interface Mode {
  name: string
  logo?: string
}

defineProps<{
  modes: Mode[]
  currentMode: Mode
  label?: string
  labelWidth?: number
}>()

const emits = defineEmits<{
  (e: 'update:currentMode', val: Mode): void
}>()

// Select the mode and close the menu
const selectMode = (mode: Mode) => {
  emits('update:currentMode', mode)
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
    <span v-if="label" :style="{width: labelWidth && withPx(labelWidth)}" class="label">{{ label + ':' }}</span>
    <!-- The current mode display area -->
    <div class="dropdown" @click="toggleDropdown">
      <img v-if="currentMode.logo" :src="currentMode.logo" :alt="currentMode.name + ' Mode'" class="mode-logo" />
      <span>{{ currentMode.name }}</span>
      <i class="arrow" :class="{ open: isDropdownOpen }"></i>
    </div>
    <!-- drop down menu -->
    <ul v-show="isDropdownOpen" class="dropdown-menu">
      <li v-for="mode in modes" :key="mode.name" class="dropdown-item" @click="selectMode(mode)">
        <img v-if="mode.logo" :src="mode.logo" :alt="mode.name + ' Mode'" class="mode-logo" />
        <span>{{ mode.name }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.reading-mode-selector {
  position: relative;
  display: flex;
  align-items: center;
  height: 37px;
}

.label {
  flex-shrink: 0;
  font-size: 12px;
  font-family: sans-serif;
  margin-right: 5px;
}

.dropdown {
  cursor: pointer;
  border-radius: 4px;
  padding: 8px;
  background: #fefefe;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  
}

.mode-logo {
  width: 20px;
  height: 20px;
}

.dropdown span {
  flex: 1;
  /* if not set width to 0, the ellipsis will invalidated */
  width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* arrow */
.arrow {
  border: solid black;
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding: 3px;
  transform: translateX(-3px) rotate(45deg);
  transition: transform 0.2s ease;
}

.arrow.open {
  transform: rotate(-135deg) translate(-3px, -3px);
}

/* menu */
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
