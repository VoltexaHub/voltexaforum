<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getStatus } from '../services/api'

const loading = ref(true)
const services = ref([])
const lastFetchedAt = ref(null)
const secondsSinceUpdate = ref(0)
let refreshInterval = null
let counterInterval = null

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

const overallStatus = computed(() => {
  if (!services.value.length) return 'unknown'
  if (services.value.some(s => s.status === 'outage')) return 'outage'
  if (services.value.some(s => s.status === 'degraded')) return 'degraded'
  return 'operational'
})

const overallLabel = computed(() => {
  if (overallStatus.value === 'operational') return 'All Systems Operational'
  if (overallStatus.value === 'degraded') return 'Degraded Performance'
  if (overallStatus.value === 'outage') return 'Service Outage'
  return 'Checking...'
})

const overallBannerClass = computed(() => {
  if (overallStatus.value === 'operational') return 'bg-green-500/10 border-green-500/30 text-green-400'
  if (overallStatus.value === 'degraded') return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
  if (overallStatus.value === 'outage') return 'bg-red-500/10 border-red-500/30 text-red-400'
  return 'bg-gray-500/10 border-gray-500/30 text-gray-400'
})

const overallIcon = computed(() => {
  if (overallStatus.value === 'operational') return 'fa-solid fa-circle-check'
  if (overallStatus.value === 'degraded') return 'fa-solid fa-triangle-exclamation'
  if (overallStatus.value === 'outage') return 'fa-solid fa-circle-xmark'
  return 'fa-solid fa-spinner fa-spin'
})

const incidents = computed(() =>
  services.value.filter(s => s.status !== 'operational')
)

function statusBadgeClass(status) {
  if (status === 'operational') return 'bg-green-500/20 text-green-400 border-green-500/30'
  if (status === 'degraded') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  return 'bg-red-500/20 text-red-400 border-red-500/30'
}

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
  if (seconds < 60) return `${seconds} seconds ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  return `${Math.floor(seconds / 3600)} hours ago`
}

async function fetchStatus() {
  try {
    const { data } = await getStatus()
    services.value = data.data?.services || data.services || []
    lastFetchedAt.value = Date.now()
    secondsSinceUpdate.value = 0
  } catch {
    // silently fail for public page
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStatus()
  refreshInterval = setInterval(fetchStatus, 60000)
  counterInterval = setInterval(() => {
    if (lastFetchedAt.value) {
      secondsSinceUpdate.value = Math.floor((Date.now() - lastFetchedAt.value) / 1000)
    }
  }, 1000)
})

onUnmounted(() => {
  clearInterval(refreshInterval)
  clearInterval(counterInterval)
})
</script>

<template>
  <div class="min-h-screen bg-gray-950">
    <!-- Header -->
    <div class="border-b border-gray-800">
      <div class="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 class="text-3xl font-bold text-white mb-2">VoltexaHub Status</h1>
        <p class="text-gray-400">Real-time system status and uptime monitoring</p>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <!-- Loading -->
      <div v-if="loading" class="space-y-4">
        <div class="h-24 bg-gray-800 rounded-2xl animate-pulse"></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="i in 4" :key="i" class="h-32 bg-gray-800 rounded-xl animate-pulse"></div>
        </div>
      </div>

      <template v-else>
        <!-- Overall Status Banner -->
        <div
          class="rounded-2xl border p-6 flex items-center gap-4"
          :class="overallBannerClass"
        >
          <i :class="overallIcon" class="text-3xl"></i>
          <div>
            <h2 class="text-xl font-bold">{{ overallLabel }}</h2>
            <p class="text-sm opacity-75 mt-0.5">
              Last updated {{ secondsSinceUpdate }} seconds ago
            </p>
          </div>
        </div>

        <!-- Incident Notices -->
        <div v-if="incidents.length" class="space-y-3">
          <div
            v-for="s in incidents"
            :key="s.name"
            class="rounded-xl border p-4 flex items-start gap-3"
            :class="s.status === 'outage'
              ? 'bg-red-500/5 border-red-500/20'
              : 'bg-yellow-500/5 border-yellow-500/20'"
          >
            <i
              class="mt-0.5"
              :class="s.status === 'outage'
                ? 'fa-solid fa-circle-xmark text-red-400'
                : 'fa-solid fa-triangle-exclamation text-yellow-400'"
            ></i>
            <div>
              <p class="text-sm font-semibold" :class="s.status === 'outage' ? 'text-red-400' : 'text-yellow-400'">
                {{ serviceNames[s.name] || s.name }} — {{ statusLabel(s.status) }}
              </p>
              <p v-if="s.message" class="text-xs text-gray-400 mt-1">{{ s.message }}</p>
            </div>
          </div>
        </div>

        <!-- Service Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="s in services"
            :key="s.name"
            class="bg-gray-900 rounded-xl border border-gray-800 p-5 hover:border-gray-700 transition-colors"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                  <i :class="serviceIcons[s.name] || 'fa-solid fa-circle'" class="text-gray-400"></i>
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-white">{{ serviceNames[s.name] || s.name }}</h3>
                  <p class="text-xs text-gray-500">{{ timeAgo(s.last_checked) }}</p>
                </div>
              </div>
              <span class="w-3 h-3 rounded-full mt-1" :class="statusDotClass(s.status)"></span>
            </div>

            <div class="flex items-center justify-between">
              <span
                class="px-2.5 py-1 text-xs font-medium rounded-full border"
                :class="statusBadgeClass(s.status)"
              >
                {{ statusLabel(s.status) }}
              </span>
            </div>

            <p v-if="s.message" class="text-xs text-gray-400 mt-3">{{ s.message }}</p>
          </div>
        </div>

        <!-- Last Updated Counter -->
        <div class="text-center text-xs text-gray-600 pt-4">
          Auto-refreshes every 60 seconds &middot; Last updated {{ secondsSinceUpdate }} seconds ago
        </div>
      </template>
    </div>

    <!-- Footer -->
    <div class="border-t border-gray-800 mt-12">
      <div class="max-w-4xl mx-auto px-4 py-6 text-center">
        <a
          href="https://community.voltexahub.com"
          class="text-sm text-gray-500 hover:text-violet-400 transition-colors"
        >
          Powered by VoltexaHub
        </a>
      </div>
    </div>
  </div>
</template>
