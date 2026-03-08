<script setup>
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <h2 class="text-lg font-semibold text-white">Thread Polls</h2>
    </div>

    <!-- Info -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-5 space-y-3">
      <h3 class="text-sm font-semibold text-white flex items-center gap-2">
        <i class="fa-solid fa-square-poll-vertical text-violet-400 text-xs"></i>
        How Polls Work
      </h3>
      <p class="text-sm text-gray-400">
        Add polls to threads via the thread creation form (coming soon). Users can vote once per poll.
        Poll results are displayed in real-time within the thread view.
      </p>
    </div>

    <!-- Stats -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-5 space-y-3">
      <h3 class="text-sm font-semibold text-white flex items-center gap-2">
        <i class="fa-solid fa-circle-check text-green-400 text-xs"></i>
        System Status
      </h3>
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-green-500"></span>
        <span class="text-sm text-green-400 font-medium">Active</span>
      </div>
      <p class="text-xs text-gray-500">The poll system is running and ready to accept polls.</p>
    </div>

    <!-- Config -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-5 space-y-4">
      <h3 class="text-sm font-semibold text-white flex items-center gap-2">
        <i class="fa-solid fa-gear text-gray-400 text-xs"></i>
        Configuration
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-gray-700/40 rounded-lg border border-gray-600/40 p-4">
          <p class="text-xs text-gray-400 mb-1">Max Options Per Poll</p>
          <p class="text-lg font-semibold text-white">10</p>
        </div>
        <div class="bg-gray-700/40 rounded-lg border border-gray-600/40 p-4">
          <p class="text-xs text-gray-400 mb-1">Multiple Choice</p>
          <p class="text-lg font-semibold text-white">Supported</p>
        </div>
        <div class="bg-gray-700/40 rounded-lg border border-gray-600/40 p-4">
          <p class="text-xs text-gray-400 mb-1">Close Date</p>
          <p class="text-lg font-semibold text-white">Supported</p>
        </div>
      </div>
    </div>

    <!-- Note -->
    <div class="bg-blue-500/10 rounded-xl border border-blue-500/20 p-4 flex items-start gap-3">
      <i class="fa-solid fa-circle-info text-blue-400 mt-0.5"></i>
      <p class="text-sm text-blue-300">
        Polls are created by thread authors from the thread creation page. An admin list endpoint will be available in a future update.
      </p>
    </div>
  </div>
</template>
