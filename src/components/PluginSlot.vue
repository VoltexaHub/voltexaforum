<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { pluginRegistry } from '../plugins/registry'

const props = defineProps({
  name: { type: String, required: true },
  context: { type: Object, default: () => ({}) }
})

const slotComponents = computed(() => {
  return (pluginRegistry.slots[props.name] || []).map(entry => ({
    component: defineAsyncComponent(entry.component),
    props: entry.props || {}
  }))
})
</script>

<template>
  <template v-for="(slot, i) in slotComponents" :key="i">
    <component :is="slot.component" v-bind="{ ...slot.props, ...context }" />
  </template>
</template>
