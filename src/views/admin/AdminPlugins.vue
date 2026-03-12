<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAdminPlugins, installPlugin, togglePlugin, uninstallPlugin } from '../../services/api'
import { useToastStore } from '../../stores/toast'

import AdminAnnouncementsPlugin from './plugins/AdminAnnouncementsPlugin.vue'

// Plugin admin pages — auto-discovered via plugin registry
// Add entries here when a plugin ships its own ACP component
const pluginComponents = {
  'announcements': AdminAnnouncementsPlugin,
}

const toast = useToastStore()
const route = useRoute()
const router = useRouter()

const plugins = ref([])
const loading = ref(true)
const building = ref(false)

// If ?plugin= is in the URL, render that plugin's settings instead
const activeSlug = computed(() => route.query.plugin || null)
const activeComponent = computed(() => activeSlug.value ? pluginComponents[activeSlug.value] ?? null : null)
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
    const { data } = await togglePlugin(slug)
    if (data?.building) {
      building.value = true
      toast.success('Plugin activated. Rebuilding frontend... this may take 30 seconds.')
      setTimeout(() => {
        building.value = false
        window.location.reload()
      }, 35000)
    }
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
    toast.success('Plugin uninstalled.')
  } catch {
    toast.error('Failed to uninstall plugin.')
  }
}

onMounted(fetchPlugins)
</script>

<template>
  <!-- Plugin settings (accessed via sidebar sub-item) -->
  <div v-if="activeSlug" class="space-y-4">
    <div class="flex items-center gap-2 text-sm text-gray-400">
      <span v-if="activePlugin?.enabled" class="flex items-center gap-1.5 text-green-400">
        <span class="w-2 h-2 rounded-full bg-green-400"></span> Active
      </span>
      <span v-else class="flex items-center gap-1.5 text-gray-500">
        <span class="w-2 h-2 rounded-full bg-gray-600"></span> Inactive
      </span>
      <span class="text-gray-600">·</span>
      <span>{{ activePlugin?.description }}</span>
    </div>

    <component v-if="activeComponent" :is="activeComponent" />

    <div v-else class="bg-gray-800 rounded-xl border border-gray-700/50 p-10 text-center">
      <i class="fa-solid fa-gear text-3xl text-gray-600 mb-3 block"></i>
      <p class="text-sm text-gray-400">No settings available for this plugin.</p>
    </div>
  </div>

  <!-- Plugin Manager (default view at /admin/plugins) -->
  <div v-else class="space-y-6">
    <div v-if="building" class="rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400 px-4 py-3 text-sm flex items-center gap-2">
      <i class="fa-solid fa-spinner animate-spin"></i>
      Rebuilding frontend — this takes ~30 seconds. Page will reload automatically.
    </div>

    <div class="flex items-center gap-3">
      <h2 class="text-lg font-semibold text-white">Plugin Manager</h2>
      <span class="px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full text-xs font-semibold">
        {{ installed.length }} installed
      </span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 4" :key="i" class="h-14 bg-gray-800 rounded-xl animate-pulse border border-gray-700/40" />
    </div>

    <template v-else>
      <!-- Installed -->
      <div v-if="installed.length" class="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-700/50 flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <i class="fa-solid fa-puzzle-piece"></i> Installed Plugins
        </div>
        <div class="divide-y divide-gray-700/50">
          <div v-for="p in installed" :key="p.slug" class="flex items-center gap-4 px-5 py-3.5">
            <!-- Status dot -->
            <div class="w-2 h-2 rounded-full shrink-0" :class="p.enabled ? 'bg-green-400' : 'bg-gray-600'" />

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-semibold text-white">{{ p.name }}</span>
                <span class="text-xs text-gray-500">v{{ p.version }}</span>
                <span class="text-xs" :class="p.enabled ? 'text-green-400' : 'text-gray-600'">
                  {{ p.enabled ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-0.5 truncate max-w-md">{{ p.description }}</p>
            </div>

            <!-- Author -->
            <span class="hidden lg:block text-xs text-gray-600 shrink-0">by {{ p.author }}</span>

            <!-- Actions -->
            <div class="flex items-center gap-2 shrink-0">
              <button
                class="px-3 py-1 text-xs font-medium rounded-lg transition-colors"
                :class="p.enabled
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
                  : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'"
                @click="doToggle(p.slug)"
              >
                {{ p.enabled ? 'Deactivate' : 'Activate' }}
              </button>
              <button
                class="px-3 py-1 text-xs font-medium rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                @click="doUninstall(p.slug)"
              >
                Uninstall
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="bg-gray-800 rounded-xl border border-gray-700/50 p-8 text-center">
        <i class="fa-solid fa-puzzle-piece text-2xl text-gray-600 mb-3 block"></i>
        <p class="text-sm text-gray-500">No plugins installed yet.</p>
        <p v-if="available.length" class="text-xs text-gray-600 mt-1">Install one from the list below.</p>
      </div>

      <!-- Available on disk -->
      <div v-if="available.length" class="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-700/50 flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <i class="fa-solid fa-hard-drive"></i> Available to Install
        </div>
        <div class="divide-y divide-gray-700/50">
          <div v-for="p in available" :key="p.slug" class="flex items-center gap-4 px-5 py-3.5">
            <div class="w-2 h-2 rounded-full bg-gray-700 shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-white">{{ p.name }}</span>
                <span class="text-xs text-gray-500">v{{ p.version }}</span>
              </div>
              <p class="text-xs text-gray-500 mt-0.5 truncate max-w-md">{{ p.description }}</p>
            </div>
            <span class="hidden lg:block text-xs text-gray-600 shrink-0">by {{ p.author }}</span>
            <button
              class="px-3 py-1 text-xs font-medium rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 transition-colors shrink-0"
              @click="doInstall(p.slug)"
            >
              <i class="fa-solid fa-download mr-1"></i> Install
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
