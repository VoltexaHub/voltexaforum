<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { updateAccount } from '../../services/api'

defineProps({
  isDark: Boolean,
})

const emit = defineEmits(['message', 'error'])

const authStore = useAuthStore()

const saving = ref(false)
const email = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

onMounted(() => {
  const user = authStore.user
  if (user) {
    email.value = user.email || ''
  }
})

async function saveAccount() {
  saving.value = true
  try {
    await updateAccount({
      email: email.value,
      current_password: currentPassword.value || undefined,
      password: newPassword.value || undefined,
      password_confirmation: confirmPassword.value || undefined,
    })
    emit('message', 'Account updated successfully!')
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e) {
    emit('error', e.response?.data?.message || 'Failed to update account.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="text-xl font-bold mb-6">Account</h2>

    <div class="mb-6">
      <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Email Address</label>
      <input
        type="email"
        v-model="email"
        class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
        :class="isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'"
      />
    </div>

    <div class="mb-6">
      <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Change Password</label>
      <div class="space-y-3">
        <input
          type="password"
          v-model="currentPassword"
          placeholder="Current password"
          class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
          :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
        />
        <input
          type="password"
          v-model="newPassword"
          placeholder="New password"
          class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
          :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
        />
        <input
          type="password"
          v-model="confirmPassword"
          placeholder="Confirm new password"
          class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
          :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
        />
      </div>
    </div>

    <button
      @click="saveAccount"
      :disabled="saving"
      class="px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-accent to-purple-700 hover:from-purple-600 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
    >
      <svg v-if="saving" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {{ saving ? 'Saving...' : 'Save Changes' }}
    </button>
  </div>
</template>
