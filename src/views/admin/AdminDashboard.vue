<script setup>
import { ref, onMounted } from 'vue'
import { getAdminDashboard } from '../../services/api'
import { useToastStore } from '../../stores/toast'
import UserAvatar from '../../components/UserAvatar.vue'
import { formatRelative } from '../../utils/date'

const toast = useToastStore()
const loading = ref(true)
const error = ref(null)

const stats = ref({ user_count: 0, post_count: 0, thread_count: 0, revenue_this_month: 0 })
const recentActivity = ref([])
const recentRegistrations = ref([])
const recentPurchases = ref([])
const topForums = ref([])
const quickActions = ref({ pending_reports: 0 })

const statCards = ref([])

function buildStatCards(s) {
  return [
    { label: 'Total Users', value: Number(s.user_count).toLocaleString(), icon: 'fa-solid fa-users' },
    { label: 'Total Posts', value: Number(s.post_count).toLocaleString(), icon: 'fa-solid fa-pen-to-square' },
    { label: 'Total Threads', value: Number(s.thread_count).toLocaleString(), icon: 'fa-solid fa-comments' },
    { label: 'Online Now', value: Number(s.online_count ?? 0).toLocaleString(), icon: 'fa-solid fa-circle text-green-500' },
    { label: 'Revenue This Month', value: '$' + Number(s.revenue_this_month).toFixed(2), icon: 'fa-solid fa-dollar-sign' },
    { label: 'Posts Today', value: Number(s.posts_today ?? 0).toLocaleString(), icon: 'fa-solid fa-comment' },
    { label: 'Threads Today', value: Number(s.threads_today ?? 0).toLocaleString(), icon: 'fa-solid fa-pen-to-square' },
    { label: 'New Users Today', value: Number(s.users_today ?? 0).toLocaleString(), icon: 'fa-solid fa-user-plus' },
  ]
}

async function fetchData() {
  loading.value = true
  error.value = null
  try {
    const res = await getAdminDashboard()
    const d = res.data.data || res.data
    stats.value = d
    statCards.value = buildStatCards(d)
    recentActivity.value = d.recent_activity || []
    const raw = res.data
    recentRegistrations.value = raw.recent_registrations || []
    recentPurchases.value = raw.recent_purchases || []
    topForums.value = d.top_forums || []
    quickActions.value = {
      pending_reports: d.pending_reports || 0,
    }
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to load dashboard'
    toast.show(error.value, 'error')
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

function activityIcon(type) {
  const map = { registration: 'fa-solid fa-user-plus', purchase: 'fa-solid fa-credit-card', thread: 'fa-solid fa-pen-to-square', ban: 'fa-solid fa-ban', post: 'fa-solid fa-comment' }
  return map[type] || 'fa-solid fa-circle-info'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Error banner -->
    <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
      <span class="text-sm text-red-400">{{ error }}</span>
      <button @click="fetchData" class="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30 transition-colors">Retry</button>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <template v-if="loading">
        <div v-for="i in 4" :key="i" class="bg-gray-800 rounded-xl p-5 border border-gray-700/50 animate-pulse">
          <div class="h-6 bg-gray-700 rounded w-8 mb-3"></div>
          <div class="h-8 bg-gray-700 rounded w-24 mb-1"></div>
          <div class="h-4 bg-gray-700 rounded w-20"></div>
        </div>
      </template>
      <template v-else>
        <div
          v-for="stat in statCards"
          :key="stat.label"
          class="bg-gray-800 rounded-xl p-5 border border-gray-700/50"
        >
          <div class="flex items-center justify-between mb-3">
            <i :class="[stat.icon, 'text-2xl text-violet-400']"></i>
          </div>
          <div class="text-2xl font-bold text-white">{{ stat.value }}</div>
          <div class="text-sm text-gray-400 mt-1">{{ stat.label }}</div>
        </div>
      </template>
    </div>

    <!-- Quick Actions -->
    <div v-if="!loading" class="flex flex-wrap gap-3">
      <button class="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-500/20 transition-colors border border-amber-500/20">
        <i class="fa-solid fa-shield-halved"></i> View Pending Reports ({{ quickActions.pending_reports }})
      </button>
      <router-link to="/admin/awards" class="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-500/10 text-violet-400 rounded-lg text-sm font-medium hover:bg-violet-500/20 transition-colors border border-violet-500/20">
        <i class="fa-solid fa-award"></i> New Award
      </router-link>
    </div>

    <!-- Recent Activity -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50">
      <div class="px-5 py-4 border-b border-gray-700/50">
        <h2 class="text-base font-semibold text-white">Recent Activity</h2>
      </div>
      <template v-if="loading">
        <div v-for="i in 5" :key="i" class="flex items-center gap-3 px-5 py-3 animate-pulse">
          <div class="h-5 w-5 bg-gray-700 rounded"></div>
          <div class="h-4 bg-gray-700 rounded flex-1"></div>
          <div class="h-3 bg-gray-700 rounded w-16"></div>
        </div>
      </template>
      <div v-else class="divide-y divide-gray-700/50">
        <div
          v-for="(event, i) in recentActivity"
          :key="event.id || i"
          class="flex items-center gap-3 px-5 py-3 hover:bg-gray-700/30 transition-colors"
        >
          <i :class="[activityIcon(event.type), 'text-sm text-violet-400 mt-0.5 shrink-0 w-4 text-center']"></i>
          <span class="text-sm text-gray-300 flex-1">{{ event.text }}</span>
          <span class="text-xs text-gray-500 shrink-0">{{ event.time }}</span>
        </div>
        <div v-if="!recentActivity.length" class="px-5 py-8 text-center text-sm text-gray-500">No recent activity</div>
      </div>
    </div>

    <!-- Top Forums -->
    <div v-if="!loading && topForums.length" class="bg-gray-800 rounded-xl border border-gray-700/50">
      <div class="px-5 py-4 border-b border-gray-700/50">
        <h2 class="text-base font-semibold text-white">Top Forums</h2>
      </div>
      <div class="divide-y divide-gray-700/50">
        <div
          v-for="(forum, idx) in topForums"
          :key="forum.id"
          class="flex items-center gap-3 px-5 py-3 hover:bg-gray-700/30 transition-colors"
        >
          <span class="text-sm font-bold text-gray-500 w-6 text-center">{{ idx + 1 }}</span>
          <router-link :to="'/forum/' + forum.slug" class="text-sm font-medium text-violet-400 hover:text-violet-300 flex-1">{{ forum.name }}</router-link>
          <span class="text-xs text-gray-400">{{ forum.thread_count }} threads</span>
          <span class="text-xs text-gray-500">{{ forum.post_count }} posts</span>
        </div>
      </div>
    </div>

    <!-- Bottom 2-col: Registrations + Purchases -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Registrations -->
      <div class="bg-gray-800 rounded-xl border border-gray-700/50">
        <div class="px-5 py-4 border-b border-gray-700/50">
          <h2 class="text-base font-semibold text-white">Recent Registrations</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-gray-500 uppercase tracking-wider">
                <th class="px-5 py-3">User</th>
                <th class="px-5 py-3">Email</th>
                <th class="px-5 py-3">Joined</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700/50">
              <template v-if="loading">
                <tr v-for="i in 3" :key="i" class="animate-pulse">
                  <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-24"></div></td>
                  <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-32"></div></td>
                  <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-20"></div></td>
                </tr>
              </template>
              <template v-else>
                <tr v-for="user in recentRegistrations" :key="user.username || user.id" class="hover:bg-gray-700/30 transition-colors">
                  <td class="px-5 py-3">
                    <div class="flex items-center gap-2">
                      <UserAvatar :name="user.username" :color="user.avatar_color || '#7c3aed'" :avatar-url="user.avatar_path" size="sm" />
                      <span class="font-medium text-gray-200">{{ user.username }}</span>
                    </div>
                  </td>
                  <td class="px-5 py-3 text-gray-400">{{ user.email }}</td>
                  <td class="px-5 py-3 text-gray-400">{{ formatRelative(user.joined || user.created_at) }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Purchases -->
      <div class="bg-gray-800 rounded-xl border border-gray-700/50">
        <div class="px-5 py-4 border-b border-gray-700/50">
          <h2 class="text-base font-semibold text-white">Recent Purchases</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-gray-500 uppercase tracking-wider">
                <th class="px-5 py-3">User</th>
                <th class="px-5 py-3">Item</th>
                <th class="px-5 py-3">Amount</th>
                <th class="px-5 py-3">Time</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700/50">
              <template v-if="loading">
                <tr v-for="i in 3" :key="i" class="animate-pulse">
                  <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-20"></div></td>
                  <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-24"></div></td>
                  <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-16"></div></td>
                  <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-16"></div></td>
                </tr>
              </template>
              <template v-else>
                <tr v-for="(p, i) in recentPurchases" :key="p.id || i" class="hover:bg-gray-700/30 transition-colors">
                  <td class="px-5 py-3 font-medium text-gray-200">{{ p.user || p.username }}</td>
                  <td class="px-5 py-3 text-gray-400">{{ p.item || p.item_name }}</td>
                  <td class="px-5 py-3 text-gray-300">{{ p.amount }}</td>
                  <td class="px-5 py-3 text-gray-500">{{ p.time || p.created_at }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
