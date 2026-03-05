<script setup>
import { inject, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForumStore } from '../stores/forum'
import { createThread, getForumThreads, getThreadPrefixes, getTags } from '../services/api'
import MarkdownEditor from '../components/MarkdownEditor.vue'

const isDark = inject('isDark')
const route = useRoute()
const router = useRouter()
const forumStore = useForumStore()

const slug = computed(() => route.params.slug)
const forumMeta = ref(null)

const title = ref('')
const body = ref('')
const tagInput = ref('')
const tags = ref([])
const loading = ref(false)
const error = ref(null)
const errors = ref({})
const prefixes = ref([])
const selectedPrefixId = ref(null)
const tagSuggestions = ref([])
const showTagSuggestions = ref(false)

onMounted(async () => {
  try {
    const [forumRes, prefixRes] = await Promise.all([
      getForumThreads(slug.value, 1),
      getThreadPrefixes(),
    ])
    forumMeta.value = forumRes.data.forum || null
    prefixes.value = prefixRes.data.data || []
  } catch {}
})

async function onTagInput() {
  const q = tagInput.value.trim()
  if (q.length < 1) { showTagSuggestions.value = false; return }
  try {
    const res = await getTags({ q })
    tagSuggestions.value = (res.data.data || []).filter(t => !tags.value.includes(t.name)).slice(0, 8)
    showTagSuggestions.value = tagSuggestions.value.length > 0
  } catch {
    showTagSuggestions.value = false
  }
}

function selectTagSuggestion(tag) {
  if (tags.value.length >= 5) return
  if (!tags.value.includes(tag.name)) tags.value.push(tag.name)
  tagInput.value = ''
  showTagSuggestions.value = false
}

function addTag() {
  const raw = tagInput.value.trim()
  if (!raw) return
  const newTags = raw.split(',').map(t => t.trim()).filter(t => t && !tags.value.includes(t))
  tags.value.push(...newTags)
  tagInput.value = ''
}

function removeTag(tag) {
  tags.value = tags.value.filter(t => t !== tag)
}

function handleTagKeydown(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addTag()
  }
  if (e.key === 'Backspace' && !tagInput.value && tags.value.length) {
    tags.value.pop()
  }
}

async function handleSubmit() {
  errors.value = {}
  error.value = null

  if (title.value.trim().length < 3) {
    errors.value.title = 'Title must be at least 3 characters.'
    return
  }
  if (body.value.trim().length < 10) {
    errors.value.body = 'Body must be at least 10 characters.'
    return
  }

  loading.value = true
  try {
    const res = await createThread({
      forum_slug: slug.value,
      title: title.value,
      body: body.value,
      prefix_id: selectedPrefixId.value || undefined,
      tags: tags.value.length ? tags.value : undefined,
    })
    const newThread = res.data.data
    router.push(`/thread/${newThread.id}`)
  } catch (e) {
    if (e.response?.data?.errors) {
      errors.value = {}
      for (const [key, val] of Object.entries(e.response.data.errors)) {
        errors.value[key] = Array.isArray(val) ? val[0] : val
      }
    } else {
      error.value = e.response?.data?.message || 'Failed to create thread.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm mb-6 flex-wrap"
         :class="isDark ? 'text-gray-400' : 'text-gray-500'">
      <router-link to="/" class="hover:text-purple-accent transition-colors">Home</router-link>
      <template v-if="forumMeta?.category">
        <span>&#8250;</span>
        <span>{{ forumMeta.category.name }}</span>
      </template>
      <template v-if="forumMeta?.parent_forum">
        <span>&#8250;</span>
        <router-link :to="`/forum/${forumMeta.parent_forum.slug}`" class="hover:text-purple-accent transition-colors">
          {{ forumMeta.parent_forum.name }}
        </router-link>
      </template>
      <span>&#8250;</span>
      <router-link :to="`/forum/${slug}`" class="hover:text-purple-accent transition-colors">{{ forumMeta?.name || slug }}</router-link>
      <span>&#8250;</span>
      <span :class="isDark ? 'text-white' : 'text-gray-900'" class="font-medium">New Thread</span>
    </nav>

    <div
      class="rounded-xl p-6 transition-colors duration-300"
      :class="isDark ? 'bg-gray-900' : 'bg-white shadow-sm'"
    >
      <h1 class="text-2xl font-bold mb-6">Create New Thread</h1>

      <!-- General error -->
      <div
        v-if="error"
        class="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
      >
        {{ error }}
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Prefix selector -->
        <div v-if="prefixes.length">
          <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
            Prefix <span class="text-xs font-normal" :class="isDark ? 'text-gray-500' : 'text-gray-400'">(optional)</span>
          </label>
          <div class="flex flex-wrap gap-2">
            <button type="button" @click="selectedPrefixId = null"
              class="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              :class="selectedPrefixId === null
                ? 'border-purple-accent bg-purple-accent/10 text-purple-accent'
                : isDark ? 'border-gray-700 text-gray-400 hover:border-gray-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'">
              No prefix
            </button>
            <button type="button" v-for="p in prefixes" :key="p.id" @click="selectedPrefixId = p.id"
              class="px-3 py-1.5 rounded-full text-xs font-bold border transition-colors"
              :class="selectedPrefixId === p.id ? 'ring-2 ring-purple-accent ring-offset-1' : ''"
              :style="{ background: p.bg_color, color: p.text_color, borderColor: p.color + '40' }">
              {{ p.name }}
            </button>
          </div>
        </div>

        <!-- Title -->
        <div>
          <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
            Title <span class="text-red-400">*</span>
          </label>
          <input
            v-model="title"
            type="text"
            required
            placeholder="Thread title..."
            class="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-accent"
            :class="[
              isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400',
              errors.title ? 'border-red-500 focus:ring-red-500' : '',
            ]"
          />
          <p v-if="errors.title" class="text-red-400 text-xs mt-1">{{ errors.title }}</p>
        </div>

        <!-- Body -->
        <div>
          <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
            Content <span class="text-red-400">*</span>
          </label>
          <MarkdownEditor
            v-model="body"
            :rows="12"
            placeholder="Write your thread content..."
          />
          <p v-if="errors.body" class="text-red-400 text-xs mt-1">{{ errors.body }}</p>
        </div>

        <!-- Tags -->
        <div>
          <label class="block text-sm font-medium mb-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
            Tags <span class="text-xs font-normal" :class="isDark ? 'text-gray-500' : 'text-gray-400'">(optional, max 5)</span>
          </label>
          <div class="relative">
            <div
              class="flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg border transition-colors min-h-[42px]"
              :class="isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
            >
              <span
                v-for="tag in tags"
                :key="tag"
                class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-accent/15 text-purple-accent"
              >
                {{ tag }}
                <button type="button" @click="removeTag(tag)" class="hover:text-white transition-colors">&times;</button>
              </span>
              <input
                v-if="tags.length < 5"
                v-model="tagInput"
                type="text"
                placeholder="Add tags..."
                @keydown="handleTagKeydown"
                @input="onTagInput"
                @blur="() => { setTimeout(() => { showTagSuggestions = false }, 150); addTag() }"
                class="flex-1 min-w-[120px] bg-transparent outline-none text-sm py-0.5"
                :class="isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'"
              />
            </div>
            <!-- Autocomplete dropdown -->
            <div v-if="showTagSuggestions && tagSuggestions.length" class="absolute z-20 w-full mt-1 rounded-lg border shadow-lg py-1 max-h-48 overflow-y-auto"
              :class="isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'">
              <button type="button" v-for="s in tagSuggestions" :key="s.id" @mousedown.prevent="selectTagSuggestion(s)"
                class="w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between"
                :class="isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'">
                <span>#{{ s.name }}</span>
                <span class="text-xs" :class="isDark ? 'text-gray-600' : 'text-gray-400'">{{ s.use_count }} uses</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-2">
          <router-link
            :to="`/forum/${slug}`"
            class="px-6 py-2.5 rounded-lg font-medium transition-colors"
            :class="isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'"
          >
            Cancel
          </router-link>
          <button
            type="submit"
            :disabled="loading"
            class="px-6 py-2.5 bg-purple-accent hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="loading" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ loading ? 'Creating...' : 'Create Thread' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
