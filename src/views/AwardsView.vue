<script setup>
import { inject, ref, onMounted } from 'vue'
import { getAwards } from '../services/api'
import AwardDetailModal from '../components/AwardDetailModal.vue'

const isDark = inject('isDark')

const awards = ref([])
const loading = ref(true)
const error = ref(null)
const selectedAward = ref(null)

async function fetchAwards() {
  loading.value = true
  error.value = null
  try {
    const res = await getAwards()
    awards.value = res.data.data
  } catch (e) {
    error.value = 'Failed to load awards. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchAwards)

function typeBadgeClass(type) {
  switch (type) {
    case 'achievement': return 'bg-purple-500/15 text-purple-400 border-purple-500/30'
    case 'purchasable': return 'bg-green-500/15 text-green-400 border-green-500/30'
    default: return 'bg-gray-500/15 text-gray-400 border-gray-500/30'
  }
}

function typeLabel(type) {
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Manual'
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div class="h-8 rounded w-1/4 animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div v-for="i in 8" :key="i" class="rounded-xl p-5 animate-pulse border" :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'">
          <div class="flex flex-col items-center gap-3">
            <div class="w-12 h-12 rounded-lg" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
            <div class="h-4 rounded w-1/2" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
            <div class="h-3 rounded w-3/4" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-20">
      <i class="fa-solid fa-face-sad-tear text-5xl text-gray-400"></i>
      <p class="text-lg font-medium mt-4" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ error }}</p>
      <button
        @click="fetchAwards"
        class="mt-4 px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        Retry
      </button>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold">Awards</h1>
        <p class="text-sm mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
          Browse all available awards
        </p>
      </div>

      <!-- Awards grid -->
      <div v-if="awards.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <button
          v-for="award in awards"
          :key="award.id"
          @click="selectedAward = award"
          class="rounded-xl p-5 border transition-all duration-300 text-left hover:scale-[1.02] hover:shadow-lg cursor-pointer"
          :class="isDark ? 'bg-gray-900 border-gray-800 hover:border-purple-accent/40' : 'bg-white border-gray-200 shadow-sm hover:border-purple-accent/40'"
        >
          <div class="flex flex-col items-center text-center gap-3">
            <!-- Icon -->
            <div class="w-14 h-14 rounded-lg flex items-center justify-center shrink-0">
              <img
                v-if="award.icon_url"
                :src="award.icon_url"
                :alt="award.name"
                class="w-12 h-12 object-contain"
              />
              <span v-else-if="award.icon && !award.icon.startsWith('fa-')" class="text-3xl">{{ award.icon }}</span>
              <i v-else class="fa-solid fa-award text-3xl text-yellow-500"></i>
            </div>

            <!-- Name -->
            <h3 class="font-semibold text-sm">{{ award.name }}</h3>

            <!-- Type badge -->
            <span
              class="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border"
              :class="typeBadgeClass(award.type)"
            >
              {{ typeLabel(award.type) }}
            </span>

            <!-- Description -->
            <p
              class="text-xs line-clamp-2"
              :class="isDark ? 'text-gray-500' : 'text-gray-400'"
            >
              {{ award.description }}
            </p>

            <!-- Achievement link -->
            <p v-if="award.type === 'achievement' && award.achievement" class="text-xs text-purple-accent">
              Linked to: {{ award.achievement.name }}
            </p>

            <!-- Price -->
            <div v-if="award.type === 'purchasable'" class="flex items-center gap-2 text-xs font-medium">
              <span v-if="award.price_credits" class="text-yellow-500">
                <i class="fa-solid fa-coins mr-0.5"></i>{{ award.price_credits.toLocaleString() }}
              </span>
              <span v-if="award.price_money" class="text-green-500">
                ${{ Number(award.price_money).toFixed(2) }}
              </span>
            </div>

            <!-- Holder count -->
            <p class="text-xs" :class="isDark ? 'text-gray-600' : 'text-gray-400'">
              {{ award.holder_count ?? 0 }} {{ (award.holder_count ?? 0) === 1 ? 'member has' : 'members have' }} this
            </p>
          </div>
        </button>
      </div>

      <!-- Empty state -->
      <div v-else class="rounded-xl p-12 text-center" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
        <i class="fa-solid fa-award text-4xl text-gray-400"></i>
        <p class="mt-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">No awards available yet.</p>
      </div>
    </template>

    <!-- Detail modal -->
    <AwardDetailModal
      v-if="selectedAward"
      :award="selectedAward"
      @close="selectedAward = null"
    />
  </div>
</template>
