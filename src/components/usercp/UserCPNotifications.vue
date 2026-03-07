<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { updateNotificationSettings } from '../../services/api'

defineProps({
  isDark: Boolean,
})

const emit = defineEmits(['message', 'error'])

const authStore = useAuthStore()

const saving = ref(false)
const notificationSettings = ref([])

onMounted(() => {
  const user = authStore.user
  if (user) {
    notificationSettings.value = user.notification_settings || [
      { id: 'thread-replies', label: 'Thread replies', description: 'Notify when someone replies to your thread', enabled: true },
      { id: 'mentions', label: 'Mentions', description: 'Notify when someone @mentions you', enabled: true },
      { id: 'dms', label: 'Direct Messages', description: 'Notify when you receive a DM', enabled: true },
      { id: 'achievements', label: 'Achievement unlocked', description: 'Notify when you earn an achievement', enabled: true },
      { id: 'awards', label: 'Award received', description: 'Notify when staff grant you an award', enabled: true },
      { id: 'store', label: 'Store purchase confirmed', description: 'Notify on successful purchase', enabled: true },
      { id: 'credits', label: 'Credits earned', description: 'Notify when you earn credits', enabled: true },
    ]
  }
})

async function saveNotifications() {
  saving.value = true
  try {
    const settings = {}
    for (const s of notificationSettings.value) {
      settings[s.id] = s.enabled
    }
    await updateNotificationSettings(settings)
    emit('message', 'Notification settings saved!')
  } catch (e) {
    emit('error', e.response?.data?.message || 'Failed to save notification settings.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="text-xl font-bold mb-6">Notifications</h2>

    <div class="space-y-1">
      <div
        v-for="setting in notificationSettings"
        :key="setting.id"
        class="flex items-center justify-between p-4 rounded-lg transition-colors"
        :class="isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'"
      >
        <div class="flex-1 mr-4">
          <p class="font-medium text-sm">{{ setting.label }}</p>
          <p class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">{{ setting.description }}</p>
        </div>
        <button
          @click="setting.enabled = !setting.enabled"
          class="relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0"
          :class="setting.enabled ? 'bg-purple-accent' : isDark ? 'bg-gray-600' : 'bg-gray-300'"
        >
          <span
            class="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
            :class="setting.enabled ? 'translate-x-6' : 'translate-x-0'"
          />
        </button>
      </div>
    </div>

    <button
      @click="saveNotifications"
      :disabled="saving"
      class="mt-6 px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-accent to-purple-700 hover:from-purple-600 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
    >
      <svg v-if="saving" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {{ saving ? 'Saving...' : 'Save Notification Settings' }}
    </button>
  </div>
</template>
