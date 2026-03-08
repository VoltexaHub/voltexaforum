<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { getStaffThreads, staffPinThread, staffLockThread, staffSolveThread, staffDeleteThread, staffDeletePost } from '../../services/api'
import { useToastStore } from '../../stores/toast'

const authStore = useAuthStore()
const toast = useToastStore()

const threads = ref([])
const meta = ref({})
const loading = ref(true)
const search = ref('')
const page = ref(1)
const acting = ref(null)

async function fetchThreads() {
  loading.value = true
  try {
    const params = { page: page.value }
    if (search.value.trim()) params.search = search.value.trim()
    const res = await getStaffThreads(params)
    threads.value = res.data.data || []
    meta.value = res.data.meta || {}
  } catch {
    toast.error('Failed to load threads.')
  } finally {
    loading.value = false
  }
}

async function togglePin(thread) {
  acting.value = thread.id
  try {
    const res = await staffPinThread(thread.id)
    const updated = res.data.data
    const idx = threads.value.findIndex(t => t.id === thread.id)
    if (idx !== -1) threads.value[idx] = { ...threads.value[idx], ...updated }
    toast.success(res.data.message)
  } catch { toast.error('Failed.') }
  finally { acting.value = null }
}

async function toggleLock(thread) {
  acting.value = thread.id
  try {
    const res = await staffLockThread(thread.id)
    const updated = res.data.data
    const idx = threads.value.findIndex(t => t.id === thread.id)
    if (idx !== -1) threads.value[idx] = { ...threads.value[idx], ...updated }
    toast.success(res.data.message)
  } catch { toast.error('Failed.') }
  finally { acting.value = null }
}

async function toggleSolve(thread) {
  acting.value = thread.id
  try {
    const res = await staffSolveThread(thread.id)
    const updated = res.data.data
    const idx = threads.value.findIndex(t => t.id === thread.id)
    if (idx !== -1) threads.value[idx] = { ...threads.value[idx], ...updated }
    toast.success(res.data.message)
  } catch { toast.error('Failed.') }
  finally { acting.value = null }
}

async function deleteThread(thread) {
  if (!window.confirm(`Delete thread "${thread.title}"? This cannot be undone.`)) return
  acting.value = thread.id
  try {
    await staffDeleteThread(thread.id)
    threads.value = threads.value.filter(t => t.id !== thread.id)
    toast.success('Thread deleted.')
  } catch { toast.error('Failed to delete thread.') }
  finally { acting.value = null }
}

function handleSearch() {
  page.value = 1
  fetchThreads()
}

function goPage(p) {
  page.value = p
  fetchThreads()
}

onMounted(fetchThreads)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <h2 class="text-lg font-semibold text-white">
        <i class="fa-solid fa-comments text-blue-400 mr-2"></i>Thread Management
      </h2>
      <form @submit.prevent="handleSearch" class="flex gap-2">
        <input v-model="search" type="text" placeholder="Search threads..."
          class="px-3 py-2 rounded-lg border text-sm bg-gray-900 border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
        <button type="submit" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors">
          Search
        </button>
      </form>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-14 rounded-xl animate-pulse bg-gray-800" />
    </div>

    <!-- Table -->
    <div v-else class="rounded-xl border overflow-hidden bg-gray-800 border-gray-700">
      <div v-if="!threads.length" class="p-8 text-center text-gray-500">No threads found.</div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-700 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <th class="text-left px-5 py-3">Thread</th>
            <th class="text-left px-5 py-3 hidden sm:table-cell">Author</th>
            <th class="text-center px-3 py-3">Status</th>
            <th class="text-right px-5 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="thread in threads" :key="thread.id"
            class="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors last:border-0">
            <td class="px-5 py-3">
              <router-link :to="`/thread/${thread.id}`" class="text-white font-medium hover:text-violet-400 transition-colors">
                {{ thread.title }}
              </router-link>
              <div v-if="thread.forum" class="text-xs text-gray-500 mt-0.5">{{ thread.forum.name }}</div>
            </td>
            <td class="px-5 py-3 text-gray-400 hidden sm:table-cell">{{ thread.user?.username || '—' }}</td>
            <td class="px-3 py-3 text-center">
              <div class="flex items-center justify-center gap-1.5">
                <span v-if="thread.is_pinned" class="text-amber-400" title="Pinned"><i class="fa-solid fa-thumbtack text-xs"></i></span>
                <span v-if="thread.is_locked" class="text-red-400" title="Locked"><i class="fa-solid fa-lock text-xs"></i></span>
                <span v-if="thread.is_solved" class="text-green-400" title="Solved"><i class="fa-solid fa-check text-xs"></i></span>
              </div>
            </td>
            <td class="px-5 py-3 text-right">
              <div class="flex items-center justify-end gap-1">
                <button @click="togglePin(thread)" :disabled="acting === thread.id" title="Pin/Unpin"
                  class="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-amber-400 transition-colors disabled:opacity-50">
                  <i class="fa-solid fa-thumbtack text-xs"></i>
                </button>
                <button @click="toggleLock(thread)" :disabled="acting === thread.id" title="Lock/Unlock"
                  class="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50">
                  <i class="fa-solid fa-lock text-xs"></i>
                </button>
                <button @click="toggleSolve(thread)" :disabled="acting === thread.id" title="Solved/Unsolved"
                  class="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-green-400 transition-colors disabled:opacity-50">
                  <i class="fa-solid fa-check text-xs"></i>
                </button>
                <button @click="deleteThread(thread)" :disabled="acting === thread.id" title="Delete"
                  class="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50">
                  <i class="fa-solid fa-trash text-xs"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="flex justify-center gap-2">
      <button v-for="p in meta.last_page" :key="p" @click="goPage(p)"
        class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        :class="p === meta.current_page ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'">
        {{ p }}
      </button>
    </div>
  </div>
</template>
