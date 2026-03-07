<script setup>
const sampleCode = `function fibonacci(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

// Calculate first 10 Fibonacci numbers
const results = Array.from({ length: 10 }, (_, i) => fibonacci(i));
console.log(results); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]`
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <router-link to="/admin/plugins" class="text-gray-400 hover:text-white transition-colors">
        <i class="fa-solid fa-arrow-left text-sm"></i>
      </router-link>
      <h2 class="text-lg font-semibold text-white">Code Paste</h2>
    </div>

    <!-- Info -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-5 space-y-3">
      <h3 class="text-sm font-semibold text-white flex items-center gap-2">
        <i class="fa-solid fa-code text-violet-400 text-xs"></i>
        About This Plugin
      </h3>
      <p class="text-sm text-gray-400">
        Enhances code blocks in posts with syntax highlighting, line numbers, and a copy-to-clipboard button.
        Supports all major programming languages including JavaScript, PHP, Python, Go, Rust, and more.
      </p>
    </div>

    <!-- Status -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-5 space-y-3">
      <h3 class="text-sm font-semibold text-white flex items-center gap-2">
        <i class="fa-solid fa-circle-check text-green-400 text-xs"></i>
        Status
      </h3>
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-green-500"></span>
        <span class="text-sm text-green-400 font-medium">Active — code blocks are being enhanced automatically.</span>
      </div>
    </div>

    <!-- How it works -->
    <div class="bg-blue-500/10 rounded-xl border border-blue-500/20 p-4 flex items-start gap-3">
      <i class="fa-solid fa-circle-info text-blue-400 mt-0.5"></i>
      <p class="text-sm text-blue-300">
        Code blocks in posts using <code class="bg-blue-500/20 px-1.5 py-0.5 rounded text-xs font-mono">```</code> fences
        or <code class="bg-blue-500/20 px-1.5 py-0.5 rounded text-xs font-mono">[code]</code> BBCode are automatically
        enhanced with syntax highlighting, line numbers, and a copy button.
      </p>
    </div>

    <!-- Live Preview -->
    <div class="bg-gray-800 rounded-xl border border-gray-700/50 p-5 space-y-3">
      <h3 class="text-sm font-semibold text-white flex items-center gap-2">
        <i class="fa-solid fa-eye text-gray-400 text-xs"></i>
        Live Preview
      </h3>
      <div class="bg-gray-900 rounded-lg border border-gray-700/50 overflow-hidden">
        <div class="flex items-center justify-between px-4 py-2 bg-gray-800/80 border-b border-gray-700/50">
          <span class="text-xs text-gray-400 font-mono">javascript</span>
          <button class="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
            <i class="fa-regular fa-copy"></i> Copy
          </button>
        </div>
        <pre class="p-4 overflow-x-auto"><code class="text-sm font-mono leading-relaxed"><template v-for="(line, i) in sampleCode.split('\n')" :key="i"><span class="inline-block w-8 text-right mr-4 text-gray-600 select-none">{{ i + 1 }}</span><span class="text-gray-300">{{ line }}
</span></template></code></pre>
      </div>
    </div>
  </div>
</template>
