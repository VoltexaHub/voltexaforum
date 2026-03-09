<script setup>
import { ref, onMounted } from 'vue'
import { useToastStore } from '../../../stores/toast'
import { getAdminThemes, uploadTheme, activateTheme, deleteTheme } from '../../../services/api'

const toast = useToastStore()
const themes = ref([])
const loading = ref(true)
const showUploadModal = ref(false)
const uploadFile = ref(null)
const uploading = ref(false)
const uploadError = ref('')

async function fetchThemes() {
  try {
    const res = await getAdminThemes()
    themes.value = res.data.data || res.data
  } catch {
    toast.error('Failed to load themes.')
  } finally {
    loading.value = false
  }
}

async function handleActivate(slug) {
  try {
    await activateTheme(slug)
    toast.success('Theme activated.')
    await fetchThemes()
    if (window.__injectActiveThemeCss) window.__injectActiveThemeCss()
  } catch {
    toast.error('Failed to activate theme.')
  }
}

async function handleDelete(slug) {
  if (!confirm('Delete this theme? This cannot be undone.')) return
  try {
    await deleteTheme(slug)
    toast.success('Theme deleted.')
    await fetchThemes()
  } catch {
    toast.error('Failed to delete theme.')
  }
}

function onFileChange(e) {
  uploadFile.value = e.target.files[0] || null
  uploadError.value = ''
}

async function handleUpload() {
  if (!uploadFile.value) return
  uploading.value = true
  uploadError.value = ''
  try {
    const fd = new FormData()
    fd.append('file', uploadFile.value)
    await uploadTheme(fd)
    toast.success('Theme installed.')
    showUploadModal.value = false
    uploadFile.value = null
    await fetchThemes()
  } catch (e) {
    uploadError.value = e.response?.data?.message || 'Upload failed.'
  } finally {
    uploading.value = false
  }
}

function swatchStyle(theme) {
  const bg = theme.preview?.bg || '#111827'
  const accent = theme.preview?.accent || '#7c3aed'
  return { background: `linear-gradient(135deg, ${bg} 0%, ${accent}33 100%)` }
}

function accentDot(theme) {
  return theme.preview?.accent || '#7c3aed'
}

onMounted(fetchThemes)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-semibold text-white">Themes</h3>
      <button
        class="px-4 py-2 text-sm font-medium rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
        @click="showUploadModal = true"
      >
        <i class="fa-solid fa-upload mr-2"></i>Install Theme
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <i class="fa-solid fa-spinner fa-spin text-gray-500 text-xl"></i>
    </div>

    <!-- Theme grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="theme in themes"
        :key="theme.slug"
        class="bg-gray-800 rounded-xl border-2 p-5 space-y-3"
        :class="theme.active ? 'border-violet-500' : 'border-gray-700/50'"
      >
        <!-- Preview swatch -->
        <div class="h-24 rounded-lg flex items-center justify-center relative overflow-hidden" :style="swatchStyle(theme)">
          <div class="w-4 h-4 rounded-full shadow-lg" :style="{ backgroundColor: accentDot(theme) }"></div>
        </div>

        <div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-gray-200">{{ theme.name }}</span>
            <span v-if="theme.active" class="text-[10px] font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">{{ theme.description }}</p>
          <p class="text-xs text-gray-600 mt-1">
            <span v-if="theme.version">v{{ theme.version }}</span>
            <span v-if="theme.version && theme.author"> · </span>
            <span v-if="theme.author">{{ theme.author }}</span>
          </p>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <button
            v-if="!theme.active"
            class="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
            @click="handleActivate(theme.id)"
          >Activate</button>
          <span v-else class="text-xs text-violet-400 font-medium">Currently active</span>
          <button
            v-if="!theme.built_in"
            class="ml-auto p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            @click="handleDelete(theme.id)"
            title="Delete theme"
          >
            <i class="fa-solid fa-trash text-xs"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Upload modal -->
    <Teleport to="body">
      <div v-if="showUploadModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" @click="showUploadModal = false"></div>
        <div class="relative bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-md p-6 space-y-4">
          <h3 class="text-lg font-semibold text-white">Install Theme</h3>
          <p class="text-sm text-gray-400">Upload a theme package (.zip file).</p>

          <input
            type="file"
            accept=".zip"
            class="block w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-600 file:cursor-pointer"
            @change="onFileChange"
          />

          <p v-if="uploadError" class="text-sm text-red-400">{{ uploadError }}</p>

          <div class="flex justify-end gap-3 pt-2">
            <button
              class="px-4 py-2 text-sm font-medium rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
              @click="showUploadModal = false"
            >Cancel</button>
            <button
              class="px-4 py-2 text-sm font-medium rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
              :disabled="!uploadFile || uploading"
              @click="handleUpload"
            >
              <i v-if="uploading" class="fa-solid fa-spinner fa-spin mr-2"></i>
              {{ uploading ? 'Uploading…' : 'Upload' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
