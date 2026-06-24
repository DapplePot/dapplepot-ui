import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import {
  useBlogById,
  useCreateBlog,
  useUpdateBlog,
  useUploadBlogAsset,
} from '../hooks/useBlogs'
import { ChevronLeft, Upload, Loader2, Image, X } from 'lucide-react'
import { parseMarkdown } from '../utils/markdown'

const AUTHOR_OPTIONS = ['Pushpendra Pal', 'Kshitiz Rana', 'Sayantan Gain']
const TAG_OPTIONS = ['Research', 'Insights', 'Announcements', 'Product Updates']

// Banner constraints — 1200×630 is the Open Graph standard so the same image
// doubles as the social-share preview when the post URL is pasted into Slack,
// LinkedIn, Twitter, etc.
const BANNER_MAX_BYTES   = 500 * 1024   // 500 KB
const BANNER_MIN_WIDTH   = 1200          // px
const BANNER_RATIO       = 1200 / 630    // ≈ 1.905
const BANNER_RATIO_TOL   = 0.1           // ±10 %

// Reads the image client-side to check dimensions and aspect ratio. Returns
// null if the file passes, or an error message describing what's wrong.
function validateBannerDimensions(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const w = img.naturalWidth
      const h = img.naturalHeight
      if (w < BANNER_MIN_WIDTH) {
        resolve(`Banner is ${w}×${h}. Please upload an image at least ${BANNER_MIN_WIDTH}px wide.`)
        return
      }
      const ratio = w / h
      if (Math.abs(ratio - BANNER_RATIO) / BANNER_RATIO > BANNER_RATIO_TOL) {
        resolve(`Banner is ${w}×${h} (${ratio.toFixed(2)}:1). Please use a ~1.91:1 image like 1200×630.`)
        return
      }
      resolve(null)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve('Could not read the image file. Please try a different one.')
    }
    img.src = url
  })
}

interface GuideSection {
  title:  string
  syntax: string
  note?:  string
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    title:  'Headings',
    syntax: '# H1\n## H2\n### H3\n#### H4',
  },
  {
    title:  'Emphasis',
    syntax: '**bold**, *italic*, ***both***, ~~strike~~, `code`',
  },
  {
    title:  'Links',
    syntax: '[external](https://example.com)\nhttps://example.com\n<hello@example.com>',
  },
  {
    title:  'Images',
    syntax: '![alt](https://placehold.co/200x80?text=img)',
    note:   'URLs with spaces: wrap in <…> or use %20. The Insert Image button encodes automatically.',
  },
  {
    title:  'Lists',
    syntax: '- item one\n- item two\n  - nested\n\n1. first\n2. second',
  },
  {
    title:  'Task list',
    syntax: '- [x] done\n- [ ] todo',
  },
  {
    title:  'Blockquote',
    syntax: '> A quoted line with **emphasis**.',
  },
  {
    title:  'Code block',
    syntax: '```ts\nfunction greet(name: string) {\n  return `Hi ${name}`\n}\n```',
  },
  {
    title:  'Table',
    syntax: '| Feature       | Supported |\n| ------------- | --------- |\n| Tables        | yes       |\n| Strikethrough | yes       |',
  },
  {
    title:  'Horizontal rule',
    syntax: '---',
  },
]

export function BlogForm() {
  const navigate = useNavigate()
  const { id } = useParams({ strict: false }) as { id?: string }
  const isEdit = !!id

  const { data: existingBlog, isLoading: isLoadingBlog } = useBlogById(id ?? null)
  const createMutation = useCreateBlog()
  const updateMutation = useUpdateBlog()
  const uploadMutation = useUploadBlogAsset()

  // Form states
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [bannerImageUrl, setBannerImageUrl] = useState('')
  const [authors, setAuthors] = useState<string[]>([])
  const [tag, setTag] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [contentMarkdown, setContentMarkdown] = useState('')

  // UI state
  const [previewTab, setPreviewTab] = useState<'write' | 'preview' | 'guide'>('write')
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [isUploadingInline, setIsUploadingInline] = useState(false)
  const [validationError, setValidationError] = useState('')

  // Populate form if editing
  useEffect(() => {
    if (existingBlog) {
      setTitle(existingBlog.title)
      setSlug(existingBlog.slug)
      setExcerpt(existingBlog.excerpt)
      setBannerImageUrl(existingBlog.bannerImageUrl)
      setAuthors(existingBlog.authors)
      setTag(existingBlog.tag)
      setMetaTitle(existingBlog.metaTitle ?? '')
      setMetaDescription(existingBlog.metaDescription ?? '')
      setContentMarkdown(existingBlog.contentMarkdown)
    }
  }, [existingBlog])

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Allow the same file to be re-picked after a rejection.
    e.target.value = ''
    if (!file) return

    if (file.size > BANNER_MAX_BYTES) {
      const kb = Math.round(file.size / 1024)
      setValidationError(`Banner image is ${kb} KB. Please upload an image under 500 KB.`)
      return
    }

    const dimError = await validateBannerDimensions(file)
    if (dimError) {
      setValidationError(dimError)
      return
    }
    setValidationError('')

    setIsUploadingBanner(true)
    try {
      const res = await uploadMutation.mutateAsync(file)
      setBannerImageUrl(res.url)
    } catch (err) {
      alert('Failed to upload banner image.')
    } finally {
      setIsUploadingBanner(false)
    }
  }

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingInline(true)
    try {
      const res = await uploadMutation.mutateAsync(file)
      // Encode any spaces / unsafe chars in the URL so markdown parsers don't
      // truncate it at the first space. encodeURI keeps :/?# intact.
      const safeUrl = encodeURI(res.url)
      const imageTag = `\n![${file.name.split('.')[0]}](${safeUrl})\n`
      setContentMarkdown((prev) => prev + imageTag)
    } catch (err) {
      alert('Failed to upload inline image.')
    } finally {
      setIsUploadingInline(false)
    }
  }

  const handleAuthorToggle = (author: string) => {
    if (authors.includes(author)) {
      setAuthors(authors.filter((a) => a !== author))
    } else {
      setAuthors([...authors, author])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    // Basic Validations
    if (!title.trim()) return setValidationError('Title is required.')
    if (!slug.trim()) return setValidationError('Slug is required.')
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return setValidationError('Slug must contain only lowercase letters, numbers, and hyphens.')
    }
    if (!excerpt.trim()) return setValidationError('Excerpt is required.')
    if (excerpt.length > 200) return setValidationError('Excerpt must be 200 characters or fewer.')
    if (!bannerImageUrl) return setValidationError('Banner image is required.')
    if (authors.length === 0) return setValidationError('At least one author must be selected.')
    if (!tag) return setValidationError('Tag is required.')
    if (!contentMarkdown.trim()) return setValidationError('Content is required.')

    const payload = {
      title,
      slug,
      excerpt,
      bannerImageUrl,
      authors,
      tag,
      metaTitle: metaTitle.trim() || null,
      metaDescription: metaDescription.trim() || null,
      contentMarkdown,
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: id!, body: payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      navigate({ to: '/blogs' })
    } catch (err: any) {
      const errMsg = err?.response?.data?.error?.message ?? 'Failed to save blog post.'
      setValidationError(errMsg)
    }
  }

  if (isEdit && isLoadingBlog) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          to="/blogs"
          className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">
            {isEdit ? 'Edit Blog' : 'New Blog'}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
            {isEdit ? 'Update your blog post details.' : 'Write and publish a new blog post.'}
          </p>
        </div>
      </div>

      {validationError && (
        <div className="rounded bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
          {validationError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6 bg-white p-6 rounded border border-slate-200 dark:bg-zinc-900 dark:border-zinc-700">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Title</label>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter blog title"
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-violet-400"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Slug</label>
              </div>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. agent-observability-guide"
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-violet-400"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Short Description / Excerpt
                </label>
                <span className="text-xs text-slate-400 dark:text-zinc-500">
                  {excerpt.length} / 200
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={200}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A brief excerpt of the blog post for cards and previews..."
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-violet-400"
              />
            </div>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-6 bg-white p-6 rounded border border-slate-200 dark:bg-zinc-900 dark:border-zinc-700">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Tag</label>
              </div>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-violet-400"
              >
                <option value="" disabled hidden>Select a tag</option>
                {TAG_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Authors</label>
              </div>
              <div className="space-y-1.5 mt-1">
                {AUTHOR_OPTIONS.map((author) => {
                  const isChecked = authors.includes(author)
                  return (
                    <label key={author} className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleAuthorToggle(author)}
                        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-800"
                      />
                      {author}
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Banner Image
                </label>
                <span className="text-xs text-slate-400 dark:text-zinc-500">
                  1200×630 · ≤ 500 KB
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {bannerImageUrl ? (
                  <div className="relative">
                    <img
                      src={bannerImageUrl}
                      alt="Banner preview"
                      className="w-full aspect-[1200/630] object-cover rounded border border-slate-200 dark:border-zinc-700"
                    />
                    <button
                      type="button"
                      onClick={() => setBannerImageUrl('')}
                      aria-label="Remove banner image"
                      className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded bg-black/60 text-white hover:bg-black/80"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center justify-center gap-2 rounded border border-dashed border-slate-300 hover:border-violet-500 hover:text-violet-600 px-4 py-4 text-sm text-slate-500 cursor-pointer dark:border-zinc-600 dark:hover:border-violet-400">
                    {isUploadingBanner ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="bg-white p-6 rounded border border-slate-200 dark:bg-zinc-900 dark:border-zinc-700 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-200">SEO Settings (Optional)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Meta Title</label>
              </div>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="SEO page title tag"
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-violet-400"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Meta Description</label>
                <span className="text-xs text-slate-400 dark:text-zinc-500">
                  {metaDescription.length} / 160
                </span>
              </div>
              <input
                type="text"
                maxLength={160}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="SEO meta description snippet"
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-violet-400"
              />
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div className="bg-white rounded border border-slate-200 dark:bg-zinc-900 dark:border-zinc-700 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPreviewTab('write')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                  previewTab === 'write'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('preview')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                  previewTab === 'preview'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('guide')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                  previewTab === 'guide'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Guide
              </button>
            </div>

            {/* Inline Upload Option */}
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs text-slate-600 cursor-pointer dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 font-semibold">
                {isUploadingInline ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Image className="h-3.5 w-3.5" />
                )}
                <span>Insert Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleInlineImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="p-4">
            {previewTab === 'write' && (
              <textarea
                rows={18}
                value={contentMarkdown}
                onChange={(e) => setContentMarkdown(e.target.value)}
                placeholder="Write your blog post in Markdown format here..."
                className="w-full font-mono text-sm border-0 outline-none resize-y bg-transparent text-slate-900 placeholder-slate-400 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            )}
            {previewTab === 'preview' && (
              <div className="max-w-none min-h-[360px] p-2 bg-slate-50/50 rounded dark:bg-zinc-950/20 overflow-auto text-sm text-slate-700 dark:text-zinc-300">
                {contentMarkdown ? (
                  <div dangerouslySetInnerHTML={{ __html: parseMarkdown(contentMarkdown) }} />
                ) : (
                  <p className="text-slate-400 dark:text-zinc-500 italic">Nothing to preview yet.</p>
                )}
              </div>
            )}
            {previewTab === 'guide' && (
              <div className="min-h-[360px] overflow-auto">
                <p className="mb-4 text-xs text-slate-500 dark:text-zinc-400">
                  Markdown source on the left, rendered output on the right.
                </p>
                <div className="space-y-5">
                  {GUIDE_SECTIONS.map((section) => (
                    <div key={section.title}>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                        {section.title}
                      </h4>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <pre className="overflow-x-auto rounded bg-slate-100 p-3 font-mono text-xs text-slate-800 dark:bg-zinc-800 dark:text-zinc-200">
                          {section.syntax}
                        </pre>
                        <div
                          className="rounded border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                          dangerouslySetInnerHTML={{ __html: parseMarkdown(section.syntax) }}
                        />
                      </div>
                      {section.note && (
                        <p className="mt-1.5 text-xs italic text-slate-500 dark:text-zinc-400">
                          {section.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            to="/blogs"
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="inline-flex items-center justify-center rounded bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 disabled:opacity-50 dark:bg-violet-700 dark:hover:bg-violet-600"
          >
            {(createMutation.isPending || updateMutation.isPending) && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Save Blog
          </button>
        </div>
      </form>
    </div>
  )
}
