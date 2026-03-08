<script setup>
import { ref, onMounted } from 'vue'
import { getAdminStatus, setStatusOverride, clearStatusOverride, clearAllStatusOverrides } from '../../../services/api'
import { useToastStore } from '../../../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const services = ref([])
const overrides = ref([])

const serviceNames = {
  database: 'Database',
  forum: 'Forum Application',
  queue: 'Queue Worker',
  websocket: 'WebSocket',
}

const serviceIcons = {
  database: 'fa-solid fa-database',
  forum: 'fa-solid fa-server',
  queue: 'fa-solid fa-list-check',
  websocket: 'fa-solid fa-wifi',
}

const form = ref({
  service: 'database',
  status: 'operational',
  message: '',
})

function statusDotClass(status) {
  if (status === 'operational') return 'bg-green-500'
  if (status === 'degraded') return 'bg-yellow-500'
  return 'bg-red-500'
}

function statusLabel(status) {
  if (status === 'operational') return 'Operational'
  if (status === 'degraded') return 'Degraded'
  return 'Outage'
}

function timeAgo(timestamp) {
  if (!timestamp) return 'Unknown'
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}

async function fetchStatus() {
  loading.value = true
  try {
    const { data } = await getAdminStatus()
    services.value = data.data?.services || []
    overrides.value = data.data?.overrides || []
  } catch {
    toast.error('Failed to load status data.')
  } finally {
    loading.value = false
  }
}

async function submitOverride() {
  try {
    await setStatusOverride(form.value)
    toast.success('Override set successfully.')
    form.value.message = ''
    await fetchStatus()
  } catch {
    toast.error('Failed to set override.')
  }
}

async function removeOverride(service) {
  try {
    await clearStatusOverride(service)
    toast.success('Override cleared.')
    await fetchStatus()
  } catch {
    toast.error('Failed to clear override.')
  }
}

async function removeAllOverrides() {
  if (!confirm('Clear all status overrides?')) return
  try {
    await clearAllStatusOverrides()
    toast.success('All overrides cleared.')
    await fetchStatus()
  } catch {
    toast.error('Failed to clear overrides.')
  }
}

onMounted(fetchStatus)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <h2 class="text-lg font-semibold text-white">Status Page</h2>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-gray-800 rounded-xl border border-gray-700/50 p-5 animate-pulse">
      <div class="h-5 bg-gray-700 rounded w-1/3 mb-3"></div>
      <div class="h-4 bg-gray-700 rounded w-full mb-2"></div>
      <div class="h-4 bg-gray-700 rounded w-2/3"></div>
    </div>

    <template v-else>
      <!-- Service Status Cards -->
      <div>
        <h3 class="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <i class="fa-solid fa-heart-pulse text-gray-400 text-xs"></i>
          Current Status
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="s in services"
            :key="s.name"
            class="bg-gray-800 rounded-xl border border-gray-700/50 p-4"
          >
            <div class="flex items-center gap-3 mb-2">
              <i :class="serviceIcons[s.name] || 'fa-solid fa-circle'" class="text-gray-400 text-sm"></i>
              <span class="text-sm font-semibold text-white">{{ serviceNames[s.name] || s.name }}</span>
              <span class="ml-auto flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full" :class="statusDotClass(s.status)"></span>
                <span class="text-xs font-medium" :class="{
                  'text-green-400': s.status === 'operational',
                  'text-yellow-400': s.status === 'degraded',
                  'text-red-400': s.status === 'outage',
                }">{{ statusLabel(s.status) }}</span>
              </span>
            </div>
            <p v-if="s.message" class="text-xs text-gray-400 mb-1">{{ s.message }}</p>
            <p class="text-xs text-gray-500">Last checked: {{ timeAgo(s.last_checked) }}</p>
          </div>
        </div>
      </div>

      <!-- Manual Override -->
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-5 space-y-4">
        <h3 class="text-sm font-semibold text-white flex items-center gap-2">
          <i class="fa-solid fa-sliders text-gray-400 text-xs"></i>
          Manual Override
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Service -->
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">Service</label>
            <select
              v-model="form.service"
              class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
            >
              <option value="database">Database</option>
              <option value="forum">Forum Application</option>
              <option value="queue">Queue Worker</option>
              <option value="websocket">WebSocket</option>
            </select>
          </div>

          <!-- Status -->
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
            <div class="flex gap-2 mt-1">
              <label
                v-for="opt in ['operational', 'degraded', 'outage']"
                :key="opt"
                class="flex items-center gap-1.5 cursor-pointer"
              >
                <input type="radio" v-model="form.status" :value="opt" class="accent-violet-500" />
                <span class="text-xs text-gray-300 capitalize">{{ opt }}</span>
              </label>
            </div>
          </div>

          <!-- Message -->
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">Message (optional)</label>
            <input
              v-model="form.message"
              type="text"
              class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
              placeholder="e.g. Scheduled maintenance"
            />
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            class="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
            @click="submitOverride"
          >
            <i class="fa-solid fa-check mr-1.5"></i> Set Override
          </button>
          <button
            v-if="overrides.length"
            class="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg transition-colors"
            @click="removeAllOverrides"
          >
            <i class="fa-solid fa-xmark mr-1.5"></i> Clear All Overrides
          </button>
        </div>
      </div>

      <!-- Active Overrides -->
      <div v-if="overrides.length" class="bg-gray-800 rounded-xl border border-gray-700/50 p-5 space-y-3">
        <h3 class="text-sm font-semibold text-white flex items-center gap-2">
          <i class="fa-solid fa-triangle-exclamation text-amber-400 text-xs"></i>
          Active Overrides
        </h3>
        <div class="space-y-2">
          <div
            v-for="o in overrides"
            :key="o.service"
            class="flex items-center justify-between bg-gray-700/40 rounded-lg border border-gray-600/40 px-4 py-3"
          >
            <div class="flex items-center gap-3">
              <span class="w-2.5 h-2.5 rounded-full" :class="statusDotClass(o.status)"></span>
              <span class="text-sm text-white font-medium">{{ serviceNames[o.service] || o.service }}</span>
              <span class="text-xs text-gray-400 capitalize">{{ o.status }}</span>
              <span v-if="o.message" class="text-xs text-gray-500">— {{ o.message }}</span>
            </div>
            <button
              class="px-3 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
              @click="removeOverride(o.service)"
            >
              <i class="fa-solid fa-xmark mr-1"></i> Clear
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
