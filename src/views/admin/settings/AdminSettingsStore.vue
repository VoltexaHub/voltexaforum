<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAdminConfig, updateAdminConfig, getPaymentProviders, updatePaymentProvider, uploadCustomGateway, deleteCustomGateway } from '../../../services/api'
import { useToastStore } from '../../../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const saving = ref(false)

const storeSettings = ref({
  store_enabled: true,
  currency: 'USD',
})

const providers = ref({})
const configModal = ref(null)
const modalForm = ref({})
const modalSaving = ref(false)

// Upload modal
const uploadModal = ref(false)
const uploadForm = ref({ file: null, slug: '', name: '' })
const uploading = ref(false)

// Delete confirm
const deleteConfirm = ref(null)

const builtInProviders = {
  stripe: {
    name: 'Stripe',
    icon: 'fa-brands fa-stripe',
    color: '#635bff',
    description: 'Credit card and debit card payments via Stripe',
    docsUrl: 'https://dashboard.stripe.com/apikeys',
    docsLabel: 'Get API Keys →',
    fields: [
      { key: 'public_key', label: 'Publishable Key', type: 'text' },
      { key: 'secret_key', label: 'Secret Key', type: 'password' },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password' },
      { key: 'sandbox', label: 'Test Mode', type: 'toggle' },
    ],
  },
  paypal: {
    name: 'PayPal',
    icon: 'fa-brands fa-paypal',
    color: '#003087',
    description: 'PayPal checkout for buyers worldwide',
    docsUrl: 'https://developer.paypal.com/dashboard/',
    docsLabel: 'Developer Dashboard →',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text' },
      { key: 'client_secret', label: 'Client Secret', type: 'password' },
      { key: 'sandbox', label: 'Sandbox Mode', type: 'toggle' },
    ],
  },
  plisio: {
    name: 'Plisio',
    icon: 'fa-solid fa-coins',
    color: '#4f46e5',
    description: 'Accept cryptocurrency payments via Plisio',
    docsUrl: 'https://plisio.net/account/api',
    docsLabel: 'Get API Key →',
    fields: [
      { key: 'api_key', label: 'Secret Key', type: 'password' },
      { key: 'sandbox', label: 'Test Mode', type: 'toggle' },
    ],
  },
}

const customGateways = computed(() => {
  const result = {}
  for (const [slug, data] of Object.entries(providers.value)) {
    if (data.is_custom) {
      result[slug] = data
    }
  }
  return result
})

function getProviderMeta(key) {
  if (builtInProviders[key]) return builtInProviders[key]
  const data = providers.value[key] || {}
  return {
    name: data.name || key,
    icon: null,
    color: '#6366f1',
    description: 'Custom payment gateway',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password' },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password' },
      { key: 'sandbox', label: 'Sandbox Mode', type: 'toggle' },
    ],
  }
}

async function fetchConfig() {
  loading.value = true
  try {
    const [configRes, provRes] = await Promise.all([getAdminConfig(), getPaymentProviders()])
    const d = configRes.data.data || configRes.data
    if (d.store_enabled !== undefined) storeSettings.value.store_enabled = d.store_enabled === 'true' || d.store_enabled === true
    if (d.currency) storeSettings.value.currency = d.currency
    providers.value = provRes.data.data || {}
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to load config', 'error')
  } finally {
    loading.value = false
  }
}

async function saveStoreSettings() {
  saving.value = true
  try {
    await updateAdminConfig({ config: storeSettings.value })
    toast.show('Store settings saved')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save settings', 'error')
  } finally {
    saving.value = false
  }
}

async function toggleProvider(key) {
  const prev = providers.value[key]?.enabled
  providers.value[key].enabled = !prev
  try {
    await updatePaymentProvider(key, { enabled: !prev })
  } catch {
    providers.value[key].enabled = prev
    toast.show('Failed to toggle provider', 'error')
  }
}

function openConfig(key) {
  configModal.value = key
  modalForm.value = { ...(providers.value[key] || {}) }
}

function closeConfig() {
  configModal.value = null
}

async function saveConfig() {
  modalSaving.value = true
  try {
    const key = configModal.value
    await updatePaymentProvider(key, modalForm.value)
    providers.value[key] = { ...providers.value[key], ...modalForm.value }
    toast.show(`${getProviderMeta(key).name} settings saved`)
    closeConfig()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save', 'error')
  } finally {
    modalSaving.value = false
  }
}

function onFileChange(e) {
  uploadForm.value.file = e.target.files[0] || null
}

async function submitUpload() {
  if (!uploadForm.value.file || !uploadForm.value.slug || !uploadForm.value.name) return
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', uploadForm.value.file)
    fd.append('slug', uploadForm.value.slug)
    fd.append('name', uploadForm.value.name)
    await uploadCustomGateway(fd)
    toast.show('Gateway uploaded successfully')
    uploadModal.value = false
    uploadForm.value = { file: null, slug: '', name: '' }
    await fetchConfig()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Upload failed', 'error')
  } finally {
    uploading.value = false
  }
}

async function confirmDelete(slug) {
  deleteConfirm.value = slug
}

async function doDelete() {
  const slug = deleteConfirm.value
  deleteConfirm.value = null
  try {
    await deleteCustomGateway(slug)
    delete providers.value[slug]
    toast.show('Gateway removed')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to delete', 'error')
  }
}

onMounted(fetchConfig)
</script>

<template>
  <div class="space-y-6">
    <template v-if="loading">
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 animate-pulse space-y-4">
        <div class="h-5 bg-gray-700 rounded w-40"></div>
        <div class="h-10 bg-gray-700 rounded"></div>
        <div class="h-10 bg-gray-700 rounded"></div>
      </div>
    </template>

    <template v-else>
      <!-- Store Settings -->
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-white">Store Settings</h3>
          <button @click="saveStoreSettings" :disabled="saving" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>

        <div class="flex items-center justify-between py-2">
          <div>
            <div class="text-sm font-medium text-gray-300">Store Enabled</div>
            <div class="text-xs text-gray-500 mt-0.5">Toggle the store on or off for all users</div>
          </div>
          <button
            @click="storeSettings.store_enabled = !storeSettings.store_enabled"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            :class="storeSettings.store_enabled ? 'bg-violet-600' : 'bg-gray-600'"
          >
            <span class="inline-block h-4 w-4 rounded-full bg-white transition-transform" :class="storeSettings.store_enabled ? 'translate-x-6' : 'translate-x-1'" />
          </button>
        </div>

        <div class="max-w-xs">
          <label class="block text-sm font-medium text-gray-400 mb-1.5">Currency</label>
          <select v-model="storeSettings.currency" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none">
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      <!-- Built-in Payment Providers -->
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <h3 class="text-base font-semibold text-white">Payment Providers</h3>
          <span class="px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full text-xs font-semibold">
            {{ Object.values(providers).filter(p => p.enabled).length }} active
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="(meta, key) in builtInProviders"
            :key="key"
            class="bg-gray-800 rounded-xl border border-gray-700/50 p-5 flex flex-col gap-4"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :style="{ backgroundColor: meta.color + '15' }"
                >
                  <i :class="meta.icon" class="text-lg" :style="{ color: meta.color }"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-white">{{ meta.name }}</span>
                    <span
                      class="w-2 h-2 rounded-full"
                      :class="providers[key]?.enabled ? 'bg-green-500' : 'bg-gray-600'"
                    ></span>
                  </div>
                  <p class="text-xs text-gray-400 mt-0.5">
                    {{ meta.description }}
                    <a
                      v-if="meta.docsUrl"
                      :href="meta.docsUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="ml-1 text-purple-accent hover:underline"
                    >{{ meta.docsLabel }}</a>
                  </p>
                </div>
              </div>
              <button
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                :class="providers[key]?.enabled ? 'bg-green-500' : 'bg-gray-600'"
                @click="toggleProvider(key)"
              >
                <span
                  class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200"
                  :class="providers[key]?.enabled ? 'translate-x-5' : 'translate-x-0'"
                ></span>
              </button>
            </div>

            <div class="flex items-center">
              <button
                class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium rounded-lg transition-colors"
                @click="openConfig(key)"
              >
                <i class="fa-solid fa-gear mr-1"></i> Configure
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Custom Gateways -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <h3 class="text-base font-semibold text-white">Custom Gateways</h3>
            <span class="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-semibold">
              {{ Object.keys(customGateways).length }} uploaded
            </span>
          </div>
          <button
            @click="uploadModal = true"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <i class="fa-solid fa-upload mr-1.5"></i> Upload Gateway
          </button>
        </div>

        <!-- Gateway SDK info box -->
        <div class="bg-gray-800/50 rounded-xl border border-indigo-500/20 p-4 space-y-2">
          <div class="flex items-center gap-2 text-indigo-400 text-sm font-medium">
            <i class="fa-solid fa-circle-info"></i>
            <span>Gateway SDK</span>
          </div>
          <p class="text-xs text-gray-400">Custom gateways must implement the <code class="text-indigo-300 bg-gray-700/50 px-1 py-0.5 rounded">PaymentGatewayInterface</code>. Download the example gateway to get started.</p>
          <pre class="text-xs text-gray-500 bg-gray-900/50 rounded-lg p-3 overflow-x-auto font-mono leading-relaxed">interface PaymentGatewayInterface {
  getName(): string
  createCheckout(array $params): array  // ["url" => ..., "session_id" => ...]
  verifyPayment(string $sessionId): bool
}</pre>
        </div>

        <!-- Custom gateway list -->
        <div v-if="Object.keys(customGateways).length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="(data, slug) in customGateways"
            :key="slug"
            class="bg-gray-800 rounded-xl border border-gray-700/50 p-5 flex flex-col gap-4"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-indigo-600">
                  {{ (data.name || slug).charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-white">{{ data.name || slug }}</span>
                    <span class="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px] font-semibold uppercase">Custom</span>
                    <span
                      class="w-2 h-2 rounded-full"
                      :class="data.enabled ? 'bg-green-500' : 'bg-gray-600'"
                    ></span>
                  </div>
                  <p class="text-xs text-gray-500 mt-0.5">{{ slug }}</p>
                </div>
              </div>
              <button
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                :class="data.enabled ? 'bg-green-500' : 'bg-gray-600'"
                @click="toggleProvider(slug)"
              >
                <span
                  class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200"
                  :class="data.enabled ? 'translate-x-5' : 'translate-x-0'"
                ></span>
              </button>
            </div>

            <div class="flex items-center gap-2">
              <button
                class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium rounded-lg transition-colors"
                @click="openConfig(slug)"
              >
                <i class="fa-solid fa-gear mr-1"></i> Configure
              </button>
              <button
                class="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg transition-colors"
                @click="confirmDelete(slug)"
              >
                <i class="fa-solid fa-trash mr-1"></i> Delete
              </button>
            </div>
          </div>
        </div>

        <div v-else class="bg-gray-800 rounded-xl border border-gray-700/50 p-8 text-center">
          <i class="fa-solid fa-plug text-2xl text-gray-600 mb-2"></i>
          <p class="text-sm text-gray-500">No custom gateways uploaded yet.</p>
        </div>
      </div>
    </template>

    <!-- Config Modal -->
    <Teleport to="body">
      <div v-if="configModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" @click="closeConfig"></div>
        <div class="relative bg-gray-800 rounded-xl border border-gray-700/50 w-full max-w-lg p-6 space-y-5">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-semibold text-white">{{ getProviderMeta(configModal).name }} Settings</h3>
              <a
                v-if="getProviderMeta(configModal).docsUrl"
                :href="getProviderMeta(configModal).docsUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs text-purple-accent hover:underline"
              >{{ getProviderMeta(configModal).docsLabel }}</a>
            </div>
            <button class="text-gray-400 hover:text-white transition-colors" @click="closeConfig">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="space-y-4">
            <template v-for="field in getProviderMeta(configModal).fields" :key="field.key">
              <div v-if="field.type === 'toggle'" class="flex items-center justify-between py-1">
                <label class="text-sm font-medium text-gray-300">{{ field.label }}</label>
                <button
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  :class="modalForm[field.key] ? 'bg-violet-600' : 'bg-gray-600'"
                  @click="modalForm[field.key] = !modalForm[field.key]"
                >
                  <span class="inline-block h-4 w-4 rounded-full bg-white transition-transform" :class="modalForm[field.key] ? 'translate-x-6' : 'translate-x-1'" />
                </button>
              </div>
              <div v-else>
                <label class="block text-sm font-medium text-gray-400 mb-1.5">{{ field.label }}</label>
                <input
                  v-model="modalForm[field.key]"
                  :type="field.type"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none font-mono"
                />
              </div>
            </template>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors"
              @click="closeConfig"
            >
              Cancel
            </button>
            <button
              @click="saveConfig"
              :disabled="modalSaving"
              class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {{ modalSaving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Upload Modal -->
    <Teleport to="body">
      <div v-if="uploadModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" @click="uploadModal = false"></div>
        <div class="relative bg-gray-800 rounded-xl border border-gray-700/50 w-full max-w-lg p-6 space-y-5">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold text-white">Upload Custom Gateway</h3>
            <button class="text-gray-400 hover:text-white transition-colors" @click="uploadModal = false">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1.5">Gateway File (.php)</label>
              <input
                type="file"
                accept=".php,.txt"
                @change="onFileChange"
                class="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1.5">Slug</label>
              <input
                v-model="uploadForm.slug"
                type="text"
                placeholder="e.g. mypay"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none font-mono"
              />
              <p class="text-xs text-gray-500 mt-1">Lowercase letters, numbers, and underscores only.</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1.5">Display Name</label>
              <input
                v-model="uploadForm.name"
                type="text"
                placeholder="e.g. MyPay Gateway"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors"
              @click="uploadModal = false"
            >
              Cancel
            </button>
            <button
              @click="submitUpload"
              :disabled="uploading || !uploadForm.file || !uploadForm.slug || !uploadForm.name"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {{ uploading ? 'Uploading...' : 'Upload' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="deleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" @click="deleteConfirm = null"></div>
        <div class="relative bg-gray-800 rounded-xl border border-gray-700/50 w-full max-w-sm p-6 space-y-4">
          <h3 class="text-base font-semibold text-white">Delete Gateway</h3>
          <p class="text-sm text-gray-400">Are you sure you want to delete the <strong class="text-white">{{ deleteConfirm }}</strong> gateway? This action cannot be undone.</p>
          <div class="flex justify-end gap-3">
            <button
              class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors"
              @click="deleteConfirm = null"
            >
              Cancel
            </button>
            <button
              @click="doDelete"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
