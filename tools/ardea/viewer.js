import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createViewer(container, { onInteraction = () => {}, reduced = false } = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 80);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.domElement.setAttribute('aria-label', 'トートバッグの3Dプレビュー。左右キーで回転、プラス・マイナスキーで拡大縮小');
  renderer.domElement.tabIndex = 0;
  container.append(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xa39b91, 2.8));
  for (const [x,y,z,intensity] of [[-3,6,5,4],[4,3,-3,3],[0,1,5,1.5]]) {
    const light = new THREE.DirectionalLight(0xfff7ec, intensity); light.position.set(x,y,z); scene.add(light);
  }
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, .38, 0);
  controls.enablePan = false;
  controls.enableDamping = !reduced;
  controls.dampingFactor = .085;
  controls.minPolarAngle = THREE.MathUtils.degToRad(30);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(100);
  const standardDistance = 7.9;
  controls.minDistance = standardDistance / 2.5;
  controls.maxDistance = standardDistance / .8;
  controls.touches.ONE = THREE.TOUCH.ROTATE;
  controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
  const bag = new THREE.Group(); scene.add(bag);
  const textureCanvas = document.createElement('canvas'); textureCanvas.width = textureCanvas.height = 256;
  const tx = textureCanvas.getContext('2d');
  tx.fillStyle = '#e8d9ba';tx.fillRect(0,0,256,256);tx.strokeStyle='#6b5a4524';tx.lineWidth=1;
  for(let i=-256;i<512;i+=40){tx.beginPath();tx.moveTo(i,0);tx.lineTo(i+256,256);tx.stroke();tx.beginPath();tx.moveTo(i,0);tx.lineTo(i-256,256);tx.stroke()}
  tx.fillStyle='#6b5a4540';for(let x=10;x<256;x+=40)for(let y=10;y<256;y+=40){tx.beginPath();tx.arc(x,y,1.4,0,Math.PI*2);tx.fill()}
  const texture = new THREE.CanvasTexture(textureCanvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,2);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: '#c4ad88', map: texture, roughness: .87, side: THREE.DoubleSide });
  const liningMaterial = new THREE.MeshStandardMaterial({ color: '#55483c', roughness: 1, side: THREE.DoubleSide });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: '#493b2e', roughness: .55 });
  const metal = new THREE.MeshStandardMaterial({color:'#bf9f5a',metalness:.85,roughness:.28});
  function quad(points, material){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();const m=new THREE.Mesh(g,material);bag.add(m);return m}
  const front=[[-1.12,-.85,.36],[1.12,-.85,.36],[1.5,.95,.48],[-1.5,.95,.48]];
  const back=[[-1.12,-.85,-.36],[1.12,-.85,-.36],[1.5,.95,-.48],[-1.5,.95,-.48]];
  quad(front,bodyMaterial);quad([...back].reverse(),bodyMaterial);
  quad([front[0],back[0],back[3],front[3]],bodyMaterial);quad([back[1],front[1],front[2],back[2]],bodyMaterial);quad([back[0],front[0],front[1],back[1]],liningMaterial);
  quad(front.map(([x,y,z])=>[x*.985,y-.01,z-.018]),liningMaterial);quad(back.map(([x,y,z])=>[x*.985,y-.01,z+.018]),liningMaterial);
  // Open top, rolled leather rim, two curved handles and original geometric weave.
  function tube(points,r,mat){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const m=new THREE.Mesh(new THREE.TubeGeometry(curve,48,r,8,false),mat);bag.add(m);return m}
  tube([[-1.5,.95,.48],[0,.95,.48],[1.5,.95,.48],[1.5,.95,-.48],[0,.95,-.48],[-1.5,.95,-.48],[-1.5,.95,.48]],.028,trimMaterial);
  for(const z of [-.42,.42]) {
    tube([[-.82,.88,z],[-.78,1.52,z],[-.48,2.12,z],[0,2.25,z],[.48,2.12,z],[.78,1.52,z],[.82,.88,z]],.055,trimMaterial);
    for(const x of [-.82,.82]) {const ring=new THREE.Mesh(new THREE.TorusGeometry(.083,.014,8,24),metal);ring.position.set(x,.88,z+(z>0?.04:-.04));bag.add(ring);const tab=new THREE.Mesh(new THREE.BoxGeometry(.14,.3,.04),trimMaterial);tab.position.set(x,.76,z+(z>0?.065:-.065));bag.add(tab)}
  }
  const label = new THREE.Mesh(new THREE.PlaneGeometry(.66,.20),new THREE.MeshStandardMaterial({color:'#493b2e',roughness:.65,side:THREE.DoubleSide}));label.position.set(0,.7,.502);bag.add(label);
  const brandCanvas=document.createElement('canvas');brandCanvas.width=512;brandCanvas.height=128;const bc=brandCanvas.getContext('2d');bc.fillStyle='#d9c091';bc.font='30px serif';bc.textAlign='center';bc.fillText('M A I S O N   A R D E A',256,75);const brandTexture=new THREE.CanvasTexture(brandCanvas);brandTexture.colorSpace=THREE.SRGBColorSpace;const brand=new THREE.Mesh(new THREE.PlaneGeometry(.58,.15),new THREE.MeshBasicMaterial({map:brandTexture,transparent:true}));brand.position.set(0,.7,.504);bag.add(brand);
  const stripes=[];for(const z of [-.49,.49])for(let i=0;i<2;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(.105,1.65),new THREE.MeshStandardMaterial({color:i?'#eee5d6':'#53634d',roughness:.8,side:THREE.DoubleSide}));m.position.set(-.05+i*.11,-.03,z);bag.add(m);stripes.push(m)}
  const initialCanvas=document.createElement('canvas');initialCanvas.width=512;initialCanvas.height=256;const initialTexture=new THREE.CanvasTexture(initialCanvas);initialTexture.colorSpace=THREE.SRGBColorSpace;
  const initials=new THREE.Mesh(new THREE.PlaneGeometry(.61,.31),new THREE.MeshStandardMaterial({map:initialTexture,transparent:true,roughness:.7,side:THREE.DoubleSide}));initials.rotation.y=Math.PI/2;initials.position.set(1.37,.25,0);bag.add(initials);
  const patchCanvas=document.createElement('canvas');patchCanvas.width=patchCanvas.height=256;const patchTexture=new THREE.CanvasTexture(patchCanvas);patchTexture.colorSpace=THREE.SRGBColorSpace;
  const patch=new THREE.Mesh(new THREE.PlaneGeometry(.42,.42),new THREE.MeshStandardMaterial({map:patchTexture,transparent:true,roughness:.7}));patch.position.set(-.75,.1,.51);bag.add(patch);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d');const gradient=sc.createRadialGradient(64,64,1,64,64,64);gradient.addColorStop(0,'#00000045');gradient.addColorStop(.5,'#00000020');gradient.addColorStop(1,'#00000000');sc.fillStyle=gradient;sc.fillRect(0,0,128,128);const shadowTexture=new THREE.CanvasTexture(shadowCanvas);const shadow=new THREE.Mesh(new THREE.PlaneGeometry(5.4,3.1),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.9;scene.add(shadow);
  let active=true,disposed=false,frame,last=performance.now(),auto=!reduced,autoAngle=0,tween=null;
  function pose(theta=0,elevation=13,distance=standardDistance){const phi=THREE.MathUtils.degToRad(90-elevation);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSphericalCoords(distance,phi,theta));camera.lookAt(controls.target);controls.update()}
  pose();
  function interact(){auto=false;tween=null;onInteraction()}
  controls.addEventListener('start',interact);
  function setView(view,immediate=false){auto=false;const theta={front:0,side:Math.PI/2,back:Math.PI,inside:0}[view]??0;const phi=THREE.MathUtils.degToRad(view==='inside'?32:77);const fromTheta=controls.getAzimuthalAngle();const delta=Math.atan2(Math.sin(theta-fromTheta),Math.cos(theta-fromTheta));if(immediate||reduced){camera.position.copy(controls.target).add(new THREE.Vector3().setFromSphericalCoords(standardDistance,phi,theta));controls.update();renderer.render(scene,camera)}else tween={fromTheta,toTheta:fromTheta+delta,fromPhi:controls.getPolarAngle(),toPhi:phi,fromDistance:controls.getDistance(),start:performance.now()}}
  function setDesign(d){const colors={sand:'#c4ad88',stone:'#a1a59c',ink:'#373b3b',clay:'#bb8e76'};bodyMaterial.color.set(colors[d.color]||colors.sand);const scale={PM:.82,MM:1,GM:1.13}[d.size]||1;bag.scale.setScalar(scale);bag.position.y=(scale-1)*.85;shadow.scale.set(scale,scale,1);
   const pairs={olive:['#5c684d','#e7d8bd'],navy:['#273e56','#c6a566'],rose:['#a56463','#ead5c9'],none:null};const pair=pairs[d.line];stripes.forEach((m,i)=>{m.visible=!!pair;if(pair)m.material.color.set(pair[i%2])});
   const c=initialCanvas.getContext('2d');c.clearRect(0,0,512,256);c.fillStyle=d.initialColor||'#f1e2bd';c.font='bold 100px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText((d.initials||'').replace(/[^A-Z]/g,'').slice(0,3),256,128);initialTexture.needsUpdate=true;
   const p=patchCanvas.getContext('2d');p.clearRect(0,0,256,256);patch.visible=d.patch!=='none';if(patch.visible){p.fillStyle='#403b30';p.beginPath();p.arc(128,128,108,0,Math.PI*2);p.fill();p.strokeStyle='#d1b97c';p.lineWidth=3;p.beginPath();p.arc(128,128,95,0,Math.PI*2);p.stroke();p.fillStyle='#e3cf95';p.font='100px Georgia';p.textAlign='center';p.textBaseline='middle';p.fillText({star:'✦',moon:'☾',diamond:'◇',sun:'☀',leaf:'❧',arch:'∩'}[d.patch]||'✦',128,135)}patchTexture.needsUpdate=true;patch.position.x={left:-.76,center:0,right:.76}[d.patchPosition]??-.76;
  }
  function resize(){const {width,height}=container.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.render(scene,camera)}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  function tick(now){if(disposed)return;frame=requestAnimationFrame(tick);const dt=Math.min((now-last)/1000,.1);last=now;if(!active||document.hidden)return;
    if(tween){const t=Math.min(1,(now-tween.start)/600);const e=t*t*(3-2*t);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSphericalCoords(THREE.MathUtils.lerp(tween.fromDistance,standardDistance,e),THREE.MathUtils.lerp(tween.fromPhi,tween.toPhi,e),THREE.MathUtils.lerp(tween.fromTheta,tween.toTheta,e)));if(t===1)tween=null}
    else if(auto){const amount=Math.min(dt*Math.PI/6,Math.PI*2-autoAngle);autoAngle+=amount;const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),amount);camera.position.copy(controls.target).add(offset);if(autoAngle>=Math.PI*2)auto=false}
    controls.update();renderer.render(scene,camera)
  }
  frame=requestAnimationFrame(tick);
  function key(event){const valid=['ArrowLeft','ArrowRight','+','=','-'];if(!valid.includes(event.key))return;event.preventDefault();interact();if(event.key.startsWith('Arrow')){const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),event.key==='ArrowLeft'?-.12:.12);camera.position.copy(controls.target).add(offset)}else{const offset=camera.position.clone().sub(controls.target);const distance=THREE.MathUtils.clamp(offset.length()*(event.key==='-'?1.12:.89),controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(offset.normalize().multiplyScalar(distance))}controls.update()}
  renderer.domElement.addEventListener('keydown',key);
  return {getState(){return {azimuth:controls.getAzimuthalAngle(),elevation:90-THREE.MathUtils.radToDeg(controls.getPolarAngle()),zoom:standardDistance/controls.getDistance(),automatic:auto,damping:controls.enableDamping}},setDesign,setView,reset:()=>setView('front'),setActive(v){active=v},setReduced(v){reduced=v;controls.enableDamping=!v;if(v){auto=false;tween=null}},capture(theta=0){auto=false;tween=null;pose(theta,13);renderer.render(scene,camera);const output=document.createElement('canvas');output.width=renderer.domElement.width;output.height=renderer.domElement.height;const ctx=output.getContext('2d');ctx.fillStyle='#f5f5f3';ctx.fillRect(0,0,output.width,output.height);ctx.drawImage(renderer.domElement,0,0);return output.toDataURL('image/jpeg',.79)},dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();scene.traverse(o=>{o.geometry?.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(!m)continue;m.map?.dispose();m.dispose()}});renderer.dispose();renderer.domElement.remove()}}
}
