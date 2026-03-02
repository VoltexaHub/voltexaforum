<script setup>
import { inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import { startConversation, sendMessage } from '../services/api'
import { useMessagesStore } from '../stores/messages'
import { useToastStore } from '../stores/toast'

const isDark = inject('isDark')
const router = useRouter()
const messagesStore = useMessagesStore()
const toastStore = useToastStore()

const emit = defineEmits(['close'])

const username = ref('')
const body = ref('')
const sending = ref(false)
const error = ref(null)

async function handleSend() {
  if (!username.value.trim() || !body.value.trim()) return
  sending.value = true
  error.value = null
  try {
    // Create or get conversation
    const convoRes = await startConversation(username.value.trim())
    const convoId = convoRes.data.data?.id
    if (!convoId) throw new Error('Failed to create conversation')

    // Send the message
    await sendMessage(convoId, body.value.trim())

    // Refresh conversations
    await messagesStore.fetchConversations()

    toastStore.show('Message sent!', 'success')
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

          <div>
            <label class="block text-sm font-medium mb-1.5" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
              To
            </label>
            <input
              v-model="username"
              type="text"
              placeholder="Enter username..."
              class="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors"
              :class="isDark
                ? 'bg-gray-900 border-gray-600 text-white placeholder:text-gray-500 focus:border-purple-accent'
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-purple-accent'"
            />
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
            :disabled="sending || !username.trim() || !body.trim()"
            class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-purple-accent hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ sending ? 'Sending...' : 'Send Message' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
