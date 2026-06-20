import { apiClient } from './client'

export interface BlogItem {
  id: string
  title: string
  slug: string
  excerpt: string
  contentMarkdown: string
  authors: string[]
  tag: string
  bannerImageUrl: string
  metaTitle: string | null
  metaDescription: string | null
  readTime: string | null
  createdAt: string
  updatedAt: string
}

export interface ListBlogsResponse {
  data: BlogItem[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function getBlogs(params: {
  page: number
  limit: number
  search?: string
  tag?: string
}): Promise<ListBlogsResponse> {
  const searchParams: Record<string, string> = {
    page: String(params.page),
    limit: String(params.limit),
  }
  if (params.search) searchParams.search = params.search
  if (params.tag) searchParams.tag = params.tag

  return apiClient.get('v1/blogs', { searchParams }).json()
}

export function getBlogBySlug(slug: string): Promise<BlogItem> {
  return apiClient.get(`v1/blogs/${slug}`).json()
}

export function getBlogById(id: string): Promise<BlogItem> {
  return apiClient.get(`v1/blogs/id/${id}`).json()
}

export function createBlog(
  body: Omit<BlogItem, 'id' | 'readTime' | 'createdAt' | 'updatedAt'>
): Promise<BlogItem> {
  return apiClient.post('v1/blogs', { json: body }).json()
}

export function updateBlog(
  id: string,
  body: Omit<BlogItem, 'id' | 'readTime' | 'createdAt' | 'updatedAt'>
): Promise<BlogItem> {
  return apiClient.put(`v1/blogs/${id}`, { json: body }).json()
}

export function deleteBlog(id: string): Promise<{ ok: boolean }> {
  return apiClient.delete(`v1/blogs/${id}`).json()
}

export function uploadBlogAsset(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  return apiClient.post('v1/blogs/upload', { body: formData }).json()
}
