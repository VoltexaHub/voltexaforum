<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { inject } from 'vue'
import { getAdminPlugins, installPlugin, togglePlugin, uninstallPlugin } from '../../services/api'
import { useToastStore } from '../../stores/toast'

import AdminAnnouncementsPlugin from './plugins/AdminAnnouncementsPlugin.vue'
import AdminStatusPagePlugin from './plugins/AdminStatusPagePlugin.vue'
import AdminThreadPollsPlugin from './plugins/AdminThreadPollsPlugin.vue'
import AdminCodePastePlugin from './plugins/AdminCodePastePlugin.vue'
import AdminGithubSponsorsPlugin from './plugins/AdminGithubSponsorsPlugin.vue'
import AdminBugReportsPlugin from './plugins/AdminBugReportsPlugin.vue'

const pluginComponents = {
  'announcements':   AdminAnnouncementsPlugin,
  'status-page':     AdminStatusPagePlugin,
  'thread-polls':    AdminThreadPollsPlugin,
  'code-paste':      AdminCodePastePlugin,
  'github-sponsors': AdminGithubSponsorsPlugin,
  'bug-reports':     AdminBugReportsPlugin,
}

const toast = useToastStore()
const route = useRoute()
const router = useRouter()
const isDark = inject('isDark', ref(true))

const plugins = ref([])
const loading = ref(true)

const activeSlug = computed(() => route.query.plugin || null)
const activeComponent = computed(() => activeSlug.value ? pluginComponents[activeSlug.value] : null)
const activePlugin = computed(() => plugins.value.find(p => p.slug === activeSlug.value))

const installed = computed(() => plugins.value.filter(p => p.installed))
const available = computed(() => plugins.value.filter(p => !p.installed))

async function fetchPlugins() {
  loading.value = true
  try {
    const { data } = await getAdminPlugins()
    plugins.value = data.data || []
  } catch {
    toast.error('Failed to load plugins.')
  } finally {
    loading.value = false
  }
}

async function doInstall(slug) {
  try {
    const { data } = await installPlugin(slug)
    const idx = plugins.value.findIndex(p => p.slug === slug)
    if (idx !== -1) plugins.value[idx] = { ...plugins.value[idx], ...data.data, installed: true }
    toast.success('Plugin installed.')
  } catch {
    toast.error('Failed to install plugin.')
  }
}

async function doToggle(slug) {
  const plugin = plugins.value.find(p => p.slug === slug)
  if (!plugin) return
  const prev = plugin.enabled
  plugin.enabled = !prev
  try {
    await togglePlugin(slug)
  } catch {
    plugin.enabled = prev
    toast.error('Failed to toggle plugin.')
  }
}

async function doUninstall(slug) {
  if (!confirm('Uninstall this plugin? This cannot be undone.')) return
  try {
    await uninstallPlugin(slug)
    const idx = plugins.value.findIndex(p => p.slug === slug)
    if (idx !== -1) plugins.value[idx] = { ...plugins.value[idx], installed: false, enabled: false }
    if (activeSlug.value === slug) router.replace('/admin/plugins')
    toast.success('Plugin uninstalled.')
  } catch {
    toast.error('Failed to uninstall plugin.')
  }
}

onMounted(fetchPlugins)
</script>

<template>
  <div class="space-y-6">

    <!-- Plugin settings panel (when a plugin is selected via sidebar) -->
    <template v-if="activeSlug">
      <div class="flex items-center gap-3 mb-2">
        <button @click="router.push('/admin/plugins')" class="text-gray-400 hover:text-white transition-colors">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <h2 class="text-lg font-semibold text-white">{{ activePlugin?.name || activeSlug }}</h2>
        <span v-if="activePlugin?.enabled" class="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/15 text-green-400">Active</span>
        <span v-else class="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">Inactive</span>
      </div>

      <div v-if="activeComponent">
        <component :is="activeComponent" />
      </div>
      <div v-else class="bg-gray-800 rounded-xl border border-gray-700/50 p-10 text-center">
        <i class="fa-solid fa-gear text-3xl text-gray-600 mb-3 block"></i>
        <p class="text-gray-400 text-sm">No settings available for this plugin.</p>
      </div>
    </template>

    <!-- Plugin Manager list -->
    <template v-else>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-white">Plugin Manager</h2>
          <span class="px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full text-xs font-semibold">
            {{ installed.length }} installed
          </span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="space-y-2">
        <div v-for="i in 3" :key="i" class="h-16 bg-gray-800 rounded-xl animate-pulse border border-gray-700/40" />
      </div>

      <template v-else>
        <!-- Installed plugins -->
        <div v-if="installed.length" class="bg-gray-800 rounded-xl border border-gray-700/50 divide-y divide-gray-700/50">
          <div
            v-for="p in installed"
            :key="p.slug"
            class="flex items-center gap-4 px-5 py-4"
          >
            <!-- Status dot -->
            <div class="shrink-0 w-2.5 h-2.5 rounded-full" :class="p.enabled ? 'bg-green-400' : 'bg-gray-600'" />

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-semibold text-white">{{ p.name }}</span>
                <span class="text-xs text-gray-500">v{{ p.version }}</span>
                <span
                  class="text-xs px-1.5 py-0.5 rounded font-medium"
                  :class="p.enabled ? 'bg-green-500/10 text-green-400' : 'bg-gray-700 text-gray-500'"
                >
                  {{ p.enabled ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <p class="text-xs text-gray-400 mt-0.5 truncate">{{ p.description }}</p>
            </div>

            <!-- Author -->
            <span class="hidden md:block text-xs text-gray-500 shrink-0">{{ p.author }}</span>

            <!-- Actions -->
            <div class="flex items-center gap-2 shrink-0">
              <button
                class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                :class="p.enabled
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
                  : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'"
                @click="doToggle(p.slug)"
              >
                {{ p.enabled ? 'Deactivate' : 'Activate' }}
              </button>
              <button
                class="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                @click="doUninstall(p.slug)"
              >
                Uninstall
              </button>
            </div>
          </div>
        </div>

        <div v-else class="bg-gray-800 rounded-xl border border-gray-700/50 p-8 text-center">
          <i class="fa-solid fa-puzzle-piece text-3xl text-gray-600 mb-3 block"></i>
          <p class="text-sm text-gray-500">No plugins installed yet.</p>
        </div>

        <!-- Available on disk -->
        <div v-if="available.length">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Available to Install</h3>
          <div class="bg-gray-800 rounded-xl border border-gray-700/50 divide-y divide-gray-700/50">
            <div
              v-for="p in available"
              :key="p.slug"
              class="flex items-center gap-4 px-5 py-4"
            >
              <div class="shrink-0 w-2.5 h-2.5 rounded-full bg-gray-700" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold text-white">{{ p.name }}</span>
                  <span class="text-xs text-gray-500">v{{ p.version }}</span>
                </div>
                <p class="text-xs text-gray-400 mt-0.5 truncate">{{ p.description }}</p>
              </div>
              <span class="hidden md:block text-xs text-gray-500 shrink-0">{{ p.author }}</span>
              <button
                class="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 transition-colors shrink-0"
                @click="doInstall(p.slug)"
              >
                <i class="fa-solid fa-download mr-1"></i> Install
              </button>
            </div>
          </div>
        </div>
      </template>
    </template>

  </div>
</template>
