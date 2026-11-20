export const coverColors = [
  { name: 'ノワール', hex: '#252726', family: 'Noir' },
  { name: 'アイボリー', hex: '#dfd9cb', family: 'Ivory' },
  { name: 'フォレスト', hex: '#3d5048', family: 'Forest' },
  { name: 'ミッドナイト', hex: '#303b50', family: 'Midnight' },
  { name: 'バーガンディ', hex: '#6d3541', family: 'Burgundy' },
  { name: 'テラコッタ', hex: '#ac725b', family: 'Terracotta' }
]
export const paperColors = [{ name: 'クリーム', hex: '#eee9dc' }, { name: 'ホワイト', hex: '#fafafa' }, { name: 'ブラック', hex: '#2c2d2b' }]
export const frameColors = [{ name: 'シルバー', hex: '#aeb1ad' }, { name: 'ゴールド', hex: '#b69a65' }, { name: 'ブラック', hex: '#262725' }]
export const photoSlots = [{ key: 'Cover', label: '表紙', src: '/photos/wedding-couple.webp' }, { key: 'Left', label: '見開き・左', src: '/photos/wedding-couple.webp' }, { key: 'Right', label: '見開き・右', src: '/photos/wedding-detail.webp' }]
export function freshDesign() {
  return {
    cover: '#252726', paper: '#eee9dc', frame: '#aeb1ad', size: '30', initials: '', foil: '#b69a65',
    photos: Object.fromEntries(photoSlots.map(s => [s.key, { src: s.src, zoom: 1, x: 0, y: 0 }]))
  }
}
export function useAlbum() {
  const design = useState('album-design', freshDesign)
  const favorite = useState('album-favorite', () => false)
  const cart = useState('album-cart', () => [])
  const price = computed(() => (design.value.size === '30' ? 24200 : 19800) + (design.value.initials.trim() ? 2200 : 0))
  const colorName = computed(() => coverColors.find(c => c.hex === design.value.cover)?.name || 'カスタムカラー')
  const money = n => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(n)
  const track = (event, data = {}) => {
    if (import.meta.client) {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({ event, ...data })
    }
  }
  return { design, favorite, cart, price, colorName, money, track }
}
