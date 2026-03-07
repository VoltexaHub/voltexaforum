<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { getAdminReports, updateAdminReport, getAdminThreads, pinThread, lockThread, solveThread, adminDeletePost, deleteThread } from '../../services/api'
import { useToastStore } from '../../stores/toast'

const toast = useToastStore()

// Reports
const reportTab = ref('pending')
const reports = ref({ pending: [], reviewed: [], dismissed: [] })
const loadedTabs = reactive(new Set())
const tabLoading = reactive({ pending: false, reviewed: false, dismissed: false })

async function fetchReports(status) {
  tabLoading[status] = true
  try {
    const res = await getAdminReports({ status })
    reports.value[status] = res.data.data || res.data || []
    loadedTabs.add(status)
  } catch {} finally {
    tabLoading[status] = false
  }
}

function switchTab(tab) {
  reportTab.value = tab
  if (!loadedTabs.has(tab)) {
    fetchReports(tab)
  }
}

async function markReviewed(report) {
  const idx = reports.value.pending.findIndex(r => r.id === report.id)
  if (idx !== -1) reports.value.pending.splice(idx, 1)
  report.status = 'reviewed'
  reports.value.reviewed.unshift(report)
  try {
    await updateAdminReport(report.id, { status: 'reviewed' })
    toast.show('Report marked as reviewed')
  } catch (e) {
    reports.value.reviewed = reports.value.reviewed.filter(r => r.id !== report.id)
    report.status = 'pending'
    reports.value.pending.splice(idx, 0, report)
    toast.show(e.response?.data?.message || 'Failed to update report', 'error')
  }
}

async function dismissReport(report) {
  const sourceTab = report.status === 'reviewed' ? 'reviewed' : 'pending'
  const idx = reports.value[sourceTab].findIndex(r => r.id === report.id)
  if (idx !== -1) reports.value[sourceTab].splice(idx, 1)
  report.status = 'dismissed'
  reports.value.dismissed.unshift(report)
  try {
    await updateAdminReport(report.id, { status: 'dismissed' })
    toast.show('Report dismissed')
  } catch (e) {
    reports.value.dismissed = reports.value.dismissed.filter(r => r.id !== report.id)
    report.status = sourceTab
    reports.value[sourceTab].splice(idx, 0, report)
    toast.show(e.response?.data?.message || 'Failed to dismiss report', 'error')
  }
}

const currentReports = computed(() => reports.value[reportTab.value] || [])
const pendingCount = computed(() => reports.value.pending.length)
const currentTabLoading = computed(() => tabLoading[reportTab.value])

function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '')
}

function postPreview(report) {
  const content = report.post?.content || ''
  const plain = stripHtml(content)
  return plain.length > 200 ? plain.slice(0, 200) + '...' : plain
}

function reportThreadSlug(report) {
  return report.post?.thread?.slug || report.thread?.slug || null
}

function truncate(text, len = 80) {
  if (!text) return '\u2014'
  return text.length > len ? text.slice(0, len) + '...' : text
}

function formatDate(d) {
  if (!d) return '\u2014'
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// Threads
const threads = ref([])
const threadsMeta = ref({ current_page: 1, last_page: 1, total: 0 })
const threadsLoading = ref(false)
const threadSearch = ref('')
const selectedThreads = ref(new Set())
const bulkLoading = ref(false)

const allSelected = computed({
  get: () => threads.value.length > 0 && selectedThreads.value.size === threads.value.length,
  set: (val) => {
    if (val) {
      selectedThreads.value = new Set(threads.value.map(t => t.id))
    } else {
      selectedThreads.value = new Set()
    }
  },
})

async function fetchThreads(page = 1) {
  threadsLoading.value = true
  try {
    const params = { page }
    if (threadSearch.value) params.search = threadSearch.value
    const res = await getAdminThreads(params)
    threads.value = res.data.data || []
    threadsMeta.value = res.data.meta || { current_page: 1, last_page: 1, total: 0 }
    selectedThreads.value = new Set()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to load threads', 'error')
  } finally {
    threadsLoading.value = false
  }
}

function toggleThread(id) {
  const s = new Set(selectedThreads.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  selectedThreads.value = s
}

async function handlePin(id) {
  try {
    const res = await pinThread(id)
    toast.show(res.data.message)
    const t = threads.value.find(t => t.id === id)
    if (t) t.is_pinned = res.data.data.is_pinned
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed', 'error')
  }
}

async function handleLock(id) {
  try {
    const res = await lockThread(id)
    toast.show(res.data.message)
    const t = threads.value.find(t => t.id === id)
    if (t) t.is_locked = res.data.data.is_locked
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed', 'error')
  }
}

async function handleSolve(id) {
  try {
    const res = await solveThread(id)
    toast.show(res.data.message)
    const t = threads.value.find(t => t.id === id)
    if (t) t.is_solved = res.data.data.is_solved
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed', 'error')
  }
}

async function handleDelete(id) {
  if (!confirm('Delete this thread? This cannot be undone.')) return
  try {
    await deleteThread(id)
    toast.show('Thread deleted')
    threads.value = threads.value.filter(t => t.id !== id)
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed', 'error')
  }
}

async function bulkLock(lock) {
  bulkLoading.value = true
  try {
    for (const id of selectedThreads.value) {
      const t = threads.value.find(t => t.id === id)
      if (t && t.is_locked !== lock) await lockThread(id)
    }
    toast.show(lock ? 'Threads locked' : 'Threads unlocked')
    selectedThreads.value = new Set()
    await fetchThreads(threadsMeta.value.current_page)
  } catch (e) {
    toast.show(e.response?.data?.message || 'Bulk action failed', 'error')
  } finally {
    bulkLoading.value = false
  }
}

async function bulkDelete() {
  const count = selectedThreads.value.size
  if (!confirm(`Delete ${count} threads? This cannot be undone.`)) return
  bulkLoading.value = true
  try {
    for (const id of selectedThreads.value) {
      await deleteThread(id)
    }
    toast.show(`${count} threads deleted`)
    selectedThreads.value = new Set()
    await fetchThreads(threadsMeta.value.current_page)
  } catch (e) {
    toast.show(e.response?.data?.message || 'Bulk delete failed', 'error')
  } finally {
    bulkLoading.value = false
  }
}

onMounted(() => {
  fetchReports('pending')
  fetchThreads()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Report Tabs -->
    <div class="flex border-b border-gray-700">
      <button
        v-for="tab in ['pending', 'reviewed', 'dismissed']"
        :key="tab"
        @click="switchTab(tab)"
        class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px capitalize relative"
        :class="reportTab === tab ? 'text-violet-400 border-violet-400' : 'text-gray-500 border-transparent hover:text-gray-300'"
      >
        {{ tab }}
        <span
          v-if="tab === 'pending' && pendingCount > 0"
          class="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-red-500 text-white"
        >
          {{ pendingCount }}
        </span>
      </button>
    </div>

    <!-- Reports Table -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-700/50 flex items-center justify-between">
        <h2 class="text-base font-semibold text-white">Reports</h2>
        <span class="text-xs text-gray-500">{{ currentReports.length }} reports</span>
      </div>

      <!-- Loading -->
      <template v-if="currentTabLoading">
        <div v-for="i in 5" :key="i" class="flex items-center gap-4 px-5 py-4 border-b border-gray-700/30 animate-pulse">
          <div class="h-4 bg-gray-700 rounded flex-1"></div>
          <div class="h-4 bg-gray-700 rounded w-20"></div>
          <div class="h-4 bg-gray-700 rounded w-32"></div>
        </div>
      </template>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead>
            <tr class="border-b border-gray-700">
              <th class="px-5 pb-3 pt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
              <th class="px-5 pb-3 pt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Content</th>
              <th class="px-5 pb-3 pt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Reported By</th>
              <th class="px-5 pb-3 pt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Reason</th>
              <th class="px-5 pb-3 pt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
              <th class="px-5 pb-3 pt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody v-if="currentReports.length" class="divide-y divide-gray-700/50">
            <tr v-for="report in currentReports" :key="report.id" class="hover:bg-gray-700/30 transition-colors align-top">
              <td class="px-5 py-3">
                <span
                  class="px-2 py-0.5 rounded text-xs font-semibold"
                  :class="report.thread_id && !report.post_id ? 'bg-blue-500/10 text-blue-400' : 'bg-violet-500/10 text-violet-400'"
                >
                  {{ report.thread_id && !report.post_id ? 'Thread' : 'Post' }}
                </span>
              </td>
              <td class="px-5 py-3 text-gray-300 max-w-sm">
                <div>{{ truncate(report.post?.content ? stripHtml(report.post.content) : report.thread?.title, 80) }}</div>
                <div v-if="report.post?.content" class="mt-1 text-xs text-gray-500 leading-relaxed">{{ postPreview(report) }}</div>
                <router-link
                  v-if="reportThreadSlug(report)"
                  :to="'/thread/' + reportThreadSlug(report)"
                  class="mt-1 inline-block text-xs text-violet-400 hover:text-violet-300"
                >
                  View Thread &rarr;
                </router-link>
              </td>
              <td class="px-5 py-3 text-gray-400">{{ report.reporter?.username || '\u2014' }}</td>
              <td class="px-5 py-3 text-gray-400 max-w-xs">{{ truncate(report.reason, 60) }}</td>
              <td class="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">{{ formatDate(report.created_at) }}</td>
              <td class="px-5 py-3 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    v-if="reportTab !== 'reviewed'"
                    @click="markReviewed(report)"
                    class="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors"
                  >
                    Reviewed
                  </button>
                  <button
                    v-if="reportTab !== 'dismissed'"
                    @click="dismissReport(report)"
                    class="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-600/30 text-gray-400 hover:bg-gray-600/50 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="6" class="px-5 py-12 text-center text-sm text-gray-500">
                No {{ reportTab }} reports
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Thread Management -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-700/50 flex items-center justify-between gap-4">
        <h2 class="text-base font-semibold text-white shrink-0">Threads</h2>
        <input
          v-model="threadSearch"
          @keyup.enter="fetchThreads(1)"
          placeholder="Search threads..."
          class="bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500 w-64"
        />
      </div>

      <!-- Bulk Action Bar -->
      <div v-if="selectedThreads.size > 0" class="px-5 py-3 border-b border-gray-700/50 bg-violet-500/5 flex items-center gap-3 flex-wrap">
        <span class="text-sm font-medium text-violet-400">{{ selectedThreads.size }} selected</span>
        <button @click="bulkLock(true)" :disabled="bulkLoading" class="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors disabled:opacity-50">Lock selected</button>
        <button @click="bulkLock(false)" :disabled="bulkLoading" class="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors disabled:opacity-50">Unlock selected</button>
        <button @click="bulkDelete" :disabled="bulkLoading" class="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-50">Delete selected</button>
      </div>

      <template v-if="threadsLoading">
        <div v-for="i in 5" :key="i" class="flex items-center gap-4 px-5 py-4 border-b border-gray-700/30 animate-pulse">
          <div class="h-4 bg-gray-700 rounded w-4"></div>
          <div class="h-4 bg-gray-700 rounded flex-1"></div>
          <div class="h-4 bg-gray-700 rounded w-32"></div>
        </div>
      </template>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead>
            <tr class="border-b border-gray-700">
              <th class="px-3 pb-3 pt-4 w-10">
                <input type="checkbox" v-model="allSelected" class="rounded border-gray-600 bg-gray-700 text-violet-500 focus:ring-violet-500" />
              </th>
              <th class="px-5 pb-3 pt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</th>
              <th class="px-5 pb-3 pt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Author</th>
              <th class="px-5 pb-3 pt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Forum</th>
              <th class="px-5 pb-3 pt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th class="px-5 pb-3 pt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody v-if="threads.length" class="divide-y divide-gray-700/50">
            <tr v-for="thread in threads" :key="thread.id" class="hover:bg-gray-700/30 transition-colors">
              <td class="px-3 py-3">
                <input type="checkbox" :checked="selectedThreads.has(thread.id)" @change="toggleThread(thread.id)" class="rounded border-gray-600 bg-gray-700 text-violet-500 focus:ring-violet-500" />
              </td>
              <td class="px-5 py-3 text-gray-200 font-medium max-w-xs truncate">{{ thread.title }}</td>
              <td class="px-5 py-3 text-gray-400">{{ thread.user?.username || '\u2014' }}</td>
              <td class="px-5 py-3 text-gray-400">{{ thread.forum?.name || '\u2014' }}</td>
              <td class="px-5 py-3">
                <div class="flex items-center gap-1.5">
                  <span v-if="thread.is_pinned" class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400">Pinned</span>
                  <span v-if="thread.is_locked" class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400">Locked</span>
                  <span v-if="thread.is_solved" class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-500/10 text-green-400">Solved</span>
                </div>
              </td>
              <td class="px-5 py-3 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button @click="handlePin(thread.id)" class="p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors" :title="thread.is_pinned ? 'Unpin' : 'Pin'">
                    <i class="fa-solid fa-thumbtack text-xs" :class="thread.is_pinned ? 'text-blue-400' : 'text-gray-500'"></i>
                  </button>
                  <button @click="handleLock(thread.id)" class="p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors" :title="thread.is_locked ? 'Unlock' : 'Lock'">
                    <i class="fa-solid fa-lock text-xs" :class="thread.is_locked ? 'text-amber-400' : 'text-gray-500'"></i>
                  </button>
                  <button @click="handleSolve(thread.id)" class="p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors" :title="thread.is_solved ? 'Unsolve' : 'Solve'">
                    <i class="fa-solid fa-check text-xs" :class="thread.is_solved ? 'text-green-400' : 'text-gray-500'"></i>
                  </button>
                  <button @click="handleDelete(thread.id)" class="p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors" title="Delete">
                    <i class="fa-solid fa-trash text-xs text-red-400"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="6" class="px-5 py-12 text-center text-sm text-gray-500">No threads found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="threadsMeta.last_page > 1" class="px-5 py-3 border-t border-gray-700/50 flex items-center justify-between">
        <span class="text-xs text-gray-500">Page {{ threadsMeta.current_page }} of {{ threadsMeta.last_page }} ({{ threadsMeta.total }} total)</span>
        <div class="flex items-center gap-1">
          <button
            @click="fetchThreads(threadsMeta.current_page - 1)"
            :disabled="threadsMeta.current_page <= 1"
            class="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >Prev</button>
          <button
            @click="fetchThreads(threadsMeta.current_page + 1)"
            :disabled="threadsMeta.current_page >= threadsMeta.last_page"
            class="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >Next</button>
        </div>
      </div>
    </div>
  </div>
</template>
