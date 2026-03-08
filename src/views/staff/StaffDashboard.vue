<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { getStaffReports, getStaffThreads, getStaffUsers } from '../../services/api'

const authStore = useAuthStore()
const loading = ref(true)
const stats = ref({ pendingReports: 0, totalThreads: 0, bannedUsers: 0 })

onMounted(async () => {
  try {
    const promises = []

    if (authStore.hasStaffPermission('view_reports')) {
      promises.push(
        getStaffReports({ status: 'pending' }).then(res => {
          stats.value.pendingReports = (res.data.data || []).length
        }).catch(() => {})
      )
    }

    if (authStore.hasStaffPermission('manage_threads')) {
      promises.push(
        getStaffThreads({ page: 1 }).then(res => {
          stats.value.totalThreads = res.data.meta?.total ?? 0
        }).catch(() => {})
      )
    }

    if (authStore.hasStaffPermission('ban_users')) {
      promises.push(
        getStaffUsers({ page: 1 }).then(res => {
          const users = res.data.data || []
          stats.value.bannedUsers = users.filter(u => u.is_banned).length
        }).catch(() => {})
      )
    }

    await Promise.all(promises)
  } finally {
    loading.value = false
  }
})

const quickLinks = [
  { to: '/staffcp/reports', label: 'Reports', icon: 'fa-solid fa-flag', perm: 'view_reports', color: 'text-amber-400 bg-amber-500/10' },
  { to: '/staffcp/threads', label: 'Threads', icon: 'fa-solid fa-comments', perm: 'manage_threads', color: 'text-blue-400 bg-blue-500/10' },
  { to: '/staffcp/users', label: 'Users', icon: 'fa-solid fa-users', perm: 'ban_users', color: 'text-green-400 bg-green-500/10' },
  { to: '/staffcp/awards', label: 'Awards', icon: 'fa-solid fa-award', perm: 'grant_awards', color: 'text-violet-400 bg-violet-500/10' },
]
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome -->
    <div class="rounded-xl p-6 border bg-gray-800 border-gray-700">
      <h2 class="text-xl font-bold text-white mb-1">
        <i class="fa-solid fa-shield-halved text-violet-400 mr-2"></i>
        Staff Panel
      </h2>
      <p class="text-gray-400 text-sm">Welcome back, {{ authStore.username }}.</p>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div v-if="authStore.hasStaffPermission('view_reports')"
        class="rounded-xl p-5 border bg-gray-800 border-gray-700">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Pending Reports</span>
          <i class="fa-solid fa-flag text-amber-400"></i>
        </div>
        <div v-if="loading" class="h-8 w-16 rounded animate-pulse bg-gray-700"></div>
        <p v-else class="text-2xl font-bold text-white">{{ stats.pendingReports }}</p>
      </div>

      <div v-if="authStore.hasStaffPermission('manage_threads')"
        class="rounded-xl p-5 border bg-gray-800 border-gray-700">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Threads</span>
          <i class="fa-solid fa-comments text-blue-400"></i>
        </div>
        <div v-if="loading" class="h-8 w-16 rounded animate-pulse bg-gray-700"></div>
        <p v-else class="text-2xl font-bold text-white">{{ stats.totalThreads.toLocaleString() }}</p>
      </div>

      <div v-if="authStore.hasStaffPermission('ban_users')"
        class="rounded-xl p-5 border bg-gray-800 border-gray-700">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Banned Users</span>
          <i class="fa-solid fa-ban text-red-400"></i>
        </div>
        <div v-if="loading" class="h-8 w-16 rounded animate-pulse bg-gray-700"></div>
        <p v-else class="text-2xl font-bold text-white">{{ stats.bannedUsers }}</p>
      </div>
    </div>

    <!-- Quick Access -->
    <div class="rounded-xl p-5 border bg-gray-800 border-gray-700">
      <h3 class="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Quick Access</h3>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <router-link
          v-for="link in quickLinks.filter(l => authStore.hasStaffPermission(l.perm))"
          :key="link.to"
          :to="link.to"
          class="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-700 hover:border-violet-500/50 transition-all hover:bg-gray-700/30"
        >
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="link.color">
            <i :class="link.icon"></i>
          </div>
          <span class="text-sm font-medium text-gray-300">{{ link.label }}</span>
        </router-link>
      </div>
    </div>
  </div>
</template>
