<script setup>
import { ref, inject, computed } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  rows: { type: Number, default: 6 },
})

const emit = defineEmits(['update:modelValue'])
const isDark = inject('isDark')
const textarea = ref(null)
const previewing = ref(false)

const renderedPreview = computed(() => {
  if (!props.modelValue) return ''
  return sanitize(marked.parse(props.modelValue))
})

function sanitize(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
}

function wrap(before, after, defaultText) {
  const el = textarea.value
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const val = props.modelValue
  const selected = val.substring(start, end) || defaultText || ''
  const newVal = val.substring(0, start) + before + selected + after + val.substring(end)
  emit('update:modelValue', newVal)
  const cursorPos = start + before.length + selected.length + after.length
  requestAnimationFrame(() => {
    el.focus()
    el.setSelectionRange(cursorPos, cursorPos)
  })
}

function prefixLines(prefix, defaultText) {
  const el = textarea.value
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const val = props.modelValue
  const selected = val.substring(start, end) || defaultText || ''
  const prefixed = selected.split('\n').map(line => prefix + line).join('\n')
  const newVal = val.substring(0, start) + prefixed + val.substring(end)
  emit('update:modelValue', newVal)
  requestAnimationFrame(() => {
    el.focus()
  })
}

function insertBold() { wrap('**', '**', 'bold text') }
function insertItalic() { wrap('*', '*', 'italic text') }
function insertCode() { wrap('`', '`', 'code') }
function insertCodeBlock() { wrap('```\n', '\n```', 'code block') }
function insertLink() {
  const url = prompt('Enter URL:')
  if (url) {
    const el = textarea.value
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = props.modelValue.substring(start, end) || 'link text'
    wrap('[', `](${url})`, selected)
  }
}
function insertQuote() { prefixLines('> ', 'quote') }
function insertUL() { prefixLines('- ', 'item') }
function insertOL() { prefixLines('1. ', 'item') }
function insertHR() {
  const val = props.modelValue
  const el = textarea.value
  const pos = el ? el.selectionStart : val.length
  const newVal = val.substring(0, pos) + '\n---\n' + val.substring(pos)
  emit('update:modelValue', newVal)
}

const buttons = [
  { label: 'B', title: 'Bold', action: insertBold, classes: 'font-bold' },
  { label: 'I', title: 'Italic', action: insertItalic, classes: 'italic' },
  { label: '<>', title: 'Inline Code', action: insertCode, classes: 'font-mono text-xs' },
  { label: '{}', title: 'Code Block', action: insertCodeBlock, classes: 'font-mono text-xs' },
  { icon: 'fa-solid fa-link', title: 'Link', action: insertLink },
  { icon: 'fa-solid fa-quote-right', title: 'Quote', action: insertQuote },
  { icon: 'fa-solid fa-list-ul', title: 'Unordered List', action: insertUL },
  { icon: 'fa-solid fa-list-ol', title: 'Ordered List', action: insertOL },
  { label: '---', title: 'Horizontal Rule', action: insertHR, classes: 'text-xs' },
]
</script>

<template>
  <div>
    <!-- Toolbar -->
    <div
      class="flex items-center gap-1 px-2 py-1.5 rounded-t-lg border border-b-0 flex-wrap"
      :class="isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'"
    >
      <button
        v-for="btn in buttons"
        :key="btn.title"
        type="button"
        @click="btn.action"
        :title="btn.title"
        class="w-8 h-8 flex items-center justify-center rounded transition-colors text-sm"
        :class="isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'"
      >
        <i v-if="btn.icon" :class="btn.icon"></i>
        <span v-else :class="btn.classes">{{ btn.label }}</span>
      </button>

      <div class="flex-1" />

      <button
        type="button"
        @click="previewing = !previewing"
        :title="previewing ? 'Edit' : 'Preview'"
        class="px-2.5 h-8 flex items-center gap-1.5 rounded text-xs font-medium transition-colors"
        :class="previewing
          ? 'bg-purple-accent/15 text-purple-accent'
          : isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'"
      >
        <i :class="previewing ? 'fa-solid fa-pen' : 'fa-solid fa-eye'"></i>
        {{ previewing ? 'Edit' : 'Preview' }}
      </button>
    </div>

    <!-- Editor / Preview -->
    <div v-if="!previewing">
      <textarea
        ref="textarea"
        :value="modelValue"
        @input="emit('update:modelValue', $event.target.value)"
        :rows="rows"
        :placeholder="placeholder"
        class="w-full px-4 py-3 rounded-b-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent resize-y"
        :class="isDark ? 'bg-gray-800 text-white border-gray-700 placeholder-gray-500' : 'bg-white text-gray-900 border-gray-200 placeholder-gray-400'"
      />
    </div>
    <div
      v-else
      class="px-4 py-3 rounded-b-lg border text-sm overflow-auto"
      :class="isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'"
      :style="{ minHeight: (rows * 1.5) + 'rem' }"
    >
      <div
        v-if="renderedPreview"
        class="markdown-preview prose max-w-none"
        v-html="renderedPreview"
      />
      <p v-else class="italic" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Nothing to preview</p>
    </div>
  </div>
</template>

<style scoped>
.markdown-preview :deep(h1) { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
.markdown-preview :deep(h2) { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
.markdown-preview :deep(h3) { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; }
.markdown-preview :deep(p) { margin-bottom: 0.75rem; }
.markdown-preview :deep(strong) { font-weight: 700; }
.markdown-preview :deep(em) { font-style: italic; }
.markdown-preview :deep(code) {
  background: var(--bg-card, #1f2937);
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  font-family: ui-monospace, monospace;
  font-size: 0.85em;
}
.markdown-preview :deep(pre) {
  background: var(--bg-page, #030712);
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 0.75rem;
}
.markdown-preview :deep(pre code) {
  background: none;
  padding: 0;
}
.markdown-preview :deep(blockquote) {
  border-left: 3px solid #7c3aed;
  padding-left: 1rem;
  margin: 0.75rem 0;
  opacity: 0.85;
}
.markdown-preview :deep(a) {
  color: #7c3aed;
  text-decoration: underline;
}
.markdown-preview :deep(ul) { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.75rem; }
.markdown-preview :deep(ol) { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.75rem; }
.markdown-preview :deep(li) { margin-bottom: 0.25rem; }
.markdown-preview :deep(hr) { border-color: #374151; margin: 1rem 0; }
</style>
