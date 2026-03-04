<script setup>
import { ref, onMounted, inject } from 'vue'
import {
  getAdminGroups, createAdminGroup, updateAdminGroup, deleteAdminGroup,
  getGroupPermissions, updateGroupPermissions,
} from '../../services/api'

const isDark = inject('isDark')

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

// Group permissions
const groupPerms = ref([])
const permsLoading = ref(true)
const permsSaving = ref(false)
const permsSaved = ref(false)

const roleLabels = {
  guest: 'Guest', member: 'Member', vip: 'VIP',
  elite: 'Elite', moderator: 'Moderator', admin: 'Admin',
}
const roleIcons = {
  guest: 'fa-solid fa-user', member: 'fa-solid fa-user-check',
  vip: 'fa-solid fa-star', elite: 'fa-solid fa-crown',
  moderator: 'fa-solid fa-shield', admin: 'fa-solid fa-bolt',
}

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

async function fetchGroupPerms() {
  permsLoading.value = true
  try {
    const res = await getGroupPermissions()
    groupPerms.value = res.data.data || []
  } catch {
    // silent
  } finally {
    permsLoading.value = false
  }
}

async function saveGroupPerms() {
  permsSaving.value = true
  try {
    await updateGroupPermissions({ permissions: groupPerms.value })
    permsSaved.value = true
    setTimeout(() => permsSaved.value = false, 2500)
  } finally {
    permsSaving.value = false
  }
}

function onViewToggle(perm) {
  if (!perm.can_view) {
    perm.can_post = false
    perm.can_reply = false
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
}

async function saveEdit(group) {
  saving.value = true
  try {
    const res = await updateAdminGroup(group.id, { color: editColor.value, label: editLabel.value.trim() })
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

onMounted(() => {
  fetchGroups()
  fetchGroupPerms()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Create form -->
    <div class="rounded-xl p-5 border" :class="isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'">
      <h2 class="text-sm font-semibold uppercase tracking-wider mb-4" :class="isDark ? 'text-gray-300' : 'text-gray-500'">Create Group</h2>
      <form @submit.prevent="handleCreate" class="flex flex-wrap items-end gap-4">
        <div class="flex-1 min-w-[160px]">
          <label class="block text-xs font-medium mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Name</label>
          <input v-model="newName" type="text" placeholder="e.g. Moderator"
            class="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            :class="isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'" />
        </div>
        <div class="w-20">
          <label class="block text-xs font-medium mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Color</label>
          <input v-model="newColor" type="color" class="w-full h-9 rounded-lg border cursor-pointer"
            :class="isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-white'" />
        </div>
        <div class="flex-1 min-w-[160px]">
          <label class="block text-xs font-medium mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Display Label</label>
          <input v-model="newLabel" type="text" placeholder="Optional"
            class="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            :class="isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'" />
        </div>
        <button type="submit" :disabled="saving || !newName.trim()"
          class="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {{ saving ? 'Creating...' : 'Create' }}
        </button>
      </form>
    </div>

    <!-- Error -->
    <div v-if="error" class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{{ error }}</div>

    <!-- Groups table -->
    <div class="rounded-xl border overflow-hidden" :class="isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'">
      <div v-if="loading" class="p-6 space-y-3">
        <div v-for="i in 3" :key="i" class="h-12 rounded-lg animate-pulse" :class="isDark ? 'bg-gray-700' : 'bg-gray-100'" />
      </div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b text-xs font-semibold uppercase tracking-wider"
            :class="isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-400'">
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
          <tr v-for="group in groups" :key="group.id"
            class="border-b last:border-0 transition-colors"
            :class="isDark ? 'border-gray-700/50 hover:bg-gray-700/30' : 'border-gray-100 hover:bg-gray-50'">
            <td class="px-5 py-3 font-medium" :class="isDark ? 'text-white' : 'text-gray-900'">{{ group.name }}</td>
            <td class="px-5 py-3">
              <input v-if="editingId === group.id" v-model="editColor" type="color"
                class="w-8 h-8 rounded border cursor-pointer"
                :class="isDark ? 'border-gray-600 bg-gray-900' : 'border-gray-300 bg-white'" />
              <span v-else class="inline-block w-6 h-6 rounded-full border-2"
                :style="{ backgroundColor: group.color || '#6b7280', borderColor: (group.color || '#6b7280') + '60' }" />
            </td>
            <td class="px-5 py-3">
              <input v-if="editingId === group.id" v-model="editLabel" type="text"
                class="px-2 py-1 rounded border text-sm w-full max-w-[200px] focus:outline-none focus:ring-2 focus:ring-violet-500"
                :class="isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'" />
              <span v-else class="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full"
                :style="{ backgroundColor: (group.color||'#6b7280')+'20', color: group.color||'#6b7280', border: `1px solid ${group.color||'#6b7280'}40` }">
                {{ group.label || group.name }}
              </span>
            </td>
            <td class="px-5 py-3 text-center" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ group.users_count ?? 0 }}</td>
            <td class="px-5 py-3 text-right">
              <template v-if="editingId === group.id">
                <button @click="saveEdit(group)" :disabled="saving"
                  class="text-xs px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors mr-1 disabled:opacity-50">Save</button>
                <button @click="cancelEdit"
                  class="text-xs px-2.5 py-1 rounded transition-colors"
                  :class="isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'">Cancel</button>
              </template>
              <template v-else>
                <button @click="startEdit(group)" title="Edit"
                  class="text-xs px-2.5 py-1 rounded transition-colors mr-1"
                  :class="isDark ? 'text-gray-400 hover:text-violet-400 hover:bg-gray-700' : 'text-gray-400 hover:text-violet-600 hover:bg-gray-100'">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button @click="handleDelete(group)" title="Delete"
                  class="text-xs px-2.5 py-1 rounded transition-colors"
                  :class="isDark ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ─── Default Permissions ─── -->
    <div class="rounded-xl border overflow-hidden" :class="isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'">
      <div class="px-5 py-4 border-b flex items-center justify-between"
        :class="isDark ? 'border-gray-700' : 'border-gray-200'">
        <div>
          <h2 class="text-sm font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">
            <i class="fa-solid fa-shield-halved text-violet-400 mr-2"></i>Default Permissions
          </h2>
          <p class="text-xs mt-0.5" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            Global baseline for each group. Individual forums can override these.
          </p>
        </div>
      </div>

      <div v-if="permsLoading" class="p-6">
        <div v-for="i in 4" :key="i" class="h-10 rounded mb-2 animate-pulse" :class="isDark ? 'bg-gray-700' : 'bg-gray-100'" />
      </div>

      <template v-else>
        <!-- Column headers -->
        <div class="grid grid-cols-[200px_1fr_1fr_1fr] px-5 py-2.5 border-b text-xs font-semibold uppercase tracking-wider"
          :class="isDark ? 'border-gray-700 bg-gray-900/40 text-gray-500' : 'border-gray-100 bg-gray-50 text-gray-400'">
          <span>Group</span>
          <span class="text-center">View</span>
          <span class="text-center">Post</span>
          <span class="text-center">Reply</span>
        </div>

        <div v-for="perm in groupPerms" :key="perm.role_name"
          class="grid grid-cols-[200px_1fr_1fr_1fr] px-5 py-3.5 border-b last:border-0 items-center"
          :class="isDark ? 'border-gray-700/40' : 'border-gray-100'">
          <div class="flex items-center gap-2.5">
            <i :class="[roleIcons[perm.role_name] || 'fa-solid fa-user', 'text-sm text-violet-400 w-4 text-center']"></i>
            <span class="text-sm font-semibold" :class="isDark ? 'text-gray-200' : 'text-gray-800'">{{ roleLabels[perm.role_name] || perm.role_name }}</span>
          </div>
          <div class="flex justify-center">
            <input type="checkbox" v-model="perm.can_view" @change="onViewToggle(perm)"
              class="w-4 h-4 accent-violet-500 cursor-pointer rounded" />
          </div>
          <div class="flex justify-center">
            <input type="checkbox" v-model="perm.can_post"
              class="w-4 h-4 accent-violet-500 cursor-pointer rounded"
              :disabled="!perm.can_view" :class="!perm.can_view ? 'opacity-30 cursor-not-allowed' : ''" />
          </div>
          <div class="flex justify-center">
            <input type="checkbox" v-model="perm.can_reply"
              class="w-4 h-4 accent-violet-500 cursor-pointer rounded"
              :disabled="!perm.can_view" :class="!perm.can_view ? 'opacity-30 cursor-not-allowed' : ''" />
          </div>
        </div>

        <div class="px-5 py-3 flex items-center justify-end gap-3 border-t"
          :class="isDark ? 'border-gray-700' : 'border-gray-200'">
          <transition name="fade">
            <span v-if="permsSaved" class="text-sm text-green-400 flex items-center gap-1">
              <i class="fa-solid fa-circle-check"></i> Saved!
            </span>
          </transition>
          <button @click="saveGroupPerms" :disabled="permsSaving"
            class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
            <i class="fa-solid fa-floppy-disk mr-1.5"></i>
            {{ permsSaving ? 'Saving...' : 'Save Defaults' }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
