<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { updatePost, updateThread, adminDeletePost, deleteThread, likePost as likePostApi, pinThreadToProfile } from '../services/api'
import MarkdownEditor from './MarkdownEditor.vue'
import MarkdownRenderer from './MarkdownRenderer.vue'
import { formatDateTime, formatJoinDate } from '../utils/date'

const props = defineProps({
  post: Object,
  thread: Object,
  isDark: Boolean,
  isFirstPost: Boolean,
})

const emit = defineEmits(['post-updated', 'post-deleted', 'thread-deleted', 'thread-title-updated', 'mark-solved', 'unmark-solved', 'report'])

const authStore = useAuthStore()

// Editing state
const isEditing = ref(false)
const editBody = ref('')
const editTitle = ref('')
const editSaving = ref(false)

// Mod action loading
const modActionLoading = ref(null)

function canEdit() {
  if (!authStore.isLoggedIn) return false
  return authStore.user?.id === props.post.user_id || authStore.isModerator
}

function startEditing() {
  isEditing.value = true
  editBody.value = props.post.body || ''
  if (props.isFirstPost) {
    editTitle.value = props.thread?.title || ''
  }
}

function cancelEditing() {
  isEditing.value = false
  editBody.value = ''
  editTitle.value = ''
}

async function saveEdit() {
  editSaving.value = true
  try {
    if (props.isFirstPost) {
      await updateThread(props.thread.id, { title: editTitle.value, body: editBody.value })
      emit('thread-title-updated', editTitle.value)
    }
    const res = await updatePost(props.post.id, { body: editBody.value })
    const updated = res.data.data || res.data
    emit('post-updated', {
      id: props.post.id,
      body: updated.body || editBody.value,
      rendered_content: updated.rendered_content || null,
      edited_at: updated.edited_at || new Date().toISOString(),
    })
    cancelEditing()
  } catch {
    // keep editing open on failure
  } finally {
    editSaving.value = false
  }
}

function formatEditedTime(editedAt) {
  if (!editedAt) return ''
  const diff = Math.floor((Date.now() - new Date(editedAt).getTime()) / 60000)
  if (diff < 1) return 'Edited just now'
  if (diff < 60) return `Edited ${diff} minute${diff === 1 ? '' : 's'} ago`
  const hours = Math.floor(diff / 60)
  if (hours < 24) return `Edited ${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `Edited ${days} day${days === 1 ? '' : 's'} ago`
}

async function togglePostLike() {
  if (!authStore.isLoggedIn) return
  const post = props.post
  const prev = { liked: post.is_liked_by_me, count: post.like_count }
  post.is_liked_by_me = !prev.liked
  post.like_count = prev.count + (post.is_liked_by_me ? 1 : -1)
  try {
    const { data } = await likePostApi(post.id)
    post.is_liked_by_me = data.data.liked
    post.like_count = data.data.like_count
  } catch {
    post.is_liked_by_me = prev.liked
    post.like_count = prev.count
  }
}

const pinning = ref(false)
async function handlePinToProfile() {
  pinning.value = true
  try {
    await pinThreadToProfile(props.thread.id)
    alert('Thread pinned to your profile!')
  } catch {
    alert('Failed to pin thread.')
  } finally {
    pinning.value = false
  }
}

async function handleDeletePost() {
  if (props.isFirstPost) {
    if (!confirm('Delete this post and the entire thread?')) return
    modActionLoading.value = 'delete'
    try {
      await deleteThread(props.thread.id)
      emit('thread-deleted')
    } catch {} finally { modActionLoading.value = null }
  } else {
    if (!confirm('Delete this post?')) return
    modActionLoading.value = 'delete'
    try {
      await adminDeletePost(props.post.id)
      emit('post-deleted', props.post.id)
    } catch {} finally { modActionLoading.value = null }
  }
}
</script>

<template>
  <div
    class="rounded-xl overflow-hidden transition-colors duration-300"
    :class="[
      thread.solved_post_id === post.id
        ? 'border-l-4 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.08)]'
        : '',
      isDark ? 'bg-gray-900' : 'bg-white shadow-sm',
    ]"
  >
    <!-- Accepted Solution Banner -->
    <div v-if="thread.solved_post_id === post.id" class="flex items-center gap-2 px-5 py-2 bg-green-500/10 border-b border-green-500/20">
      <i class="fa-solid fa-check-circle text-green-400"></i>
      <span class="text-sm font-semibold text-green-400">Accepted Solution</span>
      <button v-if="authStore.isLoggedIn && (authStore.user?.id === thread.user_id || authStore.isModerator)" @click="$emit('unmark-solved')" class="ml-auto text-xs text-green-400/60 hover:text-green-400 transition-colors">Unmark</button>
    </div>
    <div class="flex flex-col sm:flex-row">
      <!-- Author sidebar -->
      <div
        class="sm:w-48 shrink-0 flex flex-col border-b sm:border-b-0 sm:border-r relative overflow-hidden"
        :class="isDark ? 'border-gray-800' : 'border-gray-100'"
      >
        <!-- Top section: bg + content overlay -->
        <div class="relative flex flex-col items-center pt-4 pb-3 px-3">
          <!-- Background image with fade -->
          <div
            v-if="post.author?.postbit_bg"
            class="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
            :style="{ backgroundImage: `url(${post.author.postbit_bg})` }"
          />
          <!-- Fade gradient -->
          <div
            v-if="post.author?.postbit_bg"
            class="absolute inset-0"
            :style="{ background: isDark ? 'linear-gradient(to bottom, rgba(17,24,39,0.2) 0%, rgba(17,24,39,0.7) 55%, rgba(17,24,39,1) 85%)' : 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.7) 55%, rgba(255,255,255,1) 85%)' }"
          />

          <!-- Content (z-10 above bg) -->
          <div class="relative z-10 w-full flex flex-col items-center gap-1.5">
            <!-- Username (TOP) -->
            <router-link
              :to="`/profile/${post.author?.username}`"
              class="font-bold text-sm hover:underline block truncate max-w-full text-center"
              :style="{ color: post.author?.group_color || undefined }"
              :class="!post.author?.group_color ? (isDark ? 'text-gray-100' : 'text-gray-900') : ''"
            >
              {{ post.author?.username }}
            </router-link>

            <!-- Group badge -->
            <div
              v-if="post.author?.group_label"
              class="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full"
              :style="{
                backgroundColor: (post.author?.group_color || '#6b7280') + '22',
                color: post.author?.group_color || '#6b7280',
              }"
            >
              {{ post.author?.group_label }}
            </div>

            <!-- Square avatar (larger, rounded-lg not rounded-full) -->
            <div class="mt-1.5 w-20 h-20 rounded-lg overflow-hidden shrink-0 ring-2 ring-offset-1"
                 :class="isDark ? 'ring-gray-700 ring-offset-gray-900' : 'ring-gray-200 ring-offset-white'"
            >
              <img
                v-if="post.author?.avatar_url"
                :src="post.author.avatar_url"
                class="w-full h-full object-cover"
                :alt="post.author?.username"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
                :style="{ backgroundColor: post.author?.avatar_color || '#7c3aed' }"
              >
                {{ post.author?.username?.charAt(0)?.toUpperCase() }}
              </div>
            </div>
          </div>
        </div>

        <!-- Divider + stats section -->
        <div class="hidden sm:block px-3 pb-3 flex flex-col gap-1.5">
          <div class="w-full border-t mb-1" :class="isDark ? 'border-gray-700/60' : 'border-gray-100'" />
          <div class="flex flex-col w-full gap-1.5">
            <div class="flex items-center gap-1.5 text-[11px]" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
              <i class="fa-solid fa-calendar-days w-3 text-center opacity-70" />
              <span class="truncate">{{ formatJoinDate(post.author?.created_at) }}</span>
            </div>
            <div class="flex items-center justify-between text-[11px]" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
              <span class="flex items-center gap-1.5">
                <i class="fa-solid fa-pen-to-square w-3 text-center opacity-70" />
                Posts
              </span>
              <span class="font-semibold" :class="isDark ? 'text-gray-300' : 'text-gray-600'">{{ (post.author?.post_count ?? 0).toLocaleString() }}</span>
            </div>
            <div class="flex items-center justify-between text-[11px]" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
              <span class="flex items-center gap-1.5">
                <i class="fa-solid fa-coins w-3 text-center opacity-70" />
                Credits
              </span>
              <span class="font-semibold text-purple-accent">{{ (post.author?.credits ?? 0).toLocaleString() }}</span>
            </div>
            <div v-if="post.author?.level" class="flex items-center justify-between text-[11px]" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
              <span class="flex items-center gap-1.5">
                <i class="fa-solid fa-arrow-up-right-dots w-3 text-center opacity-70" />
                Level
              </span>
              <span class="font-semibold flex items-center gap-1" :class="isDark ? 'text-gray-300' : 'text-gray-600'">
                {{ post.author.level }}
                <i v-if="post.author.xp_boost_active" class="fa-solid fa-bolt text-amber-400 text-[10px]" title="XP Boost Active"></i>
              </span>
            </div>
          </div>

          <!-- Awards -->
          <div
            v-if="post.author?.awards?.length"
            class="flex flex-wrap justify-center gap-1 mt-2 pt-2 border-t w-full"
            :class="isDark ? 'border-gray-700/60' : 'border-gray-100'"
          >
            <template v-for="award in post.author.awards.slice(0, 6)" :key="award.id">
              <img v-if="award.icon_url" :src="award.icon_url" class="w-5 h-5 object-contain" :title="award.name" />
            </template>
          </div>
        </div>
      </div>

      <!-- Post content -->
      <div class="flex-1 p-5 flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <span class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
              {{ formatDateTime(post.created_at) }}
            </span>
            <span
              v-if="post.edited_at"
              class="text-xs italic"
              :class="isDark ? 'text-gray-600' : 'text-gray-400'"
            >
              {{ formatEditedTime(post.edited_at) }}
            </span>
          </div>
          <div />
        </div>

        <!-- Editing mode -->
        <template v-if="isEditing">
          <div v-if="isFirstPost" class="mb-3">
            <label class="block text-xs font-medium mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Thread Title</label>
            <input
              v-model="editTitle"
              type="text"
              class="w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
              :class="isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'"
            />
          </div>
          <MarkdownEditor
            v-model="editBody"
            placeholder="Edit your post..."
            :rows="6"
          />
          <div class="flex items-center gap-2 mt-3">
            <button
              @click="saveEdit"
              :disabled="editSaving"
              class="px-4 py-2 bg-purple-accent hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {{ editSaving ? 'Saving...' : 'Save' }}
            </button>
            <button
              @click="cancelEditing"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'"
            >
              Cancel
            </button>
          </div>
        </template>

        <!-- Display mode -->
        <template v-else>
          <MarkdownRenderer :content="post.body" :rendered-content="post.rendered_content" :author-id="post.author?.id" />
        </template>

        <!-- Post footer — always anchored at bottom -->
        <div class="mt-auto pt-3 border-t flex items-center justify-between gap-3" :class="isDark ? 'border-gray-800' : 'border-gray-100'">
          <!-- Left: Like -->
          <button
            v-if="authStore.isLoggedIn"
            @click="togglePostLike"
            class="flex items-center gap-1.5 text-sm transition-colors"
            :class="post.is_liked_by_me ? 'text-pink-400' : isDark ? 'text-gray-500 hover:text-pink-400' : 'text-gray-400 hover:text-pink-400'"
          >
            <i :class="post.is_liked_by_me ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
            <span v-if="post.like_count > 0" class="text-xs">{{ post.like_count }} {{ post.like_count === 1 ? 'like' : 'likes' }}</span>
          </button>
          <div v-else />

          <!-- Right: Solved / Edit / Delete / Report -->
          <div class="flex items-center gap-1">
            <!-- Pin to Profile (thread author's first post only) -->
            <button
              v-if="isFirstPost && authStore.isLoggedIn && authStore.user?.id === thread.user_id"
              @click="handlePinToProfile"
              :disabled="pinning"
              class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
              :class="isDark ? 'text-gray-500 hover:text-amber-400 hover:bg-amber-500/10' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'"
              title="Pin to Profile"
            >
              <i class="fa-solid fa-thumbtack text-[11px]"></i>
              <span class="hidden sm:inline">Pin</span>
            </button>
            <!-- Mark as Solution button (non-OP posts only) -->
            <button
              v-if="authStore.isLoggedIn && (authStore.user?.id === thread.user_id || authStore.isModerator) && !isFirstPost && thread.solved_post_id !== post.id"
              @click.prevent="$emit('mark-solved', post.id)"
              class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
              :class="isDark ? 'text-gray-500 hover:text-green-400 hover:bg-green-500/10' : 'text-gray-400 hover:text-green-500 hover:bg-green-50'"
              title="Mark as Solution"
            >
              <i class="fa-solid fa-check text-[11px]"></i>
              <span class="hidden sm:inline">Solution</span>
            </button>
            <button
              v-if="canEdit()"
              @click="startEditing"
              class="text-xs px-2 py-1 rounded transition-colors"
              :class="isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'"
              title="Edit"
            >
              <i class="fa-solid fa-pen"></i>
            </button>
            <button
              v-if="authStore.isModerator"
              @click="handleDeletePost"
              :disabled="modActionLoading === 'delete'"
              class="text-xs px-2 py-1 rounded transition-colors text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
              :title="isFirstPost ? 'Delete thread' : 'Delete post'"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
            <button
              v-if="authStore.isLoggedIn && authStore.user?.id !== post.user_id"
              @click="$emit('report', post.id)"
              class="text-xs px-2 py-1 rounded transition-colors"
              :class="isDark ? 'text-gray-600 hover:text-orange-400 hover:bg-gray-800' : 'text-gray-300 hover:text-orange-500 hover:bg-gray-100'"
              title="Report"
            >
              <i class="fa-solid fa-flag"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
