<template>
  <div v-if="tags?.length" class="flex flex-wrap gap-1">
    <component :is="clickable ? 'router-link' : 'span'"
      v-for="tag in tags" :key="tag.id"
      :to="clickable ? `/tags/${tag.slug}` : undefined"
      class="text-xs px-2 py-0.5 rounded-full font-medium transition-colors"
      :class="isDark ? 'bg-gray-800 text-gray-400 hover:text-purple-accent hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:text-purple-accent hover:bg-gray-200'">
      #{{ tag.name }}
    </component>
  </div>
</template>
<script setup>
import { inject } from 'vue'
defineProps({ tags: Array, clickable: { type: Boolean, default: true } })
const isDark = inject('isDark')
</script>
