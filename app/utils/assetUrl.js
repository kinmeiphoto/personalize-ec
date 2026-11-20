export function resolveAssetUrl(path, baseURL = '/') {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return path
  const base = '/' + baseURL.split('/').filter(Boolean).join('/')
  if (base === '/' || path === base || path.startsWith(base + '/')) return path
  return base + path
}
