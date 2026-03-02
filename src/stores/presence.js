import { defineStore } from 'pinia'
import { getOnlineUsers } from '../services/api'

export const usePresenceStore = defineStore('presence', {
  state: () => ({
    onlineUsers: [],
  }),

  actions: {
    setOnlineUsers(users) {
      this.onlineUsers = users
    },

    addUser(user) {
      if (!this.onlineUsers.find(u => u.id === user.id)) {
        this.onlineUsers.push(user)
      }
    },

    removeUser(user) {
      this.onlineUsers = this.onlineUsers.filter(u => u.id !== user.id)
    },

    async fetchOnlineUsers() {
      try {
        const res = await getOnlineUsers()
        this.onlineUsers = res.data.data || res.data || []
      } catch {
        // Silently fail — online users is non-critical
      }
    },
  },
})
