/**
 * A lightweight, dependency-free Markdown-to-HTML parser.
 * Supports basic block and inline formatting for previewing blog posts.
 */
export function parseMarkdown(md: string): string {
  if (!md) return ''

  // Escape HTML tags to prevent XSS
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks
  html = html.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/gm, (_, _lang, code) => {
    return `<pre className="bg-slate-100 dark:bg-zinc-800 p-3 rounded-lg overflow-x-auto my-4 font-mono text-xs text-slate-800 dark:text-zinc-200"><code>${code.trim()}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono text-xs">$1</code>')

  // Blockquotes
  html = html.replace(/^\s*&gt;\s+(.*)$/gim, '<blockquote class="border-l-4 border-slate-300 dark:border-zinc-700 pl-4 italic my-4 text-slate-600 dark:text-zinc-400">$1</blockquote>')

  // Headers (H1 - H6)
  html = html.replace(/^###### (.*)$/gim, '<h6 class="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-4 mb-2">$1</h6>')
  html = html.replace(/^##### (.*)$/gim, '<h5 class="text-base font-bold text-slate-900 dark:text-zinc-100 mt-4 mb-2">$1</h5>')
  html = html.replace(/^#### (.*)$/gim, '<h4 class="text-lg font-bold text-slate-900 dark:text-zinc-100 mt-4 mb-2">$1</h4>')
  html = html.replace(/^### (.*)$/gim, '<h3 class="text-xl font-bold text-slate-900 dark:text-zinc-100 mt-4 mb-2">$1</h3>')
  html = html.replace(/^## (.*)$/gim, '<h2 class="text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-6 mb-3 border-b border-slate-100 dark:border-zinc-800 pb-1">$1</h2>')
  html = html.replace(/^# (.*)$/gim, '<h1 class="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 mt-8 mb-4 pb-2">$1</h1>')

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr class="my-6 border-slate-200 dark:border-zinc-800" />')

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded max-h-96 object-contain my-4 border border-slate-200 dark:border-zinc-700 mx-auto" />')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-violet-600 hover:underline dark:text-violet-400">$1</a>')

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // Italics
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  // Checklists (ordered before standard lists)
  html = html.replace(/^\s*-\s+\[(x|X)\]\s+(.*)$/gim, '<li class="list-none flex items-center gap-2"><input type="checkbox" checked disabled class="rounded border-slate-300 text-violet-600 focus:ring-violet-500" /> $2</li>')
  html = html.replace(/^\s*-\s+\[\s*\]\s+(.*)$/gim, '<li class="list-none flex items-center gap-2"><input type="checkbox" disabled class="rounded border-slate-300 text-violet-600 focus:ring-violet-500" /> $2</li>')

  // Unordered lists
  html = html.replace(/^\s*-\s+(.*)$/gim, '<li class="list-disc ml-5 my-1 text-slate-700 dark:text-zinc-300">$1</li>')

  // Ordered lists
  html = html.replace(/^\s*\d+\.\s+(.*)$/gim, '<li class="list-decimal ml-5 my-1 text-slate-700 dark:text-zinc-300">$1</li>')

  // Line breaks (convert newlines to <br /> unless it's inside block tags)
  html = html.replace(/\n/g, '<br />')

  return html
}
