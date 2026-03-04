<script setup>
import { ref, onMounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getForumPermissions, updateForumPermissions } from '../../services/api'

const isDark = inject('isDark')
const route = useRoute()
const router = useRouter()
const forumId = route.params.id

const forum = ref(null)
const permissions = ref([])
const saving = ref(false)
const saved = ref(false)
const loading = ref(true)

const roleLabels = {
  guest: 'Guest', member: 'Member', vip: 'VIP',
  elite: 'Elite', moderator: 'Moderator', admin: 'Admin',
}
const roleIcons = {
  guest: 'fa-solid fa-user', member: 'fa-solid fa-user-check',
  vip: 'fa-solid fa-star', elite: 'fa-solid fa-crown',
  moderator: 'fa-solid fa-shield', admin: 'fa-solid fa-bolt',
}

onMounted(async () => {
  try {
    const res = await getForumPermissions(forumId)
    forum.value = res.data.data.forum
    permissions.value = res.data.data.permissions
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    await updateForumPermissions(forumId, { permissions: permissions.value })
    saved.value = true
    setTimeout(() => saved.value = false, 2500)
  } finally {
    saving.value = false
  }
}

// Cycle: inherit (null) → allow (true) → deny (false) → inherit (null)
function cyclePermission(perm, field) {
  const cur = perm[field]
  if (cur === null || cur === undefined) perm[field] = true
  else if (cur === true) perm[field] = false
  else perm[field] = null

  // If view is denied/inherited-deny, lock post/reply
  if (field === 'can_view' && perm[field] === false) {
    perm.can_post = false
    perm.can_reply = false
  }
}

function stateLabel(val, groupVal) {
  if (val === null || val === undefined) return groupVal ? 'inherit (allow)' : 'inherit (deny)'
  return val ? 'allow' : 'deny'
}

function stateColor(val, groupVal) {
  if (val === null || val === undefined)
    return groupVal ? 'text-blue-400' : 'text-red-400'
  return val ? 'text-green-400' : 'text-red-400'
}

function stateIcon(val, groupVal) {
  if (val === null || val === undefined)
    return groupVal ? 'fa-solid fa-arrow-turn-down text-blue-400' : 'fa-solid fa-arrow-turn-down text-red-400'
  return val ? 'fa-solid fa-check text-green-400' : 'fa-solid fa-xmark text-red-400'
}
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <button @click="router.push('/admin/forums')"
        class="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
        :class="isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900'">
        <i class="fa-solid fa-arrow-left text-sm"></i>
      </button>
      <div>
        <h1 class="text-xl font-bold flex items-center gap-2" :class="isDark ? 'text-white' : 'text-gray-900'">
          <i class="fa-solid fa-shield-halved text-violet-400"></i>
          Forum Permissions
        </h1>
        <p class="text-sm text-gray-400" v-if="forum">{{ forum.name }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="rounded-xl p-8 text-center text-gray-500" :class="isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'">
      <i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading...
    </div>

    <template v-else>
      <!-- Legend -->
      <div class="flex flex-wrap items-center gap-4 mb-4 text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        <span class="flex items-center gap-1.5"><i class="fa-solid fa-arrow-turn-down text-blue-400"></i> Inherit from group default</span>
        <span class="flex items-center gap-1.5"><i class="fa-solid fa-check text-green-400"></i> Force allow</span>
        <span class="flex items-center gap-1.5"><i class="fa-solid fa-xmark text-red-400"></i> Force deny</span>
        <span :class="isDark ? 'text-gray-600' : 'text-gray-400'">— Click any cell to cycle</span>
      </div>

      <!-- Permissions table -->
      <div class="rounded-xl overflow-hidden mb-4" :class="isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'">
        <!-- Column headers -->
        <div class="grid grid-cols-[200px_1fr_1fr_1fr] px-5 py-3 border-b"
          :class="isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'">
          <span class="text-xs font-semibold uppercase tracking-wider" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Group</span>
          <span class="text-xs font-semibold uppercase tracking-wider text-center" :class="isDark ? 'text-gray-500' : 'text-gray-400'">View</span>
          <span class="text-xs font-semibold uppercase tracking-wider text-center" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Post</span>
          <span class="text-xs font-semibold uppercase tracking-wider text-center" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Reply</span>
        </div>

        <!-- Role rows -->
        <div
          v-for="perm in permissions"
          :key="perm.role_name"
          class="grid grid-cols-[200px_1fr_1fr_1fr] px-5 py-4 border-b last:border-0 items-center"
          :class="isDark ? 'border-gray-700/40' : 'border-gray-100'"
        >
          <div class="flex items-center gap-2.5">
            <i :class="[roleIcons[perm.role_name] || 'fa-solid fa-user', 'text-sm text-violet-400 w-4 text-center']"></i>
            <span class="text-sm font-semibold" :class="isDark ? 'text-gray-200' : 'text-gray-800'">{{ roleLabels[perm.role_name] || perm.role_name }}</span>
            <span v-if="perm.role_name === 'guest'" class="text-[10px] px-1.5 py-0.5 rounded" :class="isDark ? 'text-gray-500 bg-gray-700' : 'text-gray-400 bg-gray-100'">not logged in</span>
          </div>

          <!-- View -->
          <div class="flex flex-col items-center gap-1">
            <button
              @click="cyclePermission(perm, 'can_view')"
              class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:opacity-80"
              :class="isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'"
              :title="stateLabel(perm.can_view, perm.group_view)"
            >
              <i :class="stateIcon(perm.can_view, perm.group_view)" class="text-sm"></i>
            </button>
          </div>

          <!-- Post -->
          <div class="flex flex-col items-center gap-1">
            <button
              @click="cyclePermission(perm, 'can_post')"
              class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:opacity-80"
              :class="isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'"
              :title="stateLabel(perm.can_post, perm.group_post)"
            >
              <i :class="stateIcon(perm.can_post, perm.group_post)" class="text-sm"></i>
            </button>
          </div>

          <!-- Reply -->
          <div class="flex flex-col items-center gap-1">
            <button
              @click="cyclePermission(perm, 'can_reply')"
              class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:opacity-80"
              :class="isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'"
              :title="stateLabel(perm.can_reply, perm.group_reply)"
            >
              <i :class="stateIcon(perm.can_reply, perm.group_reply)" class="text-sm"></i>
            </button>
          </div>
        </div>
      </div>

      <p class="text-xs mb-4" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
        <i class="fa-solid fa-circle-info mr-1"></i>
        Inherit uses the group's default permission. Force allow/deny overrides it for this forum only.
        Set group defaults in <router-link to="/admin/groups" class="text-violet-400 hover:underline">Groups &amp; Roles</router-link>.
      </p>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <transition name="fade">
          <span v-if="saved" class="text-sm text-green-400 flex items-center gap-1">
            <i class="fa-solid fa-circle-check"></i> Saved!
          </span>
        </transition>
        <button
          @click="save"
          :disabled="saving"
          class="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <i class="fa-solid fa-floppy-disk mr-1.5"></i>
          {{ saving ? 'Saving...' : 'Save Permissions' }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
