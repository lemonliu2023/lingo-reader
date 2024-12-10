<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { Props } from './ValueAdjuster'

const props = withDefaults(defineProps<Partial<Props>>(), {
  delta: 1,
  min: 0,
  max: Infinity
})

const modelValue = defineModel('modelValue', {
  type: Number,
  default: 0
})
const increase = () => {
  if (modelValue.value <= props.max - props.delta) {
    modelValue.value += props.delta
  }
}
const decrease = () => {
  if (modelValue.value >= props.min + props.delta) {
    modelValue.value -= props.delta
  }
}
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    if ((e.target as HTMLInputElement).value.length === 0) {
      modelValue.value = props.min;
      (e.target as HTMLInputElement).value = props.min.toString()
    }
    (e.target as HTMLInputElement).blur()
    isFocus.value = false
  } else {
    return
  }
}
const handleInput = (e: Event) => {
  const valueStr = (e.target as HTMLInputElement).value
  if (valueStr.length === 0) {
    modelValue.value = 0
    nextTick(() => {
      (e.target as HTMLInputElement).value = ''
    })
    return
  }

  const value = valueStr.length ? parseInt(valueStr) : 0
  if (value < props.min) {
    modelValue.value = props.min
  } else if (value > props.max) {
    modelValue.value = Math.floor(value / 10);
    (e.target as HTMLInputElement).value = modelValue.value.toString()
  } else {
    modelValue.value = value
  }
}
const isFocus = ref<boolean>(false)
const handleFocus = () => {
  isFocus.value = true
}
const onOk = () => {
  isFocus.value = false
}
</script>

<template>
  <div class="value-adjuster">
    <button v-show="isFocus" class="adjust-btn" @click.stop="onOk">Yes</button>
    <button v-show="!isFocus" class="adjust-btn" @click.stop="decrease">-</button>
    <input @blur="onOk" @focus="handleFocus" v-model="modelValue" @input="handleInput" @keydown.stop @keydown="handleKeyDown" type="number"
      class="value-display" />
    <button v-show="isFocus" class="adjust-btn" @click.stop="onOk">Yes</button>
    <button v-show="!isFocus" class="adjust-btn" @click.stop="increase">+</button>
  </div>
</template>

<style scoped>
.value-adjuster {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.adjust-btn {
  width: 40px;
  height: 40px;
  background-color: #f5f5f5;
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
  height: 40px;
  border: none;
  outline: none;
  text-align: center;
  font-size: 1rem;
  padding: 0 5px;
}
</style>
