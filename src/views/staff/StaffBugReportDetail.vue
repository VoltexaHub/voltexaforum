<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getStaffBugReport, updateStaffBugReport, deleteStaffBugReport } from '../../services/api'
import { useToastStore } from '../../stores/toast'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const report = ref(null)
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const showDeleteConfirm = ref(false)

const triageForm = ref({
  status: '',
  priority: '',
  assigned_to: '',
  staff_notes: '',
})

const statusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'wont_fix', label: "Won't Fix" },
]

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
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
    const res = await getStaffBugReport(route.params.id)
    report.value = res.data.data || res.data
    triageForm.value = {
      status: report.value.status || 'open',
      priority: report.value.priority || '',
      assigned_to: report.value.assigned_to ?? '',
      staff_notes: report.value.staff_notes || '',
    }
  } catch {
    toast.show('Failed to load bug report.', 'error')
    router.push('/staffcp/bugs')
  } finally {
    loading.value = false
  }
}

async function saveChanges() {
  saving.value = true
  try {
    const data = {
      status: triageForm.value.status,
      priority: triageForm.value.priority || null,
      staff_notes: triageForm.value.staff_notes || null,
    }
    if (triageForm.value.assigned_to !== '') {
      data.assigned_to = triageForm.value.assigned_to || null
    }
    await updateStaffBugReport(report.value.id, data)
    toast.show('Bug report updated.', 'success')
    // Refresh report data
    await fetchReport()
  } catch {
    toast.show('Failed to update bug report.', 'error')
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  deleting.value = true
  try {
    await deleteStaffBugReport(report.value.id)
    toast.show('Bug report deleted.', 'success')
    router.push('/staffcp/bugs')
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
  <div class="space-y-6">
    <!-- Back Link -->
    <router-link to="/staffcp/bugs"
      class="text-sm text-gray-400 hover:text-violet-400 transition-colors inline-flex items-center gap-1">
      <i class="fa-solid fa-arrow-left"></i> Back to Bug Reports
    </router-link>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4 animate-pulse">
        <div class="h-4 bg-gray-700 rounded w-24"></div>
        <div class="h-6 bg-gray-700 rounded w-3/4"></div>
        <div class="h-4 bg-gray-700 rounded w-full"></div>
        <div class="h-4 bg-gray-700 rounded w-5/6"></div>
        <div class="h-4 bg-gray-700 rounded w-2/3"></div>
      </div>
      <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4 animate-pulse">
        <div class="h-5 bg-gray-700 rounded w-1/2"></div>
        <div class="h-10 bg-gray-700 rounded w-full"></div>
        <div class="h-10 bg-gray-700 rounded w-full"></div>
        <div class="h-10 bg-gray-700 rounded w-full"></div>
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="report" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column: Report Details -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <!-- Report ID -->
          <p class="text-xs text-gray-500 mb-1">Report #{{ report.id }}</p>

          <!-- Title -->
          <h1 class="text-xl font-semibold text-white mb-4">{{ report.title }}</h1>

          <!-- Badges -->
          <div class="flex flex-wrap gap-2 mb-6">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="statusBadgeClass(report.status)">
              {{ formatStatus(report.status) }}
            </span>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
              :class="severityBadgeClass(report.severity)">
              {{ report.severity }}
            </span>
            <span v-if="report.priority" class="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-violet-500/20 text-violet-400">
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
        </div>

        <!-- Delete -->
        <div class="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 class="text-sm font-medium text-red-400 mb-3">Danger Zone</h3>
          <div v-if="!showDeleteConfirm">
            <button @click="showDeleteConfirm = true"
              class="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
              <i class="fa-solid fa-trash"></i>
              Delete Report
            </button>
          </div>
          <div v-else class="flex items-center gap-3">
            <span class="text-sm text-red-400">Are you sure?</span>
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

      <!-- Right Column: Triage Panel -->
      <div class="space-y-6">
        <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 sticky top-6">
          <h3 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <i class="fa-solid fa-sliders text-violet-400"></i>
            Triage
          </h3>

          <div class="space-y-4">
            <!-- Status -->
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Status</label>
              <select v-model="triageForm.status"
                class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none">
                <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>

            <!-- Priority -->
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Priority</label>
              <select v-model="triageForm.priority"
                class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none">
                <option value="">Not Set</option>
                <option v-for="opt in priorityOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>

            <!-- Severity (read-only) -->
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Severity</label>
              <span class="px-2.5 py-1 rounded-full text-xs font-medium capitalize inline-block"
                :class="severityBadgeClass(report.severity)">
                {{ report.severity }}
              </span>
            </div>

            <!-- Assigned To -->
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Assigned To (User ID)</label>
              <input v-model="triageForm.assigned_to" type="text"
                placeholder="Enter user ID"
                class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" />
            </div>

            <!-- Staff Notes -->
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Staff Notes</label>
              <textarea v-model="triageForm.staff_notes" rows="4"
                placeholder="Internal notes..."
                class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none resize-y"></textarea>
            </div>

            <!-- Save -->
            <button @click="saveChanges" :disabled="saving"
              class="w-full px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <i v-if="saving" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-check"></i>
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>

        <!-- Reporter Info -->
        <div class="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 class="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <i class="fa-solid fa-user text-gray-400"></i>
            Reporter
          </h3>
          <p class="text-sm text-gray-300">{{ report.reporter?.username || 'Unknown' }}</p>
          <p class="text-xs text-gray-500 mt-1">
            <i class="fa-regular fa-clock mr-1"></i>
            {{ formatDate(report.created_at) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
