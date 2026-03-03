<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import draggable from 'vuedraggable'
import {
  getAdminForumTree,
  createAdminGame, updateAdminGame, deleteAdminGame,
  createAdminCategory, updateAdminCategory, deleteAdminCategory,
  createAdminForum, updateAdminForum, deleteAdminForum,
  reorderGames, reorderCategories, reorderForums,
} from '../../services/api'
import { useToastStore } from '../../stores/toast'
import FaIconPicker from '../../components/FaIconPicker.vue'

const toast = useToastStore()
const loading = ref(true)
const error = ref(null)

const tree = ref([])
const expandedGames = ref({})
const expandedCategories = ref({})
const showInlineForm = ref(null)
const inlineForm = ref({ name: '', slug: '', description: '', icon: 'fa-solid fa-comment' })

// Edit modal state
const editModal = reactive({
  open: false,
  type: '', // 'game' | 'category' | 'forum'
  id: null,
  saving: false,
  form: {
    name: '',
    slug: '',
    icon: '',
    description: '',
    display_order: 0,
    is_active: true,
  },
})

async function fetchTree() {
  loading.value = true
  error.value = null
  try {
    const res = await getAdminForumTree()
    tree.value = res.data.data || res.data || []
    if (tree.value.length && !Object.keys(expandedGames.value).length) {
      expandedGames.value[tree.value[0].id] = true
    }
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to load forum tree'
    toast.show(error.value, 'error')
  } finally {
    loading.value = false
  }
}

function toggleGame(gameId) {
  expandedGames.value[gameId] = !expandedGames.value[gameId]
}

function toggleCategory(key) {
  expandedCategories.value[key] = !expandedCategories.value[key]
}

function showForm(key) {
  showInlineForm.value = showInlineForm.value === key ? null : key
  inlineForm.value = { name: '', slug: '', description: '', icon: 'fa-solid fa-comment' }
}

function autoSlug() {
  inlineForm.value.slug = inlineForm.value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
}

function editAutoSlug() {
  editModal.form.slug = editModal.form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
}

// --- Create handlers ---

async function submitCreateGame() {
  try {
    await createAdminGame({ name: inlineForm.value.name, slug: inlineForm.value.slug, description: inlineForm.value.description })
    toast.show('Game created')
    showInlineForm.value = null
    fetchTree()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to create game', 'error')
  }
}

async function submitCreateCategory(gameId) {
  try {
    await createAdminCategory({ name: inlineForm.value.name, description: inlineForm.value.description, game_id: gameId })
    toast.show('Category created')
    showInlineForm.value = null
    fetchTree()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to create category', 'error')
  }
}

async function submitCreateForum(categoryId) {
  try {
    await createAdminForum({ name: inlineForm.value.name, slug: inlineForm.value.slug, description: inlineForm.value.description, icon: inlineForm.value.icon, category_id: categoryId })
    toast.show('Forum created')
    showInlineForm.value = null
    fetchTree()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to create forum', 'error')
  }
}

// --- Delete handlers ---

async function doDeleteGame(id) {
  if (!confirm('Delete this game and all its categories/forums?')) return
  try {
    await deleteAdminGame(id)
    toast.show('Game deleted')
    fetchTree()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to delete game', 'error')
  }
}

async function doDeleteCategory(id) {
  if (!confirm('Delete this category and all its forums?')) return
  try {
    await deleteAdminCategory(id)
    toast.show('Category deleted')
    fetchTree()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to delete category', 'error')
  }
}

async function doDeleteForum(id) {
  if (!confirm('Delete this forum?')) return
  try {
    await deleteAdminForum(id)
    toast.show('Forum deleted')
    fetchTree()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to delete forum', 'error')
  }
}

// --- Edit modal ---

function openEditModal(type, item) {
  editModal.type = type
  editModal.id = item.id
  editModal.form.name = item.name || ''
  editModal.form.slug = item.slug || ''
  editModal.form.icon = item.icon || ''
  editModal.form.description = item.description || ''
  editModal.form.display_order = item.display_order ?? 0
  editModal.form.is_active = item.is_active !== false
  editModal.saving = false
  editModal.open = true
}

function closeEditModal() {
  editModal.open = false
}

async function saveEdit() {
  editModal.saving = true
  try {
    const payload = { ...editModal.form }
    if (editModal.type === 'game') {
      await updateAdminGame(editModal.id, payload)
    } else if (editModal.type === 'category') {
      await updateAdminCategory(editModal.id, payload)
    } else {
      await updateAdminForum(editModal.id, payload)
    }
    toast.show(`${editModal.type.charAt(0).toUpperCase() + editModal.type.slice(1)} updated`)
    editModal.open = false
    fetchTree()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save', 'error')
  } finally {
    editModal.saving = false
  }
}

// --- Drag reorder ---

async function onGameDragEnd() {
  const items = tree.value.map((g, i) => ({ id: g.id, display_order: i + 1 }))
  try {
    await reorderGames(items)
    toast.show('Games reordered')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to reorder games', 'error')
    fetchTree()
  }
}

async function onCategoryDragEnd(game) {
  const items = game.categories.map((c, i) => ({ id: c.id, display_order: i + 1 }))
  try {
    await reorderCategories(items)
    toast.show('Categories reordered')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to reorder categories', 'error')
    fetchTree()
  }
}

async function onForumDragEnd(category) {
  const items = category.forums.map((f, i) => ({ id: f.id, display_order: i + 1 }))
  try {
    await reorderForums(items)
    toast.show('Forums reordered')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to reorder forums', 'error')
    fetchTree()
  }
}

// --- Icon display helpers ---

function renderGameIcon(icon) {
  if (!icon) return ''
  return icon.startsWith('fa-') ? '' : icon
}

function isGameFaIcon(icon) {
  return icon && icon.startsWith('fa-')
}

onMounted(fetchTree)
</script>

<template>
  <div class="space-y-6">
    <!-- Error -->
    <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
      <span class="text-sm text-red-400">{{ error }}</span>
      <button @click="fetchTree" class="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30 transition-colors">Retry</button>
    </div>

    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-400">Manage the forum hierarchy: games, categories, forums, and subforums.</p>
      <button @click="showForm('new-game')" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors">
        + Add Game
      </button>
    </div>

    <!-- Inline form for new game -->
    <div v-if="showInlineForm === 'new-game'" class="bg-gray-800 rounded-xl border border-violet-500/30 p-5 space-y-3">
      <h4 class="text-sm font-semibold text-violet-400">New Game</h4>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input v-model="inlineForm.name" @input="autoSlug" type="text" placeholder="Game name" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        <input v-model="inlineForm.slug" type="text" placeholder="slug" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
        <input v-model="inlineForm.description" type="text" placeholder="Description" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
      </div>
      <div class="flex gap-2">
        <button @click="submitCreateGame" class="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors">Create</button>
        <button @click="showInlineForm = null" class="px-3 py-1.5 bg-gray-700 text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <template v-if="loading">
      <div v-for="i in 2" :key="i" class="bg-gray-800 rounded-xl border border-gray-700/50 p-5 animate-pulse space-y-3">
        <div class="h-6 bg-gray-700 rounded w-40"></div>
        <div class="h-4 bg-gray-700 rounded w-64"></div>
        <div class="h-4 bg-gray-700 rounded w-48"></div>
      </div>
    </template>

    <!-- Game tree (draggable) -->
    <draggable
      v-model="tree"
      item-key="id"
      handle=".game-drag-handle"
      ghost-class="opacity-30"
      @end="onGameDragEnd"
      :animation="200"
    >
      <template #item="{ element: game }">
        <div class="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden mb-4">
          <!-- Game header -->
          <div class="flex items-center justify-between px-5 py-4 hover:bg-gray-700/30 transition-colors">
            <div class="flex items-center gap-3">
              <i class="fa-solid fa-grip-vertical game-drag-handle text-gray-400 hover:text-gray-200 cursor-grab active:cursor-grabbing"></i>
              <button @click="toggleGame(game.id)" class="flex items-center gap-3 cursor-pointer">
                <svg
                  class="w-4 h-4 text-gray-500 transition-transform"
                  :class="expandedGames[game.id] ? 'rotate-90' : ''"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
                <i v-if="isGameFaIcon(game.icon)" :class="game.icon" class="text-gray-400"></i>
                <span v-else class="text-lg">{{ game.icon }}</span>
                <span class="font-semibold text-white">{{ game.name }}</span>
              </button>
              <span
                class="text-[10px] font-medium px-2 py-0.5 rounded-full"
                :class="game.is_active !== false ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'"
              >{{ game.is_active !== false ? 'Active' : 'Inactive' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">{{ game.categories?.length || 0 }} categories</span>
              <button @click.stop="showForm(`cat-${game.id}`)" class="px-2 py-1 text-xs text-violet-400 hover:bg-violet-500/10 rounded transition-colors">+ Category</button>
              <button @click.stop="openEditModal('game', game)" class="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors" title="Edit">
                <i class="fa-solid fa-pen-to-square text-sm"></i>
              </button>
              <button @click.stop="doDeleteGame(game.id)" class="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Inline form for new category -->
          <div v-if="showInlineForm === `cat-${game.id}`" class="mx-5 mb-4 bg-gray-900/50 rounded-lg border border-violet-500/30 p-4 space-y-3">
            <h4 class="text-sm font-semibold text-violet-400">New Category in {{ game.name }}</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input v-model="inlineForm.name" type="text" placeholder="Category name" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
              <input v-model="inlineForm.description" type="text" placeholder="Description (optional)" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
            </div>
            <div class="flex gap-2">
              <button @click="submitCreateCategory(game.id)" class="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors">Create</button>
              <button @click="showInlineForm = null" class="px-3 py-1.5 bg-gray-700 text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
            </div>
          </div>

          <!-- Categories & Forums -->
          <div v-if="expandedGames[game.id]" class="border-t border-gray-700/50">
            <draggable
              v-model="game.categories"
              item-key="id"
              handle=".cat-drag-handle"
              ghost-class="opacity-30"
              @end="onCategoryDragEnd(game)"
              :animation="200"
            >
              <template #item="{ element: category }">
                <div>
                  <!-- Category header -->
                  <div class="flex items-center justify-between px-5 py-3 pl-8 hover:bg-gray-700/30 transition-colors border-b border-gray-700/30">
                    <div class="flex items-center gap-3">
                      <i class="fa-solid fa-grip-vertical cat-drag-handle text-gray-400 hover:text-gray-200 cursor-grab active:cursor-grabbing text-xs"></i>
                      <button @click="toggleCategory(`${game.id}-${category.id}`)" class="flex items-center gap-3 cursor-pointer">
                        <svg
                          class="w-3.5 h-3.5 text-gray-500 transition-transform"
                          :class="expandedCategories[`${game.id}-${category.id}`] !== false ? 'rotate-90' : ''"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                        <span class="font-medium text-gray-300 text-sm">{{ category.name }}</span>
                      </button>
                      <span
                        class="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        :class="category.is_active !== false ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'"
                      >{{ category.is_active !== false ? 'Active' : 'Inactive' }}</span>
                      <span class="text-xs text-gray-500">{{ category.forums?.length || 0 }} forums</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <button @click.stop="showForm(`forum-${game.id}-${category.id}`)" class="px-2 py-1 text-xs text-violet-400 hover:bg-violet-500/10 rounded transition-colors">+ Forum</button>
                      <button @click.stop="openEditModal('category', category)" class="p-1 rounded hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors" title="Edit">
                        <i class="fa-solid fa-pen-to-square text-xs"></i>
                      </button>
                      <button @click.stop="doDeleteCategory(category.id)" class="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- Inline form for new forum -->
                  <div v-if="showInlineForm === `forum-${game.id}-${category.id}`" class="mx-5 ml-14 my-3 bg-gray-900/50 rounded-lg border border-violet-500/30 p-4 space-y-3">
                    <h4 class="text-sm font-semibold text-violet-400">New Forum in {{ category.name }}</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input v-model="inlineForm.name" @input="autoSlug" type="text" placeholder="Forum name" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
                      <input v-model="inlineForm.slug" type="text" placeholder="slug" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
                      <input v-model="inlineForm.description" type="text" placeholder="Description" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-400 mb-1">Forum Icon</label>
                      <FaIconPicker v-model="inlineForm.icon" />
                    </div>
                    <div class="flex gap-2">
                      <button @click="submitCreateForum(category.id)" class="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors">Create</button>
                      <button @click="showInlineForm = null" class="px-3 py-1.5 bg-gray-700 text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
                    </div>
                  </div>

                  <!-- Forums list (draggable) -->
                  <div v-if="expandedCategories[`${game.id}-${category.id}`] !== false">
                    <draggable
                      v-model="category.forums"
                      item-key="id"
                      handle=".forum-drag-handle"
                      ghost-class="opacity-30"
                      @end="onForumDragEnd(category)"
                      :animation="200"
                    >
                      <template #item="{ element: forum }">
                        <div class="flex items-center justify-between px-5 py-2.5 pl-14 hover:bg-gray-700/20 transition-colors border-b border-gray-700/20">
                          <div class="flex items-center gap-3">
                            <i class="fa-solid fa-grip-vertical forum-drag-handle text-gray-400 hover:text-gray-200 cursor-grab active:cursor-grabbing text-xs"></i>
                            <i :class="forum.icon || 'fa-solid fa-comment'" class="text-gray-400"></i>
                            <div>
                              <span class="text-sm font-medium text-gray-300">{{ forum.name }}</span>
                              <span class="text-xs text-gray-500 ml-2">{{ forum.thread_count || forum.threads || 0 }} threads</span>
                            </div>
                            <span
                              class="text-[10px] font-medium px-2 py-0.5 rounded-full"
                              :class="forum.is_active !== false ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'"
                            >{{ forum.is_active !== false ? 'Active' : 'Inactive' }}</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <button @click="$router.push(`/admin/forums/${forum.id}/permissions`)" class="p-1 rounded hover:bg-violet-500/20 text-gray-500 hover:text-violet-400 transition-colors" title="Permissions">
                              <i class="fa-solid fa-shield-halved text-xs"></i>
                            </button>
                            <button @click="openEditModal('forum', forum)" class="p-1 rounded hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors" title="Edit">
                              <i class="fa-solid fa-pen-to-square text-xs"></i>
                            </button>
                            <button @click="doDeleteForum(forum.id)" class="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors">
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </template>
                    </draggable>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </div>
      </template>
    </draggable>

    <!-- Empty state -->
    <div v-if="!loading && !tree.length && !error" class="bg-gray-800 rounded-xl border border-gray-700/50 p-12 text-center">
      <p class="text-gray-500">No games configured yet. Add your first game to get started.</p>
    </div>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div v-if="editModal.open" class="fixed inset-0 z-[9998] flex items-center justify-center">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeEditModal"></div>
        <!-- Modal -->
        <div class="relative bg-gray-800 border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <div class="px-6 py-5 border-b border-gray-700/50">
            <h3 class="text-lg font-semibold text-white">
              Edit {{ editModal.type.charAt(0).toUpperCase() + editModal.type.slice(1) }}
            </h3>
          </div>
          <div class="px-6 py-5 space-y-4">
            <!-- Name -->
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Name</label>
              <input v-model="editModal.form.name" @input="editAutoSlug" type="text" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
            </div>
            <!-- Slug (game + forum) -->
            <div v-if="editModal.type === 'game' || editModal.type === 'forum'">
              <label class="block text-xs font-medium text-gray-400 mb-1">Slug</label>
              <input v-model="editModal.form.slug" type="text" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
            </div>
            <!-- Icon (game: text input, forum: FaIconPicker) -->
            <div v-if="editModal.type === 'game'">
              <label class="block text-xs font-medium text-gray-400 mb-1">Icon (FA class or emoji)</label>
              <div class="space-y-2">
                <FaIconPicker v-model="editModal.form.icon" />
              </div>
            </div>
            <div v-if="editModal.type === 'forum'">
              <label class="block text-xs font-medium text-gray-400 mb-1">Icon</label>
              <FaIconPicker v-model="editModal.form.icon" />
            </div>
            <!-- Description -->
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Description</label>
              <textarea v-model="editModal.form.description" rows="3" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none resize-none"></textarea>
            </div>
            <!-- Display Order -->
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Display Order</label>
              <input v-model.number="editModal.form.display_order" type="number" min="0" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-violet-500 focus:outline-none" />
            </div>
            <!-- is_active toggle -->
            <div class="flex items-center justify-between">
              <label class="text-sm text-gray-300">Active</label>
              <button
                type="button"
                @click="editModal.form.is_active = !editModal.form.is_active"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="editModal.form.is_active ? 'bg-violet-600' : 'bg-gray-600'"
              >
                <span class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200" :class="editModal.form.is_active ? 'translate-x-6' : 'translate-x-1'" />
              </button>
            </div>
          </div>
          <div class="px-6 py-4 border-t border-gray-700/50 flex justify-end gap-3">
            <button @click="closeEditModal" class="px-4 py-2 bg-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
            <button @click="saveEdit" :disabled="editModal.saving" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              {{ editModal.saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
