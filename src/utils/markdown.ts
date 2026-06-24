// CommonMark + GFM markdown renderer for blog content.
//
// Built on `marked` (parsing + GFM extensions) with a custom renderer that
// stamps Tailwind classes onto the output so previews match the app's look,
// then run through DOMPurify to strip any injected scripts / event handlers
// before the HTML is set with dangerouslySetInnerHTML.

import { marked } from 'marked'
import type { Token, Tokens } from 'marked'
import DOMPurify from 'dompurify'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const HEADING_CLASSES: Record<number, string> = {
  1: 'text-3xl font-extrabold mt-8 mb-4 pb-2',
  2: 'text-2xl font-bold mt-6 mb-3 border-b border-slate-100 dark:border-zinc-800 pb-1',
  3: 'text-xl font-bold mt-4 mb-2',
  4: 'text-lg font-bold mt-4 mb-2',
  5: 'text-base font-bold mt-4 mb-2',
  6: 'text-sm font-bold mt-4 mb-2',
}

// A small `this` shape so we can call back into marked's parser to render
// child tokens without disabling typechecking outright.
interface RendererThis {
  parser: {
    parseInline(tokens: Token[]): string
    parse(tokens: Token[]): string
  }
}

marked.use({
  gfm:    true,
  breaks: false,
  renderer: {
    heading(this: RendererThis, token: Tokens.Heading) {
      const text = this.parser.parseInline(token.tokens)
      const cls  = HEADING_CLASSES[token.depth] ?? HEADING_CLASSES[6]
      return `<h${token.depth} class="${cls} text-slate-900 dark:text-zinc-100">${text}</h${token.depth}>`
    },
    paragraph(this: RendererThis, token: Tokens.Paragraph) {
      return `<p class="my-3 leading-relaxed">${this.parser.parseInline(token.tokens)}</p>`
    },
    hr() {
      return '<hr class="my-6 border-slate-200 dark:border-zinc-800" />'
    },
    blockquote(this: RendererThis, token: Tokens.Blockquote) {
      const inner = this.parser.parse(token.tokens)
      return `<blockquote class="border-l-4 border-slate-300 dark:border-zinc-700 pl-4 italic my-4 text-slate-600 dark:text-zinc-400">${inner}</blockquote>`
    },
    code(token: Tokens.Code) {
      return `<pre class="bg-slate-100 dark:bg-zinc-800 p-3 rounded overflow-x-auto my-4"><code class="font-mono text-xs text-slate-800 dark:text-zinc-200">${escapeHtml(token.text)}</code></pre>`
    },
    codespan(token: Tokens.Codespan) {
      return `<code class="bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono text-xs">${token.text}</code>`
    },
    link(this: RendererThis, token: Tokens.Link) {
      const text  = this.parser.parseInline(token.tokens)
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : ''
      return `<a href="${token.href}"${title} target="_blank" rel="noopener noreferrer" class="text-violet-600 hover:underline dark:text-violet-400">${text}</a>`
    },
    image(token: Tokens.Image) {
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : ''
      return `<img src="${token.href}" alt="${escapeHtml(token.text)}"${title} class="rounded max-h-96 object-contain my-4 border border-slate-200 dark:border-zinc-700 mx-auto block" />`
    },
    list(this: RendererThis, token: Tokens.List) {
      const tag = token.ordered ? 'ol' : 'ul'
      const cls = token.ordered ? 'list-decimal' : 'list-disc'
      const start = token.ordered && token.start !== 1 ? ` start="${token.start}"` : ''
      const items = token.items.map((item) => {
        if (item.task) {
          const checked = item.checked ? 'checked' : ''
          const inner   = this.parser.parse(item.tokens)
          return `<li class="list-none flex items-start gap-2 my-1"><input type="checkbox" ${checked} disabled class="mt-1 rounded border-slate-300 text-violet-600 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-800" /><span>${inner}</span></li>`
        }
        return `<li class="my-1">${this.parser.parse(item.tokens)}</li>`
      }).join('')
      return `<${tag}${start} class="${cls} ml-5 my-3 text-slate-700 dark:text-zinc-300">${items}</${tag}>`
    },
    table(this: RendererThis, token: Tokens.Table) {
      const head = token.header
        .map((cell) => `<th class="px-3 py-2 text-left font-medium text-slate-700 dark:text-zinc-200 border-b border-slate-200 dark:border-zinc-700">${this.parser.parseInline(cell.tokens)}</th>`)
        .join('')
      const body = token.rows
        .map((row) => {
          const cells = row
            .map((cell) => `<td class="px-3 py-2 border-b border-slate-100 dark:border-zinc-800">${this.parser.parseInline(cell.tokens)}</td>`)
            .join('')
          return `<tr>${cells}</tr>`
        })
        .join('')
      return `<div class="overflow-x-auto my-4 rounded border border-slate-200 dark:border-zinc-700"><table class="w-full text-sm"><thead class="bg-slate-50 dark:bg-zinc-800/50">${head}</thead><tbody>${body}</tbody></table></div>`
    },
    strong(this: RendererThis, token: Tokens.Strong) {
      return `<strong class="font-semibold text-slate-900 dark:text-zinc-100">${this.parser.parseInline(token.tokens)}</strong>`
    },
    em(this: RendererThis, token: Tokens.Em) {
      return `<em class="italic">${this.parser.parseInline(token.tokens)}</em>`
    },
    del(this: RendererThis, token: Tokens.Del) {
      return `<del class="line-through text-slate-500 dark:text-zinc-400">${this.parser.parseInline(token.tokens)}</del>`
    },
  },
})

// Force every preserved <a> to open in a new tab safely. DOMPurify keeps the
// target attribute we put on, but adding rel via a hook guarantees the safe
// pair even on any user-authored `<a target="_blank">` HTML that sneaks in.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.nodeName === 'A' && node.getAttribute('target') === '_blank') {
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

export function parseMarkdown(md: string): string {
  if (!md) return ''
  const rawHtml = marked.parse(md, { async: false }) as string
  return DOMPurify.sanitize(rawHtml, {
    ADD_ATTR: ['target'],
  })
}
