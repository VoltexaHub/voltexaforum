<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getBugReport, deleteBugReport } from '../../services/api'
import { useToastStore } from '../../stores/toast'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const report = ref(null)
const loading = ref(true)
const deleting = ref(false)
const showDeleteConfirm = ref(false)

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

function priorityBadgeClass(priority) {
  const map = {
    low: 'bg-gray-400/20 text-gray-400',
    medium: 'bg-blue-400/20 text-blue-400',
    high: 'bg-orange-400/20 text-orange-400',
    urgent: 'bg-red-400/20 text-red-400',
  }
  return map[priority] || 'bg-gray-400/20 text-gray-400'
}

function formatStatus(status) {
  return (status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function fetchReport() {
  loading.value = true
  try {
    const res = await getBugReport(route.params.id)
    report.value = res.data.data || res.data
  } catch {
    toast.show('Failed to load bug report.', 'error')
    router.push('/bugs')
  } finally {
    loading.value = false
  }
}

async function confirmDelete() {
  deleting.value = true
  try {
    await deleteBugReport(report.value.id)
    toast.show('Bug report deleted.', 'success')
    router.push('/bugs')
  } catch {
    toast.show('Failed to delete bug report.', 'error')
  } finally {
    deleting.value = false
    showDeleteConfirm.value = false
  }
}

onMounted(fetchReport)
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6">
    <!-- Back Link -->
    <router-link to="/bugs" class="text-sm text-gray-400 hover:text-violet-400 transition-colors inline-flex items-center gap-1 mb-4">
      <i class="fa-solid fa-arrow-left"></i> Back to Bug Reports
    </router-link>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4 animate-pulse">
      <div class="h-4 bg-gray-700 rounded w-24"></div>
      <div class="h-6 bg-gray-700 rounded w-3/4"></div>
      <div class="flex gap-2">
        <div class="h-5 bg-gray-700 rounded w-16"></div>
        <div class="h-5 bg-gray-700 rounded w-16"></div>
        <div class="h-5 bg-gray-700 rounded w-16"></div>
      </div>
      <div class="h-4 bg-gray-700 rounded w-full"></div>
      <div class="h-4 bg-gray-700 rounded w-5/6"></div>
      <div class="h-4 bg-gray-700 rounded w-2/3"></div>
    </div>

    <!-- Report -->
    <div v-else-if="report" class="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <!-- Report ID -->
      <p class="text-xs text-gray-500 mb-1">Report #{{ report.id }}</p>

      <!-- Title -->
      <h1 class="text-xl font-semibold text-white mb-3">{{ report.title }}</h1>

      <!-- Badges -->
      <div class="flex flex-wrap gap-2 mb-5">
        <span class="px-2.5 py-0.5 rounded-full text-xs font-medium"
          :class="statusBadgeClass(report.status)">
          {{ formatStatus(report.status) }}
        </span>
        <span class="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
          :class="severityBadgeClass(report.severity)">
          {{ report.severity }}
        </span>
        <span v-if="report.priority" class="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
          :class="priorityBadgeClass(report.priority)">
          {{ report.priority }} priority
        </span>
      </div>

      <!-- Description -->
      <div class="mb-5">
        <h3 class="text-sm font-medium text-gray-400 mb-2">Description</h3>
        <p class="text-sm text-gray-300 whitespace-pre-wrap">{{ report.description }}</p>
      </div>

      <!-- Steps to Reproduce -->
      <div v-if="report.steps_to_reproduce" class="mb-5">
        <h3 class="text-sm font-medium text-gray-400 mb-2">Steps to Reproduce</h3>
        <p class="text-sm text-gray-300 whitespace-pre-wrap">{{ report.steps_to_reproduce }}</p>
      </div>

      <!-- Environment -->
      <div v-if="report.environment" class="mb-5">
        <h3 class="text-sm font-medium text-gray-400 mb-2">Environment</h3>
        <p class="text-sm text-gray-300">{{ report.environment }}</p>
      </div>

      <!-- Page URL -->
      <div v-if="report.url" class="mb-5">
        <h3 class="text-sm font-medium text-gray-400 mb-2">Page URL</h3>
        <p class="text-sm text-violet-400">{{ report.url }}</p>
      </div>

      <!-- Attachments -->
      <div v-if="report.attachments && report.attachments.length" class="mb-5">
        <h3 class="text-sm font-medium text-gray-400 mb-2">Attachments</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <a v-for="(attachment, idx) in report.attachments" :key="idx"
            :href="attachment" target="_blank"
            class="block rounded-lg overflow-hidden border border-gray-700 hover:border-violet-500 transition-colors">
            <img :src="attachment" :alt="'Attachment ' + (idx + 1)"
              class="w-full h-32 object-cover" />
          </a>
        </div>
      </div>

      <!-- Created At -->
      <p class="text-xs text-gray-500 mb-5">
        <i class="fa-regular fa-clock mr-1"></i>
        Submitted {{ formatDate(report.created_at) }}
      </p>

      <!-- Delete Button -->
      <div v-if="report.status === 'open'">
        <div v-if="!showDeleteConfirm">
          <button @click="showDeleteConfirm = true"
            class="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
            <i class="fa-solid fa-trash"></i>
            Delete Report
          </button>
        </div>
        <div v-else class="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <span class="text-sm text-red-400">Are you sure you want to delete this report?</span>
          <button @click="confirmDelete" :disabled="deleting"
            class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
            {{ deleting ? 'Deleting...' : 'Yes, Delete' }}
          </button>
          <button @click="showDeleteConfirm = false"
            class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium rounded-lg transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
