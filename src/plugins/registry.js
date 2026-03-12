// Plugin registry — auto-discovers src/plugins/*/plugin.js
const registry = {
  slots: {},
  categoryTypes: {},
  adminPages: [],
}

function registerPlugin(pluginDef) {
  if (!pluginDef) return
  if (pluginDef.slots) {
    for (const [slotName, component] of Object.entries(pluginDef.slots)) {
      if (!registry.slots[slotName]) registry.slots[slotName] = []
      registry.slots[slotName].push({ component })
    }
  }
  if (pluginDef.categoryTypes) {
    Object.assign(registry.categoryTypes, pluginDef.categoryTypes)
  }
  if (pluginDef.adminPages) {
    registry.adminPages.push(...pluginDef.adminPages)
  }
}

// Auto-discover all plugin.js files in src/plugins/*/
const pluginModules = import.meta.glob('./*/plugin.js', { eager: true })
for (const path in pluginModules) {
  const mod = pluginModules[path]
  if (mod?.default) registerPlugin(mod.default)
}

export const pluginRegistry = registry
export { registerPlugin }
