import { ref, watchEffect } from 'vue'

// Persist preference in localStorage, default to dark
const stored = localStorage.getItem('theme')
const isDark = ref(stored ? stored === 'dark' : true)

watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDark.value)
})

export function useTheme() {
  function toggle() {
    isDark.value = !isDark.value
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  return { isDark, toggle }
}
