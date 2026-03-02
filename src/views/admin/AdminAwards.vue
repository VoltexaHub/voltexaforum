<script setup>
import { ref, onMounted } from 'vue'
import { getAdminAwards, createAdminAward, updateAdminAward, deleteAdminAward } from '../../services/api'
import { useToastStore } from '../../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const error = ref(null)

const awards = ref([])
const showCreateForm = ref(false)

const newAward = ref({ name: '', icon: '', description: '' })

function resetNew() {
  newAward.value = { name: '', icon: '', description: '' }
}

async function fetchAwards() {
  loading.value = true
  error.value = null
  try {
    const res = await getAdminAwards()
    awards.value = res.data.data || res.data || []
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to load awards'
    toast.show(error.value, 'error')
  } finally {
    loading.value = false
  }
}

async function submitCreate() {
  try {
    await createAdminAward(newAward.value)
    toast.show('Award created')
    showCreateForm.value = false
    resetNew()
    fetchAwards()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to create award', 'error')
  }
}

async function doDelete(id) {
  if (!confirm('Delete this award?')) return
  try {
    await deleteAdminAward(id)
    toast.show('Award deleted')
    fetchAwards()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to delete award', 'error')
  }
}

onMounted(fetchAwards)
</script>

<template>
  <div class="space-y-6">
    <!-- Error -->
    <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
      <span class="text-sm text-red-400">{{ error }}</span>
      <button @click="fetchAwards" class="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30 transition-colors">Retry</button>
    </div>

    <div class="flex items-center justify-between flex-wrap gap-3">
      <p class="text-sm text-gray-400">Manage and grant awards to community members.</p>
      <button
        @click="showCreateForm = !showCreateForm"
        class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {{ showCreateForm ? 'Cancel' : '+ Create Award' }}
      </button>
    </div>

    <!-- Create Award form -->
    <div v-if="showCreateForm" class="bg-gray-800 rounded-xl border border-violet-500/30 p-6 space-y-4">
      <h3 class="text-base font-semibold text-white">New Award</h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Name</label>
          <input v-model="newAward.name" type="text" placeholder="Award name" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Icon (emoji)</label>
          <input v-model="newAward.icon" type="text" placeholder="🏆" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Description</label>
          <input v-model="newAward.description" type="text" placeholder="What is this award for?" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
      </div>
      <div class="flex gap-2">
        <button @click="submitCreate" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors">Create</button>
        <button @click="showCreateForm = false" class="px-4 py-2 bg-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="bg-gray-800 rounded-xl border border-gray-700/50 p-5 animate-pulse space-y-3">
        <div class="h-8 bg-gray-700 rounded w-8"></div>
        <div class="h-4 bg-gray-700 rounded w-24"></div>
        <div class="h-3 bg-gray-700 rounded w-32"></div>
      </div>
    </div>

    <!-- Awards grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="award in awards"
        :key="award.id"
        class="bg-gray-800 rounded-xl border border-gray-700/50 p-5 space-y-3"
      >
        <div class="flex items-start justify-between">
          <div class="text-3xl">{{ award.icon }}</div>
          <div class="flex gap-1">
            <button @click="doDelete(award.id)" class="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors" title="Delete">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        <div>
          <h3 class="font-semibold text-white text-sm">{{ award.name }}</h3>
          <p class="text-xs text-gray-400 mt-0.5">{{ award.description }}</p>
        </div>
        <div class="text-xs text-gray-500">
          Awarded {{ award.times_awarded || award.timesAwarded || 0 }} {{ (award.times_awarded || award.timesAwarded || 0) === 1 ? 'time' : 'times' }}
        </div>
      </div>
    </div>

    <div v-if="!loading && !awards.length" class="bg-gray-800 rounded-xl border border-gray-700/50 p-12 text-center">
      <p class="text-gray-500">No awards configured yet. Create your first award above.</p>
    </div>
  </div>
</template>
