<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-white">Error Log</h2>
      <button
        @click="clearConfirm = true"
        :disabled="logs.length === 0"
        class="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <i class="fa-solid fa-trash-can mr-1.5"></i>
        Clear All
      </button>
    </div>

    <!-- Clear confirm -->
    <div v-if="clearConfirm" class="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
      <div class="flex items-center gap-3">
        <i class="fa-solid fa-triangle-exclamation text-amber-400"></i>
        <span class="text-sm text-amber-300">Are you sure? This will delete all error log entries.</span>
      </div>
      <div class="flex items-center gap-2">
        <button @click="clearConfirm = false" class="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-gray-300 transition-colors">Cancel</button>
        <button @click="handleClear" :disabled="clearLoading" class="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
          <i v-if="clearLoading" class="fa-solid fa-spinner fa-spin mr-1"></i>
          Confirm
        </button>
      </div>
    </div>

    <!-- Settings card -->
    <div v-if="settings" class="bg-gray-800 rounded-xl border border-gray-700/50 p-5">
      <div class="flex flex-wrap items-center gap-5">
        <!-- Enable toggle -->
        <label class="flex items-center gap-3 cursor-pointer">
          <div class="relative" @click="settings.enabled = !settings.enabled">
            <div class="w-10 h-6 rounded-full transition-colors" :class="settings.enabled ? 'bg-violet-600' : 'bg-gray-600'"></div>
            <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform" :class="settings.enabled ? 'translate-x-4' : ''"></div>
          </div>
          <span class="text-sm text-gray-300">Enable error logging</span>
        </label>

        <!-- Prune days -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-400">Auto-prune after</span>
          <input
            v-model.number="settings.prune_days"
            type="number"
            min="1"
            max="365"
            class="w-20 px-2.5 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-sm text-gray-200 focus:outline-none focus:border-violet-500"
          />
          <span class="text-sm text-gray-400">days</span>
        </div>

        <!-- Save -->
        <button
          @click="saveSettings"
          :disabled="settingsSaving"
          class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <i v-if="settingsSaving" class="fa-solid fa-spinner fa-spin mr-1.5"></i>
          Save
        </button>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="flex items-center gap-2">
      <button
        v-for="tab in [{ label: 'All', value: '' }, { label: 'Exception', value: 'exception' }, { label: 'Error', value: 'error' }, { label: 'Warning', value: 'warning' }]"
        :key="tab.value"
        @click="filterType = tab.value; loadLogs(1)"
        class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        :class="filterType === tab.value
          ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
          : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800 border border-transparent'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Logs list -->
    <div v-if="logsLoading" class="flex items-center justify-center py-12">
      <i class="fa-solid fa-spinner fa-spin text-2xl text-gray-500"></i>
    </div>

    <div v-else-if="logs.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-500">
      <i class="fa-solid fa-circle-check text-4xl mb-3 text-green-500/40"></i>
      <span class="text-sm">No errors logged</span>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="log in logs"
        :key="log.id"
        class="border rounded-lg transition-colors cursor-pointer"
        :class="expandedId === log.id
          ? 'border-violet-500/40 bg-gray-800/80'
          : 'border-gray-700/50 bg-gray-800/40 hover:bg-gray-800/60'"
      >
        <!-- Row summary -->
        <div class="flex items-center gap-3 p-3" @click="toggleExpand(log.id)">
          <!-- Severity badge -->
          <span
            class="shrink-0 px-2 py-0.5 rounded text-[11px] font-semibold uppercase"
            :class="{
              'bg-red-500/20 text-red-400': log.type === 'exception',
              'bg-amber-500/20 text-amber-400': log.type === 'error',
              'bg-yellow-500/20 text-yellow-400': log.type === 'warning',
            }"
          >{{ log.type }}</span>

          <!-- Message -->
          <span class="flex-1 font-mono text-xs text-gray-300 truncate">{{ log.message?.slice(0, 80) }}</span>

          <!-- File:line -->
          <span v-if="log.file" class="text-xs text-gray-500 shrink-0">{{ baseName(log.file) }}:{{ log.line }}</span>

          <!-- Method badge -->
          <span v-if="log.method" class="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-700 text-gray-400">{{ log.method }}</span>

          <!-- Time -->
          <span class="text-xs text-gray-500 shrink-0">{{ timeAgo(log.created_at) }}</span>

          <!-- Delete -->
          <button @click.stop="removeEntry(log.id)" class="text-gray-500 hover:text-red-400 text-xs px-1 transition-colors">&times;</button>
        </div>

        <!-- Expanded detail -->
        <div v-if="expandedId === log.id" class="border-t border-gray-700/50 p-4 space-y-3">
          <div>
            <span class="text-xs font-semibold text-gray-500 uppercase">Message</span>
            <p class="font-mono text-sm text-gray-300 mt-1 break-all">{{ log.message }}</p>
          </div>
          <div v-if="log.file">
            <span class="text-xs font-semibold text-gray-500 uppercase">File</span>
            <p class="font-mono text-xs text-gray-400 mt-1">{{ log.file }}:{{ log.line }}</p>
          </div>
          <div v-if="log.url">
            <span class="text-xs font-semibold text-gray-500 uppercase">URL</span>
            <p class="text-sm text-gray-400 mt-1">{{ log.method }} {{ log.url }}</p>
          </div>
          <div v-if="log.user_id">
            <span class="text-xs font-semibold text-gray-500 uppercase">User ID</span>
            <p class="text-sm text-gray-400 mt-1">{{ log.user_id }}</p>
          </div>
          <div v-if="log.ip_address">
            <span class="text-xs font-semibold text-gray-500 uppercase">IP Address</span>
            <p class="text-sm text-gray-400 mt-1">{{ log.ip_address }}</p>
          </div>
          <div v-if="log.trace">
            <span class="text-xs font-semibold text-gray-500 uppercase">Stack Trace</span>
            <pre class="bg-gray-950 text-green-400 font-mono text-xs p-3 rounded-lg overflow-x-auto max-h-48 mt-1">{{ log.trace }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.last_page > 1" class="flex items-center justify-between">
      <button
        @click="loadLogs(pagination.current_page - 1)"
        :disabled="pagination.current_page === 1"
        class="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <i class="fa-solid fa-chevron-left mr-1"></i> Previous
      </button>
      <span class="text-sm text-gray-500">Page {{ pagination.current_page }} of {{ pagination.last_page }}</span>
      <button
        @click="loadLogs(pagination.current_page + 1)"
        :disabled="pagination.current_page === pagination.last_page"
        class="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Next <i class="fa-solid fa-chevron-right ml-1"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getErrorLogSettings, updateErrorLogSettings, getErrorLog, deleteErrorLogEntry, clearErrorLog } from '../../services/api'
import { useToastStore } from '../../stores/toast'

const toast = useToastStore()

const settings = ref(null)
const settingsSaving = ref(false)
const logs = ref([])
const logsLoading = ref(true)
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })
const filterType = ref('')
const expandedId = ref(null)
const clearConfirm = ref(false)
const clearLoading = ref(false)

onMounted(() => {
  loadSettings()
  loadLogs()
})

async function loadSettings() {
  try {
    const res = await getErrorLogSettings()
    settings.value = res.data
  } catch {
    settings.value = { enabled: false, prune_days: 30 }
  }
}

async function loadLogs(page = 1) {
  logsLoading.value = true
  try {
    const params = { page }
    if (filterType.value) params.type = filterType.value
    const res = await getErrorLog(params)
    logs.value = res.data.data
    pagination.value = {
      current_page: res.data.current_page,
      last_page: res.data.last_page,
      total: res.data.total,
    }
  } catch {
    logs.value = []
  } finally {
    logsLoading.value = false
  }
}

async function saveSettings() {
  settingsSaving.value = true
  try {
    await updateErrorLogSettings(settings.value)
    toast.show('Settings saved')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save settings', 'error')
  } finally {
    settingsSaving.value = false
  }
}

async function removeEntry(id) {
  try {
    await deleteErrorLogEntry(id)
    logs.value = logs.value.filter(l => l.id !== id)
  } catch {
    toast.show('Failed to delete entry', 'error')
  }
}

async function handleClear() {
  clearLoading.value = true
  try {
    await clearErrorLog()
    logs.value = []
    clearConfirm.value = false
    pagination.value = { current_page: 1, last_page: 1, total: 0 }
    toast.show('Error log cleared')
  } catch {
    toast.show('Failed to clear log', 'error')
  } finally {
    clearLoading.value = false
  }
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function baseName(path) {
  return path ? path.split('/').pop() : ''
}
</script>
