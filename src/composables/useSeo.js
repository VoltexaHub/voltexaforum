import { computed, unref } from 'vue'
import { useHead } from '@unhead/vue'
import { useForumStore } from '../stores/forum'

export function useSeo({ title, description, ogImage, url, type, jsonLd } = {}) {
  const forumStore = useForumStore()

  const siteName = computed(() => forumStore.config?.forum_name || 'My Forum')
  const seoDescription = computed(() => unref(description) || forumStore.config?.seo_description || '')
  const titleFormat = computed(() => forumStore.config?.seo_title_format || '{page} | {site}')
  const defaultOgImage = computed(() => forumStore.config?.seo_og_image || '')
  const twitterHandle = computed(() => forumStore.config?.seo_twitter_handle || '')
  const noindex = computed(() => {
    const v = forumStore.config?.seo_noindex
    return v === 'true' || v === true
  })

  const fullTitle = computed(() => {
    const page = unref(title)
    if (!page) return siteName.value
    return titleFormat.value
      .replace('{page}', page)
      .replace('{site}', siteName.value)
  })

  const resolvedOgImage = computed(() => unref(ogImage) || defaultOgImage.value)
  const resolvedUrl = computed(() => unref(url) || '')
  const resolvedType = computed(() => unref(type) || 'website')
  const resolvedJsonLd = computed(() => unref(jsonLd) || null)

  useHead({
    title: fullTitle,
    meta: computed(() => {
      const meta = [
        { name: 'description', content: seoDescription.value },
        { property: 'og:title', content: fullTitle.value },
        { property: 'og:description', content: seoDescription.value },
        { property: 'og:type', content: resolvedType.value },
        { property: 'og:site_name', content: siteName.value },
      ]

      if (resolvedOgImage.value) {
        meta.push({ property: 'og:image', content: resolvedOgImage.value })
      }

      if (resolvedUrl.value) {
        meta.push({ property: 'og:url', content: resolvedUrl.value })
        meta.push({ rel: 'canonical', href: resolvedUrl.value })
      }

      if (twitterHandle.value) {
        meta.push({ name: 'twitter:card', content: 'summary_large_image' })
        meta.push({ name: 'twitter:site', content: twitterHandle.value })
      }

      if (noindex.value) {
        meta.push({ name: 'robots', content: 'noindex, nofollow' })
      }

      return meta
    }),
    link: computed(() => {
      if (resolvedUrl.value) {
        return [{ rel: 'canonical', href: resolvedUrl.value }]
      }
      return []
    }),
    script: computed(() => {
      if (resolvedJsonLd.value) {
        return [{
          type: 'application/ld+json',
          innerHTML: JSON.stringify(resolvedJsonLd.value),
        }]
      }
      return []
    }),
  })
}
