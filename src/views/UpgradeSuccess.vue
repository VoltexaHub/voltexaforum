<script setup>
import { inject } from 'vue'
import { useRouter } from 'vue-router'

const isDark = inject('isDark')
const router = useRouter()
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center px-4">
    <div class="text-center max-w-md">
      <div class="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-green-500/15">
        <i class="fa-solid fa-circle-check text-green-400 text-4xl"></i>
      </div>
      <h1 class="text-3xl font-bold mb-3" :class="isDark ? 'text-white' : 'text-gray-900'">
        Upgrade Successful!
      </h1>
      <p class="text-base mb-8" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        Your upgrade is now active. Enjoy your new features and perks!
      </p>
      <button
        @click="router.push('/')"
        class="px-8 py-3 rounded-xl font-bold text-sm text-white bg-green-500 hover:bg-green-600 transition-colors active:scale-95"
      >
        Go Home
      </button>
    </div>
  </div>
</template>
