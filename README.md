# VoltexaHub — Frontend

The Vue 3 frontend for [VoltexaHub](https://github.com/VoltexaHub/voltexahub) — a self-hosted, open-source community forum platform.

## Stack

- **Vue 3** + Composition API
- **Vite** — build tool
- **Tailwind CSS v4**
- **Pinia** — state management
- **Vue Router**
- **Axios** — HTTP client
- **Laravel Echo + Reverb** — real-time WebSockets
- **Font Awesome 6 Free** — icons

## Development Setup

Requires the [VoltexaHub backend](https://github.com/VoltexaHub/voltexahub) running on port 8000.

```bash
npm install
npm run dev
```

Frontend runs at http://localhost:5173

## Production Build

```bash
npm run build
```

Output goes to `dist/` — serve with Nginx.

## Plugin Frontend Extensions

Plugins can add Vue components, routes, and slot injections by placing files in `src/plugins/{slug}/`:

```
src/plugins/my-plugin/
  plugin.js     # registers slots, category types, admin pages
  routes.js     # Vue Router routes (auto-merged on build)
  *.vue         # components
```

See [Plugin System docs](https://docs.voltexahub.com) for the full developer guide.

## Links

- **Backend repo:** https://github.com/VoltexaHub/voltexahub
- **Docs:** https://docs.voltexahub.com
- **Website:** https://voltexahub.com

## License

MIT
