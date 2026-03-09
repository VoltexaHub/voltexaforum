<script setup>
import { ref, onMounted, inject } from 'vue'
import { useRoute } from 'vue-router'
import { verifyUpgradeCheckout } from '../services/api'

const isDark = inject('isDark')
const route = useRoute()
const loading = ref(true)
const error = ref(null)
const plan = ref(null)
const message = ref(null)

onMounted(async () => {
  const sessionId = route.query.session_id
  if (!sessionId) { error.value = 'Invalid session.'; loading.value = false; return }
  try {
    const res = await verifyUpgradeCheckout(sessionId)
    plan.value = res.data.data.plan
    message.value = res.data.data.message
  } catch (e) {
    error.value = e.response?.data?.message || 'Could not verify your upgrade. Please contact support.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center px-4 py-16">
    <div class="w-full max-w-md rounded-2xl shadow-xl p-8 text-center"
      :class="isDark ? 'bg-gray-800' : 'bg-white'">

      <!-- Loading -->
      <template v-if="loading">
        <i class="fa-solid fa-spinner fa-spin text-3xl mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'"></i>
        <p class="text-base" :class="isDark ? 'text-gray-300' : 'text-gray-600'">Verifying your upgrade...</p>
      </template>

      <!-- Success -->
      <template v-else-if="plan">
        <div class="text-5xl mb-4">&#x2705;</div>
        <h1 class="text-2xl font-bold mb-2" :class="isDark ? 'text-white' : 'text-gray-900'">
          You're upgraded! &#127881;
        </h1>
        <p class="text-lg font-bold mb-1" :style="{ color: plan.color }">{{ plan.name }}</p>
        <p class="text-sm mb-6" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
          Your {{ plan.name }} upgrade is now active.
        </p>
        <div class="flex gap-3 justify-center">
          <router-link to="/upgrade"
            class="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            :class="isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'">
            View Plans
          </router-link>
          <router-link to="/usercp"
            class="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
            :style="{ backgroundColor: plan.color || '#6366f1' }">
            My Profile
          </router-link>
        </div>
      </template>

      <!-- Error -->
      <template v-else>
        <div class="text-4xl mb-4">&#x26A0;&#xFE0F;</div>
        <h1 class="text-xl font-bold mb-2" :class="isDark ? 'text-white' : 'text-gray-900'">
          Verification Failed
        </h1>
        <p class="text-sm mb-6 text-red-400">{{ error }}</p>
        <router-link to="/upgrade"
          class="inline-block px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-500 hover:opacity-90 transition-all">
          Back to Upgrade Plans
        </router-link>
      </template>
    </div>
  </div>
</template>
