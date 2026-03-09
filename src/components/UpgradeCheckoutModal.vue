<script setup>
import { ref, inject, computed, watch } from 'vue'
import { createUpgradeCheckout, activateUpgradePlan, getEnabledPaymentProviders, getPlisioCurrencies } from '../services/api'

const props = defineProps({
  plan: Object,
  show: Boolean,
})

const emit = defineEmits(['close'])

const isDark = inject('isDark')
const loading = ref(false)
const error = ref('')
const success = ref(false)

const providers = ref([])
const selectedProvider = ref(null)
const providersLoading = ref(false)

const plisioCurrencies = ref([])
const selectedCrypto = ref(null)

const cryptoMeta = {
  BTC:  { label: 'Bitcoin',      icon: 'fa-brands fa-bitcoin' },
  ETH:  { label: 'Ethereum',     icon: 'fa-brands fa-ethereum' },
  LTC:  { label: 'Litecoin',     icon: 'fa-solid fa-coins' },
  USDT: { label: 'Tether',       icon: 'fa-solid fa-dollar-sign' },
  TRX:  { label: 'TRON',         icon: 'fa-solid fa-bolt' },
  DOGE: { label: 'Dogecoin',     icon: 'fa-solid fa-dog' },
  BCH:  { label: 'Bitcoin Cash', icon: 'fa-solid fa-money-bill' },
  XMR:  { label: 'Monero',       icon: 'fa-solid fa-eye-slash' },
  BNB:  { label: 'BNB',          icon: 'fa-solid fa-cube' },
  SOL:  { label: 'Solana',       icon: 'fa-solid fa-sun' },
  USDC: { label: 'USD Coin',     icon: 'fa-solid fa-circle-dollar-to-slot' },
  DAI:  { label: 'Dai',          icon: 'fa-solid fa-d' },
  MATIC:{ label: 'Polygon',      icon: 'fa-solid fa-hexagon-nodes' },
}

const providerMeta = {
  stripe: { icon: 'fa-brands fa-stripe', label: 'Stripe' },
  paypal: { icon: 'fa-brands fa-paypal', label: 'PayPal' },
  plisio: { icon: 'fa-solid fa-coins', label: 'Crypto (Plisio)' },
}

function getProviderMeta(slug) {
  return providerMeta[slug] || { icon: 'fa-solid fa-wallet', label: slug.charAt(0).toUpperCase() + slug.slice(1) }
}

watch(() => props.show, async (val) => {
  if (val && providers.value.length === 0) {
    providersLoading.value = true
    try {
      const res = await getEnabledPaymentProviders()
      providers.value = res.data.data || res.data
      if (providers.value.length > 0) selectedProvider.value = providers.value[0]
    } catch {
      providers.value = ['stripe']
      selectedProvider.value = 'stripe'
    } finally {
      providersLoading.value = false
    }
  }
  if (val) {
    selectedCrypto.value = null
    plisioCurrencies.value = []
  }
}, { immediate: true })

watch(selectedProvider, async (val) => {
  if (val === 'plisio' && plisioCurrencies.value.length === 0) {
    try {
      const res = await getPlisioCurrencies()
      plisioCurrencies.value = res.data.data || []
      if (plisioCurrencies.value.length > 0) selectedCrypto.value = plisioCurrencies.value[0]
    } catch {
      plisioCurrencies.value = ['BTC']
      selectedCrypto.value = 'BTC'
    }
  }
})

const topFeatures = computed(() => {
  if (!props.plan?.features) return []
  return props.plan.features.filter(f => f.type === 'check').slice(0, 3)
})

const termBadge = computed(() => {
  if (!props.plan) return ''
  return { lifetime: 'One-time', monthly: 'Monthly', yearly: 'Yearly' }[props.plan.term] || props.plan.term
})

const isFree = computed(() => props.plan && Number(props.plan.price) === 0)

async function handlePaid() {
  loading.value = true
  error.value = ''
  try {
    const payload = { provider: selectedProvider.value }
    if (selectedProvider.value === 'plisio' && selectedCrypto.value) {
      payload.plisio_currency = selectedCrypto.value
    }
    const res = await createUpgradeCheckout(props.plan.id, payload)
    window.location.href = res.data.data.url
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to create checkout session.'
    loading.value = false
  }
}

async function handleFree() {
  loading.value = true
  error.value = ''
  try {
    await activateUpgradePlan(props.plan.id)
    success.value = true
    setTimeout(() => {
      success.value = false
      emit('close')
      window.location.reload()
    }, 2000)
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to activate plan.'
  } finally {
    loading.value = false
  }
}

function close() {
  if (!loading.value) {
    error.value = ''
    success.value = false
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show && plan" class="fixed inset-0 z-[9999] flex items-center justify-center p-4" @click.self="close">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close" />

        <!-- Modal -->
        <div
          class="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all"
          :class="isDark ? 'bg-gray-800' : 'bg-white'"
        >
          <!-- Close button -->
          <button
            @click="close"
            class="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            :class="isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>

          <!-- Header -->
          <div class="px-6 pt-6 pb-5" :style="{ backgroundColor: plan.color + '18', borderBottom: '2px solid ' + plan.color + '30' }">
            <h3 class="text-xl font-black" :style="{ color: plan.color }">{{ plan.name }}</h3>
            <div class="flex items-end gap-2 mt-2">
              <span class="text-3xl font-black" :class="isDark ? 'text-white' : 'text-gray-900'">
                {{ isFree ? 'Free' : '$' + Number(plan.price).toFixed(2) }}
              </span>
              <span v-if="!isFree" class="text-sm pb-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                {{ { lifetime: 'Lifetime', monthly: '/ month', yearly: '/ year' }[plan.term] || plan.term }}
              </span>
            </div>
            <span class="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              :style="{ backgroundColor: plan.color + '25', color: plan.color }">
              {{ termBadge }}
            </span>
          </div>

          <!-- Content -->
          <div class="px-6 py-5 space-y-4">
            <!-- Top features -->
            <div v-if="topFeatures.length">
              <ul class="space-y-2">
                <li v-for="(feat, i) in topFeatures" :key="i" class="flex items-center gap-2 text-sm">
                  <i class="fa-solid fa-circle-check text-green-400 shrink-0"></i>
                  <span :class="isDark ? 'text-gray-200' : 'text-gray-700'">{{ feat.label }}</span>
                </li>
              </ul>
            </div>

            <!-- One-time bonus -->
            <div v-if="plan.one_time_bonus && plan.one_time_bonus.credits"
              class="p-3 rounded-xl"
              :class="isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'">
              <div class="flex items-center justify-between text-sm">
                <span :class="isDark ? 'text-gray-300' : 'text-gray-600'">
                  <i class="fa-solid fa-gift text-green-400 mr-1.5"></i>Bonus Credits
                </span>
                <span class="font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">+{{ plan.one_time_bonus.credits }}</span>
              </div>
            </div>

            <!-- Payment method selector (always shown) -->
            <div v-if="!isFree && !success && providers.length > 0">
              <p class="text-xs font-semibold uppercase tracking-wider mb-2" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Payment Method</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="p in providers"
                  :key="p"
                  @click="selectedProvider = p"
                  class="px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2"
                  :class="[
                    providers.length > 1 ? 'cursor-pointer' : 'cursor-default pointer-events-none',
                    selectedProvider === p
                      ? 'border-purple-accent text-purple-accent'
                      : isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600'
                  ]"
                  :style="selectedProvider === p ? { backgroundColor: 'rgb(139 92 246 / 0.15)' } : {}"
                >
                  <i :class="getProviderMeta(p).icon"></i>
                  {{ getProviderMeta(p).label }}
                </button>
              </div>
            </div>

            <!-- Plisio crypto picker -->
            <div v-if="!isFree && !success && selectedProvider === 'plisio' && plisioCurrencies.length > 0">
              <p class="text-xs font-semibold uppercase tracking-wider mb-2" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Pay with</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="code in plisioCurrencies"
                  :key="code"
                  @click="selectedCrypto = code"
                  class="px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5"
                  :class="selectedCrypto === code
                    ? 'border-current text-current'
                    : isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'"
                  :style="selectedCrypto === code ? { color: plan.color, backgroundColor: plan.color + '18', borderColor: plan.color } : {}"
                >
                  <i :class="(cryptoMeta[code] || {}).icon || 'fa-solid fa-coins'" class="text-sm"></i>
                  {{ code }}
                </button>
              </div>
            </div>

            <!-- Error -->
            <div v-if="error" class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {{ error }}
            </div>

            <!-- Success -->
            <div v-if="success" class="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
              <i class="fa-solid fa-circle-check mr-1"></i> Upgrade activated successfully!
            </div>

            <!-- Action button -->
            <button
              v-if="!success"
              @click="isFree ? handleFree() : handlePaid()"
              :disabled="loading || (!isFree && !selectedProvider)"
              class="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              :style="{ backgroundColor: isFree ? plan.color : '#22c55e' }"
            >
              <i v-if="loading" class="fa-solid fa-spinner fa-spin"></i>
              <template v-else>
                <i :class="isFree ? 'fa-solid fa-bolt' : 'fa-solid fa-lock'"></i>
                {{ isFree ? 'Activate Now' : 'Continue to Payment' }}
              </template>
            </button>

            <p v-if="!isFree && !success" class="text-center text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
              <i class="fa-solid fa-shield-halved mr-1"></i>Secure checkout
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .relative, .modal-leave-active .relative {
  transition: transform 0.2s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative {
  transform: scale(0.95) translateY(10px);
}
</style>
