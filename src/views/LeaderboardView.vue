<script setup>
import { inject, ref, onMounted, watch } from 'vue'
import { getLeaderboard } from '../services/api'
import UserAvatar from '../components/UserAvatar.vue'

const isDark = inject('isDark')

const type = ref('credits')
const period = ref('all')
const entries = ref([])
const loading = ref(true)

const types = [
  { key: 'credits', label: 'Credits', icon: 'fa-solid fa-coins' },
  { key: 'posts', label: 'Posts', icon: 'fa-solid fa-comment' },
  { key: 'threads', label: 'Threads', icon: 'fa-solid fa-newspaper' },
  { key: 'reactions', label: 'Reactions', icon: 'fa-solid fa-heart' },
]

const periods = [
  { key: 'all', label: 'All Time' },
  { key: 'month', label: 'This Month' },
  { key: 'week', label: 'This Week' },
]

async function load() {
  loading.value = true
  try {
    const res = await getLeaderboard({ type: type.value, period: period.value })
    entries.value = res.data.data || []
  } catch {
    entries.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch([type, period], load)

function rankIcon(rank) {
  if (rank === 1) return '\uD83E\uDD47'
  if (rank === 2) return '\uD83E\uDD48'
  if (rank === 3) return '\uD83E\uDD49'
  return null
}

function rowBg(rank) {
  if (rank === 1) return isDark.value ? 'bg-yellow-500/5' : 'bg-yellow-50'
  if (rank === 2) return isDark.value ? 'bg-gray-400/5' : 'bg-gray-50'
  if (rank === 3) return isDark.value ? 'bg-amber-500/5' : 'bg-orange-50/50'
  return ''
}

function valueIcon(t) {
  return types.find(x => x.key === t)?.icon || 'fa-solid fa-star'
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6">
    <!-- Hero -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold mb-2"><i class="fa-solid fa-ranking-star text-purple-accent mr-2"></i>Leaderboard</h1>
      <p class="text-sm" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Top community members across all time.</p>
    </div>

    <!-- Type tabs -->
    <div class="flex justify-center gap-2 mb-4 flex-wrap">
      <button
        v-for="t in types" :key="t.key"
        @click="type = t.key"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors"
        :class="type === t.key
          ? 'bg-purple-accent text-white'
          : isDark ? 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200'"
      >
        <i :class="t.icon" class="text-xs"></i> {{ t.label }}
      </button>
    </div>

    <!-- Period tabs -->
    <div class="flex justify-center gap-2 mb-6">
      <button
        v-for="p in periods" :key="p.key"
        @click="period = p.key"
        class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        :class="period === p.key
          ? 'bg-purple-accent/15 text-purple-accent'
          : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'"
      >
        {{ p.label }}
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="rounded-xl overflow-hidden" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
      <div v-for="i in 5" :key="i" class="flex items-center gap-4 px-5 py-4" :class="i < 5 ? (isDark ? 'border-b border-gray-800/50' : 'border-b border-gray-100') : ''">
        <div class="w-8 h-8 rounded-full animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
        <div class="flex-1 space-y-2">
          <div class="h-4 rounded w-1/3 animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
        </div>
        <div class="h-4 rounded w-16 animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!entries.length" class="text-center py-16">
      <i class="fa-solid fa-trophy text-4xl text-gray-400 mb-3"></i>
      <p :class="isDark ? 'text-gray-500' : 'text-gray-400'">No data available for this period.</p>
    </div>

    <!-- Leaderboard table -->
    <div v-else class="rounded-xl overflow-hidden" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
      <!-- Header -->
      <div
        class="hidden sm:grid grid-cols-[60px_1fr_100px] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider"
        :class="isDark ? 'bg-gray-800/50 text-gray-400 border-b border-gray-800' : 'bg-gray-50 text-gray-500 border-b border-gray-200'"
      >
        <span>Rank</span>
        <span>User</span>
        <span class="text-right">{{ type === 'credits' ? 'Credits' : 'Count' }}</span>
      </div>

      <div
        v-for="entry in entries" :key="entry.rank"
        class="grid grid-cols-[60px_1fr_100px] gap-4 items-center px-5 py-3 transition-colors"
        :class="[
          rowBg(entry.rank),
          isDark ? 'border-b border-gray-800/50' : 'border-b border-gray-100',
        ]"
      >
        <!-- Rank -->
        <div class="text-center font-bold text-sm">
          <span v-if="rankIcon(entry.rank)" class="text-lg">{{ rankIcon(entry.rank) }}</span>
          <span v-else :class="isDark ? 'text-gray-500' : 'text-gray-400'">#{{ entry.rank }}</span>
        </div>

        <!-- User -->
        <div class="flex items-center gap-3 min-w-0">
          <router-link v-if="entry.user" :to="`/profile/${entry.user.username}`" class="flex items-center gap-3 min-w-0">
            <UserAvatar :name="entry.user.username" :avatar-url="entry.user.avatar_url" size="sm" />
            <div class="min-w-0">
              <span class="font-medium text-sm truncate block" :style="entry.user.group_color ? { color: entry.user.group_color } : {}">
                {{ entry.user.username }}
              </span>
              <span v-if="entry.user.group_label" class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                :style="{ backgroundColor: (entry.user.group_color || '#6b7280') + '22', color: entry.user.group_color || '#6b7280' }">
                {{ entry.user.group_label }}
              </span>
            </div>
          </router-link>
        </div>

        <!-- Value -->
        <div class="text-right font-semibold text-sm flex items-center justify-end gap-1.5">
          <i :class="valueIcon(type)" class="text-xs text-purple-accent"></i>
          <span :class="isDark ? 'text-gray-200' : 'text-gray-700'">{{ entry.value?.toLocaleString() }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
