<script setup>
import { ref, inject } from 'vue'
import { usePlan } from '../composables/usePlan'

const props = defineProps({
  limitType: { type: String, required: true },
  current: { type: Number, required: true },
  max: { type: Number, required: true },
  dismissible: { type: Boolean, default: true },
})

const isDark = inject('isDark', ref(true))
const { planName, upgradeUrl } = usePlan()
const dismissed = ref(false)
</script>

<template>
  <div
    v-if="!dismissed"
    class="rounded-xl border p-4 flex items-center justify-between gap-4 flex-wrap"
    :class="isDark ? 'bg-violet-500/10 border-violet-500/30' : 'bg-violet-50 border-violet-200'"
  >
    <div class="flex items-center gap-3 min-w-0">
      <span class="text-lg shrink-0">&#9889;</span>
      <p class="text-sm" :class="isDark ? 'text-gray-200' : 'text-gray-700'">
        You've reached your <strong>{{ limitType }}</strong> limit
        (<span class="font-semibold text-purple-accent">{{ current }}/{{ max }}</span>)
        on the <strong>{{ planName }}</strong> plan.
      </p>
    </div>
    <div class="flex items-center gap-3 shrink-0">
      <a
        :href="upgradeUrl"
        target="_blank"
        rel="noopener"
        class="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
      >
        Upgrade your plan &rarr;
      </a>
      <button
        v-if="dismissible"
        @click="dismissed = true"
        class="p-1.5 rounded-lg transition-colors"
        :class="isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'"
        title="Dismiss"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>
