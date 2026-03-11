<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-bold text-white">Maintenance</h2>
      <p class="text-sm text-gray-500 mt-1">Rebuild counters, prune old data, and clear caches.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="tool in tools"
        :key="tool.slug"
        class="bg-gray-800 rounded-xl border border-gray-700/50 p-5"
      >
        <div class="flex items-center gap-3 mb-2">
          <div class="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
            <i :class="tool.icon"></i>
          </div>
          <h3 class="font-semibold text-white text-sm">{{ tool.title }}</h3>
        </div>
        <p class="text-sm text-gray-500 mb-4">{{ tool.desc }}</p>

        <!-- Days input for prune-audit-log -->
        <div v-if="tool.hasInput" class="flex items-center gap-2 mb-3">
          <span class="text-sm text-gray-400">Older than</span>
          <input
            v-model.number="auditDays"
            type="number"
            min="7"
            max="3650"
            class="w-20 px-2.5 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-sm text-gray-200 focus:outline-none focus:border-violet-500"
          />
          <span class="text-sm text-gray-400">days</span>
        </div>

        <!-- Result message -->
        <div
          v-if="toolStates[tool.slug]?.result"
          class="text-sm mb-2"
          :class="toolStates[tool.slug].resultType === 'success' ? 'text-green-400' : 'text-red-400'"
        >
          <i :class="toolStates[tool.slug].resultType === 'success' ? 'fa-solid fa-check' : 'fa-solid fa-xmark'" class="mr-1"></i>
          {{ toolStates[tool.slug].result }}
        </div>

        <button
          @click="runTool(tool.slug)"
          :disabled="toolStates[tool.slug]?.loading"
          class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <i v-if="toolStates[tool.slug]?.loading" class="fa-solid fa-spinner fa-spin mr-1.5"></i>
          {{ toolStates[tool.slug]?.loading ? 'Running...' : 'Run' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { runMaintenanceTool } from '../../services/api'
import { useToastStore } from '../../stores/toast'

const toast = useToastStore()
const auditDays = ref(90)

const tools = [
  { slug: 'rebuild-forum-stats', icon: 'fa-solid fa-chart-bar', title: 'Rebuild Forum Stats', desc: 'Recount thread and post totals for all forums.' },
  { slug: 'rebuild-user-post-counts', icon: 'fa-solid fa-user-pen', title: 'Rebuild User Post Counts', desc: "Recount each user's post total from the database." },
  { slug: 'prune-sessions', icon: 'fa-solid fa-clock-rotate-left', title: 'Prune Expired Sessions', desc: 'Remove expired and inactive login sessions.' },
  { slug: 'prune-audit-log', icon: 'fa-solid fa-trash-can', title: 'Prune Audit Log', desc: 'Delete audit log entries older than N days.', hasInput: true },
  { slug: 'clear-cache', icon: 'fa-solid fa-broom', title: 'Clear Cache', desc: 'Clear the application and config cache.' },
]

const toolStates = reactive({})
tools.forEach(t => {
  toolStates[t.slug] = { loading: false, result: null, resultType: 'success' }
})

async function runTool(slug) {
  toolStates[slug].loading = true
  toolStates[slug].result = null
  try {
    const payload = slug === 'prune-audit-log' ? { days: auditDays.value } : {}
    const res = await runMaintenanceTool(slug, payload)
    toolStates[slug].result = res.data.message
    toolStates[slug].resultType = 'success'
  } catch (err) {
    toolStates[slug].result = err.response?.data?.message || 'Failed'
    toolStates[slug].resultType = 'error'
  } finally {
    toolStates[slug].loading = false
    setTimeout(() => {
      if (toolStates[slug]) toolStates[slug].result = null
    }, 4000)
  }
}
</script>
