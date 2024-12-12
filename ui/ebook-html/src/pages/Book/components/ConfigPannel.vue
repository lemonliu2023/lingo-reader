<script setup lang="ts">
import { onMounted } from 'vue';
import { Config } from '../../../components/Readers/sharedLogic';

const props = defineProps<{
  config: Config[]
}>()
onMounted(() => {
  console.log(props.config)
})
console.log(props.config)

</script>

<template>
  <div class="config" ref="configArea">
    <span class="tag"><img src="/config.svg" alt="config tag"></span>
  </div>
</template>

<style scoped>
.config {
  /* margin-left: 2rem; */
  position: relative;
  height: 37px;
  display: flex;
  align-items: center;
}
.config .tag {
  display: block;
  width: 25px;
  height: 25px;
}
</style>
