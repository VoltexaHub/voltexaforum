/**
 * Formats post body text with @mention highlighting.
 * Strips HTML tags for basic XSS protection before processing.
 *
 * @param {string} body - Raw post body text
 * @param {string} currentUsername - The logged-in user's username (for self-mention highlighting)
 * @returns {string} HTML string with @mentions wrapped as links
 */
export function formatPostBody(body, currentUsername) {
  if (!body) return ''

  // Strip HTML tags for basic XSS protection
  let safe = body.replace(/<[^>]*>/g, '')

  // Escape HTML entities
  safe = safe
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Replace @mentions with styled links
  safe = safe.replace(/@(\w+)/g, (match, username) => {
    const isSelf = currentUsername && username.toLowerCase() === currentUsername.toLowerCase()
    const classes = isSelf
      ? 'text-purple-accent font-medium hover:underline bg-purple-accent/10 px-0.5 rounded'
      : 'text-purple-accent font-medium hover:underline'
    return `<a href="/profile/${username}" class="${classes}">@${username}</a>`
  })

  return safe
}
