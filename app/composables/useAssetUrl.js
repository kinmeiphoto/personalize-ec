import { resolveAssetUrl } from '../utils/assetUrl.js'

export function useAssetUrl() {
  const baseURL = useRuntimeConfig().app.baseURL
  return path => resolveAssetUrl(path, baseURL)
}
