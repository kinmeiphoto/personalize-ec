import test from 'node:test'
import assert from 'node:assert/strict'
import { Group, Mesh, BoxGeometry, MeshBasicMaterial, PerspectiveCamera, Raycaster } from 'three'
import { intersectAlbum } from '../app/utils/albumHit.js'
import { resolveAssetUrl } from '../app/utils/assetUrl.js'

function scene() {
  const camera = new PerspectiveCamera(40, 1, .1, 100)
  camera.position.z = 5
  const group = new Group()
  group.add(new Mesh(new BoxGeometry(2, 2, .2), new MeshBasicMaterial()))
  return { camera, group, raycaster: new Raycaster(), rect: {left: 0, top: 0, width: 1000, height: 1000} }
}
test('only the album surface is hit; empty space inside the canvas is excluded', () => {
  const s = scene()
  assert.ok(intersectAlbum({...s, point: {x: 500, y: 500}}))
  assert.equal(intersectAlbum({...s, point: {x: 50, y: 50}}), null)
  assert.equal(intersectAlbum({...s, point: {x: -1, y: 500}}), null)
  s.group.visible = false
  assert.equal(intersectAlbum({...s, point: {x: 500, y: 500}}), null)
})
test('hit detection follows a resized canvas and a moved album', () => {
  const s = scene()
  s.rect = {left: 200, top: 100, width: 500, height: 500}
  assert.ok(intersectAlbum({...s, point: {x: 450, y: 350}}))
  s.group.position.x = 4
  assert.equal(intersectAlbum({...s, point: {x: 450, y: 350}}), null)
})
test('project Pages resolves models and photos while preserving uploads and external URLs', () => {
  assert.equal(resolveAssetUrl('/models/album-open.glb', '/personalize-ec/'), '/personalize-ec/models/album-open.glb')
  assert.equal(resolveAssetUrl('/personalize-ec/photos/example.webp', '/personalize-ec/'), '/personalize-ec/photos/example.webp')
  for (const value of ['data:image/jpeg;base64,AAAA', 'blob:https://example.org/id', 'https://example.org/photo.jpg', '//example.org/photo.jpg']) assert.equal(resolveAssetUrl(value, '/personalize-ec/'), value)
  assert.equal(resolveAssetUrl('/images/kinmei-logo.png', '/'), '/images/kinmei-logo.png')
})
