<script setup>
import { ref, onMounted, inject } from 'vue'
import { getAdminGroups, createAdminGroup, updateAdminGroup, deleteAdminGroup } from '../../services/api'
import { useToastStore } from '../../stores/toast'
import { useForumStore } from '../../stores/forum'

const isDark = inject('isDark')
const toast = useToastStore()
const forumStore = useForumStore()

const groups = ref([])
const loading = ref(true)
const saving = ref(false)

// Create form
const newName = ref('')
const newColor = ref('#8b5cf6')
const newLabel = ref('')

// Edit state
const editingId = ref(null)
const editTab = ref('general')
const editName = ref('')
const editLabel = ref('')
const editColor = ref('#94a3b8')
const editPriority = ref(0)
const editPerks = ref([])
const editIsStaff = ref(false)
const editStaffPermissions = ref([])
const editCanView = ref(true)
const editCanPost = ref(true)
const editCanReply = ref(true)

const ALL_PERKS = [
  { value: 'no_ads',                label: 'No Advertisements' },
  { value: 'bypass_unlock',         label: 'Bypass Unlock Requirements' },
  { value: 'profile_cover',         label: 'Profile Cover Photo' },
  { value: 'custom_css',            label: 'Custom Profile CSS' },
  { value: 'locked_content_bypass', label: 'Unlock Locked Content Free' },
  { value: 'change_username',       label: 'Change Username' },
  { value: 'userbar_hue',           label: 'Userbar Hue' },
  { value: 'username_color',        label: 'Custom Username Color' },
  { value: 'awards_reorder',        label: 'Reorder Awards' },
  { value: 'pre_access',            label: 'Pre-Access to New Features' },
]

const ALL_STAFF_PERMISSIONS = [
  { value: 'view_reports',   label: 'View & manage reports',               icon: 'fa-flag' },
  { value: 'manage_threads', label: 'Manage threads (pin, lock, solve, delete)', icon: 'fa-thumbtack' },
  { value: 'manage_posts',   label: 'Manage posts (delete)',               icon: 'fa-comment-slash' },
  { value: 'ban_users',      label: 'Ban & unban users',                   icon: 'fa-ban' },
  { value: 'grant_awards',   label: 'Grant & revoke awards',               icon: 'fa-trophy' },
]

const TABS = [
  { key: 'general',     label: 'General',     icon: 'fa-sliders' },
  { key: 'permissions', label: 'Permissions', icon: 'fa-shield-halved' },
  { key: 'perks',       label: 'Perks',       icon: 'fa-star' },
  { key: 'staff',       label: 'Staff Access', icon: 'fa-user-shield' },
]

async function fetchGroups() {
  loading.value = true
  try {
    const res = await getAdminGroups()
    groups.value = res.data.data || res.data
  } catch {
    toast.show('Failed to load groups.', 'error')
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
    toast.show('Group created.')
  } catch {
    toast.show('Failed to create group.', 'error')
  } finally {
    saving.value = false
  }
}

function startEdit(group) {
  editingId.value = group.id
  editTab.value = 'general'
  editName.value = group.name
  editColor.value = group.color || '#8b5cf6'
  editLabel.value = group.label || group.name
  editPriority.value = group.priority ?? 0
  editPerks.value = Array.isArray(group.perks) ? [...group.perks] : []
  editIsStaff.value = !!group.is_staff
  editStaffPermissions.value = Array.isArray(group.staff_permissions) ? [...group.staff_permissions] : []
  editCanView.value = group.can_view ?? true
  editCanPost.value = group.can_post ?? true
  editCanReply.value = group.can_reply ?? true
}

function cancelEdit() {
  editingId.value = null
}

function onViewToggle() {
  if (!editCanView.value) {
    editCanPost.value = false
    editCanReply.value = false
  }
}

async function saveEdit(group) {
  saving.value = true
  try {
    const res = await updateAdminGroup(group.id, {
      name:              editName.value.trim(),
      color:             editColor.value,
      label:             editLabel.value.trim(),
      priority:          editPriority.value,
      perks:             editPerks.value,
      is_staff:          editIsStaff.value,
      staff_permissions: editIsStaff.value ? editStaffPermissions.value : [],
      can_view:          editCanView.value,
      can_post:          editCanPost.value,
      can_reply:         editCanReply.value,
    })
    const updated = res.data.data || res.data
    const idx = groups.value.findIndex(g => g.id === group.id)
    if (idx !== -1) groups.value[idx] = { ...groups.value[idx], ...updated }
    cancelEdit()
    toast.show('Group saved.')
    forumStore.fetchRoles() // keep legend + colors in sync
  } catch {
    toast.show('Failed to save group.', 'error')
  } finally {
    saving.value = false
  }
}

async function handleDelete(group) {
  if (!window.confirm(`Delete group "${group.name}"? This cannot be undone.`)) return
  try {
    await deleteAdminGroup(group.id)
    groups.value = groups.value.filter(g => g.id !== group.id)
    toast.show('Group deleted.')
  } catch {
    toast.show('Failed to delete group.', 'error')
  }
}

onMounted(fetchGroups)
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

    <!-- Groups table -->
    <div class="rounded-xl border overflow-hidden" :class="isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'">
      <div v-if="loading" class="p-6 space-y-3">
        <div v-for="i in 4" :key="i" class="h-12 rounded-lg animate-pulse" :class="isDark ? 'bg-gray-700' : 'bg-gray-100'" />
      </div>

      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b text-xs font-semibold uppercase tracking-wider"
            :class="isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-400'">
            <th class="text-left px-5 py-3">Name</th>
            <th class="text-left px-5 py-3">Label</th>
            <th class="text-center px-3 py-3">Priority</th>
            <th class="text-center px-3 py-3">Users</th>
            <th class="text-right px-5 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!groups.length">
            <td colspan="5" class="px-5 py-10 text-center text-gray-500">No groups found.</td>
          </tr>

          <template v-for="group in groups" :key="group.id">
            <!-- Row -->
            <tr class="border-b transition-colors"
              :class="[isDark ? 'border-gray-700/50 hover:bg-gray-700/20' : 'border-gray-100 hover:bg-gray-50']">
              <td class="px-5 py-3">
                <div class="flex items-center gap-2.5">
                  <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: group.color || '#6b7280' }"></span>
                  <span class="font-medium" :class="isDark ? 'text-white' : 'text-gray-900'">{{ group.name }}</span>
                  <span v-if="group.is_staff"
                    class="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/30">
                    Staff
                  </span>
                </div>
              </td>
              <td class="px-5 py-3">
                <span class="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  :style="{ backgroundColor: (group.color || '#6b7280') + '20', color: group.color || '#6b7280', border: `1px solid ${group.color || '#6b7280'}40` }">
                  {{ group.label || group.name }}
                </span>
              </td>
              <td class="px-3 py-3 text-center">
                <span class="text-xs font-mono px-2 py-0.5 rounded" :class="isDark ? 'text-gray-400 bg-gray-700/50' : 'text-gray-500 bg-gray-100'">
                  {{ group.priority ?? 0 }}
                </span>
              </td>
              <td class="px-3 py-3 text-center text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                {{ group.users_count ?? 0 }}
              </td>
              <td class="px-5 py-3 text-right">
                <template v-if="editingId === group.id">
                  <button @click="saveEdit(group)" :disabled="saving"
                    class="text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors mr-1.5 disabled:opacity-50">
                    <i class="fa-solid fa-floppy-disk mr-1"></i>Save
                  </button>
                  <button @click="cancelEdit"
                    class="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                    :class="isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'">
                    Cancel
                  </button>
                </template>
                <template v-else>
                  <button @click="startEdit(group)"
                    class="text-xs px-2.5 py-1.5 rounded-lg transition-colors mr-1"
                    :class="isDark ? 'text-gray-400 hover:text-violet-400 hover:bg-gray-700' : 'text-gray-400 hover:text-violet-600 hover:bg-gray-100'">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button @click="handleDelete(group)"
                    class="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                    :class="isDark ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </template>
              </td>
            </tr>

            <!-- Inline edit panel -->
            <tr v-if="editingId === group.id" class="border-b"
              :class="isDark ? 'border-gray-700/50 bg-gray-900/50' : 'border-gray-100 bg-violet-50/30'">
              <td colspan="5" class="px-5 pt-3 pb-5">

                <!-- Tabs -->
                <div class="flex gap-0.5 mb-5 border-b" :class="isDark ? 'border-gray-700' : 'border-gray-200'">
                  <button v-for="tab in TABS" :key="tab.key"
                    @click="editTab = tab.key"
                    class="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px"
                    :class="editTab === tab.key
                      ? 'border-violet-500 text-violet-400'
                      : isDark ? 'border-transparent text-gray-500 hover:text-gray-300' : 'border-transparent text-gray-400 hover:text-gray-600'">
                    <i :class="`fa-solid ${tab.icon}`"></i>
                    {{ tab.label }}
                  </button>
                </div>

                <!-- Tab: General -->
                <div v-if="editTab === 'general'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div>
                    <label class="block text-xs font-medium mb-1.5" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Display Name</label>
                    <input v-model="editLabel" type="text" placeholder="e.g. Administrators"
                      class="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      :class="isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'" />
                    <p class="text-[11px] mt-1.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Shown to users everywhere on the forum.</p>
                  </div>
                  <div>
                    <label class="block text-xs font-medium mb-1.5" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Group Color</label>
                    <div class="flex items-center gap-2">
                      <input v-model="editColor" type="color" class="w-10 h-9 rounded-lg border cursor-pointer shrink-0"
                        :class="isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-white'" />
                      <input v-model="editColor" type="text" placeholder="#8b5cf6"
                        class="flex-1 px-3 py-2 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
                        :class="isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-medium mb-1.5" :class="isDark ? 'text-gray-400' : 'text-gray-600'">System Name</label>
                    <input v-model="editName" type="text" placeholder="e.g. admin"
                      class="w-full px-3 py-2 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
                      :class="isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'" />
                    <p class="text-[11px] mt-1.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Internal identifier. Lowercase, no spaces. Changing this may break permission rules.</p>
                  </div>
                  <div>
                    <label class="block text-xs font-medium mb-1.5" :class="isDark ? 'text-gray-400' : 'text-gray-600'">Priority (0–100)</label>
                    <input v-model.number="editPriority" type="number" min="0" max="100"
                      class="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      :class="isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'" />
                    <p class="text-[11px] mt-1.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Higher = more powerful. Admin should be highest.</p>
                  </div>
                </div>

                <!-- Tab: Permissions -->
                <div v-if="editTab === 'permissions'" class="space-y-3 max-w-sm">
                  <p class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                    Default forum access for this group. Individual forums can override these.
                  </p>
                  <div class="space-y-2">
                    <label
                      class="flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer transition-colors select-none"
                      :class="isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'">
                      <span class="text-sm font-medium" :class="isDark ? 'text-gray-200' : 'text-gray-700'">
                        <i class="fa-solid fa-eye w-4 mr-2 text-violet-400"></i>Can View Forums
                      </span>
                      <div class="relative">
                        <input type="checkbox" v-model="editCanView" @change="onViewToggle" class="sr-only" />
                        <div class="w-9 h-5 rounded-full transition-colors" :class="editCanView ? 'bg-violet-600' : isDark ? 'bg-gray-600' : 'bg-gray-300'"></div>
                        <div class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" :class="editCanView ? 'translate-x-4' : ''"></div>
                      </div>
                    </label>
                    <label
                      class="flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer transition-colors select-none"
                      :class="[
                        isDark ? 'border-gray-700' : 'border-gray-200',
                        editCanView ? (isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50') : 'opacity-40 cursor-not-allowed'
                      ]">
                      <span class="text-sm font-medium" :class="isDark ? 'text-gray-200' : 'text-gray-700'">
                        <i class="fa-solid fa-pen-to-square w-4 mr-2 text-violet-400"></i>Can Create Threads
                      </span>
                      <div class="relative">
                        <input type="checkbox" v-model="editCanPost" :disabled="!editCanView" class="sr-only" />
                        <div class="w-9 h-5 rounded-full transition-colors" :class="editCanPost && editCanView ? 'bg-violet-600' : isDark ? 'bg-gray-600' : 'bg-gray-300'"></div>
                        <div class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" :class="editCanPost && editCanView ? 'translate-x-4' : ''"></div>
                      </div>
                    </label>
                    <label
                      class="flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer transition-colors select-none"
                      :class="[
                        isDark ? 'border-gray-700' : 'border-gray-200',
                        editCanView ? (isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50') : 'opacity-40 cursor-not-allowed'
                      ]">
                      <span class="text-sm font-medium" :class="isDark ? 'text-gray-200' : 'text-gray-700'">
                        <i class="fa-solid fa-reply w-4 mr-2 text-violet-400"></i>Can Reply to Threads
                      </span>
                      <div class="relative">
                        <input type="checkbox" v-model="editCanReply" :disabled="!editCanView" class="sr-only" />
                        <div class="w-9 h-5 rounded-full transition-colors" :class="editCanReply && editCanView ? 'bg-violet-600' : isDark ? 'bg-gray-600' : 'bg-gray-300'"></div>
                        <div class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" :class="editCanReply && editCanView ? 'translate-x-4' : ''"></div>
                      </div>
                    </label>
                  </div>
                </div>

                <!-- Tab: Perks -->
                <div v-if="editTab === 'perks'">
                  <p class="text-xs mb-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                    Select the perks and privileges members of this group receive.
                  </p>
                  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    <label
                      v-for="perk in ALL_PERKS" :key="perk.value"
                      class="flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all text-xs font-medium select-none"
                      :class="editPerks.includes(perk.value)
                        ? 'bg-violet-600/15 border-violet-500 text-violet-300'
                        : isDark ? 'border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:border-violet-300 hover:bg-white'">
                      <input type="checkbox" :value="perk.value" v-model="editPerks" class="hidden" />
                      <i class="fa-solid shrink-0 text-sm"
                        :class="editPerks.includes(perk.value) ? 'fa-square-check text-violet-400' : 'fa-square text-gray-500'"></i>
                      {{ perk.label }}
                    </label>
                  </div>
                </div>

                <!-- Tab: Staff Access -->
                <div v-if="editTab === 'staff'" class="space-y-5">
                  <!-- is_staff toggle -->
                  <label class="flex items-center justify-between px-4 py-3.5 rounded-xl border cursor-pointer select-none max-w-sm"
                    :class="editIsStaff
                      ? 'bg-violet-600/10 border-violet-500/40'
                      : isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'">
                    <div>
                      <div class="text-sm font-semibold" :class="isDark ? 'text-gray-200' : 'text-gray-800'">
                        <i class="fa-solid fa-user-shield mr-2 text-violet-400"></i>Staff Panel Access
                      </div>
                      <div class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Grant this group access to the Staff Control Panel</div>
                    </div>
                    <div class="relative ml-4 shrink-0">
                      <input type="checkbox" v-model="editIsStaff" class="sr-only" />
                      <div class="w-10 h-5 rounded-full transition-colors" :class="editIsStaff ? 'bg-violet-600' : isDark ? 'bg-gray-600' : 'bg-gray-300'"></div>
                      <div class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" :class="editIsStaff ? 'translate-x-5' : ''"></div>
                    </div>
                  </label>

                  <!-- Staff permissions -->
                  <div v-if="editIsStaff" class="space-y-2 max-w-md">
                    <p class="text-xs font-semibold uppercase tracking-wider" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                      What can this group do in the Staff Panel?
                    </p>
                    <label
                      v-for="perm in ALL_STAFF_PERMISSIONS" :key="perm.value"
                      class="flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all select-none"
                      :class="editStaffPermissions.includes(perm.value)
                        ? 'bg-violet-600/10 border-violet-500/50'
                        : isDark ? 'border-gray-700 hover:bg-gray-800 hover:border-gray-600' : 'border-gray-200 hover:bg-gray-50'">
                      <input type="checkbox" :value="perm.value" v-model="editStaffPermissions" class="hidden" />
                      <i :class="`fa-solid fa-${perm.icon} w-4 text-center shrink-0`"
                        :style="{ color: editStaffPermissions.includes(perm.value) ? '#a78bfa' : '#6b7280' }"></i>
                      <span class="text-sm font-medium"
                        :class="editStaffPermissions.includes(perm.value) ? 'text-violet-300' : isDark ? 'text-gray-300' : 'text-gray-700'">
                        {{ perm.label }}
                      </span>
                      <i v-if="editStaffPermissions.includes(perm.value)"
                        class="fa-solid fa-check text-violet-400 text-xs ml-auto"></i>
                    </label>
                  </div>
                  <p v-else class="text-sm" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                    Enable Staff Panel Access above to configure permissions.
                  </p>
                </div>

              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
