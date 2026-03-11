<script setup>
import { ref, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { getSecuritySettings, verifyReauth } from '../../services/api'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Confirm Action' },
  description: { type: String, default: 'Please verify your identity to continue.' },
})

const emit = defineEmits(['update:modelValue', 'confirmed', 'cancelled'])

const authStore = useAuthStore()
const hasMfa = !!authStore.user?.two_factor_confirmed_at

const activeTab = ref('password')
const password = ref('')
const mfaCode = ref('')
const error = ref('')
const loading = ref(false)
const show = ref(false)

watch(() => props.modelValue, async (val) => {
  if (!val) return

  error.value = ''
  password.value = ''
  mfaCode.value = ''
  activeTab.value = 'password'

  // Check if reauth is required
  try {
    const res = await getSecuritySettings()
    if (!res.data.admin_reauth_required) {
      emit('confirmed')
      emit('update:modelValue', false)
      return
    }
  } catch {
    // If we can't check, show modal as fallback
  }

  show.value = true
})

watch(show, (val) => {
  if (!val) {
    emit('update:modelValue', false)
  }
})

function cancel() {
  show.value = false
  emit('cancelled')
}

async function confirm() {
  error.value = ''
  loading.value = true

  const payload = activeTab.value === 'mfa'
    ? { mfa_code: mfaCode.value }
    : { password: password.value }

  try {
    const res = await verifyReauth(payload)
    if (res.data.verified) {
      show.value = false
      emit('confirmed')
    } else {
      error.value = res.data.message || 'Incorrect password or code. Try again.'
    }
  } catch (e) {
    error.value = e.response?.data?.message || 'Verification failed. Try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[9999] flex items-center justify-center p-4" @click.self="cancel">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="cancel" />

      <!-- Modal -->
      <div class="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden bg-gray-800 border border-gray-700/50">
        <!-- Header -->
        <div class="px-6 pt-6 pb-4 border-b border-gray-700/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
              <i class="fa-solid fa-shield-halved text-violet-400"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-white">{{ title }}</h3>
              <p class="text-sm text-gray-400 mt-0.5">{{ description }}</p>
            </div>
          </div>
          <button @click="cancel" class="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Content -->
        <div class="px-6 py-5 space-y-4">
          <!-- Tabs (only if user has MFA) -->
          <div v-if="hasMfa" class="flex gap-1 bg-gray-900/50 rounded-lg p-1">
            <button
              @click="activeTab = 'password'; error = ''"
              class="flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
              :class="activeTab === 'password' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200'"
            >
              Password
            </button>
            <button
              @click="activeTab = 'mfa'; error = ''"
              class="flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
              :class="activeTab === 'mfa' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200'"
            >
              MFA Code
            </button>
          </div>

          <!-- Password input -->
          <div v-if="activeTab === 'password'">
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
            <input
              v-model="password"
              type="password"
              placeholder="Enter your password"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none"
              @keydown.enter="confirm"
              autofocus
            />
          </div>

          <!-- MFA input -->
          <div v-if="activeTab === 'mfa'">
            <label class="block text-sm font-medium text-gray-400 mb-1.5">MFA Code</label>
            <input
              v-model="mfaCode"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="Enter 6-digit code"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none tracking-widest text-center text-lg"
              @keydown.enter="confirm"
            />
          </div>

          <!-- Error -->
          <div v-if="error" class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p class="text-sm text-red-400">{{ error }}</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-700/50 flex justify-end gap-3">
          <button
            @click="cancel"
            class="px-4 py-2 bg-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="confirm"
            :disabled="loading || (activeTab === 'password' && !password) || (activeTab === 'mfa' && !mfaCode)"
            class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i v-if="loading" class="fa-solid fa-spinner fa-spin mr-1.5"></i>
            {{ loading ? 'Verifying...' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
