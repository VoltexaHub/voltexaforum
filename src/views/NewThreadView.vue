<script setup>
import { inject, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForumStore } from '../stores/forum'
import { createThread } from '../services/api'
import MarkdownEditor from '../components/MarkdownEditor.vue'

const isDark = inject('isDark')
const route = useRoute()
const router = useRouter()
const forumStore = useForumStore()

const slug = computed(() => route.params.slug)

const title = ref('')
const body = ref('')
const tagInput = ref('')
const tags = ref([])
const loading = ref(false)
const error = ref(null)
const errors = ref({})

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
      <span>&#8250;</span>
      <router-link :to="`/forum/${slug}`" class="hover:text-purple-accent transition-colors">{{ slug }}</router-link>
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
            Tags <span class="text-xs font-normal" :class="isDark ? 'text-gray-500' : 'text-gray-400'">(optional, comma-separated)</span>
          </label>
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
              v-model="tagInput"
              type="text"
              placeholder="Add tags..."
              @keydown="handleTagKeydown"
              @blur="addTag"
              class="flex-1 min-w-[120px] bg-transparent outline-none text-sm py-0.5"
              :class="isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'"
            />
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
