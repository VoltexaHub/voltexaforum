<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAdminGithubSponsors, grantSponsor, revokeSponsor } from '../../../services/api'
import { useToastStore } from '../../../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const data = ref(null)
const searchQuery = ref('')

const sponsors = computed(() => data.value?.sponsors || [])
const webhookConfigured = computed(() => data.value?.webhook_configured || false)
const totalSponsors = computed(() => sponsors.value.length)
const activeSponsors = computed(() => sponsors.value.filter(s => s.active).length)

async function fetchSponsors() {
  loading.value = true
  try {
    const res = await getAdminGithubSponsors()
    data.value = res.data.data || res.data
  } catch {
    toast.error('Failed to load GitHub Sponsors data.')
  } finally {
    loading.value = false
  }
}

async function doGrant(userId) {
  try {
    await grantSponsor(userId)
    toast.success('Sponsor status granted.')
    await fetchSponsors()
  } catch {
    toast.error('Failed to grant sponsor status.')
  }
}

async function doRevoke(userId) {
  if (!confirm('Revoke sponsor status from this user?')) return
  try {
    await revokeSponsor(userId)
    toast.success('Sponsor status revoked.')
    await fetchSponsors()
  } catch {
    toast.error('Failed to revoke sponsor status.')
  }
}

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(fetchSponsors)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <router-link to="/admin/plugins" class="text-gray-400 hover:text-white transition-colors">
        <i class="fa-solid fa-arrow-left text-sm"></i>
      </router-link>
      <h2 class="text-lg font-semibold text-white">GitHub Sponsors</h2>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-gray-800 rounded-xl border border-gray-700/50 p-5 animate-pulse">
      <div class="h-5 bg-gray-700 rounded w-1/3 mb-3"></div>
      <div class="h-4 bg-gray-700 rounded w-full mb-2"></div>
      <div class="h-4 bg-gray-700 rounded w-2/3"></div>
    </div>

    <template v-else>
      <!-- Webhook Status -->
      <div
        class="rounded-xl border p-5 space-y-2"
        :class="webhookConfigured
          ? 'bg-green-500/5 border-green-500/20'
          : 'bg-amber-500/5 border-amber-500/20'"
      >
        <div class="flex items-center gap-2">
          <i
            class="fa-solid text-sm"
            :class="webhookConfigured
              ? 'fa-circle-check text-green-400'
              : 'fa-triangle-exclamation text-amber-400'"
          ></i>
          <h3 class="text-sm font-semibold" :class="webhookConfigured ? 'text-green-400' : 'text-amber-400'">
            {{ webhookConfigured ? 'Webhook Configured' : 'Webhook Not Configured' }}
          </h3>
        </div>
        <p class="text-xs text-gray-400">
          {{ webhookConfigured
            ? 'GitHub Sponsors webhook is active and receiving events.'
            : 'Set GITHUB_SPONSORS_WEBHOOK_SECRET in your environment to enable automatic sponsor syncing.' }}
        </p>
        <div class="mt-2">
          <label class="block text-xs font-medium text-gray-400 mb-1">Webhook URL</label>
          <div class="flex items-center gap-2">
            <code class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono">
              https://community.voltexahub.com/api/webhooks/github-sponsors
            </code>
          </div>
        </div>
      </div>

      <!-- GitHub Approval Note -->
      <div class="bg-blue-500/10 rounded-xl border border-blue-500/20 p-4 flex items-start gap-3">
        <i class="fa-solid fa-circle-info text-blue-400 mt-0.5"></i>
        <p class="text-sm text-blue-300">
          Waiting for GitHub Sponsors approval? Once approved, set up the webhook in your GitHub repository settings
          under <span class="font-medium">Settings &rarr; Webhooks</span>.
        </p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-5">
          <p class="text-xs text-gray-400 mb-1">Total Sponsors</p>
          <p class="text-2xl font-bold text-white">{{ totalSponsors }}</p>
        </div>
        <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-5">
          <p class="text-xs text-gray-400 mb-1">Active Sponsors</p>
          <p class="text-2xl font-bold text-green-400">{{ activeSponsors }}</p>
        </div>
      </div>

      <!-- Manual Grant/Revoke -->
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-5 space-y-3">
        <h3 class="text-sm font-semibold text-white flex items-center gap-2">
          <i class="fa-solid fa-user-plus text-gray-400 text-xs"></i>
          Manual Grant / Revoke
        </h3>
        <div>
          <input
            v-model="searchQuery"
            type="text"
            class="w-full md:w-80 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
            placeholder="Search sponsors by username or GitHub login..."
          />
        </div>
      </div>

      <!-- Sponsors List -->
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-700/50">
          <h3 class="text-sm font-semibold text-white flex items-center gap-2">
            <i class="fa-brands fa-github text-gray-400 text-xs"></i>
            Sponsors
            <span class="px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full text-xs font-semibold">
              {{ totalSponsors }}
            </span>
          </h3>
        </div>

        <div v-if="!sponsors.length" class="p-6 text-center">
          <div class="text-3xl mb-3 text-gray-600"><i class="fa-brands fa-github"></i></div>
          <p class="text-sm text-gray-400">No sponsors found</p>
          <p class="text-xs text-gray-500 mt-1">Sponsors will appear here once the webhook receives events or you manually grant status.</p>
        </div>

        <table v-else class="w-full">
          <thead>
            <tr class="border-b border-gray-700/50">
              <th class="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">GitHub Login</th>
              <th class="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Forum User</th>
              <th class="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Tier</th>
              <th class="text-center px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th class="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Sponsored At</th>
              <th class="text-right px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700/50">
            <tr
              v-for="s in sponsors.filter(sp =>
                !searchQuery ||
                sp.github_login?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sp.forum_username?.toLowerCase().includes(searchQuery.toLowerCase())
              )"
              :key="s.id || s.github_login"
              class="hover:bg-gray-700/30 transition-colors"
            >
              <td class="px-5 py-3 text-sm text-gray-300 font-mono">{{ s.github_login || '—' }}</td>
              <td class="px-5 py-3 text-sm text-gray-300">{{ s.forum_username || '—' }}</td>
              <td class="px-5 py-3 text-sm text-gray-400">{{ s.tier || '—' }}</td>
              <td class="px-5 py-3 text-center">
                <span
                  class="px-2 py-0.5 text-xs font-medium rounded border"
                  :class="s.active
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'"
                >
                  {{ s.active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-5 py-3 text-sm text-gray-400">{{ formatDate(s.sponsored_at) }}</td>
              <td class="px-5 py-3 text-right">
                <button
                  v-if="s.active && s.user_id"
                  class="px-2.5 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                  @click="doRevoke(s.user_id)"
                >
                  <i class="fa-solid fa-ban mr-1"></i> Revoke
                </button>
                <button
                  v-else-if="!s.active && s.user_id"
                  class="px-2.5 py-1 text-xs text-green-400 hover:text-green-300 transition-colors"
                  @click="doGrant(s.user_id)"
                >
                  <i class="fa-solid fa-check mr-1"></i> Grant
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
