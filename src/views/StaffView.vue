<script setup>
import { ref, inject, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getStaff } from '../services/api'
import UserAvatar from '../components/UserAvatar.vue'
import { formatJoinDate } from '../utils/date'

const isDark = inject('isDark', ref(true))
const router = useRouter()

const staffData = ref({})
const loading = ref(true)

// Returns groups sorted by priority (already sorted by backend)
const staffGroups = computed(() => Object.values(staffData.value))

onMounted(async () => {
  try {
    const res = await getStaff()
    staffData.value = res.data.data
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
      <div v-if="staffGroups.length === 0" class="text-center py-16">
        <i class="fa-solid fa-shield text-4xl mb-3" :class="isDark ? 'text-gray-600' : 'text-gray-300'"></i>
        <p :class="isDark ? 'text-gray-500' : 'text-gray-400'">No staff configured yet.</p>
      </div>

      <div v-for="group in staffGroups" :key="group.role.id" v-show="group.members?.length">
        <!-- Role heading -->
        <div class="flex items-center gap-3 mb-4">
          <span
            class="text-sm font-bold uppercase tracking-widest px-3 py-1 rounded-full"
            :style="{ backgroundColor: (group.role.color || '#6b7280') + '20', color: group.role.color || '#6b7280' }"
          >
            {{ group.role.label }}
          </span>
          <div class="flex-1 h-px" :class="isDark ? 'bg-gray-800' : 'bg-gray-100'"></div>
        </div>

        <!-- Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <button
            v-for="member in group.members"
            :key="member.id"
            @click="router.push(`/profile/${member.username}`)"
            class="rounded-xl p-5 text-center transition-all duration-150 hover:scale-105 hover:shadow-lg group"
            :class="isDark ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white shadow-sm hover:shadow-md'"
            :style="{ borderTop: `3px solid ${group.role.color || '#6b7280'}` }"
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
              :style="{ color: group.role.color || '#6b7280' }"
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
