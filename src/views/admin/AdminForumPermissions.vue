<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getForumPermissions, updateForumPermissions } from '../../services/api'

const route = useRoute()
const router = useRouter()
const forumId = route.params.id

const forum = ref(null)
const permissions = ref([])
const saving = ref(false)
const saved = ref(false)
const loading = ref(true)

const roleLabels = {
  guest: 'Guest',
  member: 'Member',
  vip: 'VIP',
  elite: 'Elite',
  moderator: 'Moderator',
  admin: 'Admin',
}

const roleIcons = {
  guest: 'fa-solid fa-user',
  member: 'fa-solid fa-user-check',
  vip: 'fa-solid fa-star',
  elite: 'fa-solid fa-crown',
  moderator: 'fa-solid fa-shield',
  admin: 'fa-solid fa-bolt',
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

function onViewToggle(perm) {
  if (!perm.can_view) {
    perm.can_post = false
    perm.can_reply = false
  }
}
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <button @click="router.push('/admin/forums')" class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
        <i class="fa-solid fa-arrow-left text-sm"></i>
      </button>
      <div>
        <h1 class="text-xl font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-shield-halved text-violet-400"></i>
          Forum Permissions
        </h1>
        <p class="text-sm text-gray-400" v-if="forum">{{ forum.name }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-gray-800 rounded-xl p-8 text-center text-gray-500">
      <i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading...
    </div>

    <template v-else>
      <!-- Permissions table -->
      <div class="bg-gray-800 rounded-xl overflow-hidden mb-4">
        <!-- Column headers -->
        <div class="grid grid-cols-[200px_1fr_1fr_1fr] px-5 py-3 border-b border-gray-700 bg-gray-900/50">
          <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Group</span>
          <span class="text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">View</span>
          <span class="text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Post</span>
          <span class="text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Reply</span>
        </div>

        <!-- Role rows -->
        <div
          v-for="perm in permissions"
          :key="perm.role_name"
          class="grid grid-cols-[200px_1fr_1fr_1fr] px-5 py-4 border-b border-gray-700/40 last:border-0 items-center"
        >
          <div class="flex items-center gap-2.5">
            <i :class="[roleIcons[perm.role_name] || 'fa-solid fa-user', 'text-sm text-violet-400 w-4 text-center']"></i>
            <span class="text-sm font-semibold text-gray-200">{{ roleLabels[perm.role_name] || perm.role_name }}</span>
            <span v-if="perm.role_name === 'guest'" class="text-[10px] text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">unauthenticated</span>
          </div>
          <div class="flex justify-center">
            <input
              type="checkbox"
              v-model="perm.can_view"
              @change="onViewToggle(perm)"
              class="w-4 h-4 accent-violet-500 cursor-pointer rounded"
            />
          </div>
          <div class="flex justify-center">
            <input
              type="checkbox"
              v-model="perm.can_post"
              class="w-4 h-4 accent-violet-500 cursor-pointer rounded"
              :disabled="!perm.can_view"
              :class="!perm.can_view ? 'opacity-30 cursor-not-allowed' : ''"
            />
          </div>
          <div class="flex justify-center">
            <input
              type="checkbox"
              v-model="perm.can_reply"
              class="w-4 h-4 accent-violet-500 cursor-pointer rounded"
              :disabled="!perm.can_view"
              :class="!perm.can_view ? 'opacity-30 cursor-not-allowed' : ''"
            />
          </div>
        </div>
      </div>

      <p class="text-xs text-gray-500 mb-4">
        <i class="fa-solid fa-circle-info mr-1"></i>
        If no row is set for a role, all permissions default to allowed. Unchecking "View" automatically disables Post and Reply.
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
