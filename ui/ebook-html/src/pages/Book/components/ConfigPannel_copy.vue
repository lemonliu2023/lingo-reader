<script setup lang="ts">
import { ref, useTemplateRef, onMounted, onBeforeUnmount } from 'vue'
import { Config } from '../../../components/Readers/sharedLogic'
import DropDown from '../../../components/DropDown/DropDown.vue'
import ValueAdjuster from '../../../components/ValueAdjuster/ValueAdjuster.vue'

const props = defineProps<{
  config: Config[]
}>()
console.log(props.config)
const showConfigPannel = ref<boolean>(false)
const tooglePannelShow = () => {
  showConfigPannel.value = !showConfigPannel.value
}
const configArea = useTemplateRef('configArea')
const hiddenIfClickOutside = (e: MouseEvent) => {
  e.stopPropagation()
  if (!configArea.value!.contains(e.target as Node)) {
    showConfigPannel.value = false
  }
}
onMounted(() => {
  document.addEventListener('click', hiddenIfClickOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', hiddenIfClickOutside)
})
</script>

<template>
  <div @click.stop="tooglePannelShow" class="config" ref="configArea">
    <span class="tag"><img src="/config.svg" alt="config tag"></span>
    <div v-show="showConfigPannel" class="config-pannel">
      <div @click.stop v-for="item in config" class="pannel-item">
        <DropDown v-if="item.type === 'selection'" :key="item.name + '-selection'" :label="item.name"
          :modes="item.selectOptions" v-model:current-mode="item.selected" :label-width="120"></DropDown>
        <ValueAdjuster v-else-if="item.type === 'adjuster'" :key="item.name + '-adjuster'" :label="item.name"
          :max="item.max" :min="item.min" :delta="item.delta" v-model="item.value" :label-width="120">
        </ValueAdjuster>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config {
  flex-shrink: 0;
  margin-left: 2rem;
  position: relative;
  height: 37px;
  display: flex;
  align-items: center;
}

.config .tag {
  cursor: pointer;
}

.config-pannel {
  position: absolute;
  top: 100%;
  left: 0;
  width: 400px;
  background-color: #fefefe;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-wrap: wrap;
}

.pannel-item {
  padding: 10px;
}
</style>
