<script setup>
import { inject, ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getTagThreads } from '../services/api'
import UserAvatar from '../components/UserAvatar.vue'
import ThreadPrefix from '../components/ThreadPrefix.vue'
import ThreadTags from '../components/ThreadTags.vue'
import { formatRelative } from '../utils/date'

const isDark = inject('isDark')
const route = useRoute()

const tag = ref(null)
const threads = ref([])
const loading = ref(true)
const error = ref(null)
const currentPage = ref(1)
const pagination = ref(null)

async function loadThreads(page = 1) {
  loading.value = true
  error.value = null
  try {
    const res = await getTagThreads(route.params.slug, { page })
    threads.value = res.data.data || []
    tag.value = res.data.tag || null
    pagination.value = res.data.meta || null
    currentPage.value = page
  } catch {
    error.value = 'Failed to load threads.'
  } finally {
    loading.value = false
  }
}

onMounted(() => loadThreads(1))
watch(() => route.params.slug, () => loadThreads(1))
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
    <!-- Loading -->
    <div v-if="loading && !threads.length" class="space-y-4">
      <div class="h-8 rounded w-1/4 animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
      <div class="rounded-xl animate-pulse" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
        <div v-for="i in 5" :key="i" class="flex items-center gap-4 px-5 py-4" :class="i < 5 ? (isDark ? 'border-b border-gray-800/50' : 'border-b border-gray-100') : ''">
          <div class="w-8 h-8 rounded-full" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          <div class="flex-1 space-y-2">
            <div class="h-4 rounded w-2/3" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
            <div class="h-3 rounded w-1/4" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-20">
      <i class="fa-solid fa-face-sad-tear text-5xl text-gray-400"></i>
      <p class="text-lg font-medium mt-4" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ error }}</p>
      <button @click="loadThreads(currentPage)" class="mt-4 px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">Retry</button>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold">
          <span class="text-purple-accent">#{{ tag?.name }}</span>
        </h1>
        <p class="text-sm mt-1" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
          {{ pagination?.total || 0 }} thread{{ (pagination?.total || 0) === 1 ? '' : 's' }} with this tag
        </p>
      </div>

      <!-- Thread list -->
      <div class="rounded-xl overflow-hidden transition-colors duration-300" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
        <div
          class="hidden sm:grid grid-cols-[1fr_100px_100px_120px] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider"
          :class="isDark ? 'bg-gray-800/50 text-gray-400 border-b border-gray-800' : 'bg-gray-50 text-gray-500 border-b border-gray-200'"
        >
          <span>Thread</span>
          <span class="text-center">Replies</span>
          <span class="text-center">Views</span>
          <span class="text-right">Last Reply</span>
        </div>

        <div v-if="!threads.length" class="p-8 text-center" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
          No threads found with this tag.
        </div>

        <router-link
          v-for="(thread, idx) in threads" :key="thread.id"
          :to="`/thread/${thread.slug || thread.id}`"
          class="block sm:grid grid-cols-[1fr_100px_100px_120px] gap-4 items-center px-5 py-4 transition-colors duration-150"
          :class="[
            isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50',
            idx < threads.length - 1 ? (isDark ? 'border-b border-gray-800/50' : 'border-b border-gray-100') : '',
          ]"
        >
          <div class="flex items-center gap-3 min-w-0">
            <UserAvatar :name="thread.author?.username" :color="thread.author?.avatar_color || 'bg-purple-500'" :avatar-url="thread.author?.avatar_url" size="sm" />
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <ThreadPrefix :prefix="thread.prefix" />
                <span v-if="thread.is_solved" class="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">Solved</span>
                <span class="font-medium truncate">{{ thread.title }}</span>
              </div>
              <div class="text-sm mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                <span :style="thread.author?.group_color ? { color: thread.author.group_color } : {}">{{ thread.author?.username }}</span>
              </div>
              <ThreadTags :tags="thread.tags" class="mt-1" />
            </div>
          </div>
          <div class="hidden sm:block text-center font-medium text-sm" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ thread.replies_count ?? thread.reply_count ?? 0 }}</div>
          <div class="hidden sm:block text-center text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ (thread.views ?? thread.view_count ?? 0).toLocaleString() }}</div>
          <div class="hidden sm:block text-right text-sm" :class="isDark ? 'text-gray-500' : 'text-gray-400'">{{ formatRelative(thread.last_reply_at) }}</div>
        </router-link>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.last_page > 1" class="flex items-center justify-center gap-2 mt-6">
        <button
          v-for="page in pagination.last_page" :key="page"
          @click="loadThreads(page)"
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          :class="currentPage === page ? 'bg-purple-accent text-white' : isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'"
        >{{ page }}</button>
      </div>
    </template>
  </div>
</template>
