<script setup>
import { ref, onMounted } from 'vue'
import { getStaffUsers, staffBanUser, staffUnbanUser } from '../../services/api'
import { useToastStore } from '../../stores/toast'
import UserAvatar from '../../components/UserAvatar.vue'

const toast = useToastStore()

const users = ref([])
const meta = ref({})
const loading = ref(true)
const search = ref('')
const page = ref(1)
const acting = ref(null)

// Ban dialog
const showBanDialog = ref(false)
const banTarget = ref(null)
const banReason = ref('')
const banning = ref(false)

async function fetchUsers() {
  loading.value = true
  try {
    const params = { page: page.value }
    if (search.value.trim()) params.search = search.value.trim()
    const res = await getStaffUsers(params)
    users.value = res.data.data || []
    meta.value = res.data.meta || {}
  } catch {
    toast.error('Failed to load users.')
  } finally {
    loading.value = false
  }
}

function openBan(user) {
  banTarget.value = user
  banReason.value = ''
  showBanDialog.value = true
}

async function confirmBan() {
  if (!banTarget.value) return
  banning.value = true
  try {
    await staffBanUser(banTarget.value.id, { reason: banReason.value || null })
    const idx = users.value.findIndex(u => u.id === banTarget.value.id)
    if (idx !== -1) users.value[idx].is_banned = true
    showBanDialog.value = false
    toast.success('User banned.')
  } catch {
    toast.error('Failed to ban user.')
  } finally {
    banning.value = false
  }
}

async function unban(user) {
  if (!window.confirm(`Unban "${user.username}"?`)) return
  acting.value = user.id
  try {
    await staffUnbanUser(user.id)
    const idx = users.value.findIndex(u => u.id === user.id)
    if (idx !== -1) users.value[idx].is_banned = false
    toast.success('User unbanned.')
  } catch {
    toast.error('Failed to unban user.')
  } finally {
    acting.value = null
  }
}

function handleSearch() {
  page.value = 1
  fetchUsers()
}

function goPage(p) {
  page.value = p
  fetchUsers()
}

onMounted(fetchUsers)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <h2 class="text-lg font-semibold text-white">
        <i class="fa-solid fa-users text-green-400 mr-2"></i>User Management
      </h2>
      <form @submit.prevent="handleSearch" class="flex gap-2">
        <input v-model="search" type="text" placeholder="Search by username..."
          class="px-3 py-2 rounded-lg border text-sm bg-gray-900 border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
        <button type="submit" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors">
          Search
        </button>
      </form>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="h-32 rounded-xl animate-pulse bg-gray-800" />
    </div>

    <!-- Empty -->
    <div v-else-if="!users.length" class="rounded-xl p-8 border bg-gray-800 border-gray-700 text-center">
      <p class="text-gray-400 text-sm">No users found.</p>
    </div>

    <!-- User cards -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="user in users" :key="user.id"
        class="rounded-xl p-4 border bg-gray-800 border-gray-700 flex flex-col gap-3">
        <div class="flex items-center gap-3">
          <UserAvatar :name="user.username" :color="user.avatar_color" :avatar-url="user.avatar_url" size="md" />
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-white truncate">{{ user.username }}</span>
              <span v-if="user.is_banned"
                class="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 font-medium">Banned</span>
            </div>
            <div class="flex flex-wrap gap-1 mt-1">
              <span v-for="role in user.roles" :key="role.name"
                class="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                :style="{ backgroundColor: (role.color || '#6b7280') + '20', color: role.color || '#6b7280' }">
                {{ role.label || role.name }}
              </span>
            </div>
          </div>
        </div>
        <div class="text-xs text-gray-500">
          <i class="fa-solid fa-calendar mr-1"></i>Joined {{ new Date(user.created_at).toLocaleDateString() }}
        </div>
        <div class="flex gap-2 mt-auto">
          <button v-if="!user.is_banned" @click="openBan(user)"
            class="flex-1 px-3 py-1.5 bg-red-600/15 hover:bg-red-600/25 text-red-400 text-xs font-medium rounded-lg transition-colors">
            <i class="fa-solid fa-ban mr-1"></i>Ban
          </button>
          <button v-else @click="unban(user)" :disabled="acting === user.id"
            class="flex-1 px-3 py-1.5 bg-green-600/15 hover:bg-green-600/25 text-green-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
            <i class="fa-solid fa-unlock mr-1"></i>Unban
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="flex justify-center gap-2">
      <button v-for="p in meta.last_page" :key="p" @click="goPage(p)"
        class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        :class="p === meta.current_page ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'">
        {{ p }}
      </button>
    </div>

    <!-- Ban Dialog -->
    <Teleport to="body">
      <div v-if="showBanDialog" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
        <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4">
          <h3 class="text-lg font-semibold text-white mb-4">
            <i class="fa-solid fa-ban text-red-400 mr-2"></i>Ban {{ banTarget?.username }}
          </h3>
          <label class="block text-sm text-gray-400 mb-1">Reason (optional)</label>
          <textarea v-model="banReason" rows="3" placeholder="Enter ban reason..."
            class="w-full px-3 py-2 rounded-lg border text-sm bg-gray-900 border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4" />
          <div class="flex justify-end gap-2">
            <button @click="showBanDialog = false"
              class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors">
              Cancel
            </button>
            <button @click="confirmBan" :disabled="banning"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              {{ banning ? 'Banning...' : 'Confirm Ban' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
