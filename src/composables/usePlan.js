import { ref } from 'vue'
import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:8000/api')

// Shared state — fetched once per session
const fetched = ref(false)
const planName = ref('self-hosted')
const maxMembers = ref(0)
const maxForums = ref(0)
const maxUploadMb = ref(0)
const maxEmailPerDay = ref(0)
const customDomain = ref(true)
const pluginsEnabled = ref(true)
const customThemes = ref(true)
const removeBranding = ref(true)
const backupSchedule = ref('daily')

const upgradeUrl = 'https://billing.voltexahub.com'

function isUnlimited(value) {
  return value === 0
}

async function fetchPlan() {
  if (fetched.value) return
  fetched.value = true
  try {
    const token = localStorage.getItem('voltexahub_token')
    const res = await axios.get(`${baseURL}/plan`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    const p = res.data
    planName.value = p.plan || 'self-hosted'
    maxMembers.value = p.max_members ?? 0
    maxForums.value = p.max_forums ?? 0
    maxUploadMb.value = p.max_upload_mb ?? 0
    maxEmailPerDay.value = p.max_email_per_day ?? 0
    customDomain.value = p.custom_domain ?? true
    pluginsEnabled.value = p.plugins_enabled ?? true
    customThemes.value = p.custom_themes ?? true
    removeBranding.value = p.remove_branding ?? true
    backupSchedule.value = p.backup_schedule ?? 'daily'
  } catch {
    // Self-hosted or endpoint missing — keep unlimited defaults
  }
}

export function usePlan() {
  fetchPlan()

  return {
    planName,
    maxMembers,
    maxForums,
    maxUploadMb,
    maxEmailPerDay,
    customDomain,
    pluginsEnabled,
    customThemes,
    removeBranding,
    backupSchedule,
    upgradeUrl,
    isUnlimited,
  }
}
