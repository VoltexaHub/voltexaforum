<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { getRecentActivity } from '../services/api'
import { formatRelative } from '../utils/date'
import UserAvatar from './UserAvatar.vue'

defineProps({ isDark: Boolean })

const authStore = useAuthStore()
const activity = ref([])
const activityLoading = ref(true)

const user = computed(() => authStore.user)
const isLoggedIn = computed(() => authStore.isLoggedIn)
const awardsCount = computed(() => user.value?.user_awards?.length ?? 0)
const likesReceived = computed(() => user.value?.likes_received ?? 0)

onMounted(async () => {
  try {
    const res = await getRecentActivity()
    activity.value = (res.data.data || res.data).slice(0, 8)
  } catch {
    activity.value = []
  } finally {
    activityLoading.value = false
  }
})
</script>

<template>
  <aside class="hidden lg:block lg:w-72 lg:shrink-0 space-y-3">

    <!-- ── User Card ── -->
    <div
      class="rounded-xl border overflow-hidden"
      :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'"
    >
      <!-- Logged in -->
      <template v-if="isLoggedIn && user">
        <!-- Header row: avatar + name/badge + level -->
        <div class="px-4 pt-4 pb-3 flex items-center gap-3">
          <router-link :to="`/profile/${user.username}`" class="shrink-0">
            <UserAvatar
              :name="user.username"
              :color="user.avatar_color || '#7c3aed'"
              :avatar-url="user.avatar_url"
              :online="false"
              size="md"
            />
          </router-link>

          <div class="min-w-0 flex-1">
            <router-link
              :to="`/profile/${user.username}`"
              class="font-bold text-sm leading-tight truncate block hover:underline"
              :style="user.group_color ? { color: user.group_color } : {}"
              :class="!user.group_color ? (isDark ? 'text-white' : 'text-gray-900') : ''"
            >{{ user.username }}</router-link>
            <span
              v-if="user.group_label"
              class="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5"
              :style="user.group_color ? { backgroundColor: user.group_color + '22', color: user.group_color } : {}"
              :class="!user.group_color ? (isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500') : ''"
            >{{ user.group_label }}</span>
          </div>

          <div class="text-right shrink-0">
            <div class="text-[10px] leading-none mb-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Level</div>
            <div class="text-xl font-bold leading-none" :class="isDark ? 'text-white' : 'text-gray-900'">{{ user.level ?? 0 }}</div>
          </div>
        </div>

        <!-- Divider -->
        <div :class="isDark ? 'border-t border-gray-800' : 'border-t border-gray-100'" />

        <!-- Stats 2×2 -->
        <div class="grid grid-cols-2">
          <div
            class="p-3 flex flex-col items-center gap-0.5"
            :class="isDark ? 'border-b border-r border-gray-800' : 'border-b border-r border-gray-100'"
          >
            <span class="text-base font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
              {{ (user.post_count ?? 0).toLocaleString() }}
            </span>
            <span class="text-[11px]" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Posts</span>
          </div>
          <div
            class="p-3 flex flex-col items-center gap-0.5"
            :class="isDark ? 'border-b border-gray-800' : 'border-b border-gray-100'"
          >
            <span class="text-base font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
              {{ (user.credits ?? 0).toLocaleString() }}
            </span>
            <span class="text-[11px]" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Credits</span>
          </div>
          <div
            class="p-3 flex flex-col items-center gap-0.5"
            :class="isDark ? 'border-r border-gray-800' : 'border-r border-gray-100'"
          >
            <span class="text-base font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
              {{ likesReceived.toLocaleString() }}
            </span>
            <span class="text-[11px]" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Likes</span>
          </div>
          <div class="p-3 flex flex-col items-center gap-0.5">
            <span class="text-base font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
              {{ awardsCount }}
            </span>
            <span class="text-[11px]" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Awards</span>
          </div>
        </div>
      </template>

      <!-- Not logged in -->
      <template v-else>
        <div class="p-5 text-center">
          <div class="w-12 h-12 rounded-full bg-purple-accent/10 flex items-center justify-center mx-auto mb-3">
            <i class="fa-solid fa-bolt text-xl text-purple-accent"></i>
          </div>
          <p class="font-semibold text-sm mb-1" :class="isDark ? 'text-white' : 'text-gray-900'">Join the community</p>
          <p class="text-xs mb-4" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Sign in to participate in discussions</p>
          <div class="flex gap-2">
            <router-link to="/login" class="flex-1 py-2 text-sm font-semibold rounded-lg text-center transition-colors bg-purple-accent hover:bg-purple-700 text-white">
              Login
            </router-link>
            <router-link
              to="/register"
              class="flex-1 py-2 text-sm font-semibold rounded-lg text-center transition-colors"
              :class="isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            >
              Register
            </router-link>
          </div>
        </div>
      </template>
    </div>

    <!-- ── Latest Activity ── -->
    <div
      class="rounded-xl border overflow-hidden"
      :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'"
    >
      <div class="px-4 py-3 border-b" :class="isDark ? 'border-gray-800' : 'border-gray-100'">
        <h3 class="text-xs font-semibold uppercase tracking-wider" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
          Latest Activity
        </h3>
      </div>

      <!-- Loading -->
      <div v-if="activityLoading" class="divide-y" :class="isDark ? 'divide-gray-800' : 'divide-gray-100'">
        <div v-for="i in 6" :key="i" class="px-4 py-3 flex items-center gap-3 animate-pulse">
          <div class="w-7 h-7 rounded-full shrink-0" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          <div class="flex-1 space-y-1.5 min-w-0">
            <div class="h-3 rounded w-2/5" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
            <div class="h-2.5 rounded w-4/5" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          </div>
        </div>
      </div>

      <!-- Entries -->
      <div v-else-if="activity.length" class="divide-y" :class="isDark ? 'divide-gray-800' : 'divide-gray-100'">
        <div
          v-for="(entry, idx) in activity"
          :key="idx"
          class="px-4 py-2.5 flex items-start gap-2.5"
        >
          <UserAvatar
            :name="entry.user?.username || '?'"
            :color="entry.user?.avatar_color || '#7c3aed'"
            :avatar-url="entry.user?.avatar_url"
            :online="false"
            size="xs"
            class="shrink-0 mt-0.5"
          />
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline gap-1.5 flex-wrap">
              <span
                class="text-xs font-semibold leading-tight"
                :style="entry.user?.group_color ? { color: entry.user.group_color } : {}"
                :class="!entry.user?.group_color ? (isDark ? 'text-gray-200' : 'text-gray-800') : ''"
              >{{ entry.user?.username || 'User' }}</span>
              <span class="text-[10px] shrink-0" :class="isDark ? 'text-gray-600' : 'text-gray-400'">
                {{ formatRelative(entry.created_at) }}
              </span>
            </div>
            <router-link
              :to="`/thread/${entry.thread_slug}`"
              class="text-[11px] leading-snug line-clamp-1 transition-colors hover:text-purple-accent"
              :class="isDark ? 'text-gray-500' : 'text-gray-400'"
            >{{ entry.thread_title }}</router-link>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else class="px-4 py-6 text-center">
        <p class="text-xs" :class="isDark ? 'text-gray-600' : 'text-gray-400'">No recent activity</p>
      </div>
    </div>

  </aside>
</template>
