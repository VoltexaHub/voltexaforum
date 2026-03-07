<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { updateProfile, uploadAvatar } from '../../services/api'
import UserAvatar from '../UserAvatar.vue'

defineProps({
  isDark: Boolean,
})

const emit = defineEmits(['message', 'error'])

const authStore = useAuthStore()

const saving = ref(false)

// Avatar upload
const avatarFileInput = ref(null)
const avatarPreview = ref(null)
const avatarFile = ref(null)
const avatarUploading = ref(false)

// Profile fields
const avatarColors = [
  'bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-red-500',
  'bg-orange-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
]
const selectedAvatar = ref('')
const userTitle = ref('')
const bio = ref('')
const signature = ref('')
const discordUsername = ref('')
const twitterHandle = ref('')
const website = ref('')

onMounted(() => {
  const user = authStore.user
  if (user) {
    selectedAvatar.value = user.avatar_color || 'bg-purple-500'
    userTitle.value = user.user_title || ''
    bio.value = user.bio || ''
    signature.value = user.signature || ''
    discordUsername.value = user.discord || ''
    twitterHandle.value = user.twitter || ''
    website.value = user.website || ''
  }
})

function handleAvatarSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    emit('error', 'Avatar must be under 2MB.')
    return
  }
  avatarFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => {
    avatarPreview.value = ev.target.result
  }
  reader.readAsDataURL(file)
}

async function handleAvatarUpload() {
  if (!avatarFile.value) return
  avatarUploading.value = true
  try {
    const formData = new FormData()
    formData.append('avatar', avatarFile.value)
    const res = await uploadAvatar(formData)
    const newUrl = res.data.data?.avatar_url || res.data.avatar_url
    if (newUrl) {
      authStore.setAvatarUrl(newUrl)
    }
    avatarPreview.value = null
    avatarFile.value = null
    emit('message', 'Avatar uploaded successfully!')
    await authStore.fetchUser()
  } catch (e) {
    emit('error', e.response?.data?.message || 'Failed to upload avatar.')
  } finally {
    avatarUploading.value = false
  }
}

async function saveProfile() {
  saving.value = true
  try {
    await updateProfile({
      avatar_color: selectedAvatar.value,
      user_title: userTitle.value,
      bio: bio.value,
      signature: signature.value,
      discord: discordUsername.value,
      twitter: twitterHandle.value,
      website: website.value,
    })
    emit('message', 'Profile saved successfully!')
    await authStore.fetchUser()
  } catch (e) {
    emit('error', e.response?.data?.message || 'Failed to save profile.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="text-xl font-bold mb-6">Profile</h2>

    <!-- Avatar Upload -->
    <div class="mb-6">
      <label class="block text-sm font-medium mb-3" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Avatar</label>
      <div class="flex items-center gap-5">
        <button
          type="button"
          @click="avatarFileInput?.click()"
          class="relative group cursor-pointer"
        >
          <img
            v-if="avatarPreview"
            :src="avatarPreview"
            class="w-20 h-20 rounded-full object-cover"
          />
          <img
            v-else-if="authStore.avatarUrl"
            :src="authStore.avatarUrl"
            class="w-20 h-20 rounded-full object-cover"
          />
          <UserAvatar
            v-else
            :name="authStore.username"
            :color="selectedAvatar"
            :online="false"
            size="xl"
          />
          <div class="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <i class="fa-solid fa-camera text-white text-lg"></i>
          </div>
        </button>
        <div>
          <input
            ref="avatarFileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleAvatarSelect"
          />
          <button
            v-if="avatarFile"
            @click="handleAvatarUpload"
            :disabled="avatarUploading"
            class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-purple-accent hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <svg v-if="avatarUploading" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ avatarUploading ? 'Uploading...' : 'Upload' }}
          </button>
          <p v-else class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            Click avatar to change. JPG, PNG, GIF, WebP &mdash; max 5MB<br>
            Recommended: <strong>200&times;200 px</strong>. Auto-resized to 300&times;300 and converted to WebP.
          </p>
        </div>
      </div>
    </div>



    <div class="mb-6">
      <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Avatar Color</label>
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="color in avatarColors"
          :key="color"
          @click="selectedAvatar = color"
          class="w-10 h-10 rounded-full transition-all duration-200"
          :class="[color, selectedAvatar === color ? 'ring-2 ring-purple-accent ring-offset-2 scale-110' : 'hover:scale-105']"
        />
      </div>
    </div>

    <div class="mb-6">
      <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Username</label>
      <input
        type="text"
        :value="authStore.username"
        disabled
        class="w-full px-4 py-2.5 rounded-lg border opacity-50 cursor-not-allowed"
        :class="isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-400'"
      />
      <p class="text-xs mt-1" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Contact staff to change your username</p>
    </div>

    <div class="mb-6">
      <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">User Title</label>
      <input
        type="text"
        v-model="userTitle"
        placeholder="Enter a custom title..."
        class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
        :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
      />
    </div>

    <div class="mb-6">
      <label class="block text-sm font-medium mb-2 flex items-center justify-between" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
        <span>Bio</span>
        <span class="text-xs font-normal" :class="bio.length > 500 ? 'text-red-400' : isDark ? 'text-gray-500' : 'text-gray-400'">{{ bio.length }}/500</span>
      </label>
      <textarea
        v-model="bio"
        maxlength="500"
        rows="4"
        placeholder="Tell others about yourself..."
        class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent resize-none"
        :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
      />
    </div>

    <div class="mb-6">
      <label class="block text-sm font-medium mb-2 flex items-center justify-between" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
        <span>Signature</span>
        <span class="text-xs font-normal" :class="signature.length > 255 ? 'text-red-400' : isDark ? 'text-gray-500' : 'text-gray-400'">{{ signature.length }}/255</span>
      </label>
      <textarea
        v-model="signature"
        maxlength="255"
        rows="2"
        placeholder="Your forum signature..."
        class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent resize-none"
        :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
      />
      <p class="text-xs mt-1" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Basic text only. Displayed at the bottom of your posts.</p>
    </div>

    <div class="mb-6 space-y-4">
      <label class="block text-sm font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Social Links</label>
      <div class="flex items-center gap-3">
        <i class="fa-brands fa-discord w-8 text-center text-lg"></i>
        <input
          type="text"
          v-model="discordUsername"
          placeholder="Discord username"
          class="flex-1 px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
          :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
        />
      </div>
      <div class="flex items-center gap-3">
        <i class="fa-brands fa-x-twitter w-8 text-center text-lg"></i>
        <input
          type="text"
          v-model="twitterHandle"
          placeholder="Twitter/X handle"
          class="flex-1 px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
          :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
        />
      </div>
      <div class="flex items-center gap-3">
        <i class="fa-solid fa-globe w-8 text-center text-lg"></i>
        <input
          type="text"
          v-model="website"
          placeholder="Website URL"
          class="flex-1 px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
          :class="isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
        />
      </div>
    </div>

    <button
      @click="saveProfile"
      :disabled="saving"
      class="px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-accent to-purple-700 hover:from-purple-600 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
    >
      <svg v-if="saving" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {{ saving ? 'Saving...' : 'Save Profile' }}
    </button>
  </div>
</template>
