import { defineStore } from 'pinia'
import { getForumConfig, getGames, getForums } from '../services/api'

export const useForumStore = defineStore('forum', {
  state: () => ({
    config: null,
    games: [],
    categories: [],
    forums: [],
    loading: false,
  }),
  getters: {
    isMultiGame: (state) => state.config?.multi_game || false,
  },
  actions: {
    async fetchConfig() {
      if (this.config) return
      try {
        const res = await getForumConfig()
        this.config = res.data.data
      } catch {
        // silently fail, will retry on next call
        this.config = null
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
