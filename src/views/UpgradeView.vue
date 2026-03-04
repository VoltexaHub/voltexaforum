<script setup>
import { ref, onMounted, inject } from 'vue'
import { getUpgradePlans } from '../services/api'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const isDark = inject('isDark')
const auth = useAuthStore()
const router = useRouter()

const plans = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await getUpgradePlans()
    plans.value = res.data.data || []
  } finally {
    loading.value = false
  }
})

function termLabel(term) {
  return { lifetime: 'Lifetime', monthly: '/ month', yearly: '/ year' }[term] || term
}

function termBadge(term) {
  return { lifetime: 'One-time', monthly: 'Monthly', yearly: 'Yearly' }[term] || term
}

function handlePurchase(plan) {
  if (!auth.isLoggedIn) { router.push('/login'); return }
  // Will wire to Stripe checkout — for now route to store
  router.push('/store')
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-10">
    <!-- Header -->
    <div class="text-center mb-10">
      <h1 class="text-3xl font-bold mb-2" :class="isDark ? 'text-white' : 'text-gray-900'">
        Upgrade Your Experience
      </h1>
      <p class="text-base max-w-xl mx-auto" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        Unlock premium features, boost your reputation power, and support the community.
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="rounded-2xl animate-pulse" :class="isDark ? 'bg-gray-800' : 'bg-gray-100'" style="height:540px" />
    </div>

    <!-- Empty -->
    <div v-else-if="!plans.length" class="text-center py-20">
      <i class="fa-solid fa-rocket text-4xl text-gray-400 mb-3"></i>
      <p class="text-base" :class="isDark ? 'text-gray-400' : 'text-gray-500'">No upgrade plans available yet.</p>
    </div>

    <!-- Plans grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      <div
        v-for="plan in plans"
        :key="plan.id"
        class="rounded-2xl overflow-hidden shadow-lg flex flex-col relative"
        :class="[
          isDark ? 'bg-gray-800' : 'bg-white',
          plan.is_featured ? 'ring-2' : ''
        ]"
        :style="plan.is_featured ? `--tw-ring-color: ${plan.color}` : ''"
      >
        <!-- Featured badge -->
        <div v-if="plan.is_featured"
          class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full text-white"
          :style="{ backgroundColor: plan.color }">
          Most Popular
        </div>

        <!-- Header -->
        <div class="px-6 pt-8 pb-6" :style="{ backgroundColor: plan.color + '18', borderBottom: `2px solid ${plan.color}30` }">
          <h2 class="text-2xl font-black mb-3" :style="{ color: plan.color }">{{ plan.name }}</h2>
          <div class="flex items-end gap-2">
            <span class="text-4xl font-black" :class="isDark ? 'text-white' : 'text-gray-900'">
              ${{ plan.price === 0 ? 'Free' : Number(plan.price).toFixed(2) }}
            </span>
            <span class="text-sm font-medium pb-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
              {{ plan.price > 0 ? termLabel(plan.term) : '' }}
            </span>
          </div>
          <span class="inline-block mt-2 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
            :style="{ backgroundColor: plan.color + '25', color: plan.color }">
            {{ termBadge(plan.term) }}
          </span>
          <p v-if="plan.description" class="mt-3 text-sm" :class="isDark ? 'text-gray-300' : 'text-gray-600'">
            {{ plan.description }}
          </p>
        </div>

        <!-- Stats row (rep power, daily limit) -->
        <div class="grid grid-cols-3 divide-x text-center py-3"
          :class="isDark ? 'divide-gray-700 bg-gray-900/40 border-b border-gray-700' : 'divide-gray-100 bg-gray-50 border-b border-gray-200'">
          <div class="px-2">
            <div class="text-xs mb-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Rep Power</div>
            <div class="text-sm font-bold">
              <span class="text-green-400">+{{ plan.rep_power_pos }}</span>
              <span class="mx-0.5" :class="isDark ? 'text-gray-600' : 'text-gray-300'">/</span>
              <span class="text-red-400">-{{ plan.rep_power_neg }}</span>
            </div>
          </div>
          <div class="px-2">
            <div class="text-xs mb-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Daily Reps</div>
            <div class="text-sm font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">{{ plan.rep_daily_limit }}</div>
          </div>
          <div class="px-2">
            <div class="text-xs mb-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Group</div>
            <div class="text-xs font-bold truncate" :style="{ color: plan.color }">{{ plan.role_name ? (plan.role_name.charAt(0).toUpperCase() + plan.role_name.slice(1)) : '—' }}</div>
          </div>
        </div>

        <!-- Features list -->
        <div class="flex-1 px-6 py-5">
          <ul class="space-y-2.5">
            <li v-for="(feat, fi) in (plan.features || [])" :key="fi"
              class="flex items-start gap-2.5 text-sm">
              <!-- check -->
              <i v-if="feat.type === 'check'"
                class="fa-solid fa-circle-check text-green-400 mt-0.5 shrink-0 text-base"></i>
              <!-- cross -->
              <i v-else-if="feat.type === 'cross'"
                class="fa-solid fa-circle-xmark text-red-400/60 mt-0.5 shrink-0 text-base"></i>
              <!-- stat -->
              <i v-else
                class="fa-solid fa-chart-bar mt-0.5 shrink-0 text-base" :style="{ color: plan.color }"></i>

              <span class="flex-1" :class="[
                feat.type === 'cross' ? (isDark ? 'text-gray-500' : 'text-gray-400') : (isDark ? 'text-gray-200' : 'text-gray-700')
              ]">{{ feat.label }}</span>

              <span v-if="feat.value != null && feat.type === 'stat'"
                class="font-bold text-xs shrink-0" :class="isDark ? 'text-gray-300' : 'text-gray-600'">
                {{ feat.value }}
              </span>
            </li>
          </ul>

          <!-- One-time bonus -->
          <div v-if="plan.one_time_bonus && (plan.one_time_bonus.credits || plan.one_time_bonus.label)"
            class="mt-5 p-3 rounded-xl"
            :class="isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'">
            <div class="text-xs font-bold uppercase tracking-wider text-green-400 mb-2">One-Time Bonus</div>
            <div v-if="plan.one_time_bonus.credits" class="flex items-center justify-between text-sm">
              <span :class="isDark ? 'text-gray-300' : 'text-gray-600'">
                <i class="fa-solid fa-coins text-yellow-400 mr-1.5"></i>Credits
              </span>
              <span class="font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">{{ plan.one_time_bonus.credits }}</span>
            </div>
            <div v-if="plan.one_time_bonus.label" class="text-xs mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
              {{ plan.one_time_bonus.label }}
            </div>
          </div>
        </div>

        <!-- Prerequisite notice -->
        <div v-if="plan.required_plan"
          class="mx-6 mb-3 px-3 py-2 rounded-lg flex items-center gap-2 text-xs"
          :class="isDark ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-amber-50 border border-amber-200 text-amber-600'">
          <i class="fa-solid fa-lock shrink-0"></i>
          Requires <strong class="mx-1">{{ plan.required_plan.name }}</strong> first
        </div>

        <!-- Purchase button -->
        <div class="px-6 pb-6">
          <button
            @click="handlePurchase(plan)"
            class="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95"
            :style="{ backgroundColor: plan.color }"
          >
            {{ plan.price === 0 ? 'Get Started' : 'Purchase' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
