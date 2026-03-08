<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { submitBugReport } from '../../services/api'
import { useToastStore } from '../../stores/toast'

const router = useRouter()
const toast = useToastStore()

const form = ref({
  title: '',
  severity: 'medium',
  description: '',
  steps_to_reproduce: '',
  page_url: '',
  environment: '',
})

const attachments = ref([])
const previews = ref([])
const submitting = ref(false)
const errors = ref({})

function handleFiles(event) {
  const files = Array.from(event.target.files || [])
  const totalCount = attachments.value.length + files.length
  if (totalCount > 5) {
    toast.show('Maximum 5 attachments allowed.', 'error')
    event.target.value = ''
    return
  }
  for (const file of files) {
    attachments.value.push(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      previews.value.push({ name: file.name, url: e.target.result })
    }
    reader.readAsDataURL(file)
  }
  event.target.value = ''
}

function removeFile(index) {
  attachments.value.splice(index, 1)
  previews.value.splice(index, 1)
}

function validate() {
  const errs = {}
  if (!form.value.title.trim()) errs.title = 'Title is required.'
  if (form.value.title.length > 150) errs.title = 'Title must be 150 characters or less.'
  if (!form.value.description.trim()) errs.description = 'Description is required.'
  if (form.value.description.length > 5000) errs.description = 'Description must be 5000 characters or less.'
  if (form.value.steps_to_reproduce.length > 3000) errs.steps_to_reproduce = 'Steps must be 3000 characters or less.'
  errors.value = errs
  return Object.keys(errs).length === 0
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('title', form.value.title.trim())
    formData.append('severity', form.value.severity)
    formData.append('description', form.value.description.trim())
    if (form.value.steps_to_reproduce.trim()) {
      formData.append('steps_to_reproduce', form.value.steps_to_reproduce.trim())
    }
    if (form.value.page_url.trim()) {
      formData.append('url', form.value.page_url.trim())
    }
    if (form.value.environment.trim()) {
      formData.append('environment', form.value.environment.trim())
    }
    for (const file of attachments.value) {
      formData.append('attachments[]', file)
    }
    await submitBugReport(formData)
    toast.show('Bug report submitted successfully!', 'success')
    router.push('/bugs')
  } catch (err) {
    if (err.response?.data?.errors) {
      errors.value = {}
      const serverErrors = err.response.data.errors
      for (const key in serverErrors) {
        errors.value[key] = Array.isArray(serverErrors[key]) ? serverErrors[key][0] : serverErrors[key]
      }
    } else {
      toast.show('Failed to submit bug report.', 'error')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-6">
    <!-- Header -->
    <div class="mb-6">
      <router-link to="/bugs" class="text-sm text-gray-400 hover:text-violet-400 transition-colors">
        <i class="fa-solid fa-arrow-left mr-1"></i> Back to Bug Reports
      </router-link>
      <h1 class="text-2xl font-bold text-white mt-3 flex items-center gap-3">
        <i class="fa-solid fa-bug text-violet-400"></i>
        Submit Bug Report
      </h1>
    </div>

    <!-- Form Card -->
    <div class="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <form @submit.prevent="submit" class="space-y-5">
        <!-- Title -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Title</label>
          <input v-model="form.title" type="text" maxlength="150"
            placeholder="Brief summary of the bug"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" />
          <div class="flex justify-between mt-1">
            <span v-if="errors.title" class="text-xs text-red-400">{{ errors.title }}</span>
            <span v-else></span>
            <span class="text-xs text-gray-500">{{ form.title.length }}/150</span>
          </div>
        </div>

        <!-- Severity -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Severity</label>
          <select v-model="form.severity"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Description</label>
          <textarea v-model="form.description" rows="5" maxlength="5000"
            placeholder="Describe what happened..."
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none resize-y"></textarea>
          <div class="flex justify-between mt-1">
            <span v-if="errors.description" class="text-xs text-red-400">{{ errors.description }}</span>
            <span v-else></span>
            <span class="text-xs text-gray-500">{{ form.description.length }}/5000</span>
          </div>
        </div>

        <!-- Steps to Reproduce -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Steps to Reproduce</label>
          <textarea v-model="form.steps_to_reproduce" rows="4" maxlength="3000"
            placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none resize-y"></textarea>
          <div class="flex justify-between mt-1">
            <span v-if="errors.steps_to_reproduce" class="text-xs text-red-400">{{ errors.steps_to_reproduce }}</span>
            <span v-else></span>
            <span class="text-xs text-gray-500">{{ form.steps_to_reproduce.length }}/3000</span>
          </div>
        </div>

        <!-- Page URL -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Page URL</label>
          <input v-model="form.page_url" type="text"
            placeholder="e.g. /forums/help — leave blank if unsure"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" />
        </div>

        <!-- Environment -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Environment</label>
          <input v-model="form.environment" type="text"
            placeholder="e.g. Chrome 122, Windows 11, iPhone 14 / iOS 17"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" />
        </div>

        <!-- Attachments -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Attachments</label>
          <div class="flex items-center gap-3">
            <label
              class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg cursor-pointer transition-colors inline-flex items-center gap-2">
              <i class="fa-solid fa-paperclip"></i>
              Choose Images
              <input type="file" accept="image/*" multiple @change="handleFiles" class="hidden" />
            </label>
            <span class="text-xs text-gray-500">Max 5 images</span>
          </div>

          <!-- Previews -->
          <div v-if="previews.length" class="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3">
            <div v-for="(preview, idx) in previews" :key="idx" class="relative group">
              <img :src="preview.url" :alt="preview.name"
                class="w-full h-20 object-cover rounded-lg border border-gray-700" />
              <button type="button" @click="removeFile(idx)"
                class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <i class="fa-solid fa-xmark"></i>
              </button>
              <p class="text-xs text-gray-500 truncate mt-1">{{ preview.name }}</p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3 pt-2">
          <button type="submit" :disabled="submitting"
            class="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
            <i v-if="submitting" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-paper-plane"></i>
            {{ submitting ? 'Submitting...' : 'Submit Report' }}
          </button>
          <router-link to="/bugs" class="text-sm text-gray-400 hover:text-gray-300 transition-colors">
            Cancel
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>
