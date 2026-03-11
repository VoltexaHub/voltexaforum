<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { getAdminSeoSettings, updateAdminSeoSettings } from '../../../services/api'
import { useToastStore } from '../../../stores/toast'

const isDark = inject('isDark', ref(true))
const toast = useToastStore()
const loading = ref(true)
const saving = ref(false)

const settings = ref({
  seo_description: '',
  seo_title_format: '{page} | {site}',
  seo_og_image: '',
  seo_twitter_handle: '',
  seo_sitemap_enabled: true,
  seo_robots_txt: "User-agent: *\nAllow: /",
  seo_noindex: false,
})

const robotsPreview = computed(() => {
  if (settings.value.seo_noindex) {
    return 'User-agent: *\nDisallow: /'
  }
  return settings.value.seo_robots_txt || 'User-agent: *\nAllow: /'
})

async function fetchSettings() {
  loading.value = true
  try {
    const res = await getAdminSeoSettings()
    Object.assign(settings.value, res.data)
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to load SEO settings', 'error')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await updateAdminSeoSettings(settings.value)
    toast.show('SEO settings saved')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save settings', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(fetchSettings)
</script>

<template>
  <div class="space-y-6">
    <!-- Loading skeleton -->
    <template v-if="loading">
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 animate-pulse space-y-4">
        <div class="h-5 bg-gray-700 rounded w-48"></div>
        <div class="h-10 bg-gray-700 rounded"></div>
        <div class="h-10 bg-gray-700 rounded"></div>
        <div class="h-10 bg-gray-700 rounded"></div>
      </div>
    </template>

    <template v-else>
      <!-- General Meta -->
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-5">
        <h3 class="text-base font-semibold text-white">General Meta</h3>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Site Description</label>
          <textarea
            v-model="settings.seo_description"
            rows="3"
            placeholder="A brief description of your forum for search engines..."
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none resize-none"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Title Format</label>
          <input
            v-model="settings.seo_title_format"
            type="text"
            placeholder="{page} | {site}"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none"
          />
          <p class="text-xs text-gray-500 mt-1">Use <code class="text-violet-400">{page}</code> for the page title and <code class="text-violet-400">{site}</code> for the site name.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Default OG Image URL</label>
          <input
            v-model="settings.seo_og_image"
            type="text"
            placeholder="https://example.com/og-image.png"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Twitter Handle</label>
          <input
            v-model="settings.seo_twitter_handle"
            type="text"
            placeholder="@yourhandle"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none"
          />
        </div>
      </div>

      <!-- Indexing -->
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-5">
        <h3 class="text-base font-semibold text-white">Indexing</h3>

        <!-- Sitemap toggle -->
        <div class="flex items-center justify-between py-2">
          <div>
            <div class="text-sm font-medium text-gray-300">Enable Sitemap</div>
            <div class="text-xs text-gray-500 mt-0.5">Serves /sitemap.xml for search engine crawlers.</div>
          </div>
          <button
            @click="settings.seo_sitemap_enabled = !settings.seo_sitemap_enabled"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4"
            :class="settings.seo_sitemap_enabled ? 'bg-violet-600' : 'bg-gray-600'"
          >
            <span class="inline-block h-4 w-4 rounded-full bg-white transition-transform" :class="settings.seo_sitemap_enabled ? 'translate-x-6' : 'translate-x-1'" />
          </button>
        </div>

        <!-- Noindex toggle -->
        <div class="flex items-center justify-between py-2">
          <div>
            <div class="text-sm font-medium text-gray-300">Noindex Entire Site</div>
            <div class="text-xs text-gray-500 mt-0.5">Adds noindex meta tag and blocks all crawlers via robots.txt.</div>
            <div v-if="settings.seo_noindex" class="mt-2 flex items-center gap-2 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              <i class="fa-solid fa-triangle-exclamation"></i>
              This disables all search engine indexing for your entire site.
            </div>
          </div>
          <button
            @click="settings.seo_noindex = !settings.seo_noindex"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4"
            :class="settings.seo_noindex ? 'bg-amber-600' : 'bg-gray-600'"
          >
            <span class="inline-block h-4 w-4 rounded-full bg-white transition-transform" :class="settings.seo_noindex ? 'translate-x-6' : 'translate-x-1'" />
          </button>
        </div>
      </div>

      <!-- Robots.txt -->
      <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6 space-y-5">
        <h3 class="text-base font-semibold text-white">Robots.txt</h3>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Custom Robots.txt Content</label>
          <textarea
            v-model="settings.seo_robots_txt"
            rows="6"
            :disabled="settings.seo_noindex"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 font-mono focus:border-violet-500 focus:outline-none resize-none disabled:opacity-50"
          ></textarea>
          <p v-if="settings.seo_noindex" class="text-xs text-amber-400 mt-1">Robots.txt is overridden when noindex is enabled.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Live Preview</label>
          <div class="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm font-mono text-gray-400 whitespace-pre-wrap">{{ robotsPreview }}</div>
        </div>
      </div>

      <!-- Save -->
      <div class="flex justify-end">
        <button
          @click="save"
          :disabled="saving"
          class="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {{ saving ? 'Saving...' : 'Save SEO Settings' }}
        </button>
      </div>
    </template>
  </div>
</template>
