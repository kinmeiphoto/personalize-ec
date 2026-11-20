const baseURL = process.env.NUXT_APP_BASE_URL || '/'
const asset = (path: string) => baseURL.replace(/\/$/, '') + path

export default defineNuxtConfig({
  telemetry: false,
  compatibilityDate: '2026-11-19',
  devtools: { enabled: false },
  ssr: true,
  modules: ['@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css', '~/assets/css/selection-studio.css'],
  app: {
    baseURL,
    head: {
      htmlAttrs: { lang: 'ja' },
      title: 'Kinmei | ふたりで仕立てるウェディングアルバム',
      meta: [
        { name: 'description', content: '結婚式の記憶を、ふたりで選ぶ一冊に。表紙の色、写真、お名前や挙式日を、立体の仕上がりで確かめられるウェディングアルバムのアトリエ。' },
        { name: 'theme-color', content: '#f1f2f2' },
        { name: 'robots', content: 'noindex, nofollow' }
      ],
      link: [{ rel: 'icon', type: 'image/png', href: asset('/images/kinmei-logo.png') }]
    }
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Kinmei — Wedding Album Atelier', short_name: 'Kinmei',
      description: '結婚式の記憶を、ふたりで選ぶ一冊に。',
      theme_color: '#f1f2f2', background_color: '#f1f2f2', display: 'standalone',
      lang: 'ja', start_url: baseURL, scope: baseURL,
      icons: [{ src: asset('/icons/icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: asset('/icons/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any maskable' }]
    },
    generateSW: {
      globPatterns: ['**/*.{js,css,html,png,webp,svg,woff2,glb}'],
      maximumFileSizeToCacheInBytes: 3000000,
      navigateFallback: baseURL,
      cleanupOutdatedCaches: true
    },
    devOptions: { enabled: false }
  },
  runtimeConfig: { public: { boomerangBeaconUrl: '', gtmId: '' } }
})
