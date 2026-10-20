export default defineNuxtConfig({
  compatibilityDate: '2026-10-20',
  devtools: { enabled: false },
  app: { baseURL: process.env.NUXT_APP_BASE_URL || '/', head: { title: '余白 | Photo Atelier', htmlAttrs: { lang: 'ja' }, meta: [{ name: 'description', content: '写真と余白でつくる、あなただけの一冊。' }] } }
})
