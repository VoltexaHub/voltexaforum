<script setup>
import { provide, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from './composables/useTheme'
import AppHeader from './components/AppHeader.vue'
import AppToast from './components/AppToast.vue'

const route = useRoute()
const { isDark, toggle } = useTheme()
provide('isDark', isDark)
provide('toggleTheme', toggle)

const isAdmin = computed(() => route.path.startsWith('/admin'))
</script>

<template>
  <div
    v-if="isAdmin"
    class="min-h-screen bg-gray-900 text-white"
  >
    <RouterView />
  </div>
  <div
    v-else
    class="min-h-screen transition-colors duration-300"
    :class="isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900 light'"
  >
    <AppHeader />
    <RouterView />
  </div>
  <AppToast />
</template>
