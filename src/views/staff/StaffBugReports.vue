<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getStaffBugReports } from '../../services/api'
import { useToastStore } from '../../stores/toast'

const router = useRouter()
const toast = useToastStore()

const reports = ref([])
const loading = ref(true)
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)

const statusFilter = ref('')
const severityFilter = ref('')
const searchQuery = ref('')

const stats = ref({ open: 0, in_progress: 0, resolved: 0 })

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'wont_fix', label: "Won't Fix" },
]

const severityOptions = [
  { value: '', label: 'All Severities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
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
    const params = { page, per_page: 20 }
    if (statusFilter.value) params.status = statusFilter.value
    if (severityFilter.value) params.severity = severityFilter.value
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()

    const res = await getStaffBugReports(params)
    const data = res.data
    reports.value = data.data || []
    const meta = data.meta || data
    currentPage.value = meta.current_page || page
    lastPage.value = meta.last_page || 1
    total.value = meta.total || 0
  } catch {
    toast.show('Failed to load bug reports.', 'error')
  } finally {
    loading.value = false
  }
}

function goToPage(page) {
  if (page < 1 || page > lastPage.value) return
  fetchReports(page)
}

function viewReport(id) {
  router.push(`/staffcp/bugs/${id}`)
}

let searchTimeout = null
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchReports(1)
  }, 400)
}

watch([statusFilter, severityFilter], () => {
  currentPage.value = 1
  fetchReports(1)
})

onMounted(() => fetchReports(1))
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-white flex items-center gap-2">
        <i class="fa-solid fa-bug text-violet-400"></i>
        Bug Reports
      </h2>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-gray-800 border border-gray-700 rounded-xl p-4 border-l-4 border-l-blue-500">
        <p class="text-xs text-gray-400 uppercase tracking-wide">Open</p>
        <p class="text-2xl font-bold text-white mt-1">{{ stats.open }}</p>
      </div>
      <div class="bg-gray-800 border border-gray-700 rounded-xl p-4 border-l-4 border-l-amber-500">
        <p class="text-xs text-gray-400 uppercase tracking-wide">In Progress</p>
        <p class="text-2xl font-bold text-white mt-1">{{ stats.in_progress }}</p>
      </div>
      <div class="bg-gray-800 border border-gray-700 rounded-xl p-4 border-l-4 border-l-green-500">
        <p class="text-xs text-gray-400 uppercase tracking-wide">Resolved</p>
        <p class="text-2xl font-bold text-white mt-1">{{ stats.resolved }}</p>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="flex flex-wrap gap-3">
      <select v-model="statusFilter"
        class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none">
        <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <select v-model="severityFilter"
        class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none">
        <option v-for="opt in severityOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="Search by title..."
        class="flex-1 min-w-[200px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" />
    </div>

    <!-- Loading Skeletons -->
    <div v-if="loading" class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div class="p-4 space-y-3">
        <div v-for="i in 5" :key="i" class="h-12 rounded animate-pulse bg-gray-700/50"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!reports.length" class="rounded-xl p-8 border bg-gray-800 border-gray-700 text-center">
      <i class="fa-solid fa-bug text-3xl text-gray-600 mb-2"></i>
      <p class="text-gray-400 text-sm">No bug reports found.</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-gray-800 rounded-xl border border-gray-700 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-gray-900/50 text-left">
            <th class="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">ID</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Title</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Reporter</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Severity</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Priority</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Assigned To</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Date</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-700">
          <tr v-for="report in reports" :key="report.id"
            @click="viewReport(report.id)"
            class="hover:bg-gray-700/50 cursor-pointer transition-colors">
            <td class="px-4 py-3 text-gray-500 font-mono text-xs">#{{ report.id }}</td>
            <td class="px-4 py-3 text-white font-medium max-w-[250px] truncate">{{ report.title }}</td>
            <td class="px-4 py-3 text-gray-300">{{ report.reporter?.username || 'Unknown' }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded-full text-xs font-medium capitalize" :class="severityBadgeClass(report.severity)">
                {{ report.severity }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded-full text-xs font-medium" :class="statusBadgeClass(report.status)">
                {{ formatStatus(report.status) }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-400 text-xs capitalize">{{ report.priority || '—' }}</td>
            <td class="px-4 py-3 text-gray-400 text-xs">{{ report.assignee?.username || '—' }}</td>
            <td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{{ formatDate(report.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="!loading && reports.length" class="flex items-center justify-between">
      <p class="text-xs text-gray-500">
        Page {{ currentPage }} of {{ lastPage }} ({{ total }} total)
      </p>
      <div class="flex gap-2">
        <button @click="goToPage(currentPage - 1)" :disabled="currentPage <= 1"
          class="px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-400 text-xs rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <i class="fa-solid fa-chevron-left mr-1"></i> Prev
        </button>
        <button @click="goToPage(currentPage + 1)" :disabled="currentPage >= lastPage"
          class="px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-400 text-xs rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Next <i class="fa-solid fa-chevron-right ml-1"></i>
        </button>
      </div>
    </div>
  </div>
</template>
