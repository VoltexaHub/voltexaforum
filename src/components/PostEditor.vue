<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { createPost } from '../services/api'
import MarkdownEditor from './MarkdownEditor.vue'

const props = defineProps({
  thread: Object,
  isDark: Boolean,
})

const emit = defineEmits(['post-submitted'])

const route = useRoute()
const authStore = useAuthStore()

const replyText = ref('')
const submitting = ref(false)
const replyError = ref(null)

async function submitReply() {
  if (!replyText.value.trim()) return
  submitting.value = true
  replyError.value = null
  try {
    const res = await createPost(route.params.id, { body: replyText.value })
    emit('post-submitted', res.data.data)
    replyText.value = ''
  } catch (e) {
    replyError.value = e.response?.data?.message || 'Failed to post reply.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div
    class="rounded-xl mt-6 p-5 transition-colors duration-300"
    :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
  >
    <template v-if="thread.is_locked && !authStore.isModerator">
      <p class="text-center py-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        <i class="fa-solid fa-lock mr-1"></i> This thread is locked. No new replies can be posted.
      </p>
    </template>
    <template v-else-if="authStore.isLoggedIn">
      <h3 class="font-semibold mb-3">Reply to this thread</h3>
      <div
        v-if="replyError"
        class="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
      >
        {{ replyError }}
      </div>
      <MarkdownEditor
        v-model="replyText"
        placeholder="Write your reply... Use @ to mention users"
        :rows="5"
      />
      <div class="flex justify-end mt-3">
        <button
          @click="submitReply"
          :disabled="submitting || !replyText.trim()"
          class="px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg v-if="submitting" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ submitting ? 'Posting...' : 'Submit Reply' }}
        </button>
      </div>
    </template>
    <template v-else>
      <p class="text-center py-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        <router-link to="/login" class="text-purple-accent hover:underline font-medium">Login</router-link>
        to reply to this thread.
      </p>
    </template>
  </div>
</template>
