<script setup>
import { inject, ref, computed, onMounted, watch } from 'vue'
import { getLeaderboard } from '../services/api'
import UserAvatar from '../components/UserAvatar.vue'

const isDark = inject('isDark')
const type = ref('credits')
const period = ref('all')
const entries = ref([])
const yourRank = ref(null)
const loading = ref(true)

const types = [
  { key: 'credits', label: 'Credits', icon: 'fa-solid fa-coins' },
  { key: 'posts', label: 'Posts', icon: 'fa-solid fa-comment' },
  { key: 'threads', label: 'Threads', icon: 'fa-solid fa-newspaper' },
  { key: 'reactions', label: 'Reactions', icon: 'fa-solid fa-heart' },
  { key: 'xp', label: 'XP', icon: 'fa-solid fa-star' },
]

const periods = [
  { key: 'all', label: 'All Time' },
  { key: 'month', label: 'This Month' },
  { key: 'week', label: 'This Week' },
]

const typeConfig = {
  credits:   { icon: 'fa-solid fa-coins',     color: 'text-yellow-400', label: 'Credits' },
  posts:     { icon: 'fa-solid fa-comment',    color: 'text-blue-400',   label: 'Posts' },
  threads:   { icon: 'fa-solid fa-newspaper',  color: 'text-green-400',  label: 'Threads' },
  reactions: { icon: 'fa-solid fa-heart',      color: 'text-pink-400',   label: 'Reactions' },
  xp:        { icon: 'fa-solid fa-star',       color: 'text-yellow-400', label: 'XP' },
}

function formatJoinDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return 'Joined ' + d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

async function load() {
  loading.value = true
  try {
    const res = await getLeaderboard({ type: type.value, period: period.value })
    entries.value = res.data.data || []
    yourRank.value = res.data.your_rank || null
  } catch {
    entries.value = []
    yourRank.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch([type, period], load)

const podium = computed(() => entries.value.slice(0, 3))
const rest = computed(() => entries.value.slice(3))

// Reorder podium for display: [2nd, 1st, 3rd]
const podiumDisplay = computed(() => {
  const p = podium.value
  if (p.length < 3) return p
  return [p[1], p[0], p[2]]
})

const medals = ['🥇', '🥈', '🥉']
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <i class="fa-solid fa-ranking-star text-purple-accent"></i>
          Leaderboard
        </h1>
        <p class="text-sm text-gray-500 mt-0.5">Top community members</p>
      </div>
    </div>

    <!-- Type tabs — mobile: select, desktop: pills -->
    <div>
      <!-- Mobile select -->
      <div class="sm:hidden flex gap-2">
        <select
          v-model="type"
          class="flex-1 px-4 py-3 rounded-lg font-medium border transition-colors"
          :class="isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'"
        >
          <option v-for="t in types" :key="t.key" :value="t.key">{{ t.label }}</option>
        </select>
        <select
          v-model="period"
          class="px-4 py-3 rounded-lg font-medium border transition-colors"
          :class="isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'"
        >
          <option v-for="p in periods" :key="p.key" :value="p.key">{{ p.label }}</option>
        </select>
      </div>

      <!-- Desktop pills -->
      <div class="hidden sm:flex gap-2 flex-wrap">
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
    </div>

    <!-- Period tabs (desktop only — mobile uses select above) -->
    <div class="hidden sm:flex gap-1.5">
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
    <template v-if="loading">
      <!-- Podium skeleton -->
      <div class="grid grid-cols-3 gap-4 items-end">
        <div v-for="i in 3" :key="i"
          class="rounded-xl p-5 text-center space-y-3 animate-pulse"
          :class="[
            isDark ? 'bg-gray-900' : 'bg-white shadow-sm',
            i === 2 ? 'min-h-[260px]' : 'min-h-[220px]'
          ]"
        >
          <div class="mx-auto rounded-full animate-pulse"
            :class="[
              isDark ? 'bg-gray-800' : 'bg-gray-200',
              i === 2 ? 'w-20 h-20' : 'w-14 h-14'
            ]"
          />
          <div class="h-4 rounded w-2/3 mx-auto" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          <div class="h-3 rounded w-1/2 mx-auto" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          <div class="h-6 rounded w-1/3 mx-auto" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
        </div>
      </div>
      <!-- Table skeleton -->
      <div class="rounded-xl overflow-hidden" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
        <div v-for="i in 5" :key="i"
          class="grid grid-cols-[60px_1fr_140px_120px] gap-4 items-center px-5 py-3.5"
          :class="i < 5 ? (isDark ? 'border-b border-gray-800/50' : 'border-b border-gray-100') : ''"
        >
          <div class="h-4 w-8 rounded animate-pulse mx-auto" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
            <div class="h-4 rounded w-1/3 animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          </div>
          <div class="h-3 rounded w-16 animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          <div class="h-4 rounded w-14 animate-pulse ml-auto" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <div v-else-if="!entries.length" class="text-center py-20">
      <i class="fa-solid fa-trophy text-5xl text-gray-400"></i>
      <p class="mt-3 text-gray-500">No entries yet for this period.</p>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Podium (top 3) -->
      <div v-if="podium.length >= 3" class="grid grid-cols-3 gap-4 items-end">
        <div
          v-for="entry in podiumDisplay" :key="entry.rank"
          class="rounded-xl border p-5 text-center space-y-3 transition-colors"
          :class="[
            entry.rank === 1
              ? 'border-2 border-yellow-500/50 min-h-[260px]'
              : entry.rank === 2
                ? 'border-gray-400/30 min-h-[220px]'
                : 'border-amber-600/30 min-h-[220px]',
            entry.rank === 1
              ? (isDark ? 'bg-yellow-500/5' : 'bg-yellow-50/80')
              : (isDark ? 'bg-gray-900' : 'bg-white shadow-sm'),
          ]"
        >
          <!-- Medal -->
          <div class="text-3xl" :class="entry.rank === 1 ? 'text-4xl' : ''">
            {{ medals[entry.rank - 1] }}
          </div>

          <!-- Avatar -->
          <router-link v-if="entry.user" :to="`/profile/${entry.user.username}`" class="inline-block">
            <UserAvatar
              :name="entry.user.username"
              :avatar-url="entry.user.avatar_url"
              :avatar-color="entry.user.avatar_color"
              :size="entry.rank === 1 ? 'xl' : 'lg'"
            />
          </router-link>

          <!-- Username -->
          <div>
            <router-link v-if="entry.user" :to="`/profile/${entry.user.username}`"
              class="font-bold hover:underline block"
              :class="entry.rank === 1 ? 'text-lg' : 'text-base'"
              :style="entry.user.group_color ? { color: entry.user.group_color } : {}"
            >
              {{ entry.user.username }}
            </router-link>

            <!-- Group badge -->
            <span v-if="entry.user?.group_label"
              class="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1"
              :style="{ backgroundColor: (entry.user.group_color || '#6b7280') + '22', color: entry.user.group_color || '#6b7280' }"
            >
              {{ entry.user.group_label }}
            </span>

            <!-- User title -->
            <p v-if="entry.user?.user_title" class="text-xs mt-1" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
              {{ entry.user.user_title }}
            </p>

            <!-- Level badge -->
            <span v-if="entry.user?.level" class="inline-block bg-purple-accent/15 text-purple-accent text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1">
              Lv. {{ entry.user.level }}
            </span>
          </div>

          <!-- Divider -->
          <div class="border-t mx-4" :class="isDark ? 'border-gray-800' : 'border-gray-200'"></div>

          <!-- Value -->
          <div>
            <div class="flex items-center justify-center gap-1.5"
              :class="entry.rank === 1 ? 'text-2xl' : 'text-xl'"
            >
              <i :class="[typeConfig[type].icon, typeConfig[type].color]" class="text-sm"></i>
              <span class="font-bold" :class="isDark ? 'text-gray-100' : 'text-gray-800'">
                {{ entry.value?.toLocaleString() }}
              </span>
            </div>
            <p class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
              {{ typeConfig[type].label }}
            </p>
          </div>
        </div>
      </div>

      <!-- Rest of table (rank 4+) -->
      <div v-if="rest.length" class="rounded-xl overflow-hidden border"
        :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'"
      >
        <!-- Header -->
        <div
          class="hidden sm:grid grid-cols-[60px_1fr_140px_120px] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider"
          :class="isDark ? 'bg-gray-800/50 text-gray-400 border-b border-gray-800' : 'bg-gray-50 text-gray-500 border-b border-gray-200'"
        >
          <span class="text-center">Rank</span>
          <span>Member</span>
          <span>Group</span>
          <span class="text-right">Score</span>
        </div>

        <!-- Rows -->
        <div
          v-for="entry in rest" :key="entry.rank"
          class="grid grid-cols-[60px_1fr_140px_120px] gap-4 items-center px-5 py-3.5 transition-colors"
          :class="[
            isDark ? 'border-b border-gray-800/50 hover:bg-gray-800/30' : 'border-b border-gray-100 hover:bg-gray-50',
          ]"
        >
          <!-- Rank -->
          <div class="text-center font-bold text-sm" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            #{{ entry.rank }}
          </div>

          <!-- User -->
          <div class="flex items-center gap-3 min-w-0">
            <router-link v-if="entry.user" :to="`/profile/${entry.user.username}`" class="flex items-center gap-3 min-w-0">
              <UserAvatar :name="entry.user.username" :avatar-url="entry.user.avatar_url" :avatar-color="entry.user.avatar_color" size="sm" />
              <div class="min-w-0">
                <span class="font-medium text-sm truncate block" :style="entry.user.group_color ? { color: entry.user.group_color } : {}">
                  {{ entry.user.username }}
                </span>
                <span v-if="entry.user.user_title" class="text-xs truncate block" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  {{ entry.user.user_title }}
                </span>
                <span v-if="entry.user?.level" class="inline-block bg-purple-accent/15 text-purple-accent text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5">
                  Lv. {{ entry.user.level }}
                </span>
              </div>
            </router-link>
          </div>

          <!-- Group badge -->
          <div>
            <span v-if="entry.user?.group_label"
              class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              :style="{ backgroundColor: (entry.user.group_color || '#6b7280') + '22', color: entry.user.group_color || '#6b7280' }"
            >
              {{ entry.user.group_label }}
            </span>
            <p v-if="entry.user?.join_date" class="text-[10px] mt-0.5" :class="isDark ? 'text-gray-600' : 'text-gray-400'">
              {{ formatJoinDate(entry.user.join_date) }}
            </p>
          </div>

          <!-- Value -->
          <div class="text-right font-semibold text-sm flex items-center justify-end gap-1.5">
            <i :class="[typeConfig[type].icon, typeConfig[type].color]" class="text-xs"></i>
            <span :class="isDark ? 'text-gray-200' : 'text-gray-700'">{{ entry.value?.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- Your rank banner -->
      <div v-if="yourRank && !yourRank.in_top"
        class="rounded-xl border border-purple-accent/30 overflow-hidden"
        :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
      >
        <div class="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider"
          :class="isDark ? 'bg-purple-accent/10 text-purple-accent border-b border-purple-accent/20' : 'bg-purple-50 text-purple-accent border-b border-purple-accent/20'"
        >
          Your position
        </div>
        <div class="grid grid-cols-[60px_1fr_140px_120px] gap-4 items-center px-5 py-3.5">
          <div class="text-center font-bold text-sm text-purple-accent">
            #{{ yourRank.rank }}
          </div>
          <div class="flex items-center gap-3 min-w-0">
            <UserAvatar :name="yourRank.user?.username" :avatar-url="yourRank.user?.avatar_url" :avatar-color="yourRank.user?.avatar_color" size="sm" />
            <div class="min-w-0">
              <span class="font-medium text-sm truncate block" :style="yourRank.user?.group_color ? { color: yourRank.user.group_color } : {}">
                {{ yourRank.user?.username }}
              </span>
              <span v-if="yourRank.user?.level" class="inline-block bg-purple-accent/15 text-purple-accent text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5">
                Lv. {{ yourRank.user.level }}
              </span>
            </div>
          </div>
          <div>
            <span v-if="yourRank.user?.group_label"
              class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              :style="{ backgroundColor: (yourRank.user.group_color || '#6b7280') + '22', color: yourRank.user.group_color || '#6b7280' }"
            >
              {{ yourRank.user.group_label }}
            </span>
          </div>
          <div class="text-right font-semibold text-sm flex items-center justify-end gap-1.5">
            <i :class="[typeConfig[type].icon, typeConfig[type].color]" class="text-xs"></i>
            <span :class="isDark ? 'text-gray-200' : 'text-gray-700'">{{ yourRank.value?.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- If fewer than 3 entries, show them in the table instead -->
      <div v-if="podium.length < 3" class="rounded-xl overflow-hidden border"
        :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'"
      >
        <div
          class="hidden sm:grid grid-cols-[60px_1fr_140px_120px] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider"
          :class="isDark ? 'bg-gray-800/50 text-gray-400 border-b border-gray-800' : 'bg-gray-50 text-gray-500 border-b border-gray-200'"
        >
          <span class="text-center">Rank</span>
          <span>Member</span>
          <span>Group</span>
          <span class="text-right">Score</span>
        </div>
        <div
          v-for="entry in entries" :key="entry.rank"
          class="grid grid-cols-[60px_1fr_140px_120px] gap-4 items-center px-5 py-3.5 transition-colors"
          :class="isDark ? 'border-b border-gray-800/50 hover:bg-gray-800/30' : 'border-b border-gray-100 hover:bg-gray-50'"
        >
          <div class="text-center font-bold text-sm">
            <span v-if="entry.rank <= 3" class="text-lg">{{ medals[entry.rank - 1] }}</span>
            <span v-else :class="isDark ? 'text-gray-500' : 'text-gray-400'">#{{ entry.rank }}</span>
          </div>
          <div class="flex items-center gap-3 min-w-0">
            <router-link v-if="entry.user" :to="`/profile/${entry.user.username}`" class="flex items-center gap-3 min-w-0">
              <UserAvatar :name="entry.user.username" :avatar-url="entry.user.avatar_url" :avatar-color="entry.user.avatar_color" size="sm" />
              <div class="min-w-0">
                <span class="font-medium text-sm truncate block" :style="entry.user.group_color ? { color: entry.user.group_color } : {}">
                  {{ entry.user.username }}
                </span>
                <span v-if="entry.user.user_title" class="text-xs truncate block" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  {{ entry.user.user_title }}
                </span>
                <span v-if="entry.user?.level" class="inline-block bg-purple-accent/15 text-purple-accent text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5">
                  Lv. {{ entry.user.level }}
                </span>
              </div>
            </router-link>
          </div>
          <div>
            <span v-if="entry.user?.group_label"
              class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              :style="{ backgroundColor: (entry.user.group_color || '#6b7280') + '22', color: entry.user.group_color || '#6b7280' }"
            >
              {{ entry.user.group_label }}
            </span>
            <p v-if="entry.user?.join_date" class="text-[10px] mt-0.5" :class="isDark ? 'text-gray-600' : 'text-gray-400'">
              {{ formatJoinDate(entry.user.join_date) }}
            </p>
          </div>
          <div class="text-right font-semibold text-sm flex items-center justify-end gap-1.5">
            <i :class="[typeConfig[type].icon, typeConfig[type].color]" class="text-xs"></i>
            <span :class="isDark ? 'text-gray-200' : 'text-gray-700'">{{ entry.value?.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
