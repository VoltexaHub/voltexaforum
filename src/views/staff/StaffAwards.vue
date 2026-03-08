<script setup>
import { ref, onMounted } from 'vue'
import { getStaffAwards, getStaffUsers, staffGrantAward, staffRevokeAward, getUserProfile } from '../../services/api'
import { useToastStore } from '../../stores/toast'
import UserAvatar from '../../components/UserAvatar.vue'

const toast = useToastStore()

const allAwards = ref([])
const loading = ref(true)

// Search
const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)

// Selected user
const selectedUser = ref(null)
const userAwards = ref([])
const loadingUser = ref(false)

// Grant
const selectedAwardId = ref('')
const granting = ref(false)
const revoking = ref(null)

onMounted(async () => {
  try {
    const res = await getStaffAwards()
    allAwards.value = res.data.data || []
  } catch {
    toast.error('Failed to load awards.')
  } finally {
    loading.value = false
  }
})

async function searchUsers() {
  if (!searchQuery.value.trim()) return
  searching.value = true
  try {
    const res = await getStaffUsers({ search: searchQuery.value.trim() })
    searchResults.value = res.data.data || []
  } catch {
    toast.error('Failed to search users.')
  } finally {
    searching.value = false
  }
}

async function selectUser(user) {
  selectedUser.value = user
  searchResults.value = []
  loadingUser.value = true
  try {
    const res = await getUserProfile(user.username)
    userAwards.value = res.data.data?.awards || []
  } catch {
    userAwards.value = []
  } finally {
    loadingUser.value = false
  }
}

async function grantAward() {
  if (!selectedUser.value || !selectedAwardId.value) return
  granting.value = true
  try {
    const res = await staffGrantAward(selectedUser.value.id, { award_id: selectedAwardId.value })
    const awarded = res.data.data
    userAwards.value.push({
      id: awarded.id,
      name: awarded.award?.name || '',
      description: awarded.award?.description || '',
      icon_url: awarded.award?.icon_url || null,
    })
    selectedAwardId.value = ''
    toast.success('Award granted.')
  } catch {
    toast.error('Failed to grant award.')
  } finally {
    granting.value = false
  }
}

async function revokeAward(award) {
  if (!window.confirm(`Revoke "${award.name}" from ${selectedUser.value.username}?`)) return
  revoking.value = award.id
  try {
    await staffRevokeAward(selectedUser.value.id, award.id)
    userAwards.value = userAwards.value.filter(a => a.id !== award.id)
    toast.success('Award revoked.')
  } catch {
    toast.error('Failed to revoke award.')
  } finally {
    revoking.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold text-white">
      <i class="fa-solid fa-award text-violet-400 mr-2"></i>Award Management
    </h2>

    <!-- Search User -->
    <div class="rounded-xl p-5 border bg-gray-800 border-gray-700">
      <label class="block text-sm font-medium text-gray-300 mb-2">Search for a user</label>
      <form @submit.prevent="searchUsers" class="flex gap-2 mb-3">
        <input v-model="searchQuery" type="text" placeholder="Username..."
          class="flex-1 px-3 py-2 rounded-lg border text-sm bg-gray-900 border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
        <button type="submit" :disabled="searching"
          class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {{ searching ? 'Searching...' : 'Search' }}
        </button>
      </form>

      <!-- Search results -->
      <div v-if="searchResults.length" class="space-y-2">
        <button v-for="user in searchResults" :key="user.id" @click="selectUser(user)"
          class="flex items-center gap-3 w-full p-3 rounded-lg border border-gray-700 hover:border-violet-500/50 hover:bg-gray-700/30 transition-all text-left">
          <UserAvatar :name="user.username" :color="user.avatar_color" :avatar-url="user.avatar_url" size="sm" />
          <span class="text-sm font-medium text-white">{{ user.username }}</span>
        </button>
      </div>
    </div>

    <!-- Selected User -->
    <template v-if="selectedUser">
      <div class="rounded-xl p-5 border bg-gray-800 border-gray-700">
        <div class="flex items-center gap-3 mb-4">
          <UserAvatar :name="selectedUser.username" :color="selectedUser.avatar_color" :avatar-url="selectedUser.avatar_url" size="md" />
          <div>
            <p class="text-white font-semibold">{{ selectedUser.username }}</p>
            <p class="text-xs text-gray-500">Managing awards</p>
          </div>
        </div>

        <!-- Grant Award -->
        <div class="flex gap-2 mb-4">
          <select v-model="selectedAwardId"
            class="flex-1 px-3 py-2 rounded-lg border text-sm bg-gray-900 border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="" disabled>Select an award to grant...</option>
            <option v-for="award in allAwards" :key="award.id" :value="award.id">
              {{ award.name }}
            </option>
          </select>
          <button @click="grantAward" :disabled="granting || !selectedAwardId"
            class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {{ granting ? 'Granting...' : 'Grant' }}
          </button>
        </div>

        <!-- Current Awards -->
        <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Current Awards</h4>
        <div v-if="loadingUser" class="space-y-2">
          <div v-for="i in 2" :key="i" class="h-10 rounded-lg animate-pulse bg-gray-700" />
        </div>
        <div v-else-if="!userAwards.length" class="text-sm text-gray-500">No awards yet.</div>
        <div v-else class="space-y-2">
          <div v-for="award in userAwards" :key="award.id"
            class="flex items-center justify-between p-3 rounded-lg border border-gray-700 bg-gray-900/40">
            <div class="flex items-center gap-3">
              <img v-if="award.icon_url" :src="award.icon_url" class="w-6 h-6 object-contain" />
              <i v-else class="fa-solid fa-award text-violet-400"></i>
              <div>
                <p class="text-sm font-medium text-white">{{ award.name }}</p>
                <p v-if="award.description" class="text-xs text-gray-500">{{ award.description }}</p>
              </div>
            </div>
            <button @click="revokeAward(award)" :disabled="revoking === award.id"
              class="px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50">
              Revoke
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Loading state -->
    <div v-if="loading" class="rounded-xl p-8 border bg-gray-800 border-gray-700 text-center">
      <div class="h-8 w-32 mx-auto rounded animate-pulse bg-gray-700"></div>
    </div>
  </div>
</template>
