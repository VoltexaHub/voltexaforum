import { nextTick, watch } from 'vue'
import hljs from 'highlight.js/lib/core'

// Register languages (tree-shakeable — only these get bundled)
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import php from 'highlight.js/lib/languages/php'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'
import java from 'highlight.js/lib/languages/java'
import csharp from 'highlight.js/lib/languages/csharp'
import cpp from 'highlight.js/lib/languages/cpp'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import ruby from 'highlight.js/lib/languages/ruby'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'
import lua from 'highlight.js/lib/languages/lua'
import swift from 'highlight.js/lib/languages/swift'
import kotlin from 'highlight.js/lib/languages/kotlin'

const langs = {
  javascript, js: javascript, typescript, ts: typescript,
  python, py: python, php, css,
  html: xml, xml, json,
  bash, sh: bash, shell: bash,
  sql, java, csharp, cs: csharp,
  cpp, c: cpp, go, rust, rs: rust,
  ruby, rb: ruby, yaml, yml: yaml,
  markdown, md: markdown, lua,
  swift, kotlin, kt: kotlin,
}

Object.entries(langs).forEach(([name, lang]) => hljs.registerLanguage(name, lang))

/**
 * Enhance all <pre><code> blocks inside a container element with
 * syntax highlighting, line numbers, language label, and copy button.
 */
export function enhanceCodeBlocks(containerEl) {
  if (!containerEl) return

  containerEl.querySelectorAll('pre').forEach((pre) => {
    if (pre.dataset.codePaste) return
    pre.dataset.codePaste = '1'

    const code = pre.querySelector('code')
    if (!code) return

    // Remove s9e's injected hljs script tag (BBCode [code] blocks)
    pre.querySelectorAll('script[data-hljs-style]').forEach((s) => s.remove())

    // Detect language from class="language-xxx" (CommonMark adds this)
    const langMatch = code.className.match(/language-(\w+)/)
    const lang = langMatch ? langMatch[1] : null
    const displayLang = lang ? lang.toUpperCase() : 'CODE'

    // Store raw text before highlighting (for copy button)
    const rawText = code.textContent

    // Syntax highlight
    if (lang && hljs.getLanguage(lang)) {
      code.innerHTML = hljs.highlight(rawText, { language: lang }).value
    } else {
      const result = hljs.highlightAuto(rawText)
      code.innerHTML = result.value
    }

    // ── Build enhanced wrapper ──────────────────────────────────────
    pre.classList.add('code-paste-block')

    // Header bar
    const header = document.createElement('div')
    header.className = 'code-paste-header'

    const langLabel = document.createElement('span')
    langLabel.className = 'code-paste-lang'
    langLabel.textContent = displayLang

    const copyBtn = document.createElement('button')
    copyBtn.className = 'code-paste-copy'
    copyBtn.type = 'button'
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy'
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(rawText).then(() => {
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!'
        copyBtn.classList.add('copied')
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy'
          copyBtn.classList.remove('copied')
        }, 2000)
      })
    })

    header.appendChild(langLabel)
    header.appendChild(copyBtn)
    pre.insertBefore(header, pre.firstChild)

    // Line numbers
    const lines = code.innerHTML.split('\n')
    if (lines.length > 1 && lines[lines.length - 1].trim() === '') lines.pop()

    const lineNumbersDiv = document.createElement('div')
    lineNumbersDiv.className = 'code-paste-line-numbers'
    lineNumbersDiv.innerHTML = lines.map((_, i) => `<span>${i + 1}</span>`).join('\n')

    // Scrollable body
    const body = document.createElement('div')
    body.className = 'code-paste-body'
    body.appendChild(lineNumbersDiv)

    const codeWrap = document.createElement('div')
    codeWrap.className = 'code-paste-code'
    codeWrap.appendChild(code)

    body.appendChild(codeWrap)
    pre.appendChild(body)
  })
}

/**
 * Vue composable — auto-enhance code blocks when rendered content changes.
 *
 * Usage in MarkdownRenderer.vue:
 *   const { enhanceCodeBlocks } = useCodePaste(container, rendered)
 *   onMounted(() => nextTick(() => enhanceCodeBlocks()))
 */
export function useCodePaste(containerRef, renderedRef) {
  const run = () => nextTick(() => enhanceCodeBlocks(containerRef.value))
  watch(renderedRef, run)
  return { enhanceCodeBlocks: run }
}
