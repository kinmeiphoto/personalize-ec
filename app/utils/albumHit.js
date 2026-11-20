import { Vector2 } from 'three'

// Restrict hits to the album and its nameplate; the studio floor is excluded.
export function intersectAlbum({ point, rect, camera, group, nameplate, raycaster }) {
  if (!group || !group.visible || !rect.width || !rect.height) return null
  const x = (point.x - rect.left) / rect.width
  const y = (point.y - rect.top) / rect.height
  if (x < 0 || x > 1 || y < 0 || y > 1) return null
  group.updateWorldMatrix(true, true)
  camera.updateWorldMatrix(true, false)
  const objects = [group]
  if (nameplate?.visible) { nameplate.updateWorldMatrix(true, true); objects.push(nameplate) }
  raycaster.setFromCamera(new Vector2(x * 2 - 1, 1 - y * 2), camera)
  return raycaster.intersectObjects(objects, true)[0] || null
}
