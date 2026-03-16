<script setup>
import { ref, onMounted } from 'vue'
import { getSecuritySettings, updateSecuritySettings } from '../../../services/api'
import { useToastStore } from '../../../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const saving = ref(false)

const settings = ref({
  admin_reauth_required: true,
  turnstile_site_key: '',
  turnstile_secret_key: '',
})

async function fetchSettings() {
  loading.value = true
  try {
    const res = await getSecuritySettings()
    settings.value.admin_reauth_required = res.data.admin_reauth_required
    settings.value.turnstile_site_key = res.data.turnstile_site_key || ''
    settings.value.turnstile_secret_key = ''
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to load security settings', 'error')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await updateSecuritySettings({
      admin_reauth_required: settings.value.admin_reauth_required,
      turnstile_site_key: settings.value.turnstile_site_key,
      turnstile_secret_key: settings.value.turnstile_secret_key,
    })
    toast.show('Security settings saved')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save settings', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(fetchSettings)
</script>

<template>
  <div class="space-y-6">
    <!-- Loading skeleton -->
    <template v-if="loading">
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 animate-pulse space-y-4">
        <div class="h-5 bg-gray-700 rounded w-48"></div>
        <div class="h-10 bg-gray-700 rounded"></div>
        <div class="h-10 bg-gray-700 rounded"></div>
      </div>
    </template>

    <template v-else>
      <!-- Admin Re-authentication -->
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-white">Admin Re-authentication</h3>
          <button
            @click="save"
            :disabled="saving"
            class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>

        <!-- Toggle -->
        <div class="flex items-center justify-between py-2">
          <div>
            <div class="text-sm font-medium text-gray-300">Require re-authentication for destructive actions</div>
            <div class="text-xs text-gray-500 mt-0.5">When enabled, admins must confirm their password or MFA code before performing irreversible actions.</div>
          </div>
          <button
            @click="settings.admin_reauth_required = !settings.admin_reauth_required"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4"
            :class="settings.admin_reauth_required ? 'bg-violet-600' : 'bg-gray-600'"
          >
            <span class="inline-block h-4 w-4 rounded-full bg-white transition-transform" :class="settings.admin_reauth_required ? 'translate-x-6' : 'translate-x-1'" />
          </button>
        </div>

        <!-- Protected actions list -->
        <div class="border-t border-gray-700/50 pt-4">
          <p class="text-sm font-medium text-gray-400 mb-3">Actions that require re-authentication:</p>
          <ul class="space-y-2 text-sm text-gray-400">
            <li class="flex items-center gap-2">
              <i class="fa-solid fa-user-slash text-red-400/60 w-4 text-center"></i>
              Deleting users
            </li>
            <li class="flex items-center gap-2">
              <i class="fa-solid fa-database text-red-400/60 w-4 text-center"></i>
              Importing / restoring database
            </li>
            <li class="flex items-center gap-2">
              <i class="fa-solid fa-key text-red-400/60 w-4 text-center"></i>
              Resetting user MFA
            </li>
            <li class="flex items-center gap-2">
              <i class="fa-solid fa-comments text-red-400/60 w-4 text-center"></i>
              Deleting forums or categories
            </li>
          </ul>
        </div>
      </div>

      <!-- Turnstile CAPTCHA -->
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-5">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-semibold text-white">Cloudflare Turnstile CAPTCHA</h3>
            <p class="text-xs text-gray-400 mt-1">Protects registration from bots. Get your keys at <a href="https://dash.cloudflare.com/?to=/:account/turnstile" target="_blank" class="text-violet-400 hover:underline">dash.cloudflare.com → Turnstile</a>.</p>
          </div>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1.5">Site Key <span class="text-gray-500 font-normal">(public)</span></label>
            <input
              v-model="settings.turnstile_site_key"
              type="text"
              placeholder="0x4AAAAAAA..."
              class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1.5">Secret Key <span class="text-gray-500 font-normal">(write-only — leave blank to keep current)</span></label>
            <input
              v-model="settings.turnstile_secret_key"
              type="password"
              placeholder="Enter new secret key to update..."
              class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
            <p class="text-xs text-gray-500 mt-1">Leave blank to keep the existing secret key. Once saved, the secret is never shown again.</p>
          </div>
          <p class="text-xs text-gray-500">Leave both fields empty to disable CAPTCHA on registration.</p>
        </div>
      </div>
    </template>
  </div>
</template>
