<script setup>
import { ref, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getStaff } from '../services/api'
import UserAvatar from '../components/UserAvatar.vue'
import { formatJoinDate } from '../utils/date'
import { useForumStore } from '../stores/forum'

const isDark = inject('isDark', ref(true))
const router = useRouter()
const forumStore = useForumStore()

const staff = ref({})
const loading = ref(true)

const roleOrder = ['admin', 'moderator']

function groupColor(role) {
  return forumStore.config?.[`group_color_${role}`] || '#6b7280'
}
function groupLabel(role) {
  return forumStore.config?.[`group_label_${role}`] || role.charAt(0).toUpperCase() + role.slice(1)
}

onMounted(async () => {
  try {
    const res = await getStaff()
    staff.value = res.data.data
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold mb-1" :class="isDark ? 'text-white' : 'text-gray-900'">
        <i class="fa-solid fa-shield text-purple-accent mr-2"></i>Staff
      </h1>
      <p class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Meet the team keeping the community running.</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-8">
      <div v-for="i in 2" :key="i">
        <div class="h-5 w-32 rounded animate-pulse mb-4" :class="isDark ? 'bg-gray-700' : 'bg-gray-200'"></div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <div v-for="j in 3" :key="j" class="rounded-xl p-5 h-36 animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-white shadow-sm'"></div>
        </div>
      </div>
    </div>

    <!-- Staff groups -->
    <div v-else class="space-y-10">
      <div v-for="role in roleOrder" :key="role" v-show="staff[role]?.length">
        <!-- Role heading -->
        <div class="flex items-center gap-3 mb-4">
          <span
            class="text-sm font-bold uppercase tracking-widest px-3 py-1 rounded-full"
            :style="{ backgroundColor: groupColor(role) + '20', color: groupColor(role) }"
          >
            {{ groupLabel(role) }}
          </span>
          <div class="flex-1 h-px" :class="isDark ? 'bg-gray-800' : 'bg-gray-100'"></div>
        </div>

        <!-- Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <button
            v-for="member in staff[role]"
            :key="member.id"
            @click="router.push(`/profile/${member.username}`)"
            class="rounded-xl p-5 text-center transition-all duration-150 hover:scale-105 hover:shadow-lg group"
            :class="isDark ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white shadow-sm hover:shadow-md'"
            :style="{ borderTop: `3px solid ${groupColor(role)}` }"
          >
            <div class="mb-3 flex justify-center">
              <UserAvatar
                :name="member.username"
                :color="member.avatar_color || 'bg-purple-500'"
                :avatar-url="member.avatar_url"
                :online="member.is_online"
                size="lg"
              />
            </div>
            <div
              class="text-sm font-bold truncate group-hover:underline"
              :style="{ color: groupColor(role) }"
            >
              {{ member.username }}
            </div>
            <div class="text-[11px] mt-1" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
              Joined {{ formatJoinDate(member.joined) }}
            </div>
            <div class="text-[11px] mt-1" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
              <i class="fa-solid fa-pen-to-square mr-0.5"></i>{{ member.post_count }} posts
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
