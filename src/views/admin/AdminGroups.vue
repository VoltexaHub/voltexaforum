<script setup>
import { ref, onMounted } from 'vue'
import { getAdminGroups, createAdminGroup, updateAdminGroup, deleteAdminGroup } from '../../services/api'

const groups = ref([])
const loading = ref(true)
const error = ref(null)
const saving = ref(false)

// Create form
const newName = ref('')
const newColor = ref('#8b5cf6')
const newLabel = ref('')

// Edit state
const editingId = ref(null)
const editColor = ref('')
const editLabel = ref('')

async function fetchGroups() {
  loading.value = true
  error.value = null
  try {
    const res = await getAdminGroups()
    groups.value = res.data.data || res.data
  } catch {
    error.value = 'Failed to load groups.'
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!newName.value.trim()) return
  saving.value = true
  try {
    const res = await createAdminGroup({
      name: newName.value.trim(),
      color: newColor.value,
      label: newLabel.value.trim() || newName.value.trim(),
    })
    groups.value.push(res.data.data || res.data)
    newName.value = ''
    newColor.value = '#8b5cf6'
    newLabel.value = ''
  } catch {
    error.value = 'Failed to create group.'
  } finally {
    saving.value = false
  }
}

function startEdit(group) {
  editingId.value = group.id
  editColor.value = group.color || '#8b5cf6'
  editLabel.value = group.label || group.name
}

function cancelEdit() {
  editingId.value = null
  editColor.value = ''
  editLabel.value = ''
}

async function saveEdit(group) {
  saving.value = true
  try {
    const res = await updateAdminGroup(group.id, {
      color: editColor.value,
      label: editLabel.value.trim(),
    })
    const updated = res.data.data || res.data
    const idx = groups.value.findIndex(g => g.id === group.id)
    if (idx !== -1) groups.value[idx] = { ...groups.value[idx], ...updated }
    cancelEdit()
  } catch {
    error.value = 'Failed to update group.'
  } finally {
    saving.value = false
  }
}

async function handleDelete(group) {
  if (!window.confirm(`Delete group "${group.name}"? This cannot be undone.`)) return
  try {
    await deleteAdminGroup(group.id)
    groups.value = groups.value.filter(g => g.id !== group.id)
  } catch {
    error.value = 'Failed to delete group.'
  }
}

onMounted(fetchGroups)
</script>

<template>
  <div class="space-y-6">
    <!-- Create form -->
    <div class="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Create Group</h2>
      <form @submit.prevent="handleCreate" class="flex flex-wrap items-end gap-4">
        <div class="flex-1 min-w-[160px]">
          <label class="block text-xs font-medium text-gray-400 mb-1">Name</label>
          <input
            v-model="newName"
            type="text"
            placeholder="e.g. Moderator"
            class="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div class="w-20">
          <label class="block text-xs font-medium text-gray-400 mb-1">Color</label>
          <input
            v-model="newColor"
            type="color"
            class="w-full h-9 rounded-lg border border-gray-700 bg-gray-900 cursor-pointer"
          />
        </div>
        <div class="flex-1 min-w-[160px]">
          <label class="block text-xs font-medium text-gray-400 mb-1">Label</label>
          <input
            v-model="newLabel"
            type="text"
            placeholder="Display label (optional)"
            class="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <button
          type="submit"
          :disabled="saving || !newName.trim()"
          class="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {{ saving ? 'Creating...' : 'Create' }}
        </button>
      </form>
    </div>

    <!-- Error -->
    <div v-if="error" class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-14 rounded-lg animate-pulse bg-gray-800" />
    </div>

    <!-- Groups table -->
    <div v-else class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-700 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <th class="text-left px-5 py-3">Name</th>
            <th class="text-left px-5 py-3">Color</th>
            <th class="text-left px-5 py-3">Label</th>
            <th class="text-center px-5 py-3">Users</th>
            <th class="text-right px-5 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!groups.length">
            <td colspan="5" class="px-5 py-8 text-center text-gray-500">No groups found.</td>
          </tr>
          <tr
            v-for="group in groups"
            :key="group.id"
            class="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/30 transition-colors"
          >
            <td class="px-5 py-3 font-medium text-white">{{ group.name }}</td>
            <td class="px-5 py-3">
              <template v-if="editingId === group.id">
                <input v-model="editColor" type="color" class="w-8 h-8 rounded border border-gray-600 cursor-pointer bg-gray-900" />
              </template>
              <template v-else>
                <span
                  class="inline-block w-6 h-6 rounded-full border-2 border-gray-600"
                  :style="{ backgroundColor: group.color || '#6b7280' }"
                />
              </template>
            </td>
            <td class="px-5 py-3">
              <template v-if="editingId === group.id">
                <input
                  v-model="editLabel"
                  type="text"
                  class="px-2 py-1 rounded bg-gray-900 border border-gray-700 text-white text-sm w-full max-w-[200px] focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </template>
              <template v-else>
                <span
                  class="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full"
                  :style="{
                    backgroundColor: (group.color || '#6b7280') + '20',
                    color: group.color || '#6b7280',
                    border: `1px solid ${group.color || '#6b7280'}40`,
                  }"
                >
                  {{ group.label || group.name }}
                </span>
              </template>
            </td>
            <td class="px-5 py-3 text-center text-gray-400">{{ group.users_count ?? 0 }}</td>
            <td class="px-5 py-3 text-right">
              <template v-if="editingId === group.id">
                <button
                  @click="saveEdit(group)"
                  :disabled="saving"
                  class="text-xs px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors mr-1 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  @click="cancelEdit"
                  class="text-xs px-2.5 py-1 rounded text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </template>
              <template v-else>
                <button
                  @click="startEdit(group)"
                  class="text-xs px-2.5 py-1 rounded text-gray-400 hover:text-violet-400 hover:bg-gray-700 transition-colors mr-1"
                  title="Edit"
                >
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button
                  @click="handleDelete(group)"
                  class="text-xs px-2.5 py-1 rounded text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors"
                  title="Delete"
                >
                  <i class="fa-solid fa-trash"></i>
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
