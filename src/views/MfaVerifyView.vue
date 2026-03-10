<script setup>
import { inject, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useForumStore } from '../stores/forum'
import { verifyMfa, sendMfaEmailOtp } from '../services/api'

const isDark = inject('isDark')
const router = useRouter()
const authStore = useAuthStore()
const forumStore = useForumStore()
const forumName = computed(() => forumStore.config?.forum_name || 'My Forum')

const activeTab = ref('totp')
const code = ref('')
const recoveryCode = ref('')
const error = ref('')
const loading = ref(false)
const emailSent = ref(false)
const emailSending = ref(false)
const trustDevice = ref(false)
const trustedAutoSent = ref(false)

const tempToken = ref('')
const hasTotp = ref(false)

onMounted(async () => {
  tempToken.value = localStorage.getItem('mfa_temp_token') || ''
  hasTotp.value = localStorage.getItem('mfa_has_totp') === 'true'

  if (!tempToken.value) {
    router.push('/login')
    return
  }

  // Check if this is a trusted device redirect (auto-send email OTP)
  const autoSendEmail = localStorage.getItem('mfa_auto_send_email')
  if (autoSendEmail) {
    localStorage.removeItem('mfa_auto_send_email')
    trustedAutoSent.value = true
    activeTab.value = 'email'
    emailSending.value = true
    try {
      await sendMfaEmailOtp(tempToken.value)
      emailSent.value = true
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to send email code.'
    } finally {
      emailSending.value = false
    }
  }
})

const tabs = computed(() => {
  const t = []
  t.push({ id: 'totp', label: 'Authenticator App' })
  t.push({ id: 'email', label: 'Email Code' })
  t.push({ id: 'recovery', label: 'Recovery Code' })
  return t
})

function switchTab(tab) {
  activeTab.value = tab
  error.value = ''
  code.value = ''
  recoveryCode.value = ''
}

async function handleSendEmailCode() {
  emailSending.value = true
  error.value = ''
  try {
    await sendMfaEmailOtp(tempToken.value)
    emailSent.value = true
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to send email code.'
  } finally {
    emailSending.value = false
  }
}

async function handleVerify() {
  loading.value = true
  error.value = ''

  let verifyCode = ''
  let type = activeTab.value

  if (type === 'totp') verifyCode = code.value
  else if (type === 'email') verifyCode = code.value
  else if (type === 'recovery') verifyCode = recoveryCode.value

  try {
    const res = await verifyMfa(tempToken.value, verifyCode, type)
    const data = res.data.data

    // Set auth
    authStore.token = data.token
    authStore.user = data.user
    localStorage.setItem('voltexahub_token', data.token)

    // Save trusted device if checked
    if (trustDevice.value && data.user?.email) {
      localStorage.setItem(`voltexahub_trusted_${data.user.email}`, JSON.stringify({
        expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
      }))
    }

    // Clean up
    localStorage.removeItem('mfa_temp_token')
    localStorage.removeItem('mfa_has_totp')

    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.message || 'Invalid code. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
    <div
      class="w-full max-w-md rounded-xl p-8 transition-colors duration-300"
      :class="isDark ? 'bg-gray-900' : 'bg-white shadow-lg'"
    >
      <!-- Logo -->
      <div class="text-center mb-8">
        <router-link to="/" class="inline-flex items-center gap-2 font-bold text-2xl">
          <span class="text-3xl">&#9889;</span>
          <span class="text-purple-accent">{{ forumName }}</span>
        </router-link>
        <p class="text-sm mt-2" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
          Two-Step Verification
        </p>
      </div>

      <!-- Tab switcher -->
      <div class="flex rounded-lg overflow-hidden mb-6 border" :class="isDark ? 'border-gray-800' : 'border-gray-200'">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="switchTab(tab.id)"
          class="flex-1 py-2.5 text-xs sm:text-sm font-medium transition-colors"
          :class="activeTab === tab.id
            ? 'bg-purple-accent text-white'
            : isDark ? 'bg-gray-800 text-gray-400 hover:text-gray-200' : 'bg-gray-50 text-gray-500 hover:text-gray-700'"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Trusted device banner -->
      <div
        v-if="trustedAutoSent"
        class="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2"
      >
        <i class="fa-solid fa-shield-check"></i>
        Trusted device detected — we sent a code to your email.
      </div>

      <!-- Error -->
      <div
        v-if="error"
        class="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
      >
        {{ error }}
      </div>

      <!-- Authenticator App tab -->
      <div v-if="activeTab === 'totp'">
        <p class="text-sm mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
          Enter the 6-digit code from your authenticator app.
        </p>
        <input
          v-model="code"
          type="text"
          inputmode="numeric"
          maxlength="6"
          placeholder="000000"
          autocomplete="one-time-code"
          autofocus
          class="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent text-center text-lg font-mono tracking-widest mb-4"
          :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
          @keyup.enter="handleVerify"
        />
        <button
          @click="handleVerify"
          :disabled="loading || code.length < 6"
          class="w-full py-2.5 rounded-lg font-semibold text-white bg-purple-accent hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg v-if="loading" class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ loading ? 'Verifying...' : 'Verify' }}
        </button>
      </div>

      <!-- Email Code tab -->
      <div v-if="activeTab === 'email'">
        <div v-if="!emailSent">
          <p class="text-sm mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            We'll send a verification code to your registered email address.
          </p>
          <button
            @click="handleSendEmailCode"
            :disabled="emailSending"
            class="w-full py-2.5 rounded-lg font-semibold text-white bg-purple-accent hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg v-if="emailSending" class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ emailSending ? 'Sending...' : 'Send code to my email' }}
          </button>
        </div>
        <div v-else>
          <p class="text-sm mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            Enter the 6-digit code sent to your email.
          </p>
          <input
            v-model="code"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="000000"
            autocomplete="one-time-code"
            autofocus
            class="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent text-center text-lg font-mono tracking-widest mb-4"
            :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
            @keyup.enter="handleVerify"
          />
          <button
            @click="handleVerify"
            :disabled="loading || code.length < 6"
            class="w-full py-2.5 rounded-lg font-semibold text-white bg-purple-accent hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg v-if="loading" class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ loading ? 'Verifying...' : 'Verify' }}
          </button>
          <button
            @click="handleSendEmailCode"
            :disabled="emailSending"
            class="w-full mt-2 py-2 text-sm text-purple-accent hover:underline"
          >
            Resend code
          </button>
        </div>
      </div>

      <!-- Recovery Code tab -->
      <div v-if="activeTab === 'recovery'">
        <p class="text-sm mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
          Enter one of your recovery codes.
        </p>
        <input
          v-model="recoveryCode"
          type="text"
          placeholder="Enter recovery code"
          class="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent font-mono mb-4"
          :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
          @keyup.enter="handleVerify"
        />
        <button
          @click="handleVerify"
          :disabled="loading || !recoveryCode.trim()"
          class="w-full py-2.5 rounded-lg font-semibold text-white bg-purple-accent hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg v-if="loading" class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ loading ? 'Verifying...' : 'Verify' }}
        </button>
      </div>

      <!-- Trust this device checkbox -->
      <label class="flex items-center gap-2 mt-5 cursor-pointer select-none">
        <input
          v-model="trustDevice"
          type="checkbox"
          class="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-accent focus:ring-purple-accent focus:ring-offset-0"
        />
        <span class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Trust this device for 30 days</span>
      </label>

      <!-- Back to login -->
      <p class="text-center text-sm mt-6" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        <router-link to="/login" class="text-purple-accent hover:underline font-medium">
          Back to login
        </router-link>
      </p>
    </div>
  </div>
</template>
