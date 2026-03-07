<script setup>
import { inject, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useForumStore } from '../stores/forum'
import { getThread, getThreadPosts, pinThread, lockThread, deleteThread, moveThread, likeThread as likeThreadApi, reportPost, toggleThreadSubscription, getThreadSubscription, markSolved, unmarkSolved } from '../services/api'
import { useToastStore } from '../stores/toast'
import ThreadPrefix from '../components/ThreadPrefix.vue'
import ThreadTags from '../components/ThreadTags.vue'
import PostCard from '../components/PostCard.vue'
import PostEditor from '../components/PostEditor.vue'

const isDark = inject('isDark')
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const forumStore = useForumStore()

const thread = ref(null)
const posts = ref([])
const loading = ref(true)
const error = ref(null)
const pagination = ref(null)
const currentPage = ref(1)

// Likes state
const liked = ref(false)
const likesCount = ref(0)
const likers = ref([])

// Report state
const showReportModal = ref(false)
const reportPostId = ref(null)
const reportReason = ref('')
const reportSubmitting = ref(false)

// Subscription state
const subscribed = ref(false)
const subLoading = ref(false)

// Moderation state
const showMoveDropdown = ref(false)
const modActionLoading = ref(null)
const toast = useToastStore()

function isFirstPost(post) {
  return posts.value.length > 0 && posts.value[0].id === post.id && currentPage.value === 1
}

// Moderation actions
async function togglePin() {
  if (!thread.value || modActionLoading.value) return
  modActionLoading.value = 'pin'
  try {
    const res = await pinThread(thread.value.id)
    thread.value.is_pinned = res.data.data.is_pinned
  } catch {} finally { modActionLoading.value = null }
}

async function toggleLock() {
  if (!thread.value || modActionLoading.value) return
  modActionLoading.value = 'lock'
  try {
    const res = await lockThread(thread.value.id)
    thread.value.is_locked = res.data.data.is_locked
  } catch {} finally { modActionLoading.value = null }
}

async function handleDeleteThread() {
  if (!thread.value) return
  if (!confirm('Are you sure you want to delete this entire thread? This cannot be undone.')) return
  modActionLoading.value = 'delete'
  try {
    await deleteThread(thread.value.id)
    router.push(thread.value.forum ? `/forum/${thread.value.forum.slug}` : '/')
  } catch {} finally { modActionLoading.value = null }
}

async function handleMoveThread(forumId) {
  if (!thread.value || !forumId) return
  modActionLoading.value = 'move'
  try {
    const res = await moveThread(thread.value.id, forumId)
    thread.value.forum = res.data.data.forum
    thread.value.forum_id = forumId
    showMoveDropdown.value = false
  } catch {} finally { modActionLoading.value = null }
}

async function handleLike() {
  if (!authStore.isLoggedIn) return
  try {
    const res = await likeThreadApi(thread.value.id)
    const data = res.data.data || res.data
    liked.value = data.liked
    likesCount.value = data.likes_count ?? data.likesCount ?? likesCount.value
    likers.value = data.likers || likers.value
  } catch {}
}

function openReportModal(postId) {
  reportPostId.value = postId
  reportReason.value = ''
  showReportModal.value = true
}

async function submitReport() {
  if (!reportReason.value.trim()) return
  reportSubmitting.value = true
  try {
    await reportPost({ post_id: reportPostId.value, reason: reportReason.value })
    toast.show('Report submitted')
    showReportModal.value = false
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to submit report', 'error')
  } finally {
    reportSubmitting.value = false
  }
}

async function toggleSubscribe() {
  if (subLoading.value) return
  subLoading.value = true
  const prev = subscribed.value
  subscribed.value = !prev
  try {
    const res = await toggleThreadSubscription(route.params.id)
    subscribed.value = res.data.subscribed ?? res.data.data?.subscribed ?? !prev
  } catch {
    subscribed.value = prev
  } finally {
    subLoading.value = false
  }
}

async function handleMarkSolved(postId) {
  try {
    const res = await markSolved(thread.value.id, postId)
    const data = res.data.data || res.data
    thread.value.is_solved = true
    thread.value.solved_post_id = data.solved_post_id
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to mark as solved', 'error')
  }
}

async function handleUnmarkSolved() {
  try {
    await unmarkSolved(thread.value.id)
    thread.value.is_solved = false
    thread.value.solved_post_id = null
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to unmark solved', 'error')
  }
}

function handlePostUpdated(updatedData) {
  const idx = posts.value.findIndex(p => p.id === updatedData.id)
  if (idx !== -1) {
    posts.value[idx] = { ...posts.value[idx], body: updatedData.body, rendered_content: updatedData.rendered_content, edited_at: updatedData.edited_at }
  }
}

function handlePostDeleted(postId) {
  posts.value = posts.value.filter(p => p.id !== postId)
}

function handleThreadDeleted() {
  router.push(thread.value.forum ? `/forum/${thread.value.forum.slug}` : '/')
}

function handleThreadTitleUpdated(newTitle) {
  thread.value.title = newTitle
}

function handlePostSubmitted(newPost) {
  posts.value.push(newPost)
}

async function loadThread() {
  loading.value = true
  error.value = null
  try {
    await forumStore.fetchConfig()
    if (authStore.isModerator) forumStore.fetchForums()
    const [threadRes, postsRes] = await Promise.all([
      getThread(route.params.id),
      getThreadPosts(route.params.id, 1),
    ])
    const threadData = threadRes.data.data
    thread.value = threadData
    likers.value = threadData.likers || []
    liked.value = threadData.is_liked_by_me ?? false
    likesCount.value = threadData.likes_count ?? 0
    posts.value = postsRes.data.data
    pagination.value = postsRes.data.meta || null
    if (authStore.isLoggedIn) {
      try {
        const subRes = await getThreadSubscription(route.params.id)
        subscribed.value = subRes.data.subscribed ?? subRes.data.data?.subscribed ?? false
      } catch {}
    }
  } catch (e) {
    error.value = 'Failed to load thread. Please try again.'
  } finally {
    loading.value = false
  }
}

async function loadPage(page) {
  try {
    const res = await getThreadPosts(route.params.id, page)
    posts.value = res.data.data
    pagination.value = res.data.meta || null
    currentPage.value = page
  } catch {}
}

onMounted(loadThread)
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="h-6 rounded w-1/3 animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
      <div class="h-8 rounded w-2/3 animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
      <div v-for="i in 2" :key="i" class="rounded-xl p-5 animate-pulse" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
        <div class="flex gap-4">
          <div class="w-14 h-14 rounded-full" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          <div class="flex-1 space-y-3">
            <div class="h-4 rounded w-1/4" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
            <div class="h-3 rounded w-full" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
            <div class="h-3 rounded w-3/4" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-20">
      <i class="fa-solid fa-face-sad-tear text-5xl text-gray-400"></i>
      <p class="text-lg font-medium mt-4" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ error }}</p>
      <button
        @click="loadThread"
        class="mt-4 px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        Retry
      </button>
    </div>

    <template v-else-if="thread">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm mb-6 flex-wrap"
           :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        <router-link to="/" class="hover:text-purple-accent transition-colors">Home</router-link>
        <template v-if="thread.forum?.category">
          <span>&#8250;</span>
          <span>{{ thread.forum.category.name }}</span>
        </template>
        <template v-if="thread.forum?.parent_forum">
          <span>&#8250;</span>
          <router-link :to="`/forum/${thread.forum.parent_forum.slug}`" class="hover:text-purple-accent transition-colors">
            {{ thread.forum.parent_forum.name }}
          </router-link>
        </template>
        <template v-if="thread.forum">
          <span>&#8250;</span>
          <router-link :to="`/forum/${thread.forum.slug}`" class="hover:text-purple-accent transition-colors">
            {{ thread.forum.name }}
          </router-link>
        </template>
      </nav>

      <!-- Thread title -->
      <div class="flex items-center gap-3 mb-2 flex-wrap">
        <ThreadPrefix :prefix="thread.prefix" />
        <h1 class="text-2xl font-bold">{{ thread.title }}</h1>
        <span v-if="thread.is_pinned" class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
          <i class="fa-solid fa-thumbtack text-[10px]"></i> PINNED
        </span>
        <span v-if="thread.is_locked" class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
          <i class="fa-solid fa-lock text-[10px]"></i> LOCKED
        </span>
        <span v-if="thread.is_solved" class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
          <i class="fa-solid fa-check text-[10px]"></i> SOLVED
        </span>
      </div>
      <ThreadTags :tags="thread.tags" class="mb-2" />

      <!-- Thread like + Subscribe + Mod toolbar row -->
      <div class="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <!-- Left: Thread like + likers + Subscribe -->
        <div class="flex items-center gap-3 flex-wrap">
          <!-- Thread like -->
          <button
            @click="handleLike"
            :disabled="!authStore.isLoggedIn"
            class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors"
            :class="liked
              ? 'border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/20'
              : isDark ? 'border-gray-700 text-gray-500 hover:text-red-400 hover:border-red-500/40' : 'border-gray-200 text-gray-400 hover:text-red-400 hover:border-red-300'"
          >
            <i :class="liked ? 'fa-solid fa-heart text-[11px]' : 'fa-regular fa-heart text-[11px]'"></i>
            <span>{{ likesCount || 'Like' }}</span>
          </button>

          <!-- Subscribe -->
          <button
            v-if="authStore.isLoggedIn"
          @click="toggleSubscribe"
          :disabled="subLoading"
          class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors"
          :class="subscribed
            ? 'border-violet-500/40 text-violet-400 bg-violet-500/10 hover:bg-violet-500/20'
            : isDark ? 'border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600' : 'border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300'"
        >
          <i :class="subscribed ? 'fa-solid fa-bell text-[11px]' : 'fa-regular fa-bell text-[11px]'"></i>
          {{ subscribed ? 'Subscribed' : 'Subscribe' }}
        </button>
        <div v-else />

                </div><!-- end left group -->

        <!-- Mod toolbar -->
        <div v-if="authStore.isModerator" class="flex items-center gap-1 px-2 py-1 rounded-lg border" :class="isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'">
          <span class="text-[10px] font-semibold uppercase tracking-widest mr-1.5" :class="isDark ? 'text-gray-600' : 'text-gray-400'">
            <i class="fa-solid fa-shield-halved"></i>
          </span>
          <button
            @click="togglePin"
            :disabled="modActionLoading === 'pin'"
            class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
            :class="thread.is_pinned ? 'text-yellow-400 bg-yellow-500/10' : isDark ? 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'"
            :title="thread.is_pinned ? 'Unpin' : 'Pin'"
          >
            <i class="fa-solid fa-thumbtack text-[11px]"></i>
            <span>{{ thread.is_pinned ? 'Unpin' : 'Pin' }}</span>
          </button>
          <button
            @click="toggleLock"
            :disabled="modActionLoading === 'lock'"
            class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
            :class="thread.is_locked ? 'text-blue-400 bg-blue-500/10' : isDark ? 'text-gray-500 hover:text-blue-400 hover:bg-blue-500/10' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'"
            :title="thread.is_locked ? 'Unlock' : 'Lock'"
          >
            <i :class="['text-[11px]', thread.is_locked ? 'fa-solid fa-lock-open' : 'fa-solid fa-lock']"></i>
            <span>{{ thread.is_locked ? 'Unlock' : 'Lock' }}</span>
          </button>
          <button
            @click="handleDeleteThread"
            :disabled="modActionLoading === 'delete'"
            class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
            :class="isDark ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'"
            title="Delete thread"
          >
            <i class="fa-solid fa-trash text-[11px]"></i>
            <span>Delete</span>
          </button>
        <div v-if="authStore.isAdmin" class="relative">
          <button
            @click="showMoveDropdown = !showMoveDropdown"
            :disabled="modActionLoading === 'move'"
            class="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full transition-colors bg-gray-500/15 text-gray-400 hover:bg-gray-500/25"
          >
            <i class="fa-solid fa-arrow-right"></i>
            Move
          </button>
          <div
            v-if="showMoveDropdown"
            class="absolute top-full left-0 mt-1 z-50 w-56 rounded-lg border shadow-lg py-1 max-h-64 overflow-y-auto"
            :class="isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
          >
            <button
              v-for="forum in forumStore.forums.filter(f => f.id !== thread.forum_id)"
              :key="forum.id"
              @click="handleMoveThread(forum.id)"
              class="w-full text-left px-3 py-2 text-sm transition-colors"
              :class="isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'"
            >
              {{ forum.name }}
            </button>
          </div>
        </div>
        </div>
      </div>

      <!-- Posts -->
      <div class="space-y-4">
        <PostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          :thread="thread"
          :is-dark="isDark"
          :is-first-post="isFirstPost(post)"
          @post-updated="handlePostUpdated"
          @post-deleted="handlePostDeleted"
          @thread-deleted="handleThreadDeleted"
          @thread-title-updated="handleThreadTitleUpdated"
          @mark-solved="handleMarkSolved"
          @unmark-solved="handleUnmarkSolved"
          @report="openReportModal"
        />
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.last_page > 1" class="flex items-center justify-center gap-2 mt-6">
        <button
          v-for="page in pagination.last_page"
          :key="page"
          @click="loadPage(page)"
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          :class="currentPage === page
            ? 'bg-purple-accent text-white'
            : isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'"
        >
          {{ page }}
        </button>
      </div>

      <!-- Reply box -->
      <PostEditor
        :thread="thread"
        :is-dark="isDark"
        @post-submitted="handlePostSubmitted"
      />
    </template>

    <!-- Report Modal -->
    <Teleport to="body">
      <div v-if="showReportModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" @click="showReportModal = false"></div>
        <div class="relative w-full max-w-md rounded-xl p-6 shadow-xl" :class="isDark ? 'bg-gray-800' : 'bg-white'">
          <h3 class="text-lg font-semibold mb-4" :class="isDark ? 'text-white' : 'text-gray-900'">Report Post</h3>
          <textarea
            v-model="reportReason"
            rows="4"
            maxlength="500"
            placeholder="Describe the reason for reporting this post..."
            class="w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent resize-none"
            :class="isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
          ></textarea>
          <div class="flex items-center justify-between mt-2">
            <span class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">{{ reportReason.length }}/500</span>
            <div class="flex gap-2">
              <button
                @click="showReportModal = false"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'"
              >
                Cancel
              </button>
              <button
                @click="submitReport"
                :disabled="reportSubmitting || !reportReason.trim()"
                class="px-4 py-2 bg-purple-accent hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {{ reportSubmitting ? 'Submitting...' : 'Submit Report' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
