<script setup>
import { inject } from 'vue'

const isDark = inject('isDark')
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center px-4 py-16">
    <div class="w-full max-w-md rounded-2xl shadow-xl p-8 text-center"
      :class="isDark ? 'bg-gray-800' : 'bg-white'">
      <div class="text-4xl mb-4">&#x1F6AB;</div>
      <h1 class="text-2xl font-bold mb-2" :class="isDark ? 'text-white' : 'text-gray-900'">
        Payment Cancelled
      </h1>
      <p class="text-sm mb-6" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        No worries — you were not charged.
      </p>
      <router-link to="/upgrade"
        class="inline-block px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-500 hover:opacity-90 transition-all">
        View Upgrade Plans
      </router-link>
    </div>
  </div>
</template>
