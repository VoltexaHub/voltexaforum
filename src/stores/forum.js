import { defineStore } from 'pinia'
import { getForumConfig, getForums, getRoles } from '../services/api'

const CACHE_KEY = 'voltexahub_forum_config'
const ROLES_CACHE_KEY = 'voltexahub_roles'

function loadCachedConfig() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    return cached ? JSON.parse(cached) : null
  } catch { return null }
}

function loadCachedRoles() {
  try {
    const cached = localStorage.getItem(ROLES_CACHE_KEY)
    return cached ? JSON.parse(cached) : []
  } catch { return [] }
}

export const useForumStore = defineStore('forum', {
  state: () => ({
    config: loadCachedConfig(),
    roles: loadCachedRoles(),
    categories: [],
    forums: [],
    loading: false,
  }),
  getters: {
    isMultiGame: (state) => state.config?.multi_game === true || state.config?.multi_game === 'true',
    isMaintenanceMode: (state) => state.config?.maintenance_mode === true || state.config?.maintenance_mode === 'true',
    // Look up a role by name — case-insensitive, returns {id, name, label, color, priority, is_staff}
    roleByName: (state) => (name) => state.roles.find(r => r.name.toLowerCase() === (name || '').toLowerCase()) || null,
    roleColor: (state) => (name) => state.roles.find(r => r.name.toLowerCase() === (name || '').toLowerCase())?.color || '#6b7280',
    roleLabel: (state) => (name) => {
      const r = state.roles.find(r => r.name.toLowerCase() === (name || '').toLowerCase())
      return r?.label || (name ? name.charAt(0).toUpperCase() + name.slice(1) : '')
    },
  },
  actions: {
    async fetchConfig() {
      try {
        const res = await getForumConfig()
        this.config = res.data.data
        localStorage.setItem(CACHE_KEY, JSON.stringify(this.config))
      } catch {
        // silently fail — cached value still shown
      }
    },
    async fetchRoles() {
      try {
        const res = await getRoles()
        this.roles = res.data.data || []
        localStorage.setItem(ROLES_CACHE_KEY, JSON.stringify(this.roles))
      } catch {
        // silently fail — cached roles still used
      }
    },
    async fetchForums() {
      if (this.forums.length) return
      this.loading = true
      try {
        const res = await getForums()
        this.forums = res.data.data
      } catch {
        this.forums = []
      } finally {
        this.loading = false
      }
    },
  },
})
