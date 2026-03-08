<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAdminPlugins, installPlugin, togglePlugin, uninstallPlugin } from '../../services/api'
import { useToastStore } from '../../stores/toast'

import AdminAnnouncementsPlugin from './plugins/AdminAnnouncementsPlugin.vue'
import AdminStatusPagePlugin from './plugins/AdminStatusPagePlugin.vue'
import AdminThreadPollsPlugin from './plugins/AdminThreadPollsPlugin.vue'
import AdminCodePastePlugin from './plugins/AdminCodePastePlugin.vue'
import AdminGithubSponsorsPlugin from './plugins/AdminGithubSponsorsPlugin.vue'
import AdminBugReportsPlugin from './plugins/AdminBugReportsPlugin.vue'

const toast = useToastStore()
const plugins = ref([])
const loading = ref(true)
const selectedTab = ref('manager')
const showUploadModal = ref(false)
const isDragging = ref(false)
const showAvailable = ref(false)

const pluginComponents = {
  'announcements': AdminAnnouncementsPlugin,
  'status-page': AdminStatusPagePlugin,
  'thread-polls': AdminThreadPollsPlugin,
  'code-paste': AdminCodePastePlugin,
  'github-sponsors': AdminGithubSponsorsPlugin,
  'bug-reports': AdminBugReportsPlugin,
}

const pluginIcons = {
  'announcements': 'fa-solid fa-bullhorn',
  'status-page': 'fa-solid fa-heart-pulse',
  'thread-polls': 'fa-solid fa-square-poll-vertical',
  'code-paste': 'fa-solid fa-code',
  'github-sponsors': 'fa-brands fa-github',
  'bug-reports': 'fa-solid fa-bug',
}

const installedPlugins = computed(() => plugins.value.filter(p => p.installed))
const availablePlugins = computed(() => plugins.value.filter(p => !p.installed))
const selectedPlugin = computed(() => plugins.value.find(p => p.slug === selectedTab.value))

function onDragOver(e) { e.preventDefault(); isDragging.value = true }
function onDragLeave() { isDragging.value = false }
function onDrop(e) {
  e.preventDefault(); isDragging.value = false
  const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.zip'))
  if (!files.length) { toast.error('Only .zip files are accepted'); return }
  toast.error('Plugin zip upload is not yet connected to a backend.')
}
function onFileSelect(e) {
  const files = Array.from(e.target.files).filter(f => f.name.endsWith('.zip'))
  if (!files.length) { toast.error('Only .zip files are accepted'); return }
  toast.error('Plugin zip upload is not yet connected to a backend.')
}

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
  if (!confirm('Are you sure you want to uninstall this plugin?')) return
  try {
    await uninstallPlugin(slug)
    const idx = plugins.value.findIndex(p => p.slug === slug)
    if (idx !== -1) plugins.value[idx] = { ...plugins.value[idx], installed: false, enabled: false }
    if (selectedTab.value === slug) selectedTab.value = 'manager'
    toast.success('Plugin uninstalled.')
  } catch {
    toast.error('Failed to uninstall plugin.')
  }
}

function selectPlugin(slug) {
  selectedTab.value = slug
}

onMounted(fetchPlugins)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-semibold text-white">Plugins</h2>
        <span class="px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full text-xs font-semibold">
          {{ installedPlugins.length }} installed
        </span>
      </div>
      <button
        class="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        @click="showUploadModal = true"
      >
        <i class="fa-solid fa-upload mr-1.5"></i> Upload Plugin
      </button>
    </div>

    <!-- Two-column layout -->
    <div class="flex gap-0 bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden min-h-[600px]">
      <!-- Left sidebar -->
      <div class="w-[220px] flex-shrink-0 bg-gray-800 border-r border-gray-700/50 flex flex-col">
        <!-- Plugin Manager tab -->
        <button
          class="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors border-l-2"
          :class="selectedTab === 'manager'
            ? 'bg-violet-600/20 text-violet-300 border-violet-500'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 border-transparent'"
          @click="selectedTab = 'manager'"
        >
          <i class="fa-solid fa-puzzle-piece text-xs"></i>
          Plugin Manager
        </button>

        <div class="border-b border-gray-700/50 mx-3"></div>

        <!-- Loading skeleton -->
        <div v-if="loading" class="p-3 space-y-2">
          <div v-for="i in 3" :key="i" class="h-8 bg-gray-700/50 rounded animate-pulse"></div>
        </div>

        <!-- Installed plugins -->
        <div v-else class="flex-1 overflow-y-auto">
          <button
            v-for="p in installedPlugins"
            :key="p.slug"
            class="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors border-l-2"
            :class="selectedTab === p.slug
              ? 'bg-violet-600/20 text-violet-300 border-violet-500'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 border-transparent'"
            @click="selectPlugin(p.slug)"
          >
            <span
              class="w-2 h-2 rounded-full flex-shrink-0"
              :class="p.enabled ? 'bg-green-400' : 'bg-gray-600'"
            ></span>
            <i :class="pluginIcons[p.slug] || 'fa-solid fa-puzzle-piece'" class="text-xs w-4 text-center"></i>
            <span class="truncate">{{ p.name }}</span>
          </button>

          <!-- Available section -->
          <div v-if="availablePlugins.length" class="border-t border-gray-700/50 mt-1">
            <button
              class="w-full flex items-center justify-between px-4 py-2.5 text-left text-xs font-medium text-gray-500 hover:text-gray-400 transition-colors"
              @click="showAvailable = !showAvailable"
            >
              <span>Available ({{ availablePlugins.length }})</span>
              <i class="fa-solid fa-chevron-down text-[10px] transition-transform" :class="showAvailable ? 'rotate-180' : ''"></i>
            </button>
            <div v-if="showAvailable" class="pb-2">
              <div
                v-for="p in availablePlugins"
                :key="p.slug"
                class="flex items-center justify-between px-4 py-2"
              >
                <span class="text-xs text-gray-500 truncate mr-2">{{ p.name }}</span>
                <button
                  class="px-2 py-1 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-medium rounded transition-colors flex-shrink-0"
                  @click="doInstall(p.slug)"
                >
                  Install
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right panel -->
      <div class="flex-1 p-6 overflow-y-auto bg-gray-900/30">
        <!-- Plugin Manager panel -->
        <template v-if="selectedTab === 'manager'">
          <!-- Loading skeleton -->
          <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="i in 2" :key="i" class="bg-gray-800 rounded-xl border border-gray-700/50 p-5 animate-pulse">
              <div class="h-5 bg-gray-700 rounded w-1/3 mb-3"></div>
              <div class="h-4 bg-gray-700 rounded w-2/3 mb-4"></div>
              <div class="h-8 bg-gray-700 rounded w-1/4"></div>
            </div>
          </div>

          <template v-else>
            <!-- Installed Plugins -->
            <div class="space-y-4">
              <h3 class="text-sm font-semibold text-white flex items-center gap-2">
                <i class="fa-solid fa-puzzle-piece text-gray-400 text-xs"></i>
                Installed Plugins
              </h3>

              <div v-if="!installedPlugins.length" class="bg-gray-800 rounded-xl border border-gray-700/50 p-6">
                <div class="text-center py-6">
                  <div class="text-3xl mb-3 text-gray-600"><i class="fa-solid fa-puzzle-piece"></i></div>
                  <p class="text-sm text-gray-500">No plugins installed yet</p>
                  <p v-if="availablePlugins.length" class="text-xs text-gray-600 mt-1">Install a plugin from the sidebar or available section below</p>
                </div>
              </div>

              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="p in installedPlugins"
                  :key="p.slug"
                  class="bg-gray-800 rounded-xl border border-gray-700/50 p-5 flex flex-col gap-4 cursor-pointer hover:border-gray-600/50 transition-colors"
                  @click="selectPlugin(p.slug)"
                >
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="flex items-center gap-2">
                        <i :class="pluginIcons[p.slug] || 'fa-solid fa-puzzle-piece'" class="text-gray-400 text-sm"></i>
                        <span class="text-sm font-semibold text-white">{{ p.name }}</span>
                        <span class="text-xs text-gray-500">v{{ p.version }}</span>
                      </div>
                      <p class="text-xs text-gray-400 mt-1">{{ p.description }}</p>
                      <p class="text-xs text-gray-500 mt-1">By {{ p.author }}</p>
                    </div>
                    <!-- Enabled toggle pill -->
                    <button
                      class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                      :class="p.enabled ? 'bg-green-500' : 'bg-gray-600'"
                      @click.stop="doToggle(p.slug)"
                    >
                      <span
                        class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200"
                        :class="p.enabled ? 'translate-x-5' : 'translate-x-0'"
                      ></span>
                    </button>
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      class="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg transition-colors"
                      @click.stop="doUninstall(p.slug)"
                    >
                      <i class="fa-solid fa-trash mr-1"></i> Uninstall
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Available on disk -->
            <div v-if="availablePlugins.length" class="mt-6 bg-gray-800 rounded-xl border border-gray-700/50 p-5 space-y-4">
              <h3 class="text-sm font-semibold text-white flex items-center gap-2">
                <i class="fa-solid fa-hard-drive text-gray-400 text-xs"></i>
                Available on Disk
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="p in availablePlugins"
                  :key="p.slug"
                  class="bg-gray-700/40 rounded-lg border border-gray-600/40 p-4 flex flex-col gap-3"
                >
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-semibold text-white">{{ p.name }}</span>
                      <span class="text-xs text-gray-500">v{{ p.version }}</span>
                    </div>
                    <p class="text-xs text-gray-400 mt-1">{{ p.description }}</p>
                    <p class="text-xs text-gray-500 mt-1">By {{ p.author }}</p>
                  </div>
                  <button
                    class="self-start px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg transition-colors"
                    @click="doInstall(p.slug)"
                  >
                    <i class="fa-solid fa-download mr-1"></i> Install
                  </button>
                </div>
              </div>
            </div>
          </template>
        </template>

        <!-- Plugin admin panel -->
        <template v-else-if="selectedPlugin">
          <component
            v-if="pluginComponents[selectedPlugin.slug]"
            :is="pluginComponents[selectedPlugin.slug]"
          />
          <div v-else class="flex flex-col items-center justify-center py-16 text-center">
            <div class="text-3xl mb-3 text-gray-600"><i class="fa-solid fa-gear"></i></div>
            <p class="text-sm text-gray-400">No settings available for this plugin.</p>
          </div>
        </template>

        <!-- Fallback -->
        <div v-else class="flex flex-col items-center justify-center py-16 text-center">
          <div class="text-3xl mb-3 text-gray-600"><i class="fa-solid fa-puzzle-piece"></i></div>
          <p class="text-sm text-gray-400">Select a plugin from the sidebar.</p>
        </div>
      </div>
    </div>

    <!-- Upload Plugin Modal -->
    <Teleport to="body">
      <div v-if="showUploadModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" @click="showUploadModal = false"></div>
        <div class="relative bg-gray-800 rounded-xl border border-gray-700/50 w-full max-w-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold text-white">Upload Plugin</h3>
            <button class="text-gray-400 hover:text-white transition-colors" @click="showUploadModal = false">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div
            class="rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer"
            :class="isDragging ? 'border-violet-500 bg-violet-500/5' : 'border-gray-600 hover:border-gray-500'"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
            @click="$refs.fileInput.click()"
          >
            <input ref="fileInput" type="file" accept=".zip" multiple class="hidden" @change="onFileSelect" />
            <div class="flex flex-col items-center gap-3">
              <div class="w-12 h-12 rounded-full flex items-center justify-center" :class="isDragging ? 'bg-violet-500/20' : 'bg-gray-700/50'">
                <i class="fa-solid fa-cloud-arrow-up text-2xl" :class="isDragging ? 'text-violet-400' : 'text-gray-500'"></i>
              </div>
              <div>
                <p class="text-sm font-medium" :class="isDragging ? 'text-violet-300' : 'text-gray-300'">
                  {{ isDragging ? 'Drop plugin here' : 'Drag & drop a .zip plugin file' }}
                </p>
                <p class="text-xs text-gray-500 mt-1">or click to browse</p>
              </div>
            </div>
          </div>
          <p class="text-xs text-gray-500 text-center">Plugin must be a <code class="text-gray-400">.zip</code> containing a valid <code class="text-gray-400">plugin.json</code>. Backend upload coming soon.</p>
        </div>
      </div>
    </Teleport>
  </div>
</template>
