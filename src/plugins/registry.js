// Plugin registry — maps plugin slots to components
// To add a plugin's frontend: import its plugin.js and merge into registry

const registry = {
  slots: {},
  categoryTypes: {},
  adminPages: [],
}

function registerPlugin(pluginDef) {
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

// Register active plugins
import announcementsPlugin from './announcements/plugin.js'
registerPlugin(announcementsPlugin)

export const pluginRegistry = registry
export { registerPlugin }
