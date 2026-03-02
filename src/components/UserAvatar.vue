<script setup>
defineProps({
  name: String,
  color: { type: String, default: 'bg-purple-500' },
  online: { type: Boolean, default: false },
  size: { type: String, default: 'md' },
  avatarUrl: { type: String, default: null },
})
</script>

<template>
  <div class="relative inline-flex shrink-0">
    <img
      v-if="avatarUrl"
      :src="avatarUrl"
      :alt="name"
      class="rounded-full object-cover"
      :class="[
        size === 'sm' ? 'w-8 h-8'
          : size === 'lg' ? 'w-14 h-14'
          : size === 'xl' ? 'w-20 h-20'
          : 'w-10 h-10',
      ]"
    />
    <div
      v-else
      :class="[
        color,
        size === 'sm' ? 'w-8 h-8 text-xs'
          : size === 'lg' ? 'w-14 h-14 text-lg'
          : size === 'xl' ? 'w-20 h-20 text-2xl'
          : 'w-10 h-10 text-sm',
        'rounded-full flex items-center justify-center font-bold text-white uppercase',
      ]"
    >
      {{ name?.charAt(0) }}
    </div>
    <span
      v-if="online"
      class="absolute bottom-0 right-0 bg-green-500 rounded-full"
      :class="[
        size === 'sm' ? 'w-2.5 h-2.5'
          : size === 'xl' ? 'w-4 h-4'
          : 'w-3 h-3',
      ]"
      style="border: 2px solid var(--bg-card)"
    />
  </div>
</template>
