<template>
  <div class="space-y-6">
    <!-- Export Section -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6">
      <h2 class="text-lg font-semibold text-white mb-1">Export Database</h2>
      <p class="text-sm text-gray-400 mb-5">Download a full compressed backup of your database (.sql.gz)</p>

      <button
        @click="handleExport"
        :disabled="exporting"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <i v-if="exporting" class="fa-solid fa-spinner fa-spin"></i>
        <i v-else class="fa-solid fa-download"></i>
        {{ exporting ? 'Exporting...' : 'Export & Download' }}
      </button>
    </div>

    <!-- Import Section -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-6">
      <h2 class="text-lg font-semibold text-white mb-1">Import / Restore Database</h2>

      <div class="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-5">
        <i class="fa-solid fa-triangle-exclamation text-amber-400 mt-0.5"></i>
        <p class="text-sm text-amber-300">This will <strong>OVERWRITE</strong> your entire database. This cannot be undone.</p>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm text-gray-400 mb-2">Select backup file (.gz)</label>
          <div class="flex items-center gap-3">
            <label class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600">
              <i class="fa-solid fa-file"></i>
              Choose File
              <input type="file" accept=".gz" class="hidden" @change="onFileSelected" ref="fileInput" />
            </label>
            <span v-if="selectedFile" class="text-sm text-gray-300">{{ selectedFile.name }}</span>
            <span v-else class="text-sm text-gray-500">No file selected</span>
          </div>
        </div>

        <button
          @click="showConfirmModal = true"
          :disabled="!selectedFile || importing"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i v-if="importing" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-solid fa-upload"></i>
          {{ importing ? 'Restoring...' : 'Restore Database' }}
        </button>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showConfirmModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" @click="showConfirmModal = false"></div>
        <div class="relative bg-gray-800 rounded-xl border border-gray-700/50 p-6 max-w-md w-full mx-4 shadow-2xl">
          <h3 class="text-lg font-semibold text-white mb-2">Confirm Database Restore</h3>
          <p class="text-sm text-gray-400 mb-5">Are you sure? This will permanently overwrite all data in the database. This action cannot be undone.</p>
          <div class="flex items-center justify-end gap-3">
            <button
              @click="showConfirmModal = false"
              class="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-300 transition-colors"
            >Cancel</button>
            <button
              @click="showConfirmModal = false; showReauth = true"
              class="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
            >Yes, Restore</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Re-auth Modal -->
    <ReauthModal
      v-model="showReauth"
      title="Confirm Database Restore"
      description="Verify your identity before restoring the database."
      @confirmed="handleImport"
    />

    <!-- Toast Notification -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="toast.show"
          class="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium"
          :class="toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'"
        >
          {{ toast.message }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { exportDatabase, importDatabase } from '../../services/api'
import ReauthModal from '../../components/admin/ReauthModal.vue'

const exporting = ref(false)
const importing = ref(false)
const selectedFile = ref(null)
const showConfirmModal = ref(false)
const fileInput = ref(null)

const showReauth = ref(false)
const toast = ref({ show: false, message: '', type: 'success' })

function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 4000)
}

function onFileSelected(e) {
  selectedFile.value = e.target.files[0] || null
}

async function handleExport() {
  exporting.value = true
  try {
    const res = await exportDatabase()
    const blob = new Blob([res.data], { type: 'application/gzip' })
    const disposition = res.headers['content-disposition'] || ''
    const match = disposition.match(/filename="?(.+?)"?$/)
    const filename = match ? match[1] : `voltexahub-backup-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.sql.gz`

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    showToast('Database exported successfully')
  } catch (e) {
    showToast(e.response?.data?.message || 'Export failed', 'error')
  } finally {
    exporting.value = false
  }
}

async function handleImport() {
  showConfirmModal.value = false
  importing.value = true
  try {
    const formData = new FormData()
    formData.append('backup_file', selectedFile.value)
    const res = await importDatabase(formData)
    showToast(res.data.message || 'Database restored successfully')
    selectedFile.value = null
    if (fileInput.value) fileInput.value.value = ''
  } catch (e) {
    showToast(e.response?.data?.message || 'Import failed', 'error')
  } finally {
    importing.value = false
  }
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
