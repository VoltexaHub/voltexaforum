<script setup>
import { ref, onMounted } from 'vue'
import {
  getAdminContentPages,
  updateAdminContentPages,
  getAdminHelpArticles,
  createHelpArticle,
  updateHelpArticle,
  deleteHelpArticle,
} from '../../services/api'

const activeTab = ref('pages')

// ─── Pages ───────────────────────────────────────────────────
const pages = ref({ rules: '', privacy: '', tos: '' })
const pagesSaving = ref(false)
const pagesMsg = ref('')

async function loadPages() {
  try {
    const res = await getAdminContentPages()
    const d = res.data.data
    pages.value = { rules: d.rules || '', privacy: d.privacy || '', tos: d.tos || '' }
  } catch {}
}

async function savePages() {
  pagesSaving.value = true
  pagesMsg.value = ''
  try {
    await updateAdminContentPages(pages.value)
    pagesMsg.value = 'Pages saved successfully.'
  } catch {
    pagesMsg.value = 'Failed to save pages.'
  }
  pagesSaving.value = false
  setTimeout(() => pagesMsg.value = '', 3000)
}

// ─── Help Articles ───────────────────────────────────────────
const articles = ref([])
const articlesLoading = ref(true)
const showModal = ref(false)
const editing = ref(null)
const form = ref({ title: '', category: '', content: '', display_order: 0, is_published: true })
const formSaving = ref(false)
const formError = ref('')
const deleteConfirm = ref(null)

async function loadArticles() {
  articlesLoading.value = true
  try {
    const res = await getAdminHelpArticles()
    articles.value = res.data.data || []
  } catch {}
  articlesLoading.value = false
}

function openCreate() {
  editing.value = null
  form.value = { title: '', category: '', content: '', display_order: 0, is_published: true }
  formError.value = ''
  showModal.value = true
}

function openEdit(article) {
  editing.value = article
  form.value = {
    title: article.title,
    category: article.category,
    content: article.content,
    display_order: article.display_order || 0,
    is_published: article.is_published,
  }
  formError.value = ''
  showModal.value = true
}

async function saveArticle() {
  formSaving.value = true
  formError.value = ''
  try {
    if (editing.value) {
      await updateHelpArticle(editing.value.id, form.value)
    } else {
      await createHelpArticle(form.value)
    }
    showModal.value = false
    await loadArticles()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Failed to save article.'
  }
  formSaving.value = false
}

async function confirmDelete(article) {
  deleteConfirm.value = article
}

async function doDelete() {
  if (!deleteConfirm.value) return
  try {
    await deleteHelpArticle(deleteConfirm.value.id)
    deleteConfirm.value = null
    await loadArticles()
  } catch {}
}

const existingCategories = ref([])
function updateCategories() {
  const cats = new Set(articles.value.map(a => a.category).filter(Boolean))
  existingCategories.value = [...cats]
}

onMounted(async () => {
  await Promise.all([loadPages(), loadArticles()])
  updateCategories()
})
</script>

<template>
  <div>
    <!-- Tabs -->
    <div class="flex gap-1 mb-6 border-b border-gray-800">
      <button
        @click="activeTab = 'pages'"
        class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
        :class="activeTab === 'pages' ? 'border-violet-500 text-violet-400' : 'border-transparent text-gray-400 hover:text-gray-200'"
      >
        Pages
      </button>
      <button
        @click="activeTab = 'articles'; loadArticles().then(updateCategories)"
        class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
        :class="activeTab === 'articles' ? 'border-violet-500 text-violet-400' : 'border-transparent text-gray-400 hover:text-gray-200'"
      >
        Help Articles
      </button>
    </div>

    <!-- Pages Tab -->
    <div v-if="activeTab === 'pages'" class="space-y-6">
      <div v-for="(label, key) in { rules: 'Rules', privacy: 'Privacy Policy', tos: 'Terms of Service' }" :key="key">
        <div class="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h3 class="text-sm font-semibold text-white mb-1">{{ label }}</h3>
          <p class="text-xs text-gray-500 mb-3">Markdown supported. This page is publicly accessible.</p>
          <textarea
            v-model="pages[key]"
            rows="10"
            class="w-full rounded-lg border border-gray-700 bg-gray-950 text-gray-300 text-sm p-4 font-mono focus:outline-none focus:border-violet-500 resize-y"
            :placeholder="`Enter ${label.toLowerCase()} content...`"
          />
        </div>
      </div>

      <div class="flex items-center gap-4">
        <button
          @click="savePages"
          :disabled="pagesSaving"
          class="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <i v-if="pagesSaving" class="fa-solid fa-spinner fa-spin mr-1.5"></i>
          Save All Pages
        </button>
        <span v-if="pagesMsg" class="text-sm" :class="pagesMsg.includes('success') ? 'text-green-400' : 'text-red-400'">
          {{ pagesMsg }}
        </span>
      </div>
    </div>

    <!-- Articles Tab -->
    <div v-if="activeTab === 'articles'">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-400">{{ articles.length }} article{{ articles.length !== 1 ? 's' : '' }}</h3>
        <button
          @click="openCreate"
          class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
        >
          <i class="fa-solid fa-plus mr-1.5"></i>New Article
        </button>
      </div>

      <div v-if="articlesLoading" class="text-center py-12 text-gray-500">Loading...</div>

      <div v-else-if="articles.length === 0" class="text-center py-12">
        <i class="fa-solid fa-book-open text-3xl text-gray-600 mb-3"></i>
        <p class="text-gray-500">No help articles yet. Create your first one.</p>
      </div>

      <div v-else class="rounded-xl border border-gray-800 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-800 bg-gray-900/50">
              <th class="text-left px-4 py-3 text-gray-400 font-medium">Title</th>
              <th class="text-left px-4 py-3 text-gray-400 font-medium hidden sm:table-cell">Category</th>
              <th class="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">Order</th>
              <th class="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
              <th class="text-right px-4 py-3 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in articles" :key="a.id" class="border-b border-gray-800/50 hover:bg-gray-900/30">
              <td class="px-4 py-3 text-white font-medium">{{ a.title }}</td>
              <td class="px-4 py-3 text-gray-400 hidden sm:table-cell">
                <span class="text-xs px-2 py-0.5 rounded-full bg-gray-800">{{ a.category }}</span>
              </td>
              <td class="px-4 py-3 text-gray-500 hidden md:table-cell">{{ a.display_order }}</td>
              <td class="px-4 py-3">
                <span
                  class="text-xs font-medium px-2 py-0.5 rounded-full"
                  :class="a.is_published ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'"
                >
                  {{ a.is_published ? 'Published' : 'Draft' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <button @click="openEdit(a)" class="text-gray-400 hover:text-violet-400 transition-colors mr-3">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button @click="confirmDelete(a)" class="text-gray-400 hover:text-red-400 transition-colors">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Article Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showModal = false">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showModal = false" />
          <div class="relative w-full max-w-2xl rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div class="p-6">
              <h3 class="text-lg font-bold text-white mb-5">{{ editing ? 'Edit Article' : 'New Article' }}</h3>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-1">Title</label>
                  <input v-model="form.title" type="text" class="w-full rounded-lg border border-gray-700 bg-gray-900 text-white text-sm px-3 py-2 focus:outline-none focus:border-violet-500" placeholder="Article title" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-1">Category</label>
                  <input v-model="form.category" type="text" list="cat-suggestions" class="w-full rounded-lg border border-gray-700 bg-gray-900 text-white text-sm px-3 py-2 focus:outline-none focus:border-violet-500" placeholder="e.g. Getting Started" />
                  <datalist id="cat-suggestions">
                    <option v-for="c in existingCategories" :key="c" :value="c" />
                  </datalist>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-1">Content (Markdown)</label>
                  <textarea v-model="form.content" rows="12" class="w-full rounded-lg border border-gray-700 bg-gray-900 text-white text-sm p-3 font-mono focus:outline-none focus:border-violet-500 resize-y" placeholder="Write article content..." />
                </div>

                <div class="flex gap-4">
                  <div class="flex-1">
                    <label class="block text-sm font-medium text-gray-400 mb-1">Display Order</label>
                    <input v-model.number="form.display_order" type="number" class="w-full rounded-lg border border-gray-700 bg-gray-900 text-white text-sm px-3 py-2 focus:outline-none focus:border-violet-500" />
                  </div>
                  <div class="flex items-end pb-1">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input v-model="form.is_published" type="checkbox" class="rounded border-gray-600 bg-gray-800 text-violet-500 focus:ring-violet-500" />
                      <span class="text-sm text-gray-300">Published</span>
                    </label>
                  </div>
                </div>
              </div>

              <div v-if="formError" class="mt-4 text-sm text-red-400 bg-red-500/10 rounded-lg py-2 px-3">{{ formError }}</div>

              <div class="flex justify-end gap-3 mt-6">
                <button @click="showModal = false" class="px-4 py-2 rounded-xl border border-gray-700 text-gray-400 hover:text-gray-200 text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button @click="saveArticle" :disabled="formSaving || !form.title || !form.category || !form.content" class="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                  <i v-if="formSaving" class="fa-solid fa-spinner fa-spin mr-1.5"></i>
                  {{ editing ? 'Update' : 'Create' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Confirmation -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="deleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="deleteConfirm = null">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="deleteConfirm = null" />
          <div class="relative w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl p-6 z-10">
            <div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-500/10">
              <i class="fa-solid fa-trash text-red-400 text-xl"></i>
            </div>
            <h3 class="text-center font-bold text-white text-lg mb-1">Delete Article</h3>
            <p class="text-center text-sm text-gray-400 mb-5">
              Are you sure you want to delete <strong class="text-white">{{ deleteConfirm.title }}</strong>? This cannot be undone.
            </p>
            <div class="flex gap-3">
              <button @click="deleteConfirm = null" class="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-semibold hover:bg-gray-800 transition-colors">
                Cancel
              </button>
              <button @click="doDelete" class="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
