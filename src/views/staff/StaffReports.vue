<script setup>
import { ref, onMounted } from 'vue'
import { getStaffReports, updateStaffReport } from '../../services/api'
import { useToastStore } from '../../stores/toast'

const toast = useToastStore()
const reports = ref([])
const loading = ref(true)
const status = ref('pending')
const updating = ref(null)

async function fetchReports() {
  loading.value = true
  try {
    const res = await getStaffReports({ status: status.value })
    reports.value = res.data.data || []
  } catch {
    toast.error('Failed to load reports.')
  } finally {
    loading.value = false
  }
}

async function resolve(report) {
  updating.value = report.id
  try {
    await updateStaffReport(report.id, { status: 'resolved' })
    reports.value = reports.value.filter(r => r.id !== report.id)
    toast.success('Report resolved.')
  } catch {
    toast.error('Failed to update report.')
  } finally {
    updating.value = null
  }
}

async function dismiss(report) {
  updating.value = report.id
  try {
    await updateStaffReport(report.id, { status: 'dismissed' })
    reports.value = reports.value.filter(r => r.id !== report.id)
    toast.success('Report dismissed.')
  } catch {
    toast.error('Failed to update report.')
  } finally {
    updating.value = null
  }
}

onMounted(fetchReports)
</script>

<template>
  <div class="space-y-6">
    <!-- Header with filter -->
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-white">
        <i class="fa-solid fa-flag text-amber-400 mr-2"></i>Reports
      </h2>
      <div class="flex gap-2">
        <button v-for="s in ['pending', 'resolved', 'dismissed']" :key="s"
          @click="status = s; fetchReports()"
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize"
          :class="status === s ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'">
          {{ s }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-20 rounded-xl animate-pulse bg-gray-800" />
    </div>

    <!-- Empty -->
    <div v-else-if="!reports.length" class="rounded-xl p-8 border bg-gray-800 border-gray-700 text-center">
      <i class="fa-solid fa-check-circle text-3xl text-green-400 mb-2"></i>
      <p class="text-gray-400 text-sm">No {{ status }} reports.</p>
    </div>

    <!-- Report cards -->
    <div v-else class="space-y-3">
      <div v-for="report in reports" :key="report.id"
        class="rounded-xl p-5 border bg-gray-800 border-gray-700">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-semibold text-white">{{ report.reporter?.username || 'Unknown' }}</span>
              <span class="text-xs text-gray-500">reported</span>
            </div>
            <p class="text-sm text-gray-300 mb-2">{{ report.reason || 'No reason provided.' }}</p>
            <div v-if="report.post" class="text-xs text-gray-500">
              <i class="fa-solid fa-comment mr-1"></i>
              Post in:
              <router-link v-if="report.post?.thread"
                :to="`/thread/${report.post.thread.id}`"
                class="text-violet-400 hover:underline">
                {{ report.post.thread.title }}
              </router-link>
            </div>
            <div v-if="report.thread && !report.post" class="text-xs text-gray-500">
              <i class="fa-solid fa-comments mr-1"></i>
              Thread:
              <router-link :to="`/thread/${report.thread.id}`" class="text-violet-400 hover:underline">
                {{ report.thread.title }}
              </router-link>
            </div>
          </div>
          <div v-if="status === 'pending'" class="flex gap-2 shrink-0">
            <button @click="resolve(report)" :disabled="updating === report.id"
              class="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
              Resolve
            </button>
            <button @click="dismiss(report)" :disabled="updating === report.id"
              class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
