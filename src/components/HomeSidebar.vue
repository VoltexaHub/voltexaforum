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
  <aside class="w-full lg:w-72 lg:shrink-0 space-y-4">
    <!-- User Card -->
    <div
      class="rounded-xl border overflow-hidden"
      :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'"
    >
      <!-- Logged in -->
      <template v-if="isLoggedIn && user">
        <!-- Header -->
        <div class="p-4 flex items-center gap-3">
          <router-link :to="`/profile/${user.username}`">
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
              class="font-bold text-sm truncate block hover:underline"
              :style="user.group_color ? { color: user.group_color } : {}"
              :class="!user.group_color ? (isDark ? 'text-white' : 'text-gray-900') : ''"
            >
              {{ user.username }}
            </router-link>
            <span
              v-if="user.group_label"
              class="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5"
              :style="user.group_color ? { backgroundColor: user.group_color + '22', color: user.group_color } : {}"
              :class="!user.group_color ? (isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500') : ''"
            >
              {{ user.group_label }}
            </span>
          </div>
          <div class="text-right shrink-0">
            <span class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Lv.</span>
            <span class="text-lg font-bold ml-0.5" :class="isDark ? 'text-white' : 'text-gray-900'">{{ user.level ?? 0 }}</span>
          </div>
        </div>

        <!-- Stats grid -->
        <div
          class="grid grid-cols-2 divide-x divide-y"
          :class="isDark ? 'divide-gray-800 border-t border-gray-800' : 'divide-gray-200 border-t border-gray-200'"
        >
          <div class="p-3 text-center">
            <div class="text-base font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
              {{ (user.post_count ?? 0).toLocaleString() }}
            </div>
            <div class="text-[11px]" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Posts</div>
          </div>
          <div class="p-3 text-center">
            <div class="text-base font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
              {{ (user.credits ?? 0).toLocaleString() }}
            </div>
            <div class="text-[11px]" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Credits</div>
          </div>
          <div class="p-3 text-center">
            <div class="text-base font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
              {{ likesReceived.toLocaleString() }}
            </div>
            <div class="text-[11px]" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Likes</div>
          </div>
          <div class="p-3 text-center">
            <div class="text-base font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
              {{ awardsCount }}
            </div>
            <div class="text-[11px]" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Awards</div>
          </div>
        </div>
      </template>

      <!-- Not logged in -->
      <template v-else>
        <div class="p-5 text-center">
          <i class="fa-solid fa-bolt text-3xl text-purple-accent mb-2"></i>
          <p class="font-semibold text-sm mb-1" :class="isDark ? 'text-white' : 'text-gray-900'">Join the community</p>
          <p class="text-xs mb-4" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Sign in to participate in discussions</p>
          <div class="flex gap-2">
            <router-link
              to="/login"
              class="flex-1 px-3 py-2 text-sm font-medium rounded-lg text-center transition-colors bg-purple-accent hover:bg-purple-700 text-white"
            >Login</router-link>
            <router-link
              to="/register"
              class="flex-1 px-3 py-2 text-sm font-medium rounded-lg text-center transition-colors"
              :class="isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            >Register</router-link>
          </div>
        </div>
      </template>
    </div>

    <!-- Latest Activity -->
    <div
      class="rounded-xl border p-4"
      :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'"
    >
      <h3
        class="text-xs font-semibold uppercase tracking-wider mb-3"
        :class="isDark ? 'text-gray-500' : 'text-gray-400'"
      >Latest Activity</h3>

      <!-- Loading skeleton -->
      <div v-if="activityLoading" class="space-y-2">
        <div v-for="i in 5" :key="i" class="flex items-center gap-2 py-2 animate-pulse">
          <div class="w-7 h-7 rounded-full shrink-0" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          <div class="flex-1 space-y-1.5">
            <div class="h-3 rounded w-1/2" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
            <div class="h-2.5 rounded w-3/4" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          </div>
        </div>
      </div>

      <!-- Activity entries -->
      <div v-else-if="activity.length">
        <div
          v-for="(entry, idx) in activity"
          :key="idx"
          class="flex items-center gap-2 py-2"
          :class="idx < activity.length - 1 ? (isDark ? 'border-b border-gray-800/60' : 'border-b border-gray-100') : ''"
        >
          <UserAvatar
            :name="entry.user?.username || 'User'"
            :color="entry.user?.avatar_color || '#7c3aed'"
            :avatar-url="entry.user?.avatar_url"
            :online="false"
            class="w-7 h-7 shrink-0"
            size="xs"
          />
          <div class="min-w-0 flex-1">
            <span
              class="text-sm font-medium truncate block"
              :style="entry.user?.group_color ? { color: entry.user.group_color } : {}"
              :class="!entry.user?.group_color ? (isDark ? 'text-gray-300' : 'text-gray-700') : ''"
            >{{ entry.user?.username || 'User' }}</span>
            <div class="flex items-center gap-1">
              <router-link
                v-if="entry.thread"
                :to="`/thread/${entry.thread.slug}`"
                class="text-xs truncate hover:text-purple-accent transition-colors"
                :class="isDark ? 'text-gray-500' : 'text-gray-400'"
              >{{ entry.thread.title }}</router-link>
              <span v-if="entry.created_at" class="text-[10px] shrink-0" :class="isDark ? 'text-gray-600' : 'text-gray-300'">
                · {{ formatRelative(entry.created_at) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <p v-else class="text-xs text-center py-3" :class="isDark ? 'text-gray-600' : 'text-gray-400'">
        No recent activity
      </p>
    </div>
  </aside>
</template>
