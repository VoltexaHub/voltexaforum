<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useForumStore } from '../stores/forum'
import UserAvatar from '../components/UserAvatar.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const forumStore = useForumStore()
const sidebarOpen = ref(false)

onMounted(() => {
  if (authStore.initialized && !authStore.isStaff) {
    router.replace('/')
  }
})

const pageTitle = computed(() => route.meta?.title || 'Staff Panel')

const navItems = computed(() => {
  const items = []
  items.push({ to: '/staffcp/dashboard', label: 'Dashboard', icon: 'fa-solid fa-chart-bar', always: true })
  if (authStore.hasStaffPermission('view_reports')) {
    items.push({ to: '/staffcp/reports', label: 'Reports', icon: 'fa-solid fa-flag' })
  }
  if (authStore.hasStaffPermission('manage_threads')) {
    items.push({ to: '/staffcp/threads', label: 'Threads', icon: 'fa-solid fa-comments' })
  }
  if (authStore.hasStaffPermission('ban_users')) {
    items.push({ to: '/staffcp/users', label: 'Users', icon: 'fa-solid fa-users' })
  }
  if (authStore.hasStaffPermission('grant_awards')) {
    items.push({ to: '/staffcp/awards', label: 'Awards', icon: 'fa-solid fa-award' })
  }
  return items
})

const hasAnyPermission = computed(() => authStore.staffPermissions.length > 0)

function isActive(path) {
  if (path === '/staffcp/dashboard') return route.path === '/staffcp/dashboard' || route.path === '/staffcp'
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
        <i class="fa-solid fa-shield-halved text-violet-400"></i>
        <span class="font-bold text-gray-300 text-sm tracking-wide">Staff Panel</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <template v-if="hasAnyPermission">
          <router-link
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            @click="sidebarOpen = false"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5"
            :class="isActive(item.to)
              ? 'text-violet-400 bg-violet-500/10 border-l-2 border-violet-500 -ml-px'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'"
          >
            <i :class="[item.icon, 'w-4 text-center']"></i>
            {{ item.label }}
          </router-link>
        </template>
        <div v-else class="px-3 py-6 text-center">
          <i class="fa-solid fa-lock text-2xl text-gray-600 mb-2"></i>
          <p class="text-sm text-gray-500">No staff permissions assigned.</p>
        </div>
      </nav>

      <!-- Bottom section -->
      <div class="border-t border-gray-800 p-4 shrink-0 space-y-3">
        <div class="flex items-center gap-3">
          <UserAvatar
            :name="authStore.username"
            :color="authStore.avatarColor"
            :avatar-url="authStore.avatarUrl"
            :online="true"
            size="sm"
          />
          <div class="min-w-0">
            <div class="text-sm font-medium text-gray-200 truncate">{{ authStore.username }}</div>
            <div class="text-xs text-gray-500">Staff</div>
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <router-link
            v-if="authStore.isAdmin"
            to="/admin"
            class="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <i class="fa-solid fa-crown w-3 text-center"></i>
            Admin Panel
          </router-link>
          <router-link
            to="/"
            class="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <i class="fa-solid fa-arrow-left w-3 text-center"></i>
            Back to Site
          </router-link>
        </div>
      </div>
    </aside>

    <!-- Main content area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top bar -->
      <header class="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
        <div class="flex items-center gap-4">
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
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto p-6">
        <div v-if="!hasAnyPermission" class="flex flex-col items-center justify-center h-full text-center">
          <i class="fa-solid fa-shield-halved text-5xl text-gray-700 mb-4"></i>
          <h2 class="text-xl font-semibold text-gray-400 mb-2">Access Denied</h2>
          <p class="text-gray-500 text-sm">Your role does not have any staff permissions assigned.</p>
          <router-link to="/" class="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors">
            Return to Forum
          </router-link>
        </div>
        <RouterView v-else />
      </main>
    </div>
  </div>
</template>
