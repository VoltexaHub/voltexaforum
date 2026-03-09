<script setup>
import { ref, inject, computed, onMounted } from 'vue'
import { useForumStore } from '../stores/forum'
import { usePresenceStore } from '../stores/presence'
import { getForums as fetchForumsApi } from '../services/api'
import UserAvatar from '../components/UserAvatar.vue'
import UsergroupLegend from '../components/UsergroupLegend.vue'
import { formatRelative } from '../utils/date'

const isDark = inject('isDark')
const forumStore = useForumStore()
const presenceStore = usePresenceStore()

const categories = ref([])
const loading = ref(true)
const error = ref(null)

const homeLayout = computed(() => forumStore.config?.home_layout || 'classic')

const cardColors = ['bg-violet-600', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-cyan-600']

onMounted(async () => {
  try {
    await forumStore.fetchConfig()
    const res = await fetchForumsApi()
    categories.value = res.data.data
  } catch (e) {
    error.value = 'Failed to load forums. Please try again.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="rounded-xl p-5 animate-pulse" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
        <div class="h-4 rounded w-1/4 mb-4" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
        <div v-for="j in 2" :key="j" class="flex items-center gap-4 py-4">
          <div class="w-10 h-10 rounded-lg" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          <div class="flex-1 space-y-2">
            <div class="h-4 rounded w-1/3" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
            <div class="h-3 rounded w-2/3" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-20">
      <i class="fa-solid fa-face-sad-tear text-5xl text-gray-400"></i>
      <p class="text-lg font-medium mt-4" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ error }}</p>
      <button
        @click="loading = true; error = null; $router.go(0)"
        class="mt-4 px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        Retry
      </button>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Card Grid Layout -->
      <div v-if="homeLayout === 'card'">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="(category, catIdx) in categories"
            :key="category.id"
            class="rounded-xl overflow-hidden border transition-colors duration-300"
            :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'"
          >
            <!-- Colored header bar -->
            <div
              class="px-4 py-3 flex items-center justify-between relative overflow-hidden category-card-header"
              :class="!category.header_image ? cardColors[catIdx % cardColors.length] : ''"
              :style="category.header_image ? { backgroundImage: `url(${category.header_image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}"
            >
              <div v-if="category.header_image" class="absolute inset-0 bg-black/50" />
              <div class="relative z-10 flex items-center justify-between w-full">
                <div class="min-w-0">
                  <h3 class="font-semibold text-sm uppercase tracking-wider text-white">
                    {{ category.name }}
                  </h3>
                  <p v-if="category.description" class="text-xs mt-0.5 text-white/70 truncate">
                    {{ category.description }}
                  </p>
                </div>
                <span
                  v-if="category.total_posts"
                  class="shrink-0 ml-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-white/90 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1"
                >
                  <i class="fa-solid fa-comments text-[10px]"></i>
                  {{ category.total_posts.toLocaleString() }} posts
                </span>
              </div>
            </div>

            <!-- Forum list (2-col grid) -->
            <div class="p-4">
              <div v-if="category.forums && category.forums.length" class="grid grid-cols-2 gap-x-4 gap-y-2">
                <router-link
                  v-for="forum in category.forums.slice(0, 8)"
                  :key="forum.id"
                  :to="`/forum/${forum.slug}`"
                  class="flex items-center gap-2 text-sm truncate transition-colors hover:text-purple-accent"
                  :class="isDark ? 'text-gray-300' : 'text-gray-700'"
                >
                  <span class="w-2 h-2 rounded-full bg-purple-accent shrink-0"></span>
                  <i v-if="forum.icon" :class="[forum.icon, 'text-xs text-purple-accent opacity-70']"></i>
                  <span class="truncate">{{ forum.name }}</span>
                </router-link>
              </div>
              <span
                v-if="category.forums && category.forums.length > 8"
                class="inline-block mt-2 text-xs font-medium"
                :class="isDark ? 'text-gray-500' : 'text-gray-400'"
              >
                +{{ category.forums.length - 8 }} more
              </span>
              <div v-if="!category.forums || !category.forums.length" class="text-sm" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                No forums yet.
              </div>
            </div>

            <!-- Last post footer -->
            <div
              class="px-4 py-2.5 border-t text-xs flex items-center gap-2 min-h-[2.5rem]"
              :class="isDark ? 'border-gray-800 text-gray-500' : 'border-gray-100 text-gray-400'"
            >
              <template v-if="category.last_post_user">
                <UserAvatar
                  :name="category.last_post_user.username"
                  :color="category.last_post_user.avatar_color || '#7c3aed'"
                  :avatar-url="category.last_post_user.avatar_url"
                  :online="false"
                  size="sm"
                />
                <span :style="category.last_post_user.group_color ? { color: category.last_post_user.group_color } : {}" class="font-medium shrink-0">
                  {{ category.last_post_user.username }}
                </span>
                <span>·</span>
                <router-link
                  v-if="category.last_post_thread"
                  :to="`/thread/${category.last_post_thread.slug}`"
                  class="truncate hover:text-purple-accent transition-colors"
                  :class="isDark ? 'text-gray-400' : 'text-gray-500'"
                >
                  {{ category.last_post_thread.title }}
                </router-link>
                <span class="shrink-0">·</span>
                <span class="shrink-0">{{ category.last_post_at ? formatRelative(category.last_post_at) : '' }}</span>
              </template>
              <span v-else>No posts yet</span>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="!categories.length" class="text-center py-20">
          <i class="fa-solid fa-comments text-5xl text-gray-500 mb-4"></i>
          <p class="text-lg font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">No forums found.</p>
        </div>
      </div>

      <!-- Classic Layout -->
      <div v-else>
        <!-- Categories -->
        <div v-for="category in categories" :key="category.id" class="mb-4">
          <div class="rounded-xl overflow-hidden transition-colors duration-300" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
            <!-- Category header -->
            <div
              class="px-5 py-3 border-b border-l-4 border-l-purple-accent"
              :class="isDark ? 'bg-gray-900 border-b-gray-800' : 'bg-gray-50 border-b-gray-200'"
            >
              <h3 class="font-semibold text-sm uppercase tracking-wider" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                {{ category.name }}
              </h3>
              <p v-if="category.description" class="text-xs mt-0.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                {{ category.description }}
              </p>
            </div>

            <!-- Forums in category -->
            <div v-if="category.forums && category.forums.length">
              <div v-for="(forum, idx) in category.forums" :key="forum.id">
                <!-- Forum row -->
                <div class="group">
                  <router-link
                    :to="`/forum/${forum.slug}`"
                    class="flex items-center gap-4 px-5 py-4 transition-colors duration-150"
                    :class="[
                      isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50',
                      (idx < category.forums.length - 1 && !(forum.subforums && forum.subforums.length)) ? (isDark ? 'border-b border-gray-800/50' : 'border-b border-gray-100') : '',
                    ]"
                  >
                    <!-- Icon -->
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" :class="isDark ? 'bg-gray-800' : 'bg-gray-100'">
                      <i :class="[forum.icon || 'fa-solid fa-comment', 'text-purple-accent text-lg']"></i>
                    </div>

                    <!-- Name + description -->
                    <div class="flex-1 min-w-0">
                      <div class="font-semibold group-hover:text-purple-accent transition-colors" :class="isDark ? 'text-white' : 'text-gray-900'">
                        {{ forum.name }}
                      </div>
                      <div class="text-sm truncate" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                        {{ forum.description }}
                      </div>
                    </div>

                    <!-- Stats: stacked icon rows -->
                    <div class="hidden sm:flex flex-col gap-1 shrink-0 text-xs w-16" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                      <div class="flex items-center gap-1.5">
                        <i class="fa-regular fa-comment w-3 text-center"></i>
                        <span :class="isDark ? 'text-gray-300' : 'text-gray-600'">{{ (forum.thread_count ?? forum.threads_count ?? 0).toLocaleString() }}</span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <i class="fa-regular fa-message w-3 text-center"></i>
                        <span :class="isDark ? 'text-gray-300' : 'text-gray-600'">{{ (forum.post_count ?? forum.posts_count ?? 0).toLocaleString() }}</span>
                      </div>
                    </div>

                    <!-- Subtle divider -->
                    <div class="hidden md:block self-stretch w-px mx-1 shrink-0" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'"></div>

                    <!-- Last post -->
                    <div class="hidden md:flex items-center gap-2.5 shrink-0 w-56">
                      <template v-if="forum.last_post_user">
                        <UserAvatar
                          :name="forum.last_post_user.username"
                          :color="forum.last_post_user.avatar_color || '#7c3aed'"
                          :avatar-url="forum.last_post_user.avatar_url"
                          :online="false"
                          size="sm"
                        />
                        <div class="min-w-0">
                          <router-link
                            v-if="forum.last_thread"
                            :to="`/thread/${forum.last_thread.slug}`"
                            class="text-xs font-medium truncate block hover:text-purple-accent transition-colors"
                            :class="isDark ? 'text-gray-300' : 'text-gray-700'"
                          >{{ forum.last_thread.title }}</router-link>
                          <div class="text-[11px] flex items-center gap-1 mt-0.5" :class="isDark ? 'text-gray-600' : 'text-gray-400'">
                            <span :style="forum.last_post_user.group_color ? { color: forum.last_post_user.group_color } : {}">{{ forum.last_post_user.username }}</span>
                            <span>·</span>
                            <span>{{ forum.last_post_at ? formatRelative(forum.last_post_at) : '' }}</span>
                          </div>
                        </div>
                      </template>
                      <span v-else class="text-xs" :class="isDark ? 'text-gray-600' : 'text-gray-400'">No posts yet</span>
                    </div>
                  </router-link>
                </div>

                <!-- Sub forums -->
                <div
                  v-if="forum.subforums && forum.subforums.length"
                  class="px-5 py-2.5 border-t flex flex-wrap gap-x-5 gap-y-1.5"
                  :class="isDark ? 'bg-gray-800/40 border-gray-800/60' : 'bg-gray-50 border-gray-100'"
                >
                  <router-link
                    v-for="sub in forum.subforums"
                    :key="sub.id"
                    :to="`/forum/${sub.slug}`"
                    class="inline-flex items-center gap-1.5 text-sm transition-colors duration-150 hover:text-purple-accent"
                    :class="isDark ? 'text-gray-400' : 'text-gray-500'"
                  >
                    <i :class="[sub.icon || 'fa-solid fa-comment', 'text-xs opacity-70']"></i>
                    <span>{{ sub.name }}</span>
                  </router-link>
                </div>
              </div>
            </div>
            <div v-else class="px-5 py-4 text-sm" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
              No forums yet.
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="!categories.length" class="text-center py-20">
          <i class="fa-solid fa-comments text-5xl text-gray-500 mb-4"></i>
          <p class="text-lg font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">No forums found.</p>
        </div>
      </div>
    </div>

    <!-- Usergroup Legend -->
    <div v-if="!loading && !error" class="mt-6">
      <UsergroupLegend :is-dark="isDark" />
    </div>

    <!-- Online Users Widget -->
    <div
      v-if="!loading && !error && presenceStore.onlineUsers.length"
      class="mt-6 rounded-xl p-4 transition-colors duration-300"
      :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
    >
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span class="text-sm font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">
            {{ presenceStore.onlineUsers.length }} {{ presenceStore.onlineUsers.length === 1 ? 'member' : 'members' }} online
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <router-link
          v-for="user in presenceStore.onlineUsers.slice(0, 8)"
          :key="user.id"
          :to="`/profile/${user.username}`"
          :title="user.username"
        >
          <UserAvatar
            :name="user.username"
            :color="user.avatar_color || 'bg-purple-500'"
            :avatar-url="user.avatar_url"
            :online="true"
            size="sm"
          />
        </router-link>
        <span
          v-if="presenceStore.onlineUsers.length > 8"
          class="text-xs font-medium px-2 py-1 rounded-full"
          :class="isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'"
        >
          +{{ presenceStore.onlineUsers.length - 8 }} more
        </span>
      </div>
    </div>
  </div>
</template>
