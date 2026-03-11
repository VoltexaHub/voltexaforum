<script setup>
import { ref, inject, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resendVerification } from '../services/api'

const isDark = inject('isDark')
const route = useRoute()
const router = useRouter()

const status = ref(route.query.status || null)
const errorMsg = ref(route.query.message || 'Verification link is invalid or expired.')
const resending = ref(false)
const resendDone = ref(false)
const countdown = ref(5)

onMounted(() => {
  if (status.value === 'success') {
    const interval = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(interval)
        router.push('/')
      }
    }, 1000)
  }
})

async function handleResend() {
  resending.value = true
  try {
    await resendVerification()
    resendDone.value = true
  } catch (e) {
    errorMsg.value = e.response?.data?.message || 'Failed to resend. Please try again.'
  } finally {
    resending.value = false
  }
}
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center px-4">
    <div
      class="w-full max-w-md rounded-xl p-8 text-center"
      :class="isDark ? 'bg-gray-900' : 'bg-white shadow-lg'"
    >
      <!-- Success -->
      <template v-if="status === 'success'">
        <div class="flex flex-col items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
            <i class="fa-solid fa-circle-check text-3xl text-green-400"></i>
          </div>
          <h2 class="text-xl font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">Email Verified!</h2>
          <p :class="isDark ? 'text-gray-400' : 'text-gray-500'">Your email has been verified. Welcome to the community!</p>
          <p class="text-sm" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            Redirecting in {{ countdown }}s...
          </p>
          <router-link
            to="/"
            class="px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Go to Forum
          </router-link>
        </div>
      </template>

      <!-- Already verified -->
      <template v-else-if="status === 'already_verified'">
        <div class="flex flex-col items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-blue-500/15 flex items-center justify-center">
            <i class="fa-solid fa-circle-info text-3xl text-blue-400"></i>
          </div>
          <h2 class="text-xl font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">Already Verified</h2>
          <p :class="isDark ? 'text-gray-400' : 'text-gray-500'">Your email address is already verified.</p>
          <router-link to="/" class="px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
            Go to Forum
          </router-link>
        </div>
      </template>

      <!-- Error / no status -->
      <template v-else>
        <div class="flex flex-col items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center">
            <i class="fa-solid fa-circle-xmark text-3xl text-red-400"></i>
          </div>
          <h2 class="text-xl font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">Verification Failed</h2>
          <p :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ errorMsg }}</p>
          <template v-if="resendDone">
            <p class="text-green-400 text-sm">Verification email sent — check your inbox.</p>
          </template>
          <template v-else>
            <button
              @click="handleResend"
              :disabled="resending"
              class="px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {{ resending ? 'Sending...' : 'Resend Verification Email' }}
            </button>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>
