<script setup>
import { inject, ref, onMounted, watch } from 'vue'
import { getAwardDetail } from '../services/api'
import UserAvatar from './UserAvatar.vue'
import { formatDate } from '../utils/date'

const props = defineProps({
  award: { type: Object, required: true },
})
const emit = defineEmits(['close'])
const isDark = inject('isDark')

const detail = ref(null)
const holders = ref([])
const currentPage = ref(1)
const lastPage = ref(1)
const loadingDetail = ref(true)

async function fetchDetail(page = 1) {
  loadingDetail.value = true
  try {
    const res = await getAwardDetail(props.award.id, page)
    detail.value = res.data.data
    holders.value = res.data.data.holders?.data || []
    currentPage.value = res.data.data.holders?.current_page || 1
    lastPage.value = res.data.data.holders?.last_page || 1
  } catch {
    // fail silently, show what we have from the list
  } finally {
    loadingDetail.value = false
  }
}

onMounted(() => fetchDetail())

watch(() => props.award.id, () => fetchDetail())

function nextPage() {
  if (currentPage.value < lastPage.value) fetchDetail(currentPage.value + 1)
}
function prevPage() {
  if (currentPage.value > 1) fetchDetail(currentPage.value - 1)
}

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
  <!-- Backdrop -->
  <Teleport to="body">
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <!-- Overlay -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')" />

      <!-- Modal -->
      <div
        class="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border p-6 z-10"
        :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-xl'"
      >
        <!-- Close button -->
        <button
          @click="emit('close')"
          class="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          :class="isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>

        <!-- Icon -->
        <div class="flex justify-center mb-4">
          <img
            v-if="award.icon_url"
            :src="award.icon_url"
            :alt="award.name"
            class="w-20 h-20 object-contain"
          />
          <span v-else-if="award.icon && !award.icon.startsWith('fa-')" class="text-5xl">{{ award.icon }}</span>
          <div v-else class="w-20 h-20 rounded-xl flex items-center justify-center bg-yellow-500/10">
            <i class="fa-solid fa-award text-4xl text-yellow-500"></i>
          </div>
        </div>

        <!-- Name + badge -->
        <div class="text-center mb-4">
          <h2 class="text-xl font-bold">{{ award.name }}</h2>
          <span
            class="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border mt-2"
            :class="typeBadgeClass(award.type)"
          >
            {{ typeLabel(award.type) }}
          </span>
        </div>

        <!-- Description -->
        <p class="text-sm text-center mb-5" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
          {{ award.description }}
        </p>

        <!-- How to get it -->
        <div
          class="rounded-xl p-4 mb-5 border"
          :class="isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-200'"
        >
          <h3 class="text-sm font-semibold mb-1" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
            <i class="fa-solid fa-circle-info mr-1.5 text-purple-accent"></i>How to get this award
          </h3>
          <p class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            <template v-if="award.type === 'manual'">
              Granted by staff at their discretion.
            </template>
            <template v-else-if="award.type === 'achievement'">
              Earned by completing the <span class="text-purple-accent font-medium">{{ award.achievement?.name || 'linked' }}</span> achievement.
            </template>
            <template v-else-if="award.type === 'purchasable'">
              Available for purchase
              <template v-if="award.price_credits">
                — <i class="fa-solid fa-coins text-yellow-500"></i> {{ award.price_credits.toLocaleString() }} credits
              </template>
              <template v-if="award.price_money">
                {{ award.price_credits ? ' or ' : '— ' }}${{ Number(award.price_money).toFixed(2) }}
              </template>
            </template>
          </p>
        </div>

        <!-- Holders -->
        <div>
          <h3 class="text-sm font-semibold mb-3" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
            <i class="fa-solid fa-users mr-1.5 text-purple-accent"></i>Members with this award
          </h3>

          <div v-if="loadingDetail" class="space-y-2">
            <div v-for="i in 3" :key="i" class="h-10 rounded-lg animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          </div>

          <template v-else-if="holders.length">
            <div class="space-y-2">
              <div
                v-for="holder in holders"
                :key="holder.user_id"
                class="flex items-center gap-3 p-2 rounded-lg"
                :class="isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'"
              >
                <UserAvatar
                  :name="holder.username"
                  :avatar-url="holder.avatar_url"
                  size="sm"
                />
                <div class="flex-1 min-w-0">
                  <router-link
                    :to="`/profile/${holder.username}`"
                    class="text-sm font-medium hover:text-purple-accent transition-colors truncate block"
                    @click="emit('close')"
                  >
                    {{ holder.username }}
                  </router-link>
                  <div class="text-xs" :class="isDark ? 'text-gray-600' : 'text-gray-400'">
                    {{ formatDate(holder.granted_at) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Pagination -->
            <div v-if="lastPage > 1" class="flex items-center justify-between mt-3 pt-3 border-t" :class="isDark ? 'border-gray-800' : 'border-gray-200'">
              <button
                @click="prevPage"
                :disabled="currentPage <= 1"
                class="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                :class="currentPage <= 1
                  ? 'opacity-40 cursor-not-allowed'
                  : isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'"
              >
                <i class="fa-solid fa-chevron-left mr-1"></i>Prev
              </button>
              <span class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                Page {{ currentPage }} of {{ lastPage }}
              </span>
              <button
                @click="nextPage"
                :disabled="currentPage >= lastPage"
                class="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                :class="currentPage >= lastPage
                  ? 'opacity-40 cursor-not-allowed'
                  : isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'"
              >
                Next<i class="fa-solid fa-chevron-right ml-1"></i>
              </button>
            </div>
          </template>

          <p v-else class="text-sm text-center py-4" :class="isDark ? 'text-gray-600' : 'text-gray-400'">
            No one has this award yet.
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
