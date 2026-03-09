<script setup>
import { ref, computed, onMounted, watch, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { getHelpArticles, getHelpArticle } from '../services/api'

const isDark = inject('isDark')
const route = useRoute()
const router = useRouter()

const categories = ref({})
const article = ref(null)
const loading = ref(true)
const search = ref('')
const activeCategory = ref(null)

function sanitize(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
}

const slug = computed(() => route.params.slug)

const categoryList = computed(() => Object.keys(categories.value))

const filteredArticles = computed(() => {
  let result = {}
  for (const [cat, articles] of Object.entries(categories.value)) {
    if (activeCategory.value && activeCategory.value !== cat) continue
    const filtered = articles.filter(a => {
      if (!search.value) return true
      const q = search.value.toLowerCase()
      return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
    })
    if (filtered.length) result[cat] = filtered
  }
  return result
})

async function loadArticles() {
  try {
    const res = await getHelpArticles()
    categories.value = res.data.data || {}
  } catch {}
}

async function loadArticle(s) {
  loading.value = true
  article.value = null
  try {
    const res = await getHelpArticle(s)
    article.value = res.data.data
  } catch {
    article.value = null
  }
  loading.value = false
}

onMounted(async () => {
  await loadArticles()
  if (slug.value) {
    await loadArticle(slug.value)
  }
  loading.value = false
})

watch(slug, async (val) => {
  if (val) {
    await loadArticle(val)
  } else {
    article.value = null
    loading.value = false
  }
})

function renderedMarkdown(content) {
  if (!content) return ''
  return sanitize(marked.parse(content))
}

function truncate(str, len = 120) {
  if (!str) return ''
  const plain = str.replace(/[#*_`\[\]()>-]/g, '')
  return plain.length > len ? plain.slice(0, len) + '...' : plain
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold mb-2" :class="isDark ? 'text-white' : 'text-gray-900'">
        <i class="fa-solid fa-circle-question mr-2 text-violet-400"></i>Help Center
      </h1>
      <p class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Find answers to common questions</p>
    </div>

    <!-- Single Article View -->
    <div v-if="slug && article">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm mb-6" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        <router-link to="/help" class="hover:text-violet-400 transition-colors">Help</router-link>
        <i class="fa-solid fa-chevron-right text-xs"></i>
        <span>{{ article.category }}</span>
        <i class="fa-solid fa-chevron-right text-xs"></i>
        <span :class="isDark ? 'text-white' : 'text-gray-900'">{{ article.title }}</span>
      </div>

      <div class="rounded-xl p-8" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
        <h2 class="text-xl font-bold mb-1" :class="isDark ? 'text-white' : 'text-gray-900'">{{ article.title }}</h2>
        <span class="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-6" :class="isDark ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600'">
          {{ article.category }}
        </span>
        <div v-html="renderedMarkdown(article.content)" class="markdown-body" :class="isDark ? 'text-gray-300' : 'text-gray-700'" />
      </div>

      <router-link to="/help" class="inline-flex items-center gap-2 mt-6 text-sm text-violet-400 hover:text-violet-300 transition-colors">
        <i class="fa-solid fa-arrow-left"></i> Back to Help Center
      </router-link>
    </div>

    <!-- Loading -->
    <div v-else-if="slug && loading">
      <div class="rounded-xl p-8 animate-pulse" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
        <div class="h-6 rounded w-1/3 mb-4" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
        <div class="h-4 rounded w-2/3 mb-2" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
        <div class="h-4 rounded w-1/2" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
      </div>
    </div>

    <!-- Article not found -->
    <div v-else-if="slug && !loading && !article" class="text-center py-16">
      <i class="fa-solid fa-circle-exclamation text-4xl mb-4" :class="isDark ? 'text-gray-600' : 'text-gray-300'"></i>
      <p class="text-lg font-medium" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Article not found</p>
      <router-link to="/help" class="text-violet-400 hover:text-violet-300 text-sm mt-2 inline-block">Back to Help Center</router-link>
    </div>

    <!-- Article List View -->
    <div v-else>
      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Sidebar -->
        <div class="lg:w-56 shrink-0">
          <!-- Search -->
          <div class="relative mb-4">
            <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'"></i>
            <input
              v-model="search"
              type="text"
              placeholder="Search articles..."
              class="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
              :class="isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'"
            />
          </div>

          <!-- Categories -->
          <div class="rounded-xl p-3 space-y-1" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
            <button
              @click="activeCategory = null"
              class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="!activeCategory
                ? (isDark ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600')
                : (isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50')"
            >
              All Categories
            </button>
            <button
              v-for="cat in categoryList"
              :key="cat"
              @click="activeCategory = cat"
              class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="activeCategory === cat
                ? (isDark ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600')
                : (isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50')"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <!-- Articles -->
        <div class="flex-1 min-w-0">
          <div v-if="loading" class="space-y-4">
            <div v-for="i in 3" :key="i" class="rounded-xl p-6 animate-pulse" :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'">
              <div class="h-5 rounded w-1/3 mb-3" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
              <div class="h-4 rounded w-2/3" :class="isDark ? 'bg-gray-800' : 'bg-gray-200'" />
            </div>
          </div>

          <div v-else-if="Object.keys(filteredArticles).length === 0" class="text-center py-16">
            <i class="fa-solid fa-book-open text-4xl mb-4" :class="isDark ? 'text-gray-600' : 'text-gray-300'"></i>
            <p class="text-lg font-medium" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
              {{ search ? 'No articles match your search' : 'No help articles yet' }}
            </p>
          </div>

          <div v-else class="space-y-8">
            <div v-for="(articles, category) in filteredArticles" :key="category">
              <h3 class="text-sm font-semibold uppercase tracking-wider mb-3" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                {{ category }}
              </h3>
              <div class="space-y-2">
                <router-link
                  v-for="a in articles"
                  :key="a.slug"
                  :to="`/help/${a.slug}`"
                  class="block rounded-xl p-5 transition-colors border"
                  :class="isDark
                    ? 'bg-gray-900 border-gray-800 hover:border-violet-500/30'
                    : 'bg-white border-gray-100 shadow-sm hover:border-violet-200'"
                >
                  <h4 class="font-semibold mb-1" :class="isDark ? 'text-white' : 'text-gray-900'">{{ a.title }}</h4>
                  <p class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ truncate(a.content) }}</p>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
