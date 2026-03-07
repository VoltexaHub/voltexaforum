<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { uploadCover, updateCoverOverlay, removeCover } from '../../services/api'

defineProps({
  isDark: Boolean,
})

const emit = defineEmits(['message', 'error'])

const authStore = useAuthStore()

const coverFileInput = ref(null)
const coverPreview = ref(null)
const coverFile = ref(null)
const coverUploading = ref(false)
const coverRemoving = ref(false)
const coverOverlayOpacity = ref(authStore.user?.cover_overlay_opacity ?? 20)
const coverOverlaySaving = ref(false)

function handleCoverSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    emit('error', 'Cover photo must be under 5MB.')
    return
  }
  coverFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => { coverPreview.value = ev.target.result }
  reader.readAsDataURL(file)
}

async function handleCoverUpload() {
  if (!coverFile.value) return
  coverUploading.value = true
  try {
    const formData = new FormData()
    formData.append('image', coverFile.value)
    const res = await uploadCover(formData)
    authStore.user.cover_url = res.data.cover_url
    coverPreview.value = null
    coverFile.value = null
    emit('message', 'Cover photo uploaded!')
  } catch (e) {
    emit('error', e.response?.data?.message || 'Failed to upload cover photo.')
  } finally {
    coverUploading.value = false
  }
}

async function handleCoverRemove() {
  coverRemoving.value = true
  try {
    await removeCover()
    authStore.user.cover_url = null
    coverPreview.value = null
    coverFile.value = null
    emit('message', 'Cover photo removed.')
  } catch (e) {
    emit('error', e.response?.data?.message || 'Failed to remove cover photo.')
  } finally {
    coverRemoving.value = false
  }
}

async function handleOverlaySave() {
  coverOverlaySaving.value = true
  try {
    await updateCoverOverlay(coverOverlayOpacity.value)
    if (authStore.user) authStore.user.cover_overlay_opacity = coverOverlayOpacity.value
    emit('message', 'Overlay opacity saved.')
  } catch (e) {
    emit('error', e.response?.data?.message || 'Failed to save overlay.')
  } finally {
    coverOverlaySaving.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="text-xl font-bold mb-6">Profile Cover</h2>

    <div class="mb-6">
      <div
        class="w-full h-48 rounded-lg overflow-hidden border flex items-center justify-center mb-4"
        :class="isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'"
      >
        <img
          v-if="coverPreview"
          :src="coverPreview"
          class="w-full h-full object-cover"
        />
        <img
          v-else-if="authStore.user?.cover_url"
          :src="authStore.user.cover_url"
          class="w-full h-full object-cover"
        />
        <i v-else class="fa-solid fa-image text-4xl" :class="isDark ? 'text-gray-600' : 'text-gray-400'"></i>
      </div>

      <div class="flex items-center gap-3">
        <input
          ref="coverFileInput"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          class="hidden"
          @change="handleCoverSelect"
        />
        <button
          v-if="coverFile"
          @click="handleCoverUpload"
          :disabled="coverUploading"
          class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-purple-accent hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <svg v-if="coverUploading" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ coverUploading ? 'Uploading...' : 'Upload' }}
        </button>
        <template v-else>
          <button
            @click="coverFileInput?.click()"
            class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
            :class="isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
          >
            <i class="fa-solid fa-upload mr-1.5"></i> Choose Image
          </button>
          <button
            v-if="authStore.user?.cover_url"
            @click="handleCoverRemove"
            :disabled="coverRemoving"
            class="px-4 py-2 rounded-lg text-sm font-medium text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors disabled:opacity-50"
          >
            {{ coverRemoving ? 'Removing...' : 'Remove' }}
          </button>
        </template>
      </div>
      <p class="text-xs mt-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
        JPG, PNG, GIF, WebP &mdash; max 5MB<br>
        Recommended: <strong>1500&times;500 px</strong>. Auto-resized and converted to WebP.
      </p>
    </div>

    <!-- Overlay opacity -->
    <div class="mt-6 pt-6 border-t" :class="isDark ? 'border-gray-700' : 'border-gray-200'">
      <label class="block text-sm font-medium mb-1" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
        Cover Overlay Opacity
      </label>
      <p class="text-xs mb-3" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
        A dark tint over your cover photo. 0 = none, 80 = darkest.
      </p>
      <div class="flex items-center gap-4">
        <input
          type="range"
          min="0" max="80" step="5"
          v-model.number="coverOverlayOpacity"
          class="flex-1 accent-purple-600"
        />
        <span class="text-sm font-mono w-10 text-center" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ coverOverlayOpacity }}%</span>
        <button
          @click="handleOverlaySave"
          :disabled="coverOverlaySaving"
          class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-purple-accent hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {{ coverOverlaySaving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>
  </div>
</template>
