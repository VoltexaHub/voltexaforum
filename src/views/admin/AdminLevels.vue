<script setup>
import { ref, onMounted } from 'vue'
import { getAdminLevels, createAdminLevel, updateAdminLevel, deleteAdminLevel, presetAdminLevels, getAdminXpSettings, updateAdminXpSettings } from '../../services/api'
import { useToastStore } from '../../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const error = ref(null)
const levels = ref([])
const editingId = ref(null)
const editForm = ref({ level: 0, xp_required: 0, label: '' })
const showCreateForm = ref(false)
const newLevel = ref({ level: 1, xp_required: 0, label: '' })

const xpSettings = ref({ xp_post_created: 10, xp_thread_created: 20, xp_like_received: 5 })
const savingXp = ref(false)

async function fetchLevels() {
  loading.value = true
  error.value = null
  try {
    const res = await getAdminLevels()
    levels.value = res.data.data || res.data || []
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to load levels'
    toast.show(error.value, 'error')
  } finally {
    loading.value = false
  }
}

async function fetchXpSettings() {
  try {
    const res = await getAdminXpSettings()
    xpSettings.value = res.data.data || res.data
  } catch {}
}

async function saveXpSettings() {
  savingXp.value = true
  try {
    await updateAdminXpSettings(xpSettings.value)
    toast.show('XP settings saved')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save XP settings', 'error')
  } finally {
    savingXp.value = false
  }
}

async function submitCreate() {
  try {
    await createAdminLevel(newLevel.value)
    toast.show('Level created')
    showCreateForm.value = false
    newLevel.value = { level: 1, xp_required: 0, label: '' }
    fetchLevels()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to create level', 'error')
  }
}

function startEdit(lvl) {
  editingId.value = lvl.id
  editForm.value = { level: lvl.level, xp_required: lvl.xp_required, label: lvl.label || '' }
}

async function saveEdit(id) {
  try {
    await updateAdminLevel(id, editForm.value)
    toast.show('Level updated')
    editingId.value = null
    fetchLevels()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to update level', 'error')
  }
}

async function doDelete(id) {
  if (!confirm('Delete this level?')) return
  try {
    await deleteAdminLevel(id)
    toast.show('Level deleted')
    fetchLevels()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to delete level', 'error')
  }
}

async function loadPreset() {
  if (!confirm('This will replace all existing levels with the preset. Continue?')) return
  try {
    const res = await presetAdminLevels()
    levels.value = res.data.data || res.data || []
    toast.show('Preset levels loaded')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to load preset', 'error')
  }
}

onMounted(() => {
  fetchLevels()
  fetchXpSettings()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Error -->
    <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
      <span class="text-sm text-red-400">{{ error }}</span>
      <button @click="fetchLevels" class="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30 transition-colors">Retry</button>
    </div>

    <!-- XP per Action settings -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6">
      <h3 class="text-base font-semibold text-white mb-1">XP per Action</h3>
      <p class="text-sm text-gray-400 mb-4">Configure how much XP users earn for each action.</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Posts (+XP)</label>
          <input v-model.number="xpSettings.xp_post_created" type="number" min="0" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Threads (+XP)</label>
          <input v-model.number="xpSettings.xp_thread_created" type="number" min="0" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Likes Received (+XP)</label>
          <input v-model.number="xpSettings.xp_like_received" type="number" min="0" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
      </div>
      <div class="mt-4">
        <button @click="saveXpSettings" :disabled="savingXp" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
          {{ savingXp ? 'Saving...' : 'Save XP Settings' }}
        </button>
      </div>
    </div>

    <!-- Header -->
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-400">Manage level thresholds and labels.</p>
      <div class="flex items-center gap-2">
        <button @click="loadPreset" class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors">
          Load Preset Levels
        </button>
        <button
          @click="showCreateForm = !showCreateForm"
          class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {{ showCreateForm ? 'Cancel' : '+ Add Level' }}
        </button>
      </div>
    </div>

    <!-- Create form -->
    <div v-if="showCreateForm" class="bg-gray-800 rounded-xl border border-violet-500/30 p-6 space-y-4">
      <h3 class="text-base font-semibold text-white">New Level</h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Level #</label>
          <input v-model.number="newLevel.level" type="number" min="1" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">XP Required</label>
          <input v-model.number="newLevel.xp_required" type="number" min="0" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Label</label>
          <input v-model="newLevel.label" type="text" placeholder="e.g. Newcomer" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        </div>
      </div>
      <div class="flex gap-2">
        <button @click="submitCreate" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors">Create</button>
        <button @click="showCreateForm = false" class="px-4 py-2 bg-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
      </div>
    </div>

    <!-- Levels table -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-700/50">
              <th class="px-5 py-3">Level</th>
              <th class="px-5 py-3">Label</th>
              <th class="px-5 py-3">XP Required</th>
              <th class="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700/50">
            <template v-if="loading">
              <tr v-for="i in 5" :key="i" class="animate-pulse">
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-10"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-24"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-16"></div></td>
                <td class="px-5 py-3"><div class="h-4 bg-gray-700 rounded w-20"></div></td>
              </tr>
            </template>
            <template v-else>
              <tr v-for="lvl in levels" :key="lvl.id" class="hover:bg-gray-700/30 transition-colors">
                <template v-if="editingId === lvl.id">
                  <td class="px-5 py-2">
                    <input v-model.number="editForm.level" type="number" min="1" class="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
                  </td>
                  <td class="px-5 py-2">
                    <input v-model="editForm.label" type="text" class="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
                  </td>
                  <td class="px-5 py-2">
                    <input v-model.number="editForm.xp_required" type="number" min="0" class="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
                  </td>
                  <td class="px-5 py-2">
                    <div class="flex items-center gap-1">
                      <button @click="saveEdit(lvl.id)" class="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded transition-colors">Save</button>
                      <button @click="editingId = null" class="px-2.5 py-1 bg-gray-700 text-gray-300 text-xs font-medium rounded hover:bg-gray-600 transition-colors">Cancel</button>
                    </div>
                  </td>
                </template>
                <template v-else>
                  <td class="px-5 py-3">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 font-bold text-sm">
                      {{ lvl.level }}
                    </span>
                  </td>
                  <td class="px-5 py-3 font-medium text-gray-200">{{ lvl.label || '\u2014' }}</td>
                  <td class="px-5 py-3 text-gray-400">{{ (lvl.xp_required ?? 0).toLocaleString() }} XP</td>
                  <td class="px-5 py-3">
                    <div class="flex items-center gap-1">
                      <button @click="startEdit(lvl)" class="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors" title="Edit">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button @click="doDelete(lvl.id)" class="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </template>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div v-if="!loading && !levels.length" class="px-5 py-12 text-center text-sm text-gray-500">
        No levels configured yet. Click "Load Preset Levels" to get started.
      </div>
    </div>
  </div>
</template>
