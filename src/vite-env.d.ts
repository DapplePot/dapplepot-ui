/// <reference types="vite/client" />
// Allow CSS imports
declare module '*.css' {
  const content: Record<string, string>
  export default content
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
