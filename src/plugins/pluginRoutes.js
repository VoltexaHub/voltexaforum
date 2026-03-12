// Auto-discovers and merges routes from all installed plugin route files
// Plugins add a src/plugins/{slug}/routes.js that exports an array of Vue Router route objects

const routeModules = import.meta.glob('./*/routes.js', { eager: true })

const pluginRoutes = []

for (const path in routeModules) {
  const mod = routeModules[path]
  const routes = mod?.default
  if (Array.isArray(routes)) {
    pluginRoutes.push(...routes)
  }
}

export default pluginRoutes
