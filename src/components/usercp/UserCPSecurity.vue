<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { getMfaStatus, enableMfa, confirmMfa, disableMfa, regenerateRecoveryCodes } from '../../services/api'
import QRCode from 'qrcode'

defineProps({
  isDark: Boolean,
})

const emit = defineEmits(['message', 'error'])
const authStore = useAuthStore()

const loading = ref(true)
const mfaEnabled = ref(false)
const saving = ref(false)

// QR setup modal
const showSetupModal = ref(false)
const qrDataUrl = ref('')
const secretKey = ref('')
const otpauthUri = ref('')
const setupCode = ref('')
const setupError = ref('')

// Recovery codes screen
const showRecoveryCodes = ref(false)
const recoveryCodes = ref([])

// Password confirm modal
const showPasswordModal = ref(false)
const passwordModalAction = ref(null) // 'disable' | 'regenerate'
const confirmPassword = ref('')
const passwordError = ref('')

onMounted(async () => {
  try {
    const res = await getMfaStatus()
    mfaEnabled.value = res.data.data?.mfa_enabled || false
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
})

async function handleEnableMfa() {
  saving.value = true
  setupError.value = ''
  try {
    const res = await enableMfa()
    const data = res.data.data
    otpauthUri.value = data.otpauth_uri
    secretKey.value = data.secret
    qrDataUrl.value = await QRCode.toDataURL(data.otpauth_uri, { width: 200, margin: 2 })
    setupCode.value = ''
    showSetupModal.value = true
  } catch (e) {
    emit('error', e.response?.data?.message || 'Failed to enable MFA.')
  } finally {
    saving.value = false
  }
}

async function handleConfirmSetup() {
  saving.value = true
  setupError.value = ''
  try {
    const res = await confirmMfa(setupCode.value)
    recoveryCodes.value = res.data.data?.recovery_codes || []
    showSetupModal.value = false
    showRecoveryCodes.value = true
    mfaEnabled.value = true
  } catch (e) {
    setupError.value = e.response?.data?.message || 'Invalid code. Please try again.'
  } finally {
    saving.value = false
  }
}

function closeRecoveryCodes() {
  showRecoveryCodes.value = false
  recoveryCodes.value = []
  emit('message', 'Two-factor authentication enabled successfully!')
}

function downloadRecoveryCodes() {
  const text = recoveryCodes.value.join('\n')
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'recovery-codes.txt'
  a.click()
  URL.revokeObjectURL(url)
}

function promptPasswordConfirm(action) {
  passwordModalAction.value = action
  confirmPassword.value = ''
  passwordError.value = ''
  showPasswordModal.value = true
}

async function handlePasswordConfirm() {
  saving.value = true
  passwordError.value = ''
  try {
    if (passwordModalAction.value === 'disable') {
      await disableMfa(confirmPassword.value)
      mfaEnabled.value = false
      showPasswordModal.value = false
      emit('message', 'Two-factor authentication disabled.')
    } else if (passwordModalAction.value === 'regenerate') {
      const res = await regenerateRecoveryCodes(confirmPassword.value)
      recoveryCodes.value = res.data.data?.recovery_codes || []
      showPasswordModal.value = false
      showRecoveryCodes.value = true
    }
  } catch (e) {
    passwordError.value = e.response?.data?.message || 'Incorrect password.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="text-xl font-bold mb-6">Security</h2>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center gap-2 text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
      <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Loading...
    </div>

    <!-- MFA Not Enabled -->
    <div v-else-if="!mfaEnabled">
      <div
        class="p-5 rounded-xl border"
        :class="isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-100'"
      >
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-purple-accent/15">
            <i class="fa-solid fa-shield-halved text-purple-accent"></i>
          </div>
          <div class="flex-1">
            <h3 class="font-semibold mb-1">Two-Factor Authentication</h3>
            <p class="text-sm mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
              Add an extra layer of security to your account by requiring a code from your authenticator app when signing in.
            </p>
            <button
              @click="handleEnableMfa"
              :disabled="saving"
              class="px-5 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-accent to-purple-700 hover:from-purple-600 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <svg v-if="saving" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Enable MFA
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MFA Enabled -->
    <div v-else>
      <div
        class="p-5 rounded-xl border mb-6"
        :class="isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-100'"
      >
        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center">
            <i class="fa-solid fa-check text-green-400 text-sm"></i>
          </div>
          <span class="font-semibold text-green-400">MFA is active</span>
        </div>
        <p class="text-sm mb-5" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
          Your account is protected with two-factor authentication.
        </p>
        <div class="flex flex-wrap gap-3">
          <button
            @click="promptPasswordConfirm('regenerate')"
            class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
            :class="isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
          >
            <i class="fa-solid fa-rotate mr-1.5"></i>
            Regenerate Recovery Codes
          </button>
          <button
            @click="promptPasswordConfirm('disable')"
            class="px-4 py-2 rounded-lg text-sm font-medium text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors"
          >
            <i class="fa-solid fa-shield-halved mr-1.5"></i>
            Disable MFA
          </button>
        </div>
      </div>
    </div>

    <!-- QR Code Setup Modal -->
    <Teleport to="body">
      <div v-if="showSetupModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" @click="showSetupModal = false"></div>
        <div
          class="relative w-full max-w-md rounded-xl p-6 z-10"
          :class="isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow-xl'"
        >
          <h3 class="text-lg font-bold mb-4">Set Up Authenticator</h3>
          <p class="text-sm mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc).
          </p>

          <!-- QR Code -->
          <div class="flex justify-center mb-4">
            <img :src="qrDataUrl" alt="QR Code" class="rounded-lg" />
          </div>

          <!-- Secret key -->
          <div class="mb-4">
            <p class="text-xs font-medium mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
              Or enter this key manually:
            </p>
            <div
              class="px-3 py-2 rounded-lg font-mono text-sm select-all break-all"
              :class="isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'"
            >
              {{ secretKey }}
            </div>
          </div>

          <!-- Verify code -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
              Enter the 6-digit code from your app
            </label>
            <input
              v-model="setupCode"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="000000"
              autocomplete="one-time-code"
              class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent text-center text-lg font-mono tracking-widest"
              :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
              @keyup.enter="handleConfirmSetup"
            />
          </div>

          <div v-if="setupError" class="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {{ setupError }}
          </div>

          <div class="flex gap-3">
            <button
              @click="handleConfirmSetup"
              :disabled="saving || setupCode.length < 6"
              class="flex-1 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-accent to-purple-700 hover:from-purple-600 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg v-if="saving" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Confirm
            </button>
            <button
              @click="showSetupModal = false"
              class="px-5 py-2.5 rounded-lg font-medium border transition-colors"
              :class="isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Recovery Codes Modal -->
    <Teleport to="body">
      <div v-if="showRecoveryCodes" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50"></div>
        <div
          class="relative w-full max-w-md rounded-xl p-6 z-10"
          :class="isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow-xl'"
        >
          <h3 class="text-lg font-bold mb-2">Recovery Codes</h3>

          <div class="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
            <i class="fa-solid fa-triangle-exclamation mr-1.5"></i>
            These codes will not be shown again. Save them somewhere safe.
          </div>

          <div
            class="grid grid-cols-2 gap-2 mb-5 p-4 rounded-lg"
            :class="isDark ? 'bg-gray-800' : 'bg-gray-100'"
          >
            <div
              v-for="code in recoveryCodes"
              :key="code"
              class="font-mono text-sm text-center py-1.5 px-2 rounded"
              :class="isDark ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-800'"
            >
              {{ code }}
            </div>
          </div>

          <div class="flex gap-3">
            <button
              @click="downloadRecoveryCodes"
              class="flex-1 py-2.5 rounded-lg font-medium border transition-colors flex items-center justify-center gap-2"
              :class="isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
            >
              <i class="fa-solid fa-download"></i>
              Download Codes
            </button>
            <button
              @click="closeRecoveryCodes"
              class="flex-1 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-accent to-purple-700 hover:from-purple-600 hover:to-purple-800 transition-all duration-200"
            >
              I have saved my codes
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Password Confirm Modal -->
    <Teleport to="body">
      <div v-if="showPasswordModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" @click="showPasswordModal = false"></div>
        <div
          class="relative w-full max-w-sm rounded-xl p-6 z-10"
          :class="isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow-xl'"
        >
          <h3 class="text-lg font-bold mb-4">Confirm Password</h3>
          <p class="text-sm mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            Enter your password to continue.
          </p>

          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Enter your password"
            class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent mb-4"
            :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
            @keyup.enter="handlePasswordConfirm"
          />

          <div v-if="passwordError" class="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {{ passwordError }}
          </div>

          <div class="flex gap-3">
            <button
              @click="handlePasswordConfirm"
              :disabled="saving || !confirmPassword"
              class="flex-1 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-accent to-purple-700 hover:from-purple-600 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg v-if="saving" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Confirm
            </button>
            <button
              @click="showPasswordModal = false"
              class="px-5 py-2.5 rounded-lg font-medium border transition-colors"
              :class="isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
