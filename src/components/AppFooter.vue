<script setup>
import { inject, ref, computed } from 'vue'
import { useForumStore } from '../stores/forum'
import AdSlot from './AdSlot.vue'

const isDark = inject('isDark', ref(true))
const forumStore = useForumStore()
const forumName = computed(() => forumStore.config?.forum_name || 'My Forum')
const config = computed(() => forumStore.config || {})
const year = new Date().getFullYear()
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
    <AdSlot position="footer" />
  </div>
  <footer
    class="border-t transition-colors duration-300"
    :class="isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">

        <!-- Brand -->
        <div class="col-span-2 sm:col-span-1">
          <router-link to="/" class="flex items-center gap-2 mb-3 font-bold text-sm" :class="isDark ? 'text-white' : 'text-gray-900'">
            <img v-if="config.logo_type === 'image' && config.logo_image" :src="config.logo_image" alt="Logo" class="h-6 w-auto object-contain" />
            <template v-else>
              <i v-if="config.logo_type !== 'text_only'" :class="config.logo_icon || 'fa-solid fa-bolt'" :style="{ color: config.logo_icon_color || '#7c3aed' }"></i>
              <span v-if="config.logo_type !== 'icon_only'">{{ forumName }}</span>
            </template>
          </router-link>
          <p class="text-xs leading-relaxed" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
            A community built for gamers and creators. Join the conversation.
          </p>
        </div>

        <!-- Community -->
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider mb-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Community</h4>
          <ul class="space-y-2">
            <li><router-link to="/" class="text-sm transition-colors hover:text-purple-accent flex items-center gap-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'"><i class="fa-solid fa-comments w-3.5 text-center text-xs"></i>Forums</router-link></li>
            <li><router-link to="/members" class="text-sm transition-colors hover:text-purple-accent flex items-center gap-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'"><i class="fa-solid fa-users w-3.5 text-center text-xs"></i>Members</router-link></li>
            <li><router-link to="/leaderboard" class="text-sm transition-colors hover:text-purple-accent flex items-center gap-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'"><i class="fa-solid fa-trophy w-3.5 text-center text-xs"></i>Leaderboard</router-link></li>
            <li><router-link to="/staff" class="text-sm transition-colors hover:text-purple-accent flex items-center gap-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'"><i class="fa-solid fa-shield-halved w-3.5 text-center text-xs"></i>Staff</router-link></li>
            <li><router-link to="/achievements" class="text-sm transition-colors hover:text-purple-accent flex items-center gap-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'"><i class="fa-solid fa-medal w-3.5 text-center text-xs"></i>Achievements</router-link></li>
          </ul>
        </div>

        <!-- Account -->
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider mb-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Account</h4>
          <ul class="space-y-2">
            <li><router-link to="/usercp" class="text-sm transition-colors hover:text-purple-accent flex items-center gap-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'"><i class="fa-solid fa-gear w-3.5 text-center text-xs"></i>Settings</router-link></li>
            <li><router-link to="/credits" class="text-sm transition-colors hover:text-purple-accent flex items-center gap-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'"><i class="fa-solid fa-coins w-3.5 text-center text-xs"></i>Credits</router-link></li>
            <li><router-link to="/store" class="text-sm transition-colors hover:text-purple-accent flex items-center gap-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'"><i class="fa-solid fa-bag-shopping w-3.5 text-center text-xs"></i>Store</router-link></li>
            <li><router-link to="/messages" class="text-sm transition-colors hover:text-purple-accent flex items-center gap-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'"><i class="fa-solid fa-envelope w-3.5 text-center text-xs"></i>Messages</router-link></li>
          </ul>
        </div>

        <!-- Support -->
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider mb-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Support</h4>
          <ul class="space-y-2">
            <li><router-link to="/search" class="text-sm transition-colors hover:text-purple-accent flex items-center gap-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'"><i class="fa-solid fa-magnifying-glass w-3.5 text-center text-xs"></i>Search</router-link></li>
            <li><router-link to="/help" class="text-sm transition-colors hover:text-purple-accent flex items-center gap-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'"><i class="fa-solid fa-circle-question w-3.5 text-center text-xs"></i>Help Center</router-link></li>
            <li><router-link to="/rules" class="text-sm transition-colors hover:text-purple-accent flex items-center gap-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'"><i class="fa-solid fa-scale-balanced w-3.5 text-center text-xs"></i>Rules</router-link></li>
            <li><router-link to="/privacy" class="text-sm transition-colors hover:text-purple-accent flex items-center gap-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'"><i class="fa-solid fa-lock w-3.5 text-center text-xs"></i>Privacy Policy</router-link></li>
            <li><router-link to="/terms" class="text-sm transition-colors hover:text-purple-accent flex items-center gap-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'"><i class="fa-solid fa-file-lines w-3.5 text-center text-xs"></i>Terms of Service</router-link></li>
          </ul>
        </div>

      </div>

      <!-- Bottom bar -->
      <div
        class="flex items-center justify-between flex-wrap gap-3 pt-6 border-t text-xs"
        :class="isDark ? 'border-gray-800 text-gray-600' : 'border-gray-200 text-gray-400'"
      >
        <span>&copy; {{ year }} {{ forumName }}. All rights reserved.</span>
        <span class="flex items-center gap-1">
          Powered by
          <span class="font-semibold text-purple-accent ml-1">VoltexaHub</span>
        </span>
      </div>
    </div>
  </footer>
</template>
