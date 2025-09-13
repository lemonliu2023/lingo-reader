<script setup lang="ts">
import { ref, watch } from 'vue'
import { toFixedOne, withPx } from '../../utils'
import type { Props } from './ValueAdjuster'

const props = withDefaults(defineProps<Partial<Props>>(), {
  delta: 1,
  min: 0,
  max: Infinity,
  modelValue: 0,
})

const emits = defineEmits<{
  (event: 'update:modelValue', value: number): void
}>()

const inputValue = ref<number>(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  inputValue.value = newVal
})

function increase() {
  if (inputValue.value <= props.max - props.delta) {
    inputValue.value = toFixedOne(inputValue.value + props.delta)
    emits('update:modelValue', inputValue.value)
  }
}
function decrease() {
  if (inputValue.value >= props.min + props.delta) {
    inputValue.value = toFixedOne(inputValue.value - props.delta)
    emits('update:modelValue', inputValue.value)
  }
}
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    (e.target as HTMLInputElement).blur()
  }
}
function handleChange(e: Event) {
  const valueStr = (e.target as HTMLInputElement).value
  if (valueStr.length === 0) {
    // when value in <input> is 0, then press Backspace key and Enter key,
    //  the content in <input> is '', but not '0'. So we could first
    //  change inputValue to 1 and afterwards change inputValue to 0 to
    //  trigger a view update.
    inputValue.value = 1
    inputValue.value = 0
    return
  }
  const value = toFixedOne(Number.parseFloat(valueStr))
  inputValue.value = Math.max(props.min, Math.min(props.max, value))
  emits('update:modelValue', inputValue.value)
}
</script>

<template>
  <div class="value-adjuster">
    <span v-if="label" :style="{ width: labelWidth && withPx(labelWidth) }" class="label">{{ `${label}:` }}</span>
    <button class="adjust-btn" @click.stop="decrease">
      -
    </button>
    <input
      :value="inputValue" type="number" class="value-display" @wheel.prevent @change="handleChange"
      @keydown.stop="handleKeyDown"
    >
    <button class="adjust-btn" @click.stop="increase">
      +
    </button>
  </div>
</template>

<style scoped>
.value-adjuster {
  display: flex;
  align-items: center;
  /* border-radius: 5px; */
}

.label {
  font-size: 12px;
  font-family: sans-serif;
  margin-right: 5px;
  text-align: center;
}

.adjust-btn {
  width: 40px;
  height: 37px;
  background-color: #fefefe;
  border: none;
  outline: none;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.adjust-btn:hover {
  background-color: #e0e0e0;
}

.value-display {
  flex: 1;
  /* if not set width to 0, the content html will exceed its parent element area
  when the element width is large enough */
  width: 0;
  height: 35px;
  border: none;
  outline: none;
  text-align: center;
}
</style>
