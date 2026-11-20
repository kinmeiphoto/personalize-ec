export default defineNuxtPlugin(() => {
  // No third-party beacons until a production endpoint is configured.
  const config = useRuntimeConfig()
  if (config.public.boomerangBeaconUrl) {
    const script = document.createElement('script')
    script.src = useAssetUrl()('/vendor/boomerang.js')
    script.onload = () => window.BOOMR?.init({ beacon_url: config.public.boomerangBeaconUrl, autorun: true, RT: { enabled: true } })
    document.head.appendChild(script)
  }
  if (/^GTM-[A-Z0-9]+$/.test(config.public.gtmId)) {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
    const script = document.createElement('script')
    script.src = 'https://www.googletagmanager.com/gtm.js?id=' + config.public.gtmId
    document.head.appendChild(script)
  }
})
