import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

window.Pusher = Pusher

export default new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY || 'voltexahub-key',
  wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
  wsPort: import.meta.env.VITE_REVERB_PORT || 443,
  wssPort: import.meta.env.VITE_REVERB_PORT || 443,
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'https') === 'https',
  enabledTransports: ['ws', 'wss'],
  authEndpoint: `${window.location.origin}/broadcasting/auth`,
  auth: {
    headers: {
      Authorization: 'Bearer ' + localStorage.getItem('voltexahub_token'),
    },
  },
})
