<script setup>
import { ref, onMounted } from 'vue'
import { getAdminThreads, pinThread, lockThread, solveThread, adminDeletePost } from '../../services/api'
import { useToastStore } from '../../stores/toast'
import UserAvatar from '../../components/UserAvatar.vue'

const toast = useToastStore()
const loading = ref(true)
const error = ref(null)

const activeTab = ref('threads')
const threads = ref([])

async function fetchThreads() {
  loading.value = true
  error.value = null
  try {
    const res = await getAdminThreads()
    const d = res.data
    threads.value = d.data || d || []
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to load threads'
    toast.show(error.value, 'error')
  } finally {
    loading.value = false
  }
}

async function doPin(thread) {
  try {
    await pinThread(thread.id)
    thread.is_pinned = !thread.is_pinned
    toast.show(thread.is_pinned ? 'Thread pinned' : 'Thread unpinned')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to pin thread', 'error')
  }
}

async function doLock(thread) {
  try {
    await lockThread(thread.id)
    thread.is_locked = !thread.is_locked
    toast.show(thread.is_locked ? 'Thread locked' : 'Thread unlocked')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to lock thread', 'error')
  }
}

async function doSolve(thread) {
  try {
    await solveThread(thread.id)
    thread.is_solved = !thread.is_solved
    toast.show(thread.is_solved ? 'Thread marked as solved' : 'Thread unmarked')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to update thread', 'error')
  }
}

async function doDeletePost(postId) {
  if (!confirm('Delete this post?')) return
  try {
    await adminDeletePost(postId)
    toast.show('Post deleted')
    fetchThreads()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to delete post', 'error')
  }
}

onMounted(fetchThreads)
</script>

<template>
  <div class="space-y-6">
    <!-- Error -->
    <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
      <span class="text-sm text-red-400">{{ error }}</span>
      <button @click="fetchThreads" class="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30 transition-colors">Retry</button>
    </div>

    <!-- Threads Table -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-700/50 flex items-center justify-between">
        <h2 class="text-base font-semibold text-white">Thread Moderation</h2>
        <span class="text-xs text-gray-500">{{ threads.length }} threads</span>
      </div>

      <!-- Loading -->
      <template v-if="loading">
        <div v-for="i in 5" :key="i" class="flex items-center gap-4 px-5 py-4 border-b border-gray-700/30 animate-pulse">
          <div class="h-4 bg-gray-700 rounded flex-1"></div>
          <div class="h-4 bg-gray-700 rounded w-20"></div>
          <div class="h-4 bg-gray-700 rounded w-32"></div>
        </div>
      </template>

      <div v-else class="divide-y divide-gray-700/50">
        <div
          v-for="thread in threads"
          :key="thread.id"
          class="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 gap-3 hover:bg-gray-700/30 transition-colors"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-medium text-gray-200 truncate">{{ thread.title }}</span>
              <span v-if="thread.is_pinned" class="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded text-xs">Pinned</span>
              <span v-if="thread.is_locked" class="px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">Locked</span>
              <span v-if="thread.is_solved" class="px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded text-xs">Solved</span>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              by {{ thread.author?.username || thread.author }} &middot; {{ thread.forum?.name || thread.forum }} &middot; {{ thread.reply_count || thread.replies || 0 }} replies
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <button
              @click="doPin(thread)"
              class="px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors"
              :class="thread.is_pinned ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'"
            >
              📌 {{ thread.is_pinned ? 'Unpin' : 'Pin' }}
            </button>
            <button
              @click="doLock(thread)"
              class="px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors"
              :class="thread.is_locked ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'"
            >
              🔒 {{ thread.is_locked ? 'Unlock' : 'Lock' }}
            </button>
            <button
              @click="doSolve(thread)"
              class="px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors"
              :class="thread.is_solved ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'"
            >
              ✅ {{ thread.is_solved ? 'Unsolve' : 'Solve' }}
            </button>
          </div>
        </div>

        <div v-if="!threads.length" class="px-5 py-12 text-center text-sm text-gray-500">
          No threads found
        </div>
      </div>
    </div>
  </div>
</template>
