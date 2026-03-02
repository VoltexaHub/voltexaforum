<script setup>
import { inject, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForumStore } from '../stores/forum'
import { resetPassword } from '../services/api'

const isDark = inject('isDark')
const route = useRoute()
const router = useRouter()
const forumStore = useForumStore()
const forumName = computed(() => forumStore.config?.forum_name || 'My Forum')

const token = computed(() => route.query.token || '')
const emailFromQuery = computed(() => route.query.email || '')

const password = ref('')
const passwordConfirmation = ref('')
const loading = ref(false)
const errors = ref({})
const generalError = ref(null)

async function handleSubmit() {
  loading.value = true
  errors.value = {}
  generalError.value = null
  try {
    await resetPassword({
      token: token.value,
      email: emailFromQuery.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })
    router.push({ path: '/login', query: { reset: 'success' } })
  } catch (e) {
    if (e.response?.data?.errors) {
      errors.value = e.response.data.errors
    } else {
      generalError.value = e.response?.data?.message || 'Failed to reset password. The link may have expired.'
    }
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
          Set a new password
        </p>
      </div>

      <!-- General error -->
      <div
        v-if="generalError"
        class="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
      >
        {{ generalError }}
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-5">
        <div>
          <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
            New Password
          </label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="Enter new password"
            class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
            :class="[
              isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400',
              errors.password ? 'border-red-500 focus:ring-red-500' : '',
            ]"
          />
          <p v-if="errors.password" class="text-red-400 text-xs mt-1">{{ errors.password[0] }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
            Confirm Password
          </label>
          <input
            v-model="passwordConfirmation"
            type="password"
            required
            placeholder="Confirm new password"
            class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
            :class="[
              isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400',
              errors.password_confirmation ? 'border-red-500 focus:ring-red-500' : '',
            ]"
          />
          <p v-if="errors.password_confirmation" class="text-red-400 text-xs mt-1">{{ errors.password_confirmation[0] }}</p>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 rounded-lg font-semibold text-white bg-purple-accent hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg v-if="loading" class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ loading ? 'Resetting...' : 'Reset Password' }}
        </button>
      </form>

      <!-- Back to login -->
      <p class="text-center text-sm mt-6" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        <router-link to="/login" class="text-purple-accent hover:underline font-medium">
          Back to Login
        </router-link>
      </p>
    </div>
  </div>
</template>
