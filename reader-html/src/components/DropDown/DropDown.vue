<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useClickOutside, withPx } from '../../utils'

// Reading mode interface
export interface Mode {
  name: string
  logo?: string
}

const props = defineProps<{
  modes: Mode[]
  currentModeName: string
  label?: string
  labelWidth?: number
}>()
const emits = defineEmits<{
  (e: 'update:currentModeName', val: string): void
}>()

const currentMode = ref<Mode>(
  props.modes.find(val => val.name === props.currentModeName)
  ?? props.modes[0],
)

// Toggle the drop-down menu display
const isDropdownOpen = ref(false)

// Select the mode and close the menu
function selectMode(mode: Mode) {
  emits('update:currentModeName', mode.name)
  currentMode.value = mode
  isDropdownOpen.value = false
}

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value
}

// close drop-down menu when clicking outside
const dropdownRef = useTemplateRef('dropdownRef')
useClickOutside(dropdownRef, () => {
  isDropdownOpen.value = false
})
</script>

<template>
  <div ref="dropdownRef" class="reading-mode-selector">
    <span v-if="label" :style="{ width: labelWidth && withPx(labelWidth) }" class="label">{{ `${label}:` }}</span>
    <!-- The current mode display area -->
    <div class="dropdown" @click="toggleDropdown">
      <img v-if="currentMode.logo" :src="currentMode.logo" :alt="`${currentMode.name} Mode`" class="mode-logo">
      <span class="text-ellipses">{{ currentMode.name }}</span>
      <i class="arrow" :class="{ open: isDropdownOpen }" />
    </div>
    <!-- drop down menu -->
    <ul v-show="isDropdownOpen" class="dropdown-menu">
      <li v-for="mode in modes" :key="mode.name" class="dropdown-item" @click="selectMode(mode)">
        <img v-if="mode.logo" :src="mode.logo" :alt="`${mode.name} Mode`" class="mode-logo">
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
  text-align: center;
}

.dropdown {
  flex: 1;
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
}

/* arrow */
.arrow {
  border: solid black;
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding: 3px;
  margin-right: 5px;
  transform: rotate(45deg);
  transition: transform 0.1s ease;
}

.arrow.open {
  transform: rotate(-135deg) ;
}

/* menu */
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
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
