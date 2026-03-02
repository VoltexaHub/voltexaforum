<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { users } from '../data/mockData'
import UserAvatar from '../components/UserAvatar.vue'

const route = useRoute()
const sidebarOpen = ref(false)
const currentUser = users.find(u => u.username === 'xCrafter_Z')

const pageTitle = computed(() => route.meta?.title || 'Admin')

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    ],
  },
  {
    label: 'Community',
    items: [
      { to: '/admin/users', label: 'Users', icon: '👥' },
      { to: '/admin/forums', label: 'Forums', icon: '💬' },
      { to: '/admin/moderation', label: 'Moderation', icon: '🛡️' },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { to: '/admin/store/items', label: 'Store Items', icon: '🏪' },
      { to: '/admin/store/purchases', label: 'Purchases', icon: '💳' },
    ],
  },
  {
    label: 'Gamification',
    items: [
      { to: '/admin/achievements', label: 'Achievements', icon: '🏆' },
      { to: '/admin/awards', label: 'Awards', icon: '🎖️' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/config', label: 'Config', icon: '⚙️' },
      { to: '/admin/plugins', label: 'Plugins', icon: '🧩' },
    ],
  },
]

function isActive(path) {
  if (path === '/admin/dashboard') return route.path === '/admin/dashboard' || route.path === '/admin'
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-gray-900">
    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      class="fixed lg:static inset-y-0 left-0 z-50 w-60 bg-gray-950 border-r border-gray-800 flex flex-col transition-transform duration-200 lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center gap-2 px-5 border-b border-gray-800 shrink-0">
        <span class="text-lg">⚡</span>
        <span class="font-bold text-gray-300 text-sm tracking-wide">VoltexaHub Admin</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div v-for="section in navSections" :key="section.label">
          <div class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
            {{ section.label }}
          </div>
          <router-link
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            @click="sidebarOpen = false"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5"
            :class="isActive(item.to)
              ? 'text-violet-400 bg-violet-500/10 border-l-2 border-violet-500 -ml-px'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'"
          >
            <span class="text-base">{{ item.icon }}</span>
            {{ item.label }}
          </router-link>
        </div>
      </nav>

      <!-- Bottom user section -->
      <div class="border-t border-gray-800 p-4 shrink-0">
        <div class="flex items-center gap-3 mb-3">
          <UserAvatar
            :name="currentUser?.username"
            :color="currentUser?.avatarColor || 'bg-purple-500'"
            :online="true"
            size="sm"
          />
          <div class="min-w-0">
            <div class="text-sm font-medium text-gray-200 truncate">{{ currentUser?.username }}</div>
            <div class="text-xs text-gray-500">Admin</div>
          </div>
        </div>
        <router-link
          to="/"
          class="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Forum
        </router-link>
      </div>
    </aside>

    <!-- Main content area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top bar -->
      <header class="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
        <div class="flex items-center gap-4">
          <!-- Mobile hamburger -->
          <button
            class="lg:hidden p-1.5 rounded-lg hover:bg-gray-800 text-gray-400"
            @click="sidebarOpen = !sidebarOpen"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 class="text-lg font-semibold text-white">{{ pageTitle }}</h1>
        </div>

        <div class="flex items-center gap-3">
          <!-- Quick stats pills -->
          <div class="hidden md:flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
              <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              24 online
            </span>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">
              3 pending reports
            </span>
          </div>
          <!-- Notification bell -->
          <button class="relative p-2 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
