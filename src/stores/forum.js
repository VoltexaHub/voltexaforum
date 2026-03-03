import { defineStore } from 'pinia'
import { getForumConfig, getGames, getForums } from '../services/api'

const CACHE_KEY = 'voltexahub_forum_config'

function loadCachedConfig() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    return cached ? JSON.parse(cached) : null
  } catch { return null }
}

export const useForumStore = defineStore('forum', {
  state: () => ({
    config: loadCachedConfig(), // load from cache instantly — no flash
    games: [],
    categories: [],
    forums: [],
    loading: false,
  }),
  getters: {
    isMultiGame: (state) => state.config?.multi_game === true || state.config?.multi_game === 'true',
    isMaintenanceMode: (state) => state.config?.maintenance_mode === true || state.config?.maintenance_mode === 'true',
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
    async fetchGames() {
      if (this.games.length) return
      try {
        const res = await getGames()
        this.games = res.data.data
      } catch {
        this.games = []
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
