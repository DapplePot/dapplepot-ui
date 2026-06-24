import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useBlogs, useDeleteBlog } from '../hooks/useBlogs'
import { Edit2, Trash2, Plus, Search, Eye, X, AlertTriangle } from 'lucide-react'
import { parseMarkdown } from '../utils/markdown'
import type { BlogItem } from '../api/blogs'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function Blogs() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tag, setTag] = useState('')
  const [viewBlog, setViewBlog] = useState<BlogItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

  const { data, isLoading, isError } = useBlogs({
    page,
    limit: 10,
    search: search || undefined,
    tag: tag || undefined,
  })

  const deleteBlogMutation = useDeleteBlog()

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteBlogMutation.mutateAsync(deleteTarget.id)
    } catch (err) {
      alert('Failed to delete blog post.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const blogs = data?.data ?? []
  const totalPages = data?.pagination.pages ?? 1

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">Blogs</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Create, edit, and manage public blog posts.
          </p>
        </div>
        <Link
          to="/blogs/new"
          className="inline-flex items-center gap-1.5 rounded bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 dark:bg-violet-700 dark:hover:bg-violet-600"
        >
          <Plus className="h-4 w-4" />
          New Blog
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <input
            type="search"
            placeholder="Search blogs..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full rounded border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-violet-400"
          />
        </div>

        <select
          value={tag}
          onChange={(e) => {
            setTag(e.target.value)
            setPage(1)
          }}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-violet-400"
        >
          <option value="">All Tags</option>
          <option value="Research">Research</option>
          <option value="Insights">Insights</option>
          <option value="Announcements">Announcements</option>
          <option value="Product Updates">Product Updates</option>
        </select>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-slate-100 dark:bg-zinc-800" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load blogs.</p>
      )}

      {!isLoading && !isError && (
        <>
          <div className="overflow-x-auto rounded border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 dark:border-zinc-700 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/50">
                  <th className="px-4 py-3">Banner</th>
                  <th className="px-4 py-3">Title / Slug</th>
                  <th className="px-4 py-3">Authors</th>
                  <th className="px-4 py-3">Tag</th>
                  <th className="px-4 py-3">Read Time</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                    <td className="px-4 py-3">
                      <img
                        src={blog.bannerImageUrl}
                        alt=""
                        className="w-24 aspect-[1200/630] object-cover rounded border border-slate-200 dark:border-zinc-700 cursor-pointer"
                        onClick={() => setViewBlog(blog)}
                        onError={(e) => {
                          e.currentTarget.src = 'https://placehold.co/1200x630?text=No+Image'
                        }}
                      />
                    </td>
                    <td
                      className="px-4 py-3 max-w-xs cursor-pointer group"
                      onClick={() => setViewBlog(blog)}
                    >
                      <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400">
                        {blog.title}
                      </div>
                      <div className="font-mono text-xs text-slate-400 dark:text-zinc-500 truncate">
                        {blog.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {blog.authors.map((author) => (
                          <span
                            key={author}
                            className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            {author}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-950/30 dark:text-violet-400">
                        {blog.tag}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-zinc-300">
                      {blog.readTime ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-zinc-400">
                      {formatDate(blog.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewBlog(blog)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate({ to: `/blogs/${blog.id}` })}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: blog.id, title: blog.title })}
                          disabled={deleteBlogMutation.isPending}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {blogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400 dark:text-zinc-500">
                      No blog posts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-zinc-700">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500 dark:text-zinc-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* View Blog Modal */}
      {viewBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex flex-col w-full max-w-3xl max-h-[85vh] bg-white rounded border border-slate-200 shadow-2xl dark:bg-zinc-900 dark:border-zinc-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-zinc-700 dark:bg-zinc-800/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                  {viewBlog.title}
                </h2>
                <p className="text-xs font-mono text-slate-400 dark:text-zinc-500">
                  {viewBlog.slug} | {viewBlog.tag} | {viewBlog.readTime}
                </p>
              </div>
              <button
                onClick={() => setViewBlog(null)}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Modal Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {viewBlog.bannerImageUrl && (
                <img
                  src={viewBlog.bannerImageUrl}
                  alt=""
                  className="w-full aspect-[1200/630] object-cover rounded border border-slate-200 dark:border-zinc-700 mx-auto"
                />
              )}
              <div className="max-w-none text-sm text-slate-700 dark:text-zinc-300">
                <div dangerouslySetInnerHTML={{ __html: parseMarkdown(viewBlog.contentMarkdown) }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded border border-slate-200 shadow-2xl dark:bg-zinc-900 dark:border-zinc-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4 p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Delete Blog Post</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-slate-700 dark:text-zinc-200">"{deleteTarget.title}"</span>?
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800 px-6 py-4">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteBlogMutation.isPending}
                className="inline-flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-600"
              >
                {deleteBlogMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
