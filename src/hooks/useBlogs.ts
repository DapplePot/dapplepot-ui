import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBlogs,
  getBlogBySlug,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  uploadBlogAsset,
  BlogItem,
} from '../api/blogs'

export function useBlogs(params: { page: number; limit: number; search?: string; tag?: string }) {
  return useQuery({
    queryKey: ['blogs', params],
    queryFn: () => getBlogs(params),
    staleTime: 30_000,
  })
}

export function useBlog(slug: string | null) {
  return useQuery({
    queryKey: ['blog', slug],
    queryFn: () => getBlogBySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60_000,
  })
}

export function useBlogById(id: string | null) {
  return useQuery({
    queryKey: ['blogById', id],
    queryFn: () => getBlogById(id!),
    enabled: !!id,
    staleTime: 5 * 60_000,
  })
}

export function useCreateBlog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Omit<BlogItem, 'id' | 'readTime' | 'createdAt' | 'updatedAt'>) =>
      createBlog(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['blogs'] })
    },
  })
}

export function useUpdateBlog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: Omit<BlogItem, 'id' | 'readTime' | 'createdAt' | 'updatedAt'>
    }) => updateBlog(id, body),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['blogs'] })
      void queryClient.invalidateQueries({ queryKey: ['blog', data.slug] })
    },
  })
}

export function useDeleteBlog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBlog(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['blogs'] })
    },
  })
}

export function useUploadBlogAsset() {
  return useMutation({
    mutationFn: (file: File) => uploadBlogAsset(file),
  })
}
