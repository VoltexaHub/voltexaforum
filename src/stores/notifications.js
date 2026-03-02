import { defineStore } from 'pinia'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../services/api'

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchNotifications() {
      this.loading = true
      this.error = null
      try {
        const res = await getNotifications()
        this.notifications = res.data.data || []
        this.unreadCount = this.notifications.filter(n => !n.read_at).length
      } catch (e) {
        this.error = e.response?.data?.message || 'Failed to load notifications'
      } finally {
        this.loading = false
      }
    },
    async markRead(id) {
      try {
        await markNotificationRead(id)
        const n = this.notifications.find(n => n.id === id)
        if (n && !n.read_at) {
          n.read_at = new Date().toISOString()
          this.unreadCount = Math.max(0, this.unreadCount - 1)
        }
      } catch {
        // silent
      }
    },
    async markAllRead() {
      try {
        await markAllNotificationsRead()
        this.notifications.forEach(n => {
          if (!n.read_at) n.read_at = new Date().toISOString()
        })
        this.unreadCount = 0
      } catch {
        // silent
      }
    },
    async remove(id) {
      try {
        await deleteNotification(id)
        const was = this.notifications.find(n => n.id === id)
        this.notifications = this.notifications.filter(n => n.id !== id)
        if (was && !was.read_at) {
          this.unreadCount = Math.max(0, this.unreadCount - 1)
        }
      } catch {
        // silent
      }
    },
    pushNew(notification) {
      this.notifications.unshift(notification)
      if (!notification.read_at) {
        this.unreadCount++
      }
    },
  },
})
