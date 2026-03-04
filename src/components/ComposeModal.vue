<script setup>
import { inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import { startConversation, sendMessage, getMembers } from '../services/api'
import { useMessagesStore } from '../stores/messages'
import { useToastStore } from '../stores/toast'

const isDark = inject('isDark')
const router = useRouter()
const messagesStore = useMessagesStore()
const toastStore = useToastStore()

const emit = defineEmits(['close'])

const usernameInput = ref('')
const selectedUser = ref(null)
const userResults = ref([])
const searchingUsers = ref(false)
const body = ref('')
const sending = ref(false)
const error = ref(null)
let searchTimer = null

async function onUsernameInput() {
  selectedUser.value = null
  const q = usernameInput.value.trim()
  if (q.length < 1) { userResults.value = []; return }
  clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    searchingUsers.value = true
    try {
      const res = await getMembers({ q, per_page: 6 })
      userResults.value = (res.data.data?.data || res.data.data || []).slice(0, 6)
    } catch {}
    finally { searchingUsers.value = false }
  }, 250)
}

function selectUser(user) {
  selectedUser.value = user
  usernameInput.value = user.username
  userResults.value = []
}

async function handleSend() {
  if ((!selectedUser.value && !usernameInput.value.trim()) || !body.value.trim()) return
  sending.value = true
  error.value = null
  try {
    const payload = selectedUser.value
      ? { user_id: selectedUser.value.id }
      : { username: usernameInput.value.trim() }
    const convoRes = await startConversation(payload)
    const convoId = convoRes.data.data?.id
    if (!convoId) throw new Error('Failed to create conversation')
    await sendMessage(convoId, body.value.trim())
    await messagesStore.fetchConversations()
    toastStore.show('Message sent!')
    emit('close')
    router.push('/messages/' + convoId)
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to send message'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50" @click="emit('close')" />

      <!-- Modal -->
      <div
        class="relative w-full max-w-lg rounded-xl shadow-xl border overflow-hidden"
        :class="isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-6 py-4 border-b"
          :class="isDark ? 'border-gray-700' : 'border-gray-100'"
        >
          <h2 class="text-lg font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
            New Message
          </h2>
          <button
            @click="emit('close')"
            class="p-1.5 rounded-lg transition-colors"
            :class="isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'"
          >
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="px-6 py-4 space-y-4">
          <div v-if="error" class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {{ error }}
          </div>

          <div class="relative">
            <label class="block text-sm font-medium mb-1.5" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
              To
            </label>
            <input
              v-model="usernameInput"
              @input="onUsernameInput"
              type="text"
              placeholder="Search username..."
              autocomplete="off"
              class="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors"
              :class="[
                isDark ? 'bg-gray-900 border-gray-600 text-white placeholder:text-gray-500 focus:border-purple-accent' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-purple-accent',
                selectedUser ? 'border-purple-accent' : ''
              ]"
            />
            <!-- Search results dropdown -->
            <div
              v-if="userResults.length"
              class="absolute z-10 w-full mt-1 rounded-lg border shadow-lg overflow-hidden"
              :class="isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
            >
              <button
                v-for="u in userResults"
                :key="u.id"
                @mousedown.prevent="selectUser(u)"
                class="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors"
                :class="isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-800'"
              >
                <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  :style="{ backgroundColor: u.avatar_color || '#7c3aed' }">
                  {{ u.username.charAt(0).toUpperCase() }}
                </span>
                <span class="font-medium">{{ u.username }}</span>
              </button>
            </div>
            <div v-if="searchingUsers" class="absolute right-3 top-[2.6rem] text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
              searching...
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1.5" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
              Message
            </label>
            <textarea
              v-model="body"
              rows="4"
              placeholder="Write your message..."
              class="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors resize-none"
              :class="isDark
                ? 'bg-gray-900 border-gray-600 text-white placeholder:text-gray-500 focus:border-purple-accent'
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-purple-accent'"
            />
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-end gap-3 px-6 py-4 border-t"
          :class="isDark ? 'border-gray-700' : 'border-gray-100'"
        >
          <button
            @click="emit('close')"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'"
          >
            Cancel
          </button>
          <button
            @click="handleSend"
            :disabled="sending || !usernameInput.trim() || !body.trim()"
            class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-purple-accent hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ sending ? 'Sending...' : 'Send Message' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
