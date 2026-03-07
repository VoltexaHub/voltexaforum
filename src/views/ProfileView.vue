<script setup>
import { inject, ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getUserProfile, unpinThreadFromProfile } from '../services/api'
import UserAvatar from '../components/UserAvatar.vue'
import { formatDate, formatDateTime, formatRelative, formatJoinDate } from '../utils/date'

const isDark = inject('isDark')
const route = useRoute()
const authStore = useAuthStore()

const isOwnProfile = computed(() => {
  return authStore.isLoggedIn && authStore.username === route.params.username
})

const profile = ref(null)
const loading = ref(true)
const error = ref(null)
const activeTab = ref('overview') // kept for compat, unused

const bannerColor = computed(() => {
  return profile.value?.primary_role?.color || '#7c3aed'
})

async function loadProfile() {
  loading.value = true
  error.value = null
  try {
    const res = await getUserProfile(route.params.username)
    profile.value = res.data.data
    startBoostTimer()
  } catch (e) {
    if (e.response?.status === 404) {
      profile.value = null
    } else {
      error.value = 'Failed to load profile. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

// XP Boost countdown
const boostTimeRemaining = ref('')
let boostInterval = null

function updateBoostCountdown() {
  if (!profile.value?.xp_boost_active || !profile.value?.xp_boost_expires_at) {
    boostTimeRemaining.value = ''
    return
  }
  const diff = new Date(profile.value.xp_boost_expires_at).getTime() - Date.now()
  if (diff <= 0) {
    boostTimeRemaining.value = ''
    profile.value.xp_boost_active = false
    if (boostInterval) { clearInterval(boostInterval); boostInterval = null }
    return
  }
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  boostTimeRemaining.value = `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
}

function startBoostTimer() {
  if (boostInterval) clearInterval(boostInterval)
  if (profile.value?.xp_boost_active) {
    updateBoostCountdown()
    boostInterval = setInterval(updateBoostCountdown, 1000)
  }
}

async function handleUnpin() {
  try {
    await unpinThreadFromProfile()
    profile.value.pinned_thread = null
  } catch {}
}

onMounted(loadProfile)

watch(() => route.params.username, () => {
  activeTab.value = 'overview'
  loadProfile()
})

watch(() => profile.value?.xp_boost_active, (active) => {
  if (active) startBoostTimer()
  else if (boostInterval) { clearInterval(boostInterval); boostInterval = null }
})

onUnmounted(() => {
  if (boostInterval) clearInterval(boostInterval)
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="rounded-xl overflow-hidden animate-pulse" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
        <div style="height: 280px;" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'"></div>
        <div class="px-6 pb-6 pt-12 flex items-center gap-5">
          <div class="w-24 h-24 rounded-full -mt-20 border-4" :class="isDark ? 'bg-gray-800 border-gray-900' : 'bg-gray-200 border-white'" />
          <div class="flex-1 space-y-3">
            <div class="h-6 rounded w-1/3" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
            <div class="h-4 rounded w-1/5" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-20">
      <i class="fa-solid fa-face-sad-tear text-5xl text-gray-400"></i>
      <p class="text-lg font-medium mt-4" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ error }}</p>
      <button
        @click="loadProfile"
        class="mt-4 px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        Retry
      </button>
    </div>

    <template v-else-if="profile">
      <!-- Banner header -->
      <div
        class="rounded-xl overflow-hidden mb-6 transition-colors duration-300 relative"
        :style="profile.cover_url
          ? {
              backgroundImage: `url(${profile.cover_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat',
            }
          : isDark ? { background: '#111827' } : { background: '#ffffff' }"
      >
        <!-- Flat dark tint over full card -->
        <div
          v-if="profile.cover_url"
          style="position: absolute; inset: 0; pointer-events: none; z-index: 0;"
          :style="{ background: `rgba(0,0,0,${(profile.cover_overlay_opacity ?? 20) / 100})` }"
        />
        <!-- Bottom gradient so text row is always readable -->
        <div
          v-if="profile.cover_url"
          style="position: absolute; bottom: 0; left: 0; right: 0; height: 160px; pointer-events: none; z-index: 0; background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%);"
        />
        <!-- Spacer to create the banner height above the profile info -->
        <div style="height: 200px;" />
        <div class="px-6 pb-6 relative" style="z-index: 1;">
          <div class="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-14">
            <div class="shrink-0">
              <UserAvatar
                :name="profile.username"
                :color="profile.avatar_color || 'bg-purple-500'"
                :avatar-url="profile.avatar_url"
                :online="profile.is_online"
                size="xl"
                class="ring-4 ring-black/60 rounded-full"
              />
            </div>
            <div class="text-center sm:text-left flex-1 pb-1">
              <h1 class="text-2xl font-bold">
                <span
                  :style="profile.cover_url && profile.primary_role?.color ? { color: profile.primary_role.color } : {}"
                  :class="profile.cover_url ? 'text-white drop-shadow' : (profile.primary_role?.color ? '' : (isDark ? 'text-white' : 'text-gray-900'))"
                >{{ profile.username }}</span>
              </h1>
              <div class="flex items-center justify-center sm:justify-start gap-2 mt-1.5">
                <span
                  v-if="profile.primary_role"
                  class="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full"
                  :style="profile.cover_url
                    ? { backgroundColor: 'rgba(0,0,0,0.45)', color: profile.primary_role.color || '#fff', border: `1px solid ${profile.primary_role.color || '#ffffff'}50` }
                    : { backgroundColor: (profile.primary_role.color || '#6b7280') + '20', color: profile.primary_role.color || '#6b7280', border: `1px solid ${profile.primary_role.color || '#6b7280'}40` }"
                >
                  {{ profile.primary_role.label }}
                </span>
                <span v-if="profile.is_online" class="inline-flex items-center gap-1 text-xs font-medium" :class="profile.cover_url ? 'text-green-400' : 'text-green-500'">
                  <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  Online
                </span>
              </div>
              <div v-if="profile.user_title" class="text-sm italic mt-1" :class="profile.cover_url ? 'text-gray-300' : (isDark ? 'text-gray-400' : 'text-gray-500')">
                {{ profile.user_title }}
              </div>
              <div v-if="profile.status" class="text-xs italic mt-1 flex items-center gap-1" :class="profile.cover_url ? 'text-gray-400' : (isDark ? 'text-gray-500' : 'text-gray-400')">
                <i class="fa-solid fa-comment-dots text-[10px]"></i>
                {{ profile.status }}
              </div>
            </div>
            <router-link
              v-if="isOwnProfile"
              to="/usercp"
              class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium border transition-colors shrink-0"
              :class="profile.cover_url ? 'border-white/30 text-white hover:bg-black/30 bg-black/20 backdrop-blur-sm' : (isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100')"
            >
              <i class="fa-solid fa-pen-to-square text-xs"></i> Edit Profile
            </router-link>
          </div>
        </div>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
        <div
          class="rounded-xl p-4 text-center transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <div class="text-xl font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
            {{ (profile.post_count ?? 0).toLocaleString() }}
          </div>
          <div class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            <i class="fa-solid fa-pen-to-square mr-1"></i>Posts
          </div>
        </div>
        <div
          class="rounded-xl p-4 text-center transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <div class="text-xl font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
            {{ (profile.thread_count ?? 0).toLocaleString() }}
          </div>
          <div class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            <i class="fa-solid fa-comments mr-1"></i>Threads
          </div>
        </div>
        <div
          class="rounded-xl p-4 text-center transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <div class="text-xl font-bold text-purple-accent">
            {{ (profile.credits ?? 0).toLocaleString() }}
          </div>
          <div class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            <i class="fa-solid fa-coins mr-1"></i>Credits
          </div>
        </div>
        <div
          class="rounded-xl p-4 text-center transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <div class="text-xl font-bold text-rose-400">
            {{ (profile.reputation ?? 0).toLocaleString() }}
          </div>
          <div class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            <i class="fa-solid fa-heart mr-1 text-rose-400"></i>Reputation
          </div>
        </div>
        <div
          class="rounded-xl p-4 text-center transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <div class="text-sm font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
            {{ formatDate(profile.join_date) }}
          </div>
          <div class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            <i class="fa-solid fa-calendar-days mr-1"></i>Joined
          </div>
        </div>
        <div
          class="rounded-xl p-4 text-center transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <div v-if="profile.is_online" class="text-sm font-bold text-green-500">Online Now</div>
          <div v-else class="text-sm font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
            {{ formatRelative(profile.last_seen) || 'N/A' }}
          </div>
          <div class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            <i class="fa-solid fa-clock mr-1"></i>Last Active
          </div>
        </div>
      </div>

      <!-- Level & Years of Service -->
      <div v-if="profile.level != null || profile.years_of_service" class="flex flex-col sm:flex-row gap-3 mb-6">
        <!-- Level badge with progress bar -->
        <div
          v-if="profile.level != null"
          class="flex-1 rounded-xl p-4 transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 font-bold text-sm">
                {{ profile.level }}
              </span>
              <div>
                <div class="text-sm font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">
                  Level {{ profile.level }}{{ profile.level_label ? ' — ' + profile.level_label : '' }}
                </div>
                <div class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  <template v-if="profile.xp_next_level">
                    {{ (profile.xp ?? 0).toLocaleString() }} / {{ profile.xp_next_level.toLocaleString() }} XP
                  </template>
                  <template v-else>Max Level</template>
                </div>
              </div>
            </div>
          </div>
          <div class="w-full h-2 rounded-full overflow-hidden" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'">
            <div
              class="h-full rounded-full bg-violet-500 transition-all duration-500"
              :style="{ width: (profile.level_progress ?? 0) + '%' }"
            />
          </div>
        </div>

        <!-- Years of Service badge -->
        <div
          v-if="profile.years_of_service"
          class="sm:w-48 shrink-0 rounded-xl p-4 flex items-center gap-3 transition-colors duration-300"
          :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
        >
          <span class="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400">
            <i class="fa-solid fa-calendar-days text-lg"></i>
          </span>
          <div>
            <div class="text-sm font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">{{ profile.years_of_service }}</div>
            <div class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Member</div>
          </div>
        </div>

      </div>

      <!-- Profile layout — three columns on desktop -->
      <div class="lg:grid lg:grid-cols-[240px_1fr_220px] gap-5">

        <!-- LEFT COLUMN — About sidebar -->
        <div class="space-y-4 mb-5 lg:mb-0">
          <div class="rounded-xl overflow-hidden transition-colors duration-300" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">

            <!-- Level & XP -->
            <div v-if="profile.level != null" class="p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[11px] font-semibold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Level</span>
                <span class="text-lg font-bold text-violet-400">{{ profile.level }}</span>
              </div>
              <div class="w-full h-1.5 rounded-full overflow-hidden" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'">
                <div
                  class="h-full rounded-full bg-violet-500 transition-all duration-500"
                  :style="{ width: (profile.xp_progress_percent ?? profile.level_progress ?? 0) + '%' }"
                />
              </div>
              <div class="text-[10px] mt-1 text-right" :class="isDark ? 'text-gray-600' : 'text-gray-400'">
                <template v-if="profile.xp_next_level">{{ (profile.xp ?? 0).toLocaleString() }} / {{ profile.xp_next_level.toLocaleString() }} XP</template>
                <template v-else>Max Level</template>
              </div>
            </div>

            <!-- Reputation & Likes Given mini stat boxes -->
            <div class="grid grid-cols-2 border-t" :class="isDark ? 'border-gray-800' : 'border-gray-100'">
              <div class="p-3 text-center border-r" :class="isDark ? 'border-gray-800' : 'border-gray-100'">
                <div class="text-lg font-bold text-green-400">{{ (profile.reputation ?? 0).toLocaleString() }}</div>
                <div class="text-[10px] font-semibold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Rep</div>
              </div>
              <div class="p-3 text-center">
                <div class="text-lg font-bold text-sky-400">{{ (profile.likes_given ?? 0).toLocaleString() }}</div>
                <div class="text-[10px] font-semibold uppercase tracking-widest" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Given</div>
              </div>
            </div>

            <!-- Detail list -->
            <div class="text-sm">
              <div class="flex items-center justify-between px-4 py-2.5 border-t" :class="isDark ? 'border-gray-800' : 'border-gray-100'">
                <span class="flex items-center gap-2" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                  <i class="fa-solid fa-coins text-amber-400 text-xs w-4 text-center"></i> Credits
                </span>
                <span class="font-medium" :class="isDark ? 'text-gray-200' : 'text-gray-700'">{{ (profile.credits ?? 0).toLocaleString() }}</span>
              </div>
              <div class="flex items-center justify-between px-4 py-2.5 border-t" :class="isDark ? 'border-gray-800' : 'border-gray-100'">
                <span class="flex items-center gap-2" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                  <i class="fa-solid fa-comment text-blue-400 text-xs w-4 text-center"></i> Replies
                </span>
                <span class="font-medium" :class="isDark ? 'text-gray-200' : 'text-gray-700'">{{ (profile.replies_made ?? 0).toLocaleString() }}</span>
              </div>
              <div class="flex items-center justify-between px-4 py-2.5 border-t" :class="isDark ? 'border-gray-800' : 'border-gray-100'">
                <span class="flex items-center gap-2" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                  <i class="fa-solid fa-calendar-days text-xs w-4 text-center"></i> Member since
                </span>
                <span class="font-medium" :class="isDark ? 'text-gray-200' : 'text-gray-700'">{{ formatDate(profile.join_date) }}</span>
              </div>
              <div class="flex items-center justify-between px-4 py-2.5 border-t" :class="isDark ? 'border-gray-800' : 'border-gray-100'">
                <span class="flex items-center gap-2" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                  <i class="fa-solid fa-circle text-xs w-4 text-center" :class="profile.is_online ? 'text-green-400' : ''"></i> Last seen
                </span>
                <span class="font-medium" :class="profile.is_online ? 'text-green-400' : (isDark ? 'text-gray-200' : 'text-gray-700')">
                  {{ profile.is_online ? 'Online Now' : (formatRelative(profile.last_seen) || 'N/A') }}
                </span>
              </div>
            </div>

            <!-- Pinned Thread -->
            <div v-if="profile.pinned_thread" class="border-t p-4" :class="isDark ? 'border-gray-800' : 'border-gray-100'">
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                  <i class="fa-solid fa-thumbtack text-amber-400"></i> Pinned Thread
                </h3>
                <button
                  v-if="isOwnProfile"
                  @click="handleUnpin"
                  class="text-[10px] px-1.5 py-0.5 rounded transition-colors"
                  :class="isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'"
                >
                  Unpin
                </button>
              </div>
              <router-link
                :to="`/thread/${profile.pinned_thread.slug}`"
                class="font-medium text-sm hover:text-purple-accent transition-colors line-clamp-2"
              >
                {{ profile.pinned_thread.title }}
              </router-link>
              <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                <span
                  v-if="profile.pinned_thread.forum"
                  class="text-[10px] px-1.5 py-0.5 rounded-full"
                  :class="isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'"
                >
                  {{ profile.pinned_thread.forum.name }}
                </span>
                <span class="text-[10px]" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  <i class="fa-solid fa-comments mr-0.5"></i>{{ profile.pinned_thread.reply_count }} replies
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- CENTER COLUMN — Main content -->
        <div class="space-y-5 mb-5 lg:mb-0">
          <!-- Bio -->
          <div
            v-if="profile.bio"
            class="rounded-xl p-5 transition-colors duration-300"
            :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
          >
            <h3 class="font-semibold mb-3 flex items-center gap-2">
              <i class="fa-solid fa-user text-sm text-purple-accent"></i> About
            </h3>
            <p class="text-sm leading-relaxed" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
              {{ profile.bio }}
            </p>
          </div>

          <!-- Recent Activity Feed -->
          <div
            v-if="profile.recent_activity?.length"
            class="rounded-xl p-5 transition-colors duration-300"
            :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
          >
            <h3 class="font-semibold mb-4 flex items-center gap-2">
              <i class="fa-solid fa-bolt text-sm text-purple-accent"></i> Recent Activity
            </h3>
            <div class="space-y-0">
              <div
                v-for="(item, idx) in profile.recent_activity"
                :key="item.id"
                class="flex gap-3 pl-3 relative"
                :class="idx < profile.recent_activity.length - 1 ? 'pb-4' : ''"
              >
                <div class="absolute left-0 top-0 bottom-0 w-0.5 bg-violet-500/30 rounded-full"></div>
                <div class="min-w-0 flex-1">
                  <router-link
                    :to="`/thread/${item.thread_slug}`"
                    class="font-medium text-sm hover:text-purple-accent transition-colors"
                  >
                    {{ item.thread_title }}
                  </router-link>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span
                      v-if="item.forum_name"
                      class="text-[11px] px-1.5 py-0.5 rounded"
                      :class="isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'"
                    >{{ item.forum_name }}</span>
                    <span class="text-[11px]" :class="isDark ? 'text-gray-600' : 'text-gray-400'">{{ formatRelative(item.created_at) }}</span>
                  </div>
                  <p v-if="item.excerpt" class="text-xs mt-1 line-clamp-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                    {{ item.excerpt }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Posts -->
          <div
            v-if="profile.recent_posts?.length"
            class="rounded-xl p-5 transition-colors duration-300"
            :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
          >
            <h3 class="font-semibold mb-3 flex items-center gap-2 text-sm">
              <i class="fa-solid fa-pen-to-square text-purple-accent"></i> Recent Posts
            </h3>
            <div class="space-y-2">
              <div
                v-for="post in profile.recent_posts"
                :key="post.id"
                class="p-3 rounded-lg border transition-colors"
                :class="isDark ? 'border-gray-800 hover:bg-gray-800/60' : 'border-gray-100 hover:bg-gray-50'"
              >
                <router-link
                  v-if="post.thread_id"
                  :to="`/thread/${post.thread_id}`"
                  class="font-medium text-sm hover:text-purple-accent transition-colors line-clamp-1"
                >{{ post.thread_title }}</router-link>
                <p v-if="post.excerpt" class="text-xs mt-1 line-clamp-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'">{{ post.excerpt }}</p>
                <div class="text-[11px] mt-1.5" :class="isDark ? 'text-gray-600' : 'text-gray-400'">{{ formatDateTime(post.created_at) }}</div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-if="!profile.bio && !profile.recent_activity?.length && !profile.recent_posts?.length && !profile.pinned_thread"
            class="rounded-xl p-12 text-center transition-colors duration-300"
            :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
          >
            <i class="fa-solid fa-user-astronaut text-4xl text-gray-400"></i>
            <p class="mt-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">This profile is looking a bit empty.</p>
          </div>
        </div>

        <!-- RIGHT COLUMN — Sidebar widgets -->
        <div class="space-y-4">
          <!-- Awards card -->
          <div
            v-if="profile.awards?.length > 0"
            class="rounded-xl p-4 transition-colors duration-300"
            :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
          >
            <h3 class="font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
              <i class="fa-solid fa-trophy text-yellow-500"></i> Awards
            </h3>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="award in profile.awards.slice(0, 6)"
                :key="award.id"
                class="flex items-center justify-center p-2 rounded-lg"
                :class="isDark ? 'bg-gray-800' : 'bg-gray-50'"
                :title="award.name"
              >
                <img
                  v-if="award.icon_url"
                  :src="award.icon_url"
                  :alt="award.name"
                  class="w-8 h-8 object-contain"
                />
                <i v-else class="fa-solid fa-award text-xl text-yellow-500"></i>
              </div>
            </div>
          </div>

          <!-- XP Boost card -->
          <div
            v-if="profile.xp_boost_active && boostTimeRemaining"
            class="rounded-xl p-4 flex items-center gap-3 transition-colors duration-300 border border-amber-500/30"
            :class="isDark ? 'bg-amber-500/5' : 'bg-amber-50 shadow-sm'"
          >
            <span class="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/15 text-amber-400 animate-pulse">
              <i class="fa-solid fa-bolt text-lg"></i>
            </span>
            <div>
              <div class="text-sm font-semibold text-amber-400">{{ profile.xp_boost_multiplier || 2 }}x XP Boost</div>
              <div class="text-xs font-mono" :class="isDark ? 'text-amber-500/70' : 'text-amber-600/70'">{{ boostTimeRemaining }}</div>
            </div>
          </div>

          <!-- Social links card -->
          <div
            v-if="profile.discord_username || profile.twitter_handle || profile.website_url || profile.minecraft_ign"
            class="rounded-xl p-4 transition-colors duration-300"
            :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
          >
            <h3 class="font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
              <i class="fa-solid fa-link text-purple-accent"></i> Connect
            </h3>
            <div class="space-y-2">
              <a
                v-if="profile.discord_username"
                class="flex items-center gap-2 text-sm rounded-lg px-2.5 py-1.5 transition-colors"
                :class="isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'"
                :title="profile.discord_username"
              >
                <i class="fa-brands fa-discord text-indigo-400 w-4 text-center"></i>
                <span class="truncate">{{ profile.discord_username }}</span>
              </a>
              <a
                v-if="profile.twitter_handle"
                :href="`https://twitter.com/${profile.twitter_handle.replace('@', '')}`"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 text-sm rounded-lg px-2.5 py-1.5 transition-colors"
                :class="isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'"
              >
                <i class="fa-brands fa-twitter text-sky-400 w-4 text-center"></i>
                <span class="truncate">{{ profile.twitter_handle }}</span>
              </a>
              <a
                v-if="profile.website_url"
                :href="profile.website_url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 text-sm rounded-lg px-2.5 py-1.5 transition-colors"
                :class="isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'"
              >
                <i class="fa-solid fa-globe text-green-400 w-4 text-center"></i>
                <span class="truncate">Website</span>
              </a>
              <a
                v-if="profile.minecraft_ign"
                class="flex items-center gap-2 text-sm rounded-lg px-2.5 py-1.5 transition-colors"
                :class="isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'"
              >
                <i class="fa-solid fa-gamepad text-emerald-400 w-4 text-center"></i>
                <span class="truncate">{{ profile.minecraft_ign }}</span>
              </a>
            </div>
          </div>
        </div>

      </div>

      <!-- Achievements — full width below the three columns -->
      <div v-if="profile.achievements?.length" class="lg:col-span-3 mt-2">
        <div class="rounded-xl p-5 transition-colors duration-300" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
          <h3 class="font-semibold mb-4 flex items-center gap-2 text-sm">
            <i class="fa-solid fa-trophy text-purple-accent"></i> Achievements
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="ach in profile.achievements"
              :key="ach.id"
              class="flex items-start gap-3 p-3 rounded-lg border transition-colors"
              :class="ach.unlocked
                ? 'border-purple-accent/30 ' + (isDark ? 'bg-gray-800/50' : 'bg-violet-50')
                : (isDark ? 'border-gray-800 opacity-40' : 'border-gray-200 opacity-40')"
            >
              <div
                class="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                :class="ach.unlocked ? 'bg-purple-accent/10 text-purple-accent' : (isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-200 text-gray-400')"
              >
                <template v-if="ach.icon && !ach.icon.startsWith('fa-')">{{ ach.icon }}</template>
                <i v-else :class="ach.icon || 'fa-solid fa-star'"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="font-medium text-sm truncate">{{ ach.name }}</span>
                  <i v-if="ach.unlocked" class="fa-solid fa-circle-check text-green-500 text-[10px] shrink-0"></i>
                  <i v-else class="fa-solid fa-lock text-[10px] shrink-0" :class="isDark ? 'text-gray-600' : 'text-gray-400'"></i>
                </div>
                <p class="text-xs mt-0.5 line-clamp-1" :class="isDark ? 'text-gray-500' : 'text-gray-400'">{{ ach.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Custom CSS -->
      <component v-if="profile.custom_css" is="style">{{ profile.custom_css }}</component>
    </template>

    <!-- User not found -->
    <div v-else-if="!loading" class="text-center py-20">
      <i class="fa-solid fa-face-sad-tear text-5xl text-gray-400"></i>
      <h1 class="text-xl font-bold mt-4">User not found</h1>
      <p class="mt-2" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        The user "{{ route.params.username }}" doesn't exist.
      </p>
      <router-link to="/" class="inline-block mt-4 text-purple-accent hover:underline">
        Back to Home
      </router-link>
    </div>
  </div>
</template>
