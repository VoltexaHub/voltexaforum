<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { getContentPage } from '../services/api'

const isDark = inject('isDark')
const content = ref('')
const loading = ref(true)

function sanitize(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
}

const renderedContent = computed(() => {
  if (!content.value) return ''
  return sanitize(marked.parse(content.value))
})

onMounted(async () => {
  try {
    const res = await getContentPage('rules')
    content.value = res.data.data?.content || ''
  } catch {}
  loading.value = false
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
    <h1 class="text-2xl font-bold mb-6" :class="isDark ? 'text-white' : 'text-gray-900'">Rules</h1>
    <div class="rounded-xl p-8" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
      <div v-if="loading" class="animate-pulse space-y-3">
        <div class="h-4 rounded w-3/4" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
        <div class="h-4 rounded w-1/2" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
        <div class="h-4 rounded w-5/6" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
      </div>
      <div v-else-if="content" v-html="renderedContent" class="markdown-body" :class="isDark ? 'text-gray-300' : 'text-gray-700'" />
      <div v-else class="text-center py-12" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
        No rules have been set yet.
      </div>
    </div>
  </div>
</template>
