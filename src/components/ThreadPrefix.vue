<template>
  <span v-if="prefix" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold mr-1.5"
    :style="{ background: prefix.bg_color, color: prefix.text_color, border: `1px solid ${prefix.color}40` }">
    {{ prefix.name }}
  </span>
</template>
<script setup>
defineProps({ prefix: Object })
</script>
