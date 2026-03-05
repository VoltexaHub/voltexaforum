<script setup>
import { ref, onMounted } from 'vue'
import { getAdminThreadPrefixes, createThreadPrefix, updateThreadPrefix, deleteThreadPrefix } from '../../services/api'
import { useToastStore } from '../../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const prefixes = ref([])

const showForm = ref(false)
const editing = ref(null)
const form = ref({ name: '', color: '#7c3aed', bg_color: '#7c3aed1a', text_color: '#a78bfa', display_order: 0, is_active: true })

function resetForm() {
  form.value = { name: '', color: '#7c3aed', bg_color: '#7c3aed1a', text_color: '#a78bfa', display_order: 0, is_active: true }
  editing.value = null
}

async function fetchPrefixes() {
  loading.value = true
  try {
    const res = await getAdminThreadPrefixes()
    prefixes.value = res.data.data || res.data || []
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to load prefixes', 'error')
  } finally {
    loading.value = false
  }
}

function startEdit(prefix) {
  editing.value = prefix.id
  form.value = { name: prefix.name, color: prefix.color, bg_color: prefix.bg_color, text_color: prefix.text_color, display_order: prefix.display_order, is_active: prefix.is_active }
  showForm.value = true
}

function startCreate() {
  resetForm()
  showForm.value = true
}

async function submitForm() {
  try {
    if (editing.value) {
      await updateThreadPrefix(editing.value, form.value)
      toast.show('Prefix updated')
    } else {
      await createThreadPrefix(form.value)
      toast.show('Prefix created')
    }
    showForm.value = false
    resetForm()
    fetchPrefixes()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to save prefix', 'error')
  }
}

async function toggleActive(prefix) {
  try {
    await updateThreadPrefix(prefix.id, { is_active: !prefix.is_active })
    prefix.is_active = !prefix.is_active
    toast.show(prefix.is_active ? 'Prefix activated' : 'Prefix deactivated')
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to update', 'error')
  }
}

async function doDelete(prefix) {
  if (!confirm(`Delete "${prefix.name}"? This cannot be undone.`)) return
  try {
    await deleteThreadPrefix(prefix.id)
    toast.show('Prefix deleted')
    fetchPrefixes()
  } catch (e) {
    toast.show(e.response?.data?.message || 'Failed to delete', 'error')
  }
}

onMounted(fetchPrefixes)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-white">Thread Prefixes</h2>
        <p class="text-sm text-gray-500 mt-1">Manage colored labels users can add to threads.</p>
      </div>
      <button @click="startCreate" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors">
        <i class="fa-solid fa-plus mr-1.5"></i> New Prefix
      </button>
    </div>

    <!-- Create / Edit form -->
    <div v-if="showForm" class="rounded-xl bg-gray-800/50 border border-gray-700 p-5 mb-6">
      <h3 class="text-sm font-semibold text-gray-300 mb-4">{{ editing ? 'Edit Prefix' : 'Create Prefix' }}</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Name</label>
          <input v-model="form.name" type="text" maxlength="50" class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Display Order</label>
          <input v-model.number="form.display_order" type="number" class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Border Color</label>
          <div class="flex items-center gap-2">
            <input v-model="form.color" type="color" class="w-8 h-8 rounded border-0 cursor-pointer" />
            <input v-model="form.color" type="text" class="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Background Color</label>
          <input v-model="form.bg_color" type="text" class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">Text Color</label>
          <div class="flex items-center gap-2">
            <input v-model="form.text_color" type="color" class="w-8 h-8 rounded border-0 cursor-pointer" />
            <input v-model="form.text_color" type="text" class="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" />
          </div>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs font-medium text-gray-400">Active</label>
          <button @click="form.is_active = !form.is_active" class="w-10 h-5 rounded-full transition-colors" :class="form.is_active ? 'bg-green-500' : 'bg-gray-600'">
            <div class="w-4 h-4 bg-white rounded-full transition-transform mx-0.5" :class="form.is_active ? 'translate-x-5' : 'translate-x-0'" />
          </button>
        </div>
      </div>
      <!-- Preview -->
      <div class="mt-4 flex items-center gap-3">
        <span class="text-xs text-gray-500">Preview:</span>
        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold"
          :style="{ background: form.bg_color, color: form.text_color, border: `1px solid ${form.color}40` }">
          {{ form.name || 'Example' }}
        </span>
      </div>
      <div class="flex items-center gap-2 mt-4">
        <button @click="submitForm" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors">
          {{ editing ? 'Update' : 'Create' }}
        </button>
        <button @click="showForm = false; resetForm()" class="px-4 py-2 text-gray-400 hover:text-white rounded-lg text-sm font-medium transition-colors">Cancel</button>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
      <div v-if="loading" class="p-8 text-center text-gray-500">Loading...</div>
      <div v-else-if="!prefixes.length" class="p-8 text-center text-gray-500">No prefixes yet.</div>
      <table v-else class="w-full">
        <thead>
          <tr class="border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500">
            <th class="px-5 py-3 text-left">Preview</th>
            <th class="px-5 py-3 text-left">Name</th>
            <th class="px-5 py-3 text-center">Order</th>
            <th class="px-5 py-3 text-center">Active</th>
            <th class="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="prefix in prefixes" :key="prefix.id" class="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
            <td class="px-5 py-3">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold"
                :style="{ background: prefix.bg_color, color: prefix.text_color, border: `1px solid ${prefix.color}40` }">
                {{ prefix.name }}
              </span>
            </td>
            <td class="px-5 py-3 text-sm text-gray-300">{{ prefix.name }}</td>
            <td class="px-5 py-3 text-sm text-gray-400 text-center">{{ prefix.display_order }}</td>
            <td class="px-5 py-3 text-center">
              <button @click="toggleActive(prefix)" class="text-xs px-2 py-0.5 rounded-full font-medium" :class="prefix.is_active ? 'bg-green-500/15 text-green-400' : 'bg-gray-700 text-gray-500'">
                {{ prefix.is_active ? 'Active' : 'Inactive' }}
              </button>
            </td>
            <td class="px-5 py-3 text-right">
              <button @click="startEdit(prefix)" class="text-xs text-gray-500 hover:text-violet-400 px-2 py-1 transition-colors"><i class="fa-solid fa-pen"></i></button>
              <button @click="doDelete(prefix)" class="text-xs text-gray-500 hover:text-red-400 px-2 py-1 transition-colors"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
