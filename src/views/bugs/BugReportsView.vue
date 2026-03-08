<script setup>
import { ref, onMounted, watch } from 'vue'
import { getBugReports } from '../../services/api'
import { useToastStore } from '../../stores/toast'

const toast = useToastStore()
const activeTab = ref('mine')
const statusFilter = ref('')
const reports = ref([])
const loading = ref(true)
const currentPage = ref(1)
const lastPage = ref(1)

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

function statusBadgeClass(status) {
  const map = {
    open: 'bg-blue-500/20 text-blue-400',
    in_progress: 'bg-amber-500/20 text-amber-400',
    resolved: 'bg-green-500/20 text-green-400',
    closed: 'bg-gray-500/20 text-gray-400',
    wont_fix: 'bg-red-500/20 text-red-400',
  }
  return map[status] || 'bg-gray-500/20 text-gray-400'
}

function severityBadgeClass(severity) {
  const map = {
    low: 'bg-gray-400/20 text-gray-400',
    medium: 'bg-blue-400/20 text-blue-400',
    high: 'bg-orange-400/20 text-orange-400',
    critical: 'bg-red-400/20 text-red-400',
  }
  return map[severity] || 'bg-gray-400/20 text-gray-400'
}

function formatStatus(status) {
  return (status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

async function fetchReports(page = 1) {
  loading.value = true
  try {
    const params = { page }
    if (activeTab.value === 'mine') {
      if (statusFilter.value) {
        params.status = statusFilter.value
      }
    } else {
      params.status = 'open'
    }
    const res = await getBugReports(params)
    const data = res.data
    if (page === 1) {
      reports.value = data.data || []
    } else {
      reports.value = [...reports.value, ...(data.data || [])]
    }
    const meta = data.meta || data
    currentPage.value = meta.current_page || page
    lastPage.value = meta.last_page || 1
  } catch {
    toast.show('Failed to load bug reports.', 'error')
  } finally {
    loading.value = false
  }
}

function loadMore() {
  fetchReports(currentPage.value + 1)
}

watch([activeTab, statusFilter], () => {
  currentPage.value = 1
  fetchReports(1)
})

onMounted(() => fetchReports(1))
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-white flex items-center gap-3">
        <i class="fa-solid fa-bug text-violet-400"></i>
        Bug Reports
      </h1>
      <router-link to="/bugs/submit"
        class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
        <i class="fa-solid fa-plus"></i>
        Submit Report
      </router-link>
    </div>

    <!-- Tab Bar -->
    <div class="flex gap-1 mb-4 border-b border-gray-700">
      <button
        @click="activeTab = 'mine'"
        class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
        :class="activeTab === 'mine'
          ? 'text-violet-400 border-violet-500'
          : 'text-gray-400 border-transparent hover:text-gray-300'">
        My Reports
      </button>
      <button
        @click="activeTab = 'all_open'"
        class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
        :class="activeTab === 'all_open'
          ? 'text-violet-400 border-violet-500'
          : 'text-gray-400 border-transparent hover:text-gray-300'">
        All Open Reports
      </button>
    </div>

    <!-- Status Filter (My Reports only) -->
    <div v-if="activeTab === 'mine'" class="flex flex-wrap gap-2 mb-5">
      <button v-for="opt in statusOptions" :key="opt.value"
        @click="statusFilter = opt.value"
        class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        :class="statusFilter === opt.value
          ? 'bg-violet-600 text-white'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'">
        {{ opt.label }}
      </button>
    </div>

    <!-- Loading Skeletons -->
    <div v-if="loading && currentPage === 1" class="space-y-3">
      <div v-for="i in 3" :key="i"
        class="rounded-xl p-5 animate-pulse bg-gray-800 border border-gray-700">
        <div class="h-5 bg-gray-700 rounded w-2/5 mb-3"></div>
        <div class="flex gap-2 mb-2">
          <div class="h-5 bg-gray-700 rounded w-16"></div>
          <div class="h-5 bg-gray-700 rounded w-16"></div>
        </div>
        <div class="h-4 bg-gray-700 rounded w-1/4"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && !reports.length"
      class="rounded-xl p-12 border bg-gray-800 border-gray-700 text-center">
      <i class="fa-solid fa-bug text-4xl text-gray-600 mb-4"></i>
      <p class="text-gray-400 text-lg mb-4">No bug reports yet</p>
      <router-link to="/bugs/submit"
        class="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors">
        <i class="fa-solid fa-plus"></i>
        Submit a Bug Report
      </router-link>
    </div>

    <!-- Report Cards -->
    <div v-else class="space-y-3">
      <router-link v-for="report in reports" :key="report.id"
        :to="`/bugs/${report.id}`"
        class="block rounded-xl p-5 border bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-sm font-semibold text-white flex-1 min-w-0 truncate">
            {{ report.title }}
          </h3>
          <div class="flex items-center gap-2 shrink-0">
            <span class="px-2 py-0.5 rounded-full text-xs font-medium"
              :class="statusBadgeClass(report.status)">
              {{ formatStatus(report.status) }}
            </span>
            <span class="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
              :class="severityBadgeClass(report.severity)">
              {{ report.severity }}
            </span>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-2">
          <i class="fa-regular fa-clock mr-1"></i>
          {{ formatDate(report.created_at) }}
        </p>
      </router-link>

      <!-- Load More -->
      <div v-if="currentPage < lastPage" class="text-center pt-4">
        <button @click="loadMore"
          :disabled="loading"
          class="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg border border-gray-700 transition-colors disabled:opacity-50">
          <i v-if="loading" class="fa-solid fa-spinner fa-spin mr-2"></i>
          Load More
        </button>
      </div>
    </div>
  </div>
</template>
