<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Config } from '../../../components/Readers/sharedLogic'
import DropDown from '../../../components/DropDown'
import ValueAdjuster from '../../../components/ValueAdjuster/ValueAdjuster.vue'
import { useClickOutside } from '../../../utils'

defineProps<{
  config: Config[]
}>()

/**
 * i18n
 */
const { t } = useI18n()

const showConfigPannel = ref<boolean>(false)
function tooglePannelShow() {
  showConfigPannel.value = !showConfigPannel.value
}

const configArea = useTemplateRef('configArea')
useClickOutside(configArea, () => {
  showConfigPannel.value = false
})
</script>

<template>
  <div ref="configArea" class="config" @click.stop="tooglePannelShow">
    <span class="tag"><img src="/config.svg" alt="config tag"></span>
    <div v-show="showConfigPannel" class="config-pannel" @wheel.stop.passive>
      <div v-if="!config.length" class="pannel-item" @click.stop>
        There is no configuration items provided by this reading mode.
      </div>
      <div v-for="item in config" :key="item.name" class="pannel-item" @click.stop>
        <!-- @vue-expect-error item.value is a ref, it can be handled by vue -->
        <DropDown
          v-if="item.type === 'selection'" v-model:current-mode-name="item.value"
          :label="t(item.name)" :modes="item.selectOptions" :label-width="150"
        />
        <!-- @vue-expect-error item.value is a ref, it can be handled by vue -->
        <ValueAdjuster
          v-else-if="item.type === 'adjuster'" v-model="item.value"
          :label="t(item.name)" :max="item.max" :min="item.min" :delta="item.delta" :label-width="150"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.config {
  flex: 0;
  margin-left: 2rem;
  position: relative;
  height: 37px;
  display: flex;
  align-items: center;
}

.config .tag {
  cursor: pointer;
  width: 25px;
  height: 25px;
}

.config-pannel {
  position: absolute;
  top: 100%;
  left: 0;
  width: 400px;
  max-height: 75vh;
  overflow-y: auto;
  background-color: #fefefe;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-wrap: wrap;
}

.pannel-item {
  flex: 1 1 400px;
  padding: 10px;
}
</style>
