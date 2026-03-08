<script setup>
import { computed } from 'vue'
import { useForumStore } from '../stores/forum'

defineProps({ isDark: Boolean })

const forumStore = useForumStore()

const show = computed(() => forumStore.config?.show_usergroup_legend === 'true')

// Use role objects from the store, filtered/ordered by the config list if set
const groups = computed(() => {
  if (!forumStore.roles.length) return []

  try {
    const raw = forumStore.config?.usergroup_legend_groups
    const names = raw ? JSON.parse(raw) : null

    const byPriority = (a, b) => (a.priority ?? 0) - (b.priority ?? 0)

    if (names && Array.isArray(names)) {
      // Admin configured a specific list — filter to those roles, sort by priority
      return forumStore.roles
        .filter(r => names.some(n => n.toLowerCase() === r.name.toLowerCase()))
        .sort(byPriority)
    }

    // Default: all roles except 'banned', sorted by priority ascending
    return [...forumStore.roles.filter(r => r.name !== 'banned')].sort(byPriority)
  } catch {
    return forumStore.roles.filter(r => r.name !== 'banned')
  }
})
</script>

<template>
  <div
    v-if="show && groups.length"
    class="rounded-xl p-4 transition-colors duration-300"
    :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
  >
    <div class="flex items-center gap-4 flex-wrap">
      <span
        class="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shrink-0"
        :class="isDark ? 'text-gray-400' : 'text-gray-500'"
      >
        <i class="fa-solid fa-users"></i>
        Groups
      </span>
      <div class="flex items-center gap-4 flex-wrap">
        <div v-for="role in groups" :key="role.id" class="flex items-center gap-1.5">
          <span
            class="w-2.5 h-2.5 rounded-full shrink-0"
            :style="{ backgroundColor: role.color }"
          ></span>
          <span class="text-sm font-medium" :style="{ color: role.color }">
            {{ role.label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
