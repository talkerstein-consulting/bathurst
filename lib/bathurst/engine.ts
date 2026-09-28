/* eslint-disable @typescript-eslint/ban-ts-comment -- untyped port for the rough build; see TODO(typing) below */
// @ts-nocheck
// Bathurst Street hero + map engine (three.js). Ported from the approved HTML prototype (reference/prototype-v15.html).
// Owns: the WebGL scene, the street fly-through, the crane move, and the maps-app chrome inside #hero.
// React renders the markup (components/bathurst/BathurstHero.tsx); this module wires behaviour onto it.
// TODO(typing): the port is intentionally untyped for the rough build; type it once the behaviour is final.
import * as THREE from "three";
import { CLIENTS, ELSEWHERE, GROUPS, CROSS_STREETS, DIRECTIONS } from "./data";
import { BATHURST_LINE } from "./bathurst-line";
import { loadMapData, buildBuildings, buildFlatLayers, loadTopo } from "./osm-layer";

export function createBathurstEngine() {
  const ac = new AbortController(); const signal = ac.signal;
  // match the approved prototype (three r149): hex colours are used as-is (no sRGB→linear conversion)
  THREE.ColorManagement.enabled = false;

  if('scrollRestoration' in history) history.scrollRestoration='manual';
  if(!location.hash) scrollTo(0,0);
  let W = innerWidth, H = innerHeight;
  const C = {sea:0xF3F7F3, steel:0x19254A, orange:0xB3530E};
  const mix = (a,b,t) => new THREE.Color(a).lerp(new THREE.Color(b), t);

  // ---------- icons ----------
  const ICON = {
    food:'<path d="M7 3v7a2 2 0 002 2v9M11 3v7M7 7h4M16 21V3c2.5 1.5 3 4 3 7h-3"/>',
    health:'<path d="M12 5v14M5 12h14"/>',
    retail:'<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2"/>',
    services:'<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 16L18 4M16 16L6 4"/>',
    finance:'<path d="M4 20h16M6 17V10M10 17V10M14 17V10M18 17V10M3 9l9-5 9 5z"/>',
    industrial:'<path d="M3 20V10l5 3V10l5 3V6h6v14z"/>',
  };
  const svg = (k,cls='') => `<svg class="${cls}" viewBox="0 0 24 24">${ICON[k]}</svg>`;
  const IND = {
    food:{name:"Food & restaurant"}, health:{name:"Health"}, retail:{name:"Retail & beauty"},
    services:{name:"Personal services"}, finance:{name:"Insurance"}, industrial:{name:"Industrial"},
  };

  // ---------- data ----------
  // Bathurst clients: from TCG email (Paymo / proposals / quotes). Elsewhere: talkerstein.com/work (metrics as published there).
  // fresh copies each mount: the engine attaches scene objects (pos, el, ring) to these records
  const LOCAL = CLIENTS.filter(p=>!p.hidden).map(p=>({...p}));
  const AWAY = ELSEWHERE.filter(p=>!p.hidden).map(p=>({...p}));
  const ALL = [...LOCAL, ...AWAY];

  // ---------- geo ----------
  const O = {lat:43.7196, lon:-79.4296};
  const toXZ = (lat,lon) => ({x:(lon-O.lon)*80300, z:-(lat-O.lat)*111000});
  const LINE0 = [[43.6980,-79.4232],[43.7057,-79.4254],[43.71833,-79.42920],[43.7225,-79.43089],[43.72678,-79.43129],[43.7288,-79.43177],[43.7340,-79.4336],[43.74678,-79.43666],[43.7545,-79.4390],[43.7765,-79.4435],[43.7906,-79.4452],[43.79896,-79.44632],[43.8120,-79.4500]].map(p=>toXZ(...p));
  // the real centreline (smoothed a little so the camera glides), used by the camera, callouts and labels
  const XREF = { ...BATHURST_LINE, xs: BATHURST_LINE.xs.map((_,i,a)=>{ let t=0,n=0; for(let k=-4;k<=4;k++){ const v=a[i+k]; if(v!==undefined){ t+=v; n++; } } return t/n; }) };
  const xAt = z => { if(XREF){ const f=(XREF.z0-z)/XREF.step, i=Math.floor(f); if(i>=0 && i<XREF.xs.length-1) return XREF.xs[i]+(XREF.xs[i+1]-XREF.xs[i])*(f-i); } for(let i=0;i<LINE0.length-1;i++){const a=LINE0[i],b=LINE0[i+1]; if(z<=a.z&&z>=b.z){return a.x+(b.x-a.x)*(z-a.z)/(b.z-a.z);}} return z>LINE0[0].z?LINE0[0].x:LINE0[LINE0.length-1].x; };
  const LINE = []; for(let z=XREF.z0; z>=XREF.z0-(XREF.xs.length-1)*XREF.step; z-=XREF.step) LINE.push(new THREE.Vector3(xAt(z),0,z));
  const zOf = lat => -(lat-O.lat)*111000;
  const km = (a,b) => { const R=6371, r=Math.PI/180, dLa=(b.lat-a.lat)*r, dLo=(b.lon-a.lon)*r; const h=Math.sin(dLa/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLo/2)**2; return 2*R*Math.asin(Math.sqrt(h)); };

  // ---------- three ----------
  const stage = document.getElementById('stage');
  const mobile = W < 760;
  const renderer = new THREE.WebGLRenderer({antialias:true});
  // render resolution: at most 1.5x (retina at 2x costs ~1.8x the GPU for little visible gain); drops further if frames run slow
  let dprCap = Math.min(devicePixelRatio, 1.5);
  renderer.setPixelRatio(dprCap);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0xF3F7F3, 1);   // outside the front-page window: paper   // with colour management off, hex values reach the screen unchanged (#B3530E is #B3530E)
  stage.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  // Vintage road-map poster: Steel Blue land, Sea Breeze paper for sky and horizon haze
  const GROUND = new THREE.Color(C.steel);
  const HAZE = new THREE.Color(C.sea);
  scene.background = HAZE;
  scene.fog = new THREE.Fog(HAZE, 100, 2000);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 80000);
  scene.add(new THREE.HemisphereLight(mix(C.sea,0xffffff,.5), mix(C.steel, C.sea, .45), 0.9*Math.PI));  // ×π: three r155+ lights are physically based; matches the r149 prototype
  const sun = new THREE.DirectionalLight(mix(C.sea, C.orange, 0.12), 0.75*Math.PI); sun.position.set(-0.6, 1, 0.35); scene.add(sun);

  // Every flat map layer (ground, park, streets, route) skips the depth buffer and is painted in creation order,
  // so layers a few centimetres apart never fight for depth when seen from high up.
  let flatOrder = 1;
  const flatMat = (color, opacity=1) => new THREE.MeshBasicMaterial({color, side:THREE.DoubleSide, transparent:true, opacity, depthWrite:false});
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60000,60000), flatMat(GROUND));
  ground.rotation.x = -Math.PI/2; ground.position.z = -4000; ground.renderOrder = flatOrder++; scene.add(ground);

  function ribbon(pts, width, color, y, opts={}){
    const pos=[], idx=[];
    pts.forEach((p,i)=>{
      const a=pts[Math.max(0,i-1)], b=pts[Math.min(pts.length-1,i+1)];
      const d=new THREE.Vector3().subVectors(b,a).normalize(); const n=new THREE.Vector3(-d.z,0,d.x).multiplyScalar(width/2);
      pos.push(p.x+n.x,y,p.z+n.z, p.x-n.x,y,p.z-n.z);
      if(i<pts.length-1){const k=i*2; idx.push(k,k+1,k+2, k+1,k+3,k+2);}
    });
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx);
    const m=new THREE.Mesh(g, flatMat(color, opts.opacity??1));
    m.renderOrder = flatOrder++; scene.add(m); return m;
  }
  const seg = (x1,z1,x2,z2) => [new THREE.Vector3(x1,0,z1), new THREE.Vector3(x2,0,z2)];

  // Cross-street names in caps (no badges). Lawrence, Wilson and the 401 sit among the callouts, so they stay unlabelled.
  const CROSS = CROSS_STREETS;
  const roadLabels = [];
  const UNLABELLED = ['Lawrence Ave W','Wilson Ave','Hwy 401'];
  CROSS.forEach(([name,lat])=>{
    if(UNLABELLED.includes(name)) return;
    const z=zOf(lat), x=xAt(z);
    roadLabels.push({name, pos:new THREE.Vector3(x+900,0,z), cls:''});
  });
  // hero: every cross street named right where it meets Bathurst, so the low 3D fly-through reads like a street map
  CROSS.forEach(([name,lat])=>{ const z=zOf(lat); roadLabels.push({name, pos:new THREE.Vector3(xAt(z)+70,0,z), cls:'hero', hero:true}); });
  // Map furniture so the paper reads like a real atlas: more avenues, the parallel streets, parks, landmarks
  // and neighbourhoods. Positions are approximate (hand-placed from OSM), which is fine for labels.
  // Priority is array order: the collision pass drops later labels first.
  const at = (lat,lon) => { const {x,z}=toXZ(lat,lon); return new THREE.Vector3(x,0,z); };
  [["Glencairn Ave",43.7093],["Brooke Ave",43.7247],["Laurelcrest Ave",43.7285],["Overbrook Pl",43.7466],["Codsell Ave",43.7485],["Drewry Ave",43.7843],["Clark Ave W",43.8025]]
    .forEach(([name,lat])=>{ const z=zOf(lat); roadLabels.push({name, pos:new THREE.Vector3(xAt(z)+620,0,z), cls:'', min:600}); });
  // north–south streets, offset from Bathurst (the grid leans with it); labelled at a few points each
  [["Yonge St",.0275],["Avenue Rd",.0166,43.735],["Allen Rd",-.0150,43.748],["Dufferin St",-.0226],["Wilson Heights Blvd",-.0118,43.765]].forEach(([name,dl,maxLat])=>{
    for(const lat of [43.712,43.742,43.772]){ if(maxLat && lat>maxLat) continue; const z=zOf(lat), bl=O.lon+xAt(z)/80300; roadLabels.push({name, pos:at(lat, bl+dl), cls:'ns', min:900}); } });
  [["Lawrence Manor",43.7262,-79.4385],["Bedford Park",43.7290,-79.4120],["Englemount",43.7165,-79.4360],["Clanton Park",43.7440,-79.4450],["Armour Heights",43.7445,-79.4230],
   ["Bathurst Manor",43.7625,-79.4535],["Westminster–Branson",43.7780,-79.4470],["Newtonbrook",43.7850,-79.4200],["Yorkdale–Glen Park",43.7160,-79.4575],["Thornhill",43.8060,-79.4420],["Downsview",43.7330,-79.4800]]
    .forEach(([name,lat,lon])=>roadLabels.push({name, pos:at(lat,lon), cls:'hood', min:1400}));

  // Real city from OpenStreetMap (public/map/bathurst-osm.tcgm.gz), drawn flat like a 1940s road map.
  // Flat city layers take paint orders 2-39; the Bathurst route is painted above them.
  const PALETTES = {
    // Poster: Steel Blue land, Sea Breeze city (the 1940s route-map look)
    poster: {
      ground: new THREE.Color(C.steel),
      roof: new THREE.Color(C.sea), wallLit: mix(C.sea, C.steel, .10), wallShade: mix(C.sea, C.steel, .34), ink: new THREE.Color(C.steel),
      roads: [mix(C.steel,C.sea,.20), mix(C.steel,C.sea,.30), mix(C.steel,C.sea,.36), mix(C.steel,C.sea,.44), mix(C.steel,C.sea,.58), mix(C.steel,C.sea,.30)],
      park: mix(C.steel, C.sea, .09), water: mix(C.steel, C.sea, .42), footprint: mix(C.steel, C.sea, .30),
      topo: {color:new THREE.Color(C.sea), minor:.10, major:.22},
    },
    // Paper: Sea Breeze land with Steel Blue ink, like a printed street atlas
    paper: {
      ground: mix(C.sea, C.steel, .10),
      roof: new THREE.Color(C.sea), wallLit: mix(C.sea, C.steel, .16), wallShade: mix(C.sea, C.steel, .36), ink: new THREE.Color(C.steel),
      roads: [new THREE.Color(C.sea), new THREE.Color(C.sea), new THREE.Color(C.sea), new THREE.Color(C.sea), mix(C.sea, C.steel, .30), new THREE.Color(C.sea)],
      park: mix(C.sea, C.steel, .18), water: mix(C.sea, C.steel, .34), footprint: mix(C.sea, C.steel, .24),
      topo: {color:new THREE.Color(C.steel), minor:.16, major:.34},
    },
  };
  const PALETTE = PALETTES.paper;
  const city = {meshes:[], ready:false};
  loadMapData('/map/bathurst-osm.tcgm.gz', signal).then(data=>{
    if(dead) return;
    let o=2; const flats=buildFlatLayers(data, PALETTE, flatMat, ()=>Math.min(39, o++));
    const {mesh, lines, recolor} = buildBuildings(data, PALETTE);
    for(const m of [...flats, mesh, lines]){ scene.add(m); city.meshes.push(m); }
    city.recolor=recolor; city.ink=lines; city.ready=true; city.data=data;
    paintBathurst(data);
    applyStyle(); applyShow();
  }).catch(err=>{ if(err?.name!=='AbortError') console.warn('Bathurst map data failed to load', err); });
  loadTopo('/map/bathurst-topo.tcgt.gz', signal).then(({minor, major})=>{
    if(dead) return;
    for(const l of [minor, major]){ l.renderOrder = 1.5; scene.add(l); city.meshes.push(l); }
    applyStyle(); applyShow();
  }).catch(err=>{ if(err?.name!=='AbortError') console.warn('Bathurst contours failed to load', err); });
  flatOrder = 40;

  // Bathurst: the route (orange, draws in as the camera cranes up)
  const routeGlow = ribbon(LINE, 110, C.orange, 0.2, {opacity:.0001});
  const route = ribbon(LINE, 10, C.orange, 0.22);
  // clip: in the hero only the road behind the runner is orange, so the line reads as trailing the point
  const clipZ = {value:-1e9}, clipS = {value:1e9};   // north / south cut of the orange (south: the last client pin, on the map)
  for(const m of [route.material, routeGlow.material]) m.onBeforeCompile = sh => {
    sh.uniforms.uClipZ = clipZ; sh.uniforms.uClipS = clipS;
    sh.vertexShader = 'varying float vWz;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWz = (modelMatrix * vec4(transformed,1.0)).z;');
    sh.fragmentShader = 'uniform float uClipZ; uniform float uClipS; varying float vWz;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n if(vWz < uClipZ || vWz > uClipS) discard;');
  };
  route.visible = routeGlow.visible = false;   // Bathurst is no longer highlighted: the journey route (below) carries the orange
  let routeCount = route.geometry.index.count;
  // the runner: a point that travels up the orange line (the hero camera chases it; on the map it loops the route)
  const runner = new THREE.Group();
  { const ring=new THREE.Mesh(new THREE.CircleGeometry(1,40), flatMat(new THREE.Color(C.sea))), dot=new THREE.Mesh(new THREE.CircleGeometry(.62,40), flatMat(new THREE.Color(C.orange))),
      halo=new THREE.Mesh(new THREE.RingGeometry(1.25,1.45,48), flatMat(new THREE.Color(C.orange), .5));
    for(const [m,o] of [[halo,1001],[ring,1002],[dot,1003]]){ m.rotation.x=-Math.PI/2; m.renderOrder=o; m.material.depthTest=false; runner.add(m); }
    runner.position.y=.5; runner.userData.halo=halo; scene.add(runner); }
  // Directions (after the last client): the last client's pin becomes "You are here" and drives on real streets
  // (the OSM road graph), one leg per step, never back north toward the pins already visited. Its trail extends
  // the orange highlight, which on the map ends at that pin.
  let DIR=null, trail=null, ghost=null; const trailD={value:0}; let jTarget=0;   // jTarget: how far the journey fill should reach (client walk)   // trail is drawn up to exactly this distance
  const lastPin = () => NODES[NODES.length-1].pos;   // NODES run north → south: the last stop is the southernmost
  function buildDir(){
    const data=city.data; if(!data) return null;
    const S=lastPin(), minZ=S.z-5;   // z grows southward: nothing north of the last pin
    // road graph: shared vertices (snapped to 3 m) are the intersections; motorways excluded
    const nodes=new Map(), key=(x,z)=>`${Math.round(x/3)},${Math.round(z/3)}`;
    const node=(x,z)=>{ const k=key(x,z); let n=nodes.get(k); if(!n){ n={k,x,z,adj:[]}; nodes.set(k,n); } return n; };
    const COST=[1.35,1.1,1,1];   // prefer the bigger streets, like a navigation app
    for(const r of data.roads){ if(r.cls>3) continue;
      for(let i=1;i<r.pts.length;i++){ const [x1,z1]=r.pts[i-1], [x2,z2]=r.pts[i]; 
        const a=node(x1,z1), b=node(x2,z2); if(a===b) continue; const w=Math.hypot(x2-x1,z2-z1)*COST[r.cls]; a.adj.push([b,w]); b.adj.push([a,w]); } }
    const every=[...nodes.values()].filter(n=>n.adj.length), all=every.filter(n=>n.z>=minZ);
    const near=(x,z,pool=all)=>{ let best=null, bd=1e18; for(const n of pool){ const d=(n.x-x)**2+(n.z-z)**2; if(d<bd){ bd=d; best=n; } } return best; };
    const route=(a,b,lo=minZ)=>{   // Dijkstra with a small binary heap
      const dist=new Map([[a.k,0]]), prev=new Map(), h=[[0,a]];
      const push=e=>{ h.push(e); let i=h.length-1; while(i>0){ const p=(i-1)>>1; if(h[p][0]<=h[i][0]) break; [h[p],h[i]]=[h[i],h[p]]; i=p; } };
      const pop=()=>{ const top=h[0], last=h.pop(); if(h.length){ h[0]=last; let i=0; for(;;){ const l=2*i+1, r=l+1; let m=i; if(l<h.length&&h[l][0]<h[m][0]) m=l; if(r<h.length&&h[r][0]<h[m][0]) m=r; if(m===i) break; [h[m],h[i]]=[h[i],h[m]]; i=m; } } return top; };
      while(h.length){ const [d,n]=pop(); if(n===b) break; if(d>(dist.get(n.k)??1e18)) continue;
        for(const [m,w] of n.adj){ if(m.z<lo) continue; const nd=d+w; if(nd<(dist.get(m.k)??1e18)){ dist.set(m.k,nd); prev.set(m.k,n); push([nd,m]); } } }
      if(!prev.has(b.k) && a!==b) return [a,b];   // not connected: a straight hop rather than nothing
      const out=[]; for(let n=b; n; n=prev.get(n.k)) { out.push(n); if(n===a) break; } return out.reverse();
    };
    // targets: straight down Bathurst for two steps, one turn east onto the avenue, then arrive along it (few turns: calm)
    const tn=(()=>{ const dx=xAt(S.z-60)-xAt(S.z+60), L=Math.hypot(dx,120); return {x:dx/L, z:-120/L}; })(), ea={x:-tn.z, z:tn.x};
    const off=(p,v,m)=>({x:p.x+v.x*m, z:p.z+v.z*m});
    const S0={x:xAt(S.z), z:S.z}, T1=off(S0,tn,-450), T2=off(T1,tn,-450), T3=off(T2,ea,600), T4=off(T3,ea,500);
    // steps 1-2: dead straight down Bathurst's own centreline (where the orange ends), no side streets
    const pts=[], at=[0];
    const len=()=>{ let L=0; for(let i=1;i<pts.length;i++) L+=pts[i].distanceTo(pts[i-1]); return L; };
    // the client walk: straight down Bathurst from the first (northernmost) pin to the last
    // the client walk: pin to pin along the shortest roads (Dijkstra on the real street graph), in map order
    const pinD=[0];
    { let prev=near(NODES[0].pos.x, NODES[0].pos.z, (()=>{ const z0=NODES[0].pos.z, c=every.filter(n=>n.z>=z0-8 && Math.abs(n.x-roadX(n.z))<15); return c.length ? c : every; })());   /* start at the first pin, on its street, never above it */ pts.push(new THREE.Vector3(prev.x,0,prev.z));
      for(let k=1;k<NODES.length;k++){ const to=near(NODES[k].pos.x, NODES[k].pos.z, every);
        for(const n of route(prev,to,-1e18).slice(1)) pts.push(new THREE.Vector3(n.x,0,n.z)); pinD.push(len()); prev=to; } }
    const walkLen=len(), walk=pts.length;
    for(let z=S.z; z<=T1.z; z+=8) pts.push(new THREE.Vector3(roadX(z),0,z)); at.push(len());
    for(let z=T1.z+8; z<=T2.z; z+=8) pts.push(new THREE.Vector3(roadX(z),0,z));
    let from=near(roadX(T2.z), T2.z); pts.push(new THREE.Vector3(from.x,0,from.z)); at.push(len());
    // steps 3-4: the turn and the arrival follow the real streets
    for(const T of [T3,T4]){ const to=near(T.x,T.z); for(const n of route(from,to).slice(1)) pts.push(new THREE.Vector3(n.x,0,n.z)); at.push(len()); from=to; }
    for(let k=0;k<at.length;k++) at[k]-=walkLen;   // legs are measured from the last pin
    at[0]=0;
    const cum=[0]; for(let i=1;i<pts.length;i++) cum.push(cum[i-1]+pts[i].distanceTo(pts[i-1]));
    // the whole journey, faint; the solid trail fills it as you scroll (the page's progress indicator)
    ghost = ribbon(pts, 10, C.orange, 0.28, {opacity:0});
    trail = ribbon(pts, 10, C.orange, 0.3);
    { const d=[0]; for(let i=1;i<pts.length;i++) d.push(d[i-1]+pts[i].distanceTo(pts[i-1]));
      const ad=new Float32Array(pts.length*2); d.forEach((v,i)=>{ ad[i*2]=v; ad[i*2+1]=v; }); trail.geometry.setAttribute('aD', new THREE.BufferAttribute(ad,1));
      trail.material.onBeforeCompile = sh => { sh.uniforms.uD = trailD;
        sh.vertexShader = 'attribute float aD; varying float vD;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vD = aD;');
        sh.fragmentShader = 'uniform float uD; varying float vD;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n if(vD > uD) discard;'); }; }
    return {pts, cum, at, off:walkLen, walk, pinD, total:cum[cum.length-1]};
  }
  const dirPos=new THREE.Vector3(); let dirIdx=-1, dirD=0, dirLook=0;   // dirLook: metres the camera looks past the dot so it clears the card   // current step (-1 off, 0 = parked on the last pin, 1..4 = legs) and the dot's distance along the route
  const dirAt = d => { if(!DIR) { const p=lastPin(); return {p, i:1, head:Math.PI}; } let i=1; while(i<DIR.cum.length-1 && DIR.cum[i]<d) i++; const a=DIR.pts[i-1], b=DIR.pts[i], f=(d-DIR.cum[i-1])/Math.max(1e-6, DIR.cum[i]-DIR.cum[i-1]); return {p:new THREE.Vector3().lerpVectors(a,b,Math.min(1,Math.max(0,f))), i, head:Math.atan2(b.x-a.x, -(b.z-a.z))}; };
  let runZ = XREF.z0;
  // Paint the orange straight onto Bathurst's own road geometry from the map data (the same polylines the
  // grey road is drawn from), so its edges follow the street exactly instead of an approximate trace.
  // the real road under the orange: Bathurst's own ways, as z-sorted segments; roadX(z) interpolates on them
  let roadSegs=null;
  const roadX = z => {
    if(!roadSegs && city.data){ roadSegs=[]; for(const r of city.data.roads){ if(r.cls!==2 || !r.pts.every(([x,zz])=>Math.abs(x-xAt(zz))<24)) continue;
      for(let i=1;i<r.pts.length;i++){ const [x1,z1]=r.pts[i-1], [x2,z2]=r.pts[i]; if(z1!==z2) roadSegs.push(z1<z2 ? [z1,x1,z2,x2] : [z2,x2,z1,x1]); } } }
    if(!roadSegs || !roadSegs.length) return xAt(z);
    const ref=xAt(z); let best=null, bd=1e9;
    for(const [za,xa,zb,xb] of roadSegs){ if(z<za || z>zb) continue; const x=xa+(xb-xa)*(z-za)/(zb-za), d=Math.abs(x-ref); if(d<bd){ bd=d; best=x; } }
    return best ?? ref;   // two carriageways: the one nearest the centreline
  };
  function paintBathurst(data){
    const pos=[], idx=[]; const w=11, y=.22;
    for(const r of data.roads){ if(r.cls!==2) continue;
      if(!r.pts.every(([x,z])=>Math.abs(x-xAt(z))<24)) continue;
      const pts=r.pts; let base=pos.length/3;
      pts.forEach(([x,z],i)=>{ const a=pts[Math.max(0,i-1)], b=pts[Math.min(pts.length-1,i+1)]; let dx=b[0]-a[0], dz=b[1]-a[1]; const L=Math.hypot(dx,dz)||1; dx/=L; dz/=L;
        pos.push(x-dz*w/2,y,z+dx*w/2, x+dz*w/2,y,z-dx*w/2); if(i<pts.length-1){ const k=base+i*2; idx.push(k,k+1,k+2, k+1,k+3,k+2); } });
      // round caps where ways meet, so joints never show a notch
      for(const [x,z] of [pts[0], pts[pts.length-1]]){ const c=pos.length/3; pos.push(x,y,z); for(let k=0;k<=12;k++){ const t=k/12*Math.PI*2; pos.push(x+Math.cos(t)*w/2,y,z+Math.sin(t)*w/2); if(k) idx.push(c,c+k,c+k+1); } }
    }
    if(!idx.length) return;
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx);
    route.geometry.dispose(); route.geometry=g; routeCount=idx.length;
  }

  // 3D pin rings (pulse under selected + all pins)
  const ringGeo = new THREE.RingGeometry(.72, 1, 48);
  LOCAL.forEach(p=>{
    const {x,z} = toXZ(p.lat,p.lon); const lx = xAt(z);
    p.pos = new THREE.Vector3(Math.abs(x-lx)<22 ? lx+22 : x, 0, z);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({color:C.orange, transparent:true, opacity:.8, side:THREE.DoubleSide, depthWrite:false}));
    ring.rotation.x=-Math.PI/2; ring.position.copy(p.pos); ring.position.y=.4; ring.renderOrder=1000; scene.add(ring); p.ring=ring;
  });

  // ---------- DOM overlays ----------
  // Callouts: a location marker, a leader line, and a rounded card with the business thumbnail.
  // Cards alternate sides along the street and the leader grows until the card clears its neighbours.
  const labels = document.getElementById('labels');
  // the journey's destination: a map pin at the end of the route
  const destEl=document.createElement('div'); destEl.className='dest-pin'; destEl.setAttribute('aria-hidden','true');
  destEl.innerHTML=`<svg viewBox="0 0 24 32"><path d="M12 31s-10-10.2-10-18A10 10 0 0112 3a10 10 0 0110 10c0 7.8-10 18-10 18z"/><circle cx="12" cy="13" r="3.6"/></svg><span>Your destination</span>`;
  labels.appendChild(destEl);
  [...LOCAL].sort((a,b)=>b.pos.z-a.pos.z).forEach((p,i)=>{ p.side = i%2 ? 'l' : 'r'; });
  const thumbHTML = p => p.thumb ? `<img src="${p.thumb}" alt="" loading="lazy" decoding="async">` : svg(p.ind,'glyph');
  LOCAL.forEach(p=>{
    const el=document.createElement('div'); el.className=`pin ${p.side}`+(p.maybe?' maybe':''); el.tabIndex=0; el.setAttribute('role','button'); el.setAttribute('aria-label', `${p.name}, ${p.addr}`);
    el.innerHTML=`<svg class="mk" viewBox="-9 -9 18 18" aria-hidden="true"><g filter="url(#grunge)"><circle r="7"/><circle class="dot" r="2.6"/></g></svg><span class="ld" aria-hidden="true"></span><div class="co sprout" data-no-tumble><span class="th single hair">${thumbHTML(p)}</span><span class="txt"><b>${p.name}</b><small></small></span></div>`;
    el.onclick=()=>openPlace(p.id); el.onkeydown=e=>{if(e.key==='Enter')openPlace(p.id);};
    labels.appendChild(el); p.el=el; p.sub=el.querySelector('small'); p.co=el.querySelector('.co');
  });
  roadLabels.forEach(r=>{ const el=document.createElement('div'); el.className='road '+r.cls; el.textContent = r.name; labels.appendChild(el); r.el=el; });
  const tabs = Object.entries(GROUPS).filter(()=>false)   // off-screen group tabs retired (Sam's has its own callout)
    .map(([key,g])=>{
    const members = ALL.filter(p=>p.group===key);
    const el=document.createElement('button'); el.type='button'; el.className='etab frame';
    const d = Math.round(km(O,g));
    el.innerHTML=`<svg class="glyph ar" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg><span><b>${g.name}</b><span>${d.toLocaleString()} km away · ${members.length} client${members.length===1?'':'s'}</span></span>`;
    el.onclick=()=> key==='thornhill' ? openPlace('sams') : openGroup(key);
    labels.appendChild(el);
    const {x,z}=toXZ(g.lat,g.lon);
    return {key, g, el, members, dir:new THREE.Vector3(x,0,z).normalize(), dist:d, local:key==='thornhill', world:new THREE.Vector3(xAt(z)+20,0,z)};
  });

  // ---------- small UI helpers ----------
  const $ = id => document.getElementById(id);
  const toastEl=$('toast'); let toastT;
  function toast(msg){ toastEl.querySelector('span').textContent=msg; toastEl.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>toastEl.classList.remove('on'), 2400); }
  function copyText(txt, okMsg){
    try{ navigator.clipboard.writeText(txt).then(()=>toast(okMsg), ()=>toast(txt)); }catch(e){ toast(txt); }
  }
  const SAVE_KEY='tcg-maps-saved';
  let saved=new Set(); try{ saved=new Set(JSON.parse(localStorage.getItem(SAVE_KEY)||'[]')); }catch(e){}
  function toggleSave(id){
    saved.has(id) ? saved.delete(id) : saved.add(id);
    try{ localStorage.setItem(SAVE_KEY, JSON.stringify([...saved])); }catch(e){}
    toast(saved.has(id) ? 'Saved to your places' : 'Removed from your places'); render();
  }
  const goSection = id => { closeDrawer(); $(id).scrollIntoView({behavior:reduce?'auto':'smooth'}); };

  // ---------- filters / search / layers ----------
  let filter='all', layer='industry', query='';
  const chips=$('chips');
  // chips run in the order the industries first appear while scrolling the map (north first), then All clients
  const CHIP = {food:'Restaurants', retail:'Retail & beauty', health:'Health', services:'Personal services'};
  const INDS=[...new Set([...LOCAL].filter(p=>p.pos).sort((a,b)=>a.pos.z-b.pos.z).map(p=>p.ind))].map(k=>[k,CHIP[k],k]).concat([['all','All clients',null]]);
  let indIdx=0;
  INDS.forEach(([k,n,ic],idx)=>{
    const b=document.createElement('button'); b.type='button'; b.className='chip sprout btn sm'; b.setAttribute('aria-pressed',k==='all'); b.setAttribute('aria-label', n);
    b.innerHTML=(ic?svg(ic,'glyph'):'')+n;
    b.onclick=()=>{ if(k==='all') return scrollToProg(1); const j=NODES.findIndex(p=>p.ind===k); if(j>=0) scrollToNode(j); };
    chips.appendChild(b);
  });
  // chevrons step to the previous / next category; the row itself swipes (native horizontal scroll)
  const chipPrev=$('chipprev'), chipNext=$('chipnext');
  // Front page → map: the chip row glides from inside the view to its map slot (FLIP, no fading)
  function flipChips(apply){
    // the chips themselves glide (the front-page label ahead of them drops out of the row)
    const a=chips.getBoundingClientRect(); apply(); const b=chips.getBoundingClientRect();
    chips.getAnimations().forEach(x=>x.cancel());
    if(!reduce && (a.left!==b.left || a.top!==b.top)) chips.animate([{transform:`translate(${a.left-b.left}px,${a.top-b.top}px)`},{transform:'none'}], {duration:620, easing:'cubic-bezier(.65,0,.35,1)'});
    chipEnds();
  }
  // markers arrive one by one, top of the screen first
  function popPins(){ LOCAL.filter(p=>p.pos).map(p=>({p, y:project(p.pos).y})).sort((a,b)=>a.y-b.y).forEach(({p},i)=>{ p.el.style.setProperty('--d', (reduce?0:i*160)+'ms'); p.el.classList.remove('pop'); void p.el.offsetWidth; p.el.classList.add('pop'); }); }
  // Google-style: an arrow only shows at an end the row can still scroll toward (i.e. when the chips overflow)
  const pageChips = d => chips.scrollBy({left: d*chips.clientWidth*.7, behavior: reduce?'auto':'smooth'});
  chipPrev.onclick=()=>pageChips(-1); chipNext.onclick=()=>pageChips(1);
  function chipEnds(){ const max=chips.scrollWidth-chips.clientWidth-2; chipPrev.hidden = chips.scrollLeft<=2; chipNext.hidden = chips.scrollLeft>=max; }
  chips.addEventListener('scroll', chipEnds, {passive:true, signal});
  addEventListener('resize', chipEnds, {signal});
  const NODES = [...LOCAL].filter(p=>p.pos).sort((a,b)=>a.pos.z-b.pos.z);   // top of the map first
  let nodeIdx=-1;
  // the chip row is the category indicator: it lights the current node's industry
  // centre a chip by scrolling only the chip row (scrollIntoView would also slide the whole map container sideways)
  function centreChip(c){ if(c) chips.scrollTo({left: c.offsetLeft - (chips.clientWidth - c.offsetWidth)/2, behavior: reduce?'auto':'smooth'}); }
  function markChip(k){ const i=Math.max(0, INDS.findIndex(x=>x[0]===k)); [...chips.children].forEach((c,j)=>c.setAttribute('aria-pressed', j===i)); if(k==='all') chips.scrollTo({left:0, behavior:'smooth'}); else centreChip(chips.children[i]); }
  function setNode(i){
    nodeIdx=Math.max(-1, Math.min(NODES.length-1, i));
    stick.classList.toggle('nodes', nodeIdx>=0);
    if(nodeIdx<0){ selected=null; markChip('all'); if(view.type==='place') view={type:'list'}; setCollapsed(true); render(); refresh(); resetView(); return; }
    openPlace(NODES[nodeIdx].id);   // focus the marker and open its sidebar
  }
  function setIndustry(i){
    indIdx=Math.max(0, Math.min(INDS.length-1, i)); const k=INDS[indIdx][0];
    filter=k; [...chips.children].forEach((c,j)=>c.setAttribute('aria-pressed', j===indIdx)); chipEnds();
    centreChip(chips.children[indIdx]);
    if(view.type==='place'){ view={type:query?'results':'list'}; selected=null; }
    if(k!=='all' && mapReady()) setCollapsed(false);
    render(); refresh();
    if(k==='all') resetView(); else { const r=ALL.filter(matches).filter(p=>p.pos); if(r.length) fitTo(r); }
    stepHint();
  }
  function stepHint(){
    const h=document.getElementById('maphint'); if(!h) return;   // step pill removed; the chips show the active industry
    const n=INDS.length, nx=INDS[indIdx+1];
    const txt = `${INDS[indIdx][1]} · ${indIdx+1} of ${n}` + (nx ? ` · scroll for ${nx[1]}` : ' · keep scrolling for how we work');
    if(h.lastChild.nodeValue!==txt) h.lastChild.nodeValue=txt;
  }
  const matches = p => (filter==='all'||p.ind===filter) && (!query || (p.name+' '+p.addr+' '+IND[p.ind].name+' '+p.services.join(' ')).toLowerCase().includes(query));
  const q=$('q'), qclear=$('qclear');
  q.addEventListener('input',()=>{ query=q.value.trim().toLowerCase(); qclear.hidden=!q.value; view={type:query?'results':'list'}; selected=null; render(); refresh(); });
  $('searchform').addEventListener('submit', e=>{ e.preventDefault(); const r=ALL.filter(matches); if(!query) return; if(r.length===1) openPlace(r[0].id); else if(r.length){ fitTo(r.filter(p=>p.pos)); setSheet('half'); } q.blur(); });
  qclear.onclick=()=>{ q.value=''; query=''; qclear.hidden=true; view={type:'list'}; selected=null; render(); refresh(); q.focus(); };
  const PH=["Search “bagels”","Search “website”","Search “brand identity”","Search “menu”","Search “booking”"]; let phI=0;
  const phTimer = setInterval(()=>{ if(!q.value && document.activeElement!==q && view.type!=='place'){ q.placeholder=PH[phI++%PH.length]; } }, 2600);
  const layerBtn=$('layerbtn') || document.createElement('button'), layersEl=$('layers');   // the map view button gave its slot to Directions
  const setLayers = open => { layersEl.hidden=!open; layerBtn.setAttribute('aria-expanded', open); };
  layerBtn.onclick=()=>setLayers(layersEl.hidden);
  layersEl.querySelectorAll('[data-layer]').forEach(b=>b.onclick=()=>{ layer=b.dataset.layer; layersEl.querySelectorAll('[data-layer]').forEach(x=>x.setAttribute('aria-pressed',x===b)); refresh(); });
  $('mvclose').onclick=()=>{ setLayers(false); layerBtn.focus(); };
  // Map view settings: view (3D / 2D), style (poster / paper), what to show
  const mapView = {view:'3d', style:'paper', show:{buildings:true, blocks:true, nature:true, contours:true}};
  const pressGroup = (attr, val) => layersEl.querySelectorAll(`[data-${attr}]`).forEach(x=>x.setAttribute('aria-pressed', x.dataset[attr]===val));
  layersEl.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{ mapView.view=b.dataset.view; pressGroup('view', mapView.view); applyView(); });
  layersEl.querySelectorAll('[data-style]').forEach(b=>b.onclick=()=>{ mapView.style=b.dataset.style; pressGroup('style', mapView.style); applyStyle(); });
  layersEl.querySelectorAll('[data-show]').forEach(inp=>inp.onchange=()=>{ mapView.show[inp.dataset.show]=inp.checked; applyShow(); });
  function applyView(){
    if(target<1) scrollToProg(1);
    mapDirty=true;
    setGoal(mapView.view==='2d' ? {pitch:0} : {pitch:defaultView().pitch});
  }
  function applyStyle(){
    const pal = PALETTES[mapView.style];
    ground.material.color.copy(pal.ground);
    for(const m of city.meshes){
      const k=m.userData.kind;
      if(k==='park') m.material.color.copy(pal.park);
      else if(k==='water') m.material.color.copy(pal.water);
      else if(k==='blocks') m.material.color.copy(pal.footprint);
      else if(k?.startsWith('road')) m.material.color.copy(pal.roads[+k.slice(4)]);
      else if(k==='topo' || k==='topo-index'){ m.material.color.copy(pal.topo.color); m.material.opacity = k==='topo' ? pal.topo.minor : pal.topo.major; }
    }
    city.recolor?.(pal);
    document.getElementById('stick').classList.toggle('paper-map', mapView.style==='paper');
  }
  applyStyle();
  function applyShow(){
    for(const m of city.meshes){
      const k=m.userData.kind;
      if(k==='buildings') m.visible=mapView.show.buildings;
      else if(k==='blocks') m.visible=mapView.show.blocks;
      else if(k==='park' || k==='water') m.visible=mapView.show.nature;
      else if(k==='topo' || k==='topo-index') m.visible=mapView.show.contours;
    }
  }
  document.addEventListener('pointerdown', e=>{ if(!layersEl.hidden && !layersEl.contains(e.target) && !layerBtn.contains(e.target)) setLayers(false); }, {signal});
  function subLine(p){ if(layer==='services') return p.services.slice(0,2).join(' · '); if(layer==='results') return p.result || 'Case study in progress'; return IND[p.ind].name; }

  // ---------- menu drawer ----------
  // (the menu drawer was retired; the sidebar toggle took its place)
  const drawer={hidden:true}; const closeDrawer=()=>{};

  // ---------- sheet ----------
  const placeClose=$('placeclose');
  const sheet=$('sheet'), sheetBody=$('sheetBody'); let view={type:'list'}, selected=null;
  const I = {
    bookmark:'<path d="M7 3h10v18l-5-4-5 4z"/>',
    share:'<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>',
    diag:'<path d="M12 2l10 10-10 10L2 12z"/><path d="M9 14v-2a2 2 0 012-2h4M13 8l2 2-2 2"/>',
    web:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>',
    doc:'<path d="M5 4h10l4 4v12H5z"/><path d="M9 12h6M9 16h6"/>',
    peg:'<circle cx="12" cy="5" r="2.4"/><path d="M8.5 21l1-6H8l1.2-5.2A2 2 0 0111.1 8h1.8a2 2 0 011.9 1.8L16 15h-1.5l1 6"/>',
  };
  // Sheet actions are text CTAs (STYLE.md: icon-only is for universal actions); the Diagnostic is the one orange CTA.
  const act = (key, label, icon, extra='') => `<button class="act sprout btn sm${key==='pri'?' orange':''}" type="button" data-a="${label}" aria-label="${label}" ${extra}><svg class="glyph" viewBox="0 0 24 24">${icon}</svg>${label}</button>`;
  const thumb = p => `<span class="th single hair">${thumbHTML(p)}</span>`;
  const item = p => `<button class="item${matches(p)?'':' dim'}" type="button" data-id="${p.id}">${thumb(p)}<span><b>${p.name}${saved.has(p.id)?'<span class="sv-badge">Saved</span>':''}</b><span class="sub">${IND[p.ind].name} · ${p.addr}</span>${p.result?`<span class="res">${p.result}</span>`:`<span class="sub">${p.services.join(' · ')}</span>`}</span></button>`;
  const group = (title, list, extra='') => `<div class="sec"><span class="eyebrow">${title} · ${list.length}</span>${extra}</div><div class="items">${list.map(item).join('')}</div>`;
  function listHTML(){
    const loc = LOCAL.filter(p=>!p.group), th = ALL.filter(p=>p.group==='thornhill'), away = AWAY.filter(p=>p.group!=='thornhill');
    return `<div class="biz">
      <h2 class="tcg-logo biz-logo" role="img" aria-label="Talkerstein Consulting Group"></h2>
      <div class="meta"><b>5.0</b><span class="stars" aria-label="5 out of 5">★★★★★</span><span>7 reviews on Clutch · Toronto consulting agency</span></div>
      <div class="acts">
        ${act('pri','Diagnostic',I.diag)}
        <a class="act sprout btn sm" href="https://talkerstein.com" target="_blank" rel="noopener" aria-label="Website"><svg class="glyph" viewBox="0 0 24 24">${I.web}</svg>Website</a>
        ${act('','Save',I.bookmark,`aria-pressed="${saved.has('tcg')}"`)}
        ${act('','Share',I.share)}
      </div>
    </div>
    ${group('Along Bathurst', loc, `<button class="sprout link" type="button" id="routecard" aria-label="Show all of Bathurst">Show all</button>`)}
    ${th.length ? group('Thornhill', th) : ''}
    ${away.length ? group('Elsewhere', away) : ''}
    <p class="sheet-credit">Map data © OpenStreetMap contributors · Elevation: AWS Terrain Tiles</p>`;
  }
  function resultsHTML(){
    const r=ALL.filter(matches), term=q.value.trim().replace(/[<>&"]/g,'');
    if(!r.length) return `<div class="results-h"><p><b>No results for “${term}”</b></p><p>Try a service like “website” or “menu”.</p><button class="sprout link" type="button" id="clearq" aria-label="Clear the search">Clear the search</button></div>`;
    return `<div class="results-h"><p><b>${r.length}</b> result${r.length===1?'':'s'} for “${term}”</p></div><div class="items">${r.map(item).join('')}</div>`;
  }
  // a client's sidebar: gallery, name, then Overview / Reviews / About tabs (maps-listing style, no action buttons)
  function placeHTML(p){
    const tab = placeTab[p.id] || 'overview';
    const panel = {
      overview: `${p.result?`<div class="result"><b>${p.result}</b><small>Published on talkerstein.com/work</small></div>`:''}
        <dl class="kv">
          <dt><svg class="glyph" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg><span class="sr-only">Address</span></dt><dd>${p.addr}${/Thornhill|ON$/.test(p.addr)?'':', Toronto'}</dd>
          <dt><svg class="glyph" viewBox="0 0 24 24"><path d="M14 7l3-3 3 3-3 3M4 20l9-9"/></svg><span class="sr-only">Services</span></dt><dd class="tags">${p.services.map(x=>`<span class="single hair">${x}</span>`).join('')}</dd>
        </dl>`,
      reviews: p.testimonial
        ? `<blockquote class="quote">“${p.testimonial.quote}”<cite>${p.testimonial.who}</cite></blockquote>`
        : `<p class="note">No published review from ${p.name} yet.</p>`,   // TODO(content): client quotes, never written on their behalf
      about: `<p class="about">${IND[p.ind].name} on Bathurst. Talkerstein handled ${p.services.join(', ').replace(/, ([^,]*)$/, ' and $1').toLowerCase()}.</p>${p.note?`<p class="note">${p.note}</p>`:''}`,
    }[tab];
    const T = [['overview','Overview'],['reviews','Reviews'],['about','About']];
    return `<div class="place">
      <div class="gallery"><div class="single hair">${thumbHTML(p)}<span>Case study image</span></div><div class="single hair"><span>Before</span></div><div class="single hair"><span>After</span></div></div>
      <div class="hd"><div><h2>${p.name}</h2><div class="meta">${IND[p.ind].name}${p.maybe?' · <b>to confirm</b>':''}</div></div></div>
      <div class="ptabs" role="tablist" aria-label="${p.name}">${T.map(([k,n])=>`<button type="button" role="tab" class="ptab" data-tab="${k}" aria-selected="${k===tab}">${n}</button>`).join('')}</div>
      <div class="ppanel" role="tabpanel">${panel}</div>
    </div>`;
  }
  const placeTab = {};
  function render(){
    const p = view.type==='place' ? ALL.find(x=>x.id===view.id) : null;
    const top = sheetBody.scrollTop, same = render._last===view.type+(view.id||'');
    sheetBody.innerHTML = p ? placeHTML(p) : view.type==='results' ? resultsHTML() : listHTML();
    // a clicked place docks the panel to the left edge (search floats over it, X closes the place)
    mapUI.classList.toggle('dock', !!p); placeClose.hidden = !p; qclear.hidden = !!p || !q.value;
    q.placeholder = p ? p.name : PH[0];
    render._last = view.type+(view.id||'');
    sheetBody.scrollTop = same ? top : 0;
    sheetBody.querySelectorAll('.item').forEach(b=>b.onclick=()=>openPlace(b.dataset.id));
    sheetBody.querySelectorAll('.ptab').forEach(b=>b.onclick=()=>{ placeTab[view.id]=b.dataset.tab; render(); });
    placeClose.onclick=()=>{ view={type:query?'results':'list'}; selected=null; render(); refresh(); q.focus({preventScroll:true}); };
    const cq=sheetBody.querySelector('#clearq'); if(cq) cq.onclick=()=>qclear.onclick();
    const rc=sheetBody.querySelector('#routecard'); if(rc) rc.onclick=fitRoute;
    sheetBody.querySelectorAll('[data-a]').forEach(b=>{
      const a=b.dataset.a;
      b.onclick = () => {
        if(a==='Diagnostic'){ document.getElementById('m1')?.click(); goSection('go'); }
        else if(a==='Save') toggleSave(p ? p.id : 'tcg');
        else if(a==='Share') copyText(p ? `${p.name}, ${p.addr}${/Thornhill|ON$/.test(p.addr)?'':', Toronto'}` : 'Talkerstein Consulting Group · talkerstein.com', p ? 'Address copied' : 'Details copied');
        else if(a==='Street View') goStreet(p);
        else if(a==='Case study'){ open('https://talkerstein.com/work','_blank','noopener'); }   // TODO(content): link each client's case study
      };
    });
  }
  function openPlace(id){
    const p=ALL.find(x=>x.id===id); if(!p) return;
    view={type:'place',id}; selected=id; { const j=NODES.findIndex(n=>n.id===id); if(j>=0) nodeIdx=j; markChip(p.ind); } render(); refresh(); setSheet('half'); setCollapsed(false);
    if(target<1) scrollToProg(1);
    if(p.pos) flyTo(p.pos, Math.min(goal.dist, 1500));
  }
  function refresh(){
    LOCAL.forEach(p=>{ p.el.classList.toggle('dim', !matches(p)); p.el.classList.toggle('sel', selected===p.id); if(p.sub.textContent!==subLine(p)){ p.sub.textContent=subLine(p); p.cw=0; } });
    tabs.forEach(t=>{ t.el.style.opacity = t.members.some(matches) ? 1 : .35; });
  }
  // phone bottom sheet: peek / half / full, drag or tap the handle
  const ORDER=['peek','half','full'];
  function setSheet(st){ sheet.dataset.state=st; }
  { const grab=$('grab'); let y0=null, moved=false;
    grab.addEventListener('pointerdown', e=>{ y0=e.clientY; moved=false; grab.setPointerCapture(e.pointerId); });
    grab.addEventListener('pointermove', e=>{ if(y0!==null && Math.abs(e.clientY-y0)>6) moved=true; });
    grab.addEventListener('pointerup', e=>{ if(y0===null) return; const dy=e.clientY-y0, i=ORDER.indexOf(sheet.dataset.state); y0=null;
      if(!moved) setSheet(ORDER[(i+1)%3]); else setSheet(ORDER[Math.max(0,Math.min(2, i + (dy<0?1:-1)))]); });
  }
  const mapUI=$('mapui');
  function setCollapsed(c){ mapUI.classList.toggle('pc', c); const et=$('edgetab'); et.setAttribute('aria-label', c?'Expand side panel':'Collapse side panel'); et.setAttribute('aria-expanded', String(!c));  }
  // the TCG mark opens the Talkerstein sidebar (the home listing)
  $('brandbtn').onclick=e=>{ e.preventDefault(); scrollTo({top:0, behavior: reduce?'auto':'smooth'}); };   // the TCG mark: back to the top, nothing else
  $('edgetab').onclick=()=>setCollapsed(!mapUI.classList.contains('pc'));
  render(); refresh(); stepHint(); chipEnds();

  // ---------- camera path (street view → crane → map) ----------
  const X0 = xAt(0);
  let streetAnchor = {x:X0, z:900};
  // on load the camera glides north up Bathurst at eye level until the visitor scrolls
  const INTRO = {el:0, segs:[], total:0, stopT:{}};
  { const stops=[520, ...LOCAL.map(p=>p.pos.z+35).sort((a,b)=>b-a)]; let t=0;
    const order=[...LOCAL].sort((a,b)=>b.pos.z-a.pos.z);
    for(let i=0;i<stops.length-1;i++){ const a=stops[i], b=stops[i+1], d=Math.abs(b-a), dur=Math.min(14, Math.max(4, 3.2+1.6*Math.sqrt(d/100))); INTRO.segs.push({a,b,t0:t,dur}); t+=dur; if(order[i]) INTRO.stopT[order[i].id]=t; }
    INTRO.total=t; }
  function introZ(t){ for(const s of INTRO.segs){ if(t<=s.t0+s.dur){ const u=(t-s.t0)/s.dur, f=.8*(.5-.5*Math.cos(Math.PI*u))+.2*u; return s.a+(s.b-s.a)*f; } } return INTRO.segs[INTRO.segs.length-1].b; }
  function keys(){
    const sx=streetAnchor.x, sz=streetAnchor.z, mz = W<760 ? 1750 : 0, fy = W<760 ? 2700 : 3900;
    return [
      // hero: above the rooftops, straight up the middle of Bathurst
      [0.00, [xAt(sz+140), W<760 ? 150 : 110, sz+140], [xAt(sz-650), 0, sz-650]],   // the text now sits beside/above the window, so the view can look down the street   // camera rides the road's own heading
      [0.45, [xAt(sz+300)+260, 700, sz+500],   [xAt(sz-1300)-60, 0, sz-1400]],
      [1.00, [X0-230, fy, -1350+mz+fy*.59], [X0-230, 0, -1350+mz]],
    ];
  }
  let posCurve, tgtCurve, KEYS;
  function buildCurves(){ KEYS=keys(); posCurve=new THREE.CatmullRomCurve3(KEYS.map(k=>new THREE.Vector3(...k[1])),false,'centripetal'); tgtCurve=new THREE.CatmullRomCurve3(KEYS.map(k=>new THREE.Vector3(...k[2])),false,'centripetal'); }
  const ease = x => x<.5 ? 4*x*x*x : 1-Math.pow(-2*x+2,3)/2;
  const toU = t => { for(let i=0;i<KEYS.length-1;i++){const a=KEYS[i][0],b=KEYS[i+1][0]; if(t<=b) return (i+ease((t-a)/(b-a)))/(KEYS.length-1);} return 1; };

  // ---------- map camera: centre, distance, bearing, pitch ----------
  const view3 = {cx:0, cz:0, dist:4000, bearing:0, pitch:.5};   // what is drawn
  const goal  = {cx:0, cz:0, dist:4000, bearing:0, pitch:.5};   // where it is easing to
  let mapDirty=false;
  function defaultView(){ const k=KEYS[KEYS.length-1], p=new THREE.Vector3(...k[1]), t=new THREE.Vector3(...k[2]), d=p.distanceTo(t); return {cx:t.x, cz:t.z, dist:d, bearing:0, pitch:Math.acos((p.y-t.y)/d)}; }
  function setGoal(v, instant){ Object.assign(goal, v); goal.dist=Math.min(16000,Math.max(300,goal.dist)); goal.pitch=Math.min(1.15,Math.max(0,goal.pitch)); if(instant) Object.assign(view3, goal); }
  function resetView(){ mapDirty=false; setGoal(defaultView()); }
  const fwd = b => ({x:Math.sin(b), z:-Math.cos(b)}), rgt = b => ({x:Math.cos(b), z:Math.sin(b)});
  function poseFrom(vw, pos, tgt){ const sp=Math.sin(vw.pitch), cp=Math.cos(vw.pitch), f=fwd(vw.bearing); tgt.set(vw.cx,0,vw.cz); pos.set(vw.cx - f.x*vw.dist*sp, vw.dist*cp, vw.cz - f.z*vw.dist*sp); }
  const mpp = dist => 2*dist*Math.tan(camera.fov*Math.PI/360)/H;
  // pixel offset of the visible map centre (panel / sheet cover part of the canvas)
  function visibleOffset(){
    if(W<760){ const top=120, bot=sheetTop(); return {x:0, y:H/2 - (top+bot)/2}; }
    if(mapUI.classList.contains('pc')) return {x:0,y:0};
    // centre on what the sidebar leaves visible (its real width, which changes per breakpoint)
    const r=mapUI.querySelector('.panel').getBoundingClientRect(), s=stick.getBoundingClientRect(); return {x:Math.max(0, r.right-s.left-(document.querySelector('.ctrls')?.offsetWidth||0)-24)/2, y:0};   // minus the control column on the right
  }
  function centreFor(world, dist, bearing, pitch){
    const o=visibleOffset(), m=mpp(dist), r=rgt(bearing), f=fwd(bearing), k=1/Math.max(.45,Math.cos(pitch));
    return {cx: world.x - r.x*o.x*m - f.x*o.y*m*k, cz: world.z - r.z*o.x*m - f.z*o.y*m*k};
  }
  function flyTo(world, dist){ mapDirty=true; setGoal({...centreFor(world, dist, goal.bearing, goal.pitch), dist}); }
  function fitTo(list){
    if(!list.length) return; if(list.length===1) return flyTo(list[0].pos, 1500);
    const zs=list.map(p=>p.pos.z), xs=list.map(p=>p.pos.x), cz=(Math.min(...zs)+Math.max(...zs))/2, cx=(Math.min(...xs)+Math.max(...xs))/2;
    const vw=Math.max(200, W-2*visibleOffset().x), span=Math.max(Math.max(...zs)-Math.min(...zs), (Math.max(...xs)-Math.min(...xs))*H/vw)*1.15;   // fit into the map the sidebar leaves visible
    flyTo(new THREE.Vector3(cx,0,cz), Math.max(1400, span*1.25));
    if(target<1) scrollToProg(1);
  }
  function fitRoute(){ if(target<1) scrollToProg(1); mapDirty=true; const zc=-4400; setGoal({...centreFor(new THREE.Vector3(xAt(zc),0,zc), W<760?19000:13500, 0, .35), dist:W<760?19000:13500, bearing:0, pitch:.35}); }

  // ---------- scroll drives everything (in screen heights) ----------
  // A: front page → map · B: one slot per client (focus + sidebar) · C: the cover sheet rises · then the page moves on
  let target=0, prog=0, lastTs=0, covered=false, winPx=null;   // covered: the reviews sheet is fully over the map, nothing to draw
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero=$('hero'), stick=$('stick'), coverEl=$('cover');
  const PH_A=1.6, PH_LEAD=.2, SLOT=.8, DIR_SLOTS=DIRECTIONS.length+2, PH_C=1, HOLD=.35;   // after the clients: parked on the pin, one slot per direction step, the "Find your way forward" step, then the reviews sheet
  const phB = () => NODES.length*SLOT;
  const DSLOT = () => W<760 ? 1.25 : SLOT;   // route steps: a longer slot on phones, where one swipe covers more of the page
  let coverH=0;
  function sizeHero(){ coverH = coverEl.offsetHeight || H; hero.style.height = ((PH_A+PH_LEAD+phB()+DIR_SLOTS*DSLOT()+PH_C+HOLD+1)*H + Math.max(0, coverH - H))+'px'; }
  let scrollNode=-2;
  function onScroll(){
    const s=Math.max(0, scrollY - hero.offsetTop)/H;
    target=Math.min(1, s/PH_A);
    const nodesEnd=PH_A+PH_LEAD+phB(), dirEnd=nodesEnd+DIR_SLOTS*DSLOT();
    if(s<nodesEnd){
      if(dirIdx>=0) setDir(-1);
      const n = s < PH_A+PH_LEAD ? -1 : Math.min(NODES.length-1, Math.floor((s-PH_A-PH_LEAD)/SLOT));
      // the fill reaches the pin in focus and eases on toward the next one
      { const f=Math.min(NODES.length-1, Math.max(0, (s-PH_A-PH_LEAD)/SLOT)), a=NODES[Math.floor(f)].pos.z, b=(NODES[Math.ceil(f)]||NODES[Math.floor(f)]).pos.z;
        jTarget = s < PH_A+PH_LEAD ? 0 : DIR?.pinD ? DIR.pinD[Math.floor(f)] /* the journey: solid only up to the pin in focus (none at the first), drawn as the dot drives to the next */ : Math.max(0, a+(b-a)*(f%1) - NODES[0].pos.z); }
      if(n!==scrollNode){ scrollNode=n; if(n!==nodeIdx || n<0) setNode(n); }
    } else {
      // half a slot parked on the last pin, then the rest of the phase drives the whole route in one motion
      const driveEnd = nodesEnd + DIRECTIONS.length*DSLOT();   // the dot arrives here; the last slot is the CTA step
      DIR ??= buildDir();
      // each step snaps: when its card shows, the dot drives its whole leg and parks at the waypoint
      const L=DIRECTIONS.length, t=(s-nodesEnd-DSLOT()*.5)/(DSLOT()*(DIRECTIONS.length-.5)/DIRECTIONS.length), li=Math.min(L-1, Math.max(0, Math.floor(t))), fr=t<0 ? 0 : 1;   /* the moment a step shows, the dot heads straight for its waypoint */
      const A=DIR?.at, span=DIR ? DIR.total-DIR.off : 1, d = A ? A[li]+((A[li+1]??span)-A[li])*fr : (li+fr)/L*span;
      dirProg = Math.min(1, Math.max(0, d/span));
      const leg = li+1;   // the card = the leg being driven
      setDir(s>=driveEnd ? DIRECTIONS.length+1 : dirProg<=0 ? 0 : Math.min(DIRECTIONS.length, leg));
    }
    // after the last direction step, the reviews (and services) sheet slides in
    const k1=Math.min(1, Math.max(0, (s-dirEnd)/PH_C)); covered = k1>=1;
    const up=Math.min(Math.max(0, coverH-H+16), Math.max(0, (s-dirEnd-PH_C)*H));   // once it is up, it keeps rising with the scroll
    coverEl.style.transform=`translate3d(0,${((1-k1)*H - up).toFixed(1)}px,0)`; coverEl.style.visibility = k1>0 ? 'visible' : 'hidden';
  }
  // directions mode: the sidebar collapses, the camera follows the nav dot, the step card shows each leg
  const dirCard=$('dircard');
  // the indicator: the hero's pulsing runner dot, parked on the last pin and driven along the route
  const nav = runner.clone(true); nav.userData.halo = nav.children[0]; nav.visible=false; scene.add(nav);
  let dirProg=0;   // 0..1 along the whole route, straight from the scroll (no stops until the end)
  function setDir(i){
    if(i===dirIdx) return;
    const was=dirIdx; dirIdx=i;
    stick.classList.toggle('dirs', i>=0);
    if(i<0){ nav.visible=false; setGoal({bearing:0, pitch: mapView.view==='2d' ? 0 : defaultView().pitch}); /* leave the route's south-facing tilt behind */ dirCard.classList.remove('on'); scrollNode=-2; onScroll(); return; }
    DIR ??= buildDir(); nav.visible=true;
    if(was<0){ selected=null; view={type:'list'}; render(); refresh(); setCollapsed(true); markChip('all'); dirD=DIR?DIR.off:0; mapDirty=true; }
    const st=DIRECTIONS[i-1] || (i===DIRECTIONS.length+1 ? 'cta' : null);
    // the steps slide: the old one leaves to the left, the next comes in from the right (reversed when scrolling back)
    dirCard.classList.toggle('on', i>=1);
    const track=dirCard.querySelector('.dc-track'), back = i < was;   // dirCard is the panel: heading above, the sliding card below
    track.querySelectorAll('.dc-step:not(.out)').forEach(el=>{ el.classList.add('out'); if(back) el.classList.add('back'); setTimeout(()=>el.remove(), 500); });
    if(st==='cta'){ track.appendChild(ctaCard(back)); }
    else if(st){ const el=document.createElement('div'); el.className='dc-step frame'+(back?' back':'');
      el.innerHTML=`<span class="dc-ico"><span class="dc-arrow" aria-hidden="true">${TURN[st.turn]}</span><small class="dc-est">${st.est}</small></span><div><small class="dc-n">Step ${i} of ${DIRECTIONS.length}</small><h3>${st.title}</h3><p>${st.body}</p></div>`;
      track.appendChild(el); }
  }
  // the last step: "Find Your Way Forward", a Google-Maps from/to intake that leads to the booking page
  const GOALS=[['engagement','Engagement'],['sales','Sales'],['marketing','Marketing'],['leads','Lead generation'],['retention','Customer retention'],['operations','Operations & automation'],['awareness','Brand awareness']];
  function ctaCard(back){
    const el=document.createElement('form'); el.className='dc-step dc-cta frame'+(back?' back':''); el.noValidate=false;
    el.innerHTML=`<div class="dc-cta-copy"><h3>Find Your Way Forward</h3><p>Tell us where you are and where you want to go. We will map the route.</p></div>
      <div class="dc-route"><span class="rail" aria-hidden="true"><i class="dot"></i><i class="dots"></i><span class="rpin"><svg class="glyph" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg></span></span>
        <label class="sprout field-box dir-box"><input class="input" name="from" required placeholder="Your business name" aria-label="Your business name" autocomplete="organization"></label>
        <label class="sprout field-box dir-box"><select class="input" name="goal" required aria-label="Your destination"><option value="" disabled selected>Choose your destination</option>${GOALS.map(([k,n])=>`<option value="${k}">${n}</option>`).join('')}</select>
          <span class="caret"><svg class="glyph" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span></label></div>
      <button type="submit" class="sprout btn orange dc-go" data-no-tumble aria-label="Get directions"><svg class="glyph" viewBox="0 0 24 24"><path d="M12 2.8l9.2 9.2-9.2 9.2L2.8 12z"/><path d="M9 14.5V12a1.5 1.5 0 011.5-1.5H15M13 8.5l2 2-2 2"/></svg>Get directions</button>`;
    // Get directions opens the booking page with the route filled in
    // the button only appears once both the business name and a destination are filled in
    const go=el.querySelector('.dc-go'), ready=()=>{ const f=new FormData(el); go.hidden = !(String(f.get('from')||'').trim() && f.get('goal')); };
    el.addEventListener('input', ready); el.addEventListener('change', ready); ready();
    el.onsubmit=e=>{ e.preventDefault(); const f=new FormData(el); location.href='/book?'+new URLSearchParams({from:String(f.get('from')||''), goal:String(f.get('goal')||'')}); };
    return el;
  }
  const TURN={
    straight:'<svg class="glyph" viewBox="0 0 24 24"><path d="M12 20V4M6.5 9.5L12 4l5.5 5.5"/></svg>',
    right:'<svg class="glyph" viewBox="0 0 24 24"><path d="M7 20v-7a4 4 0 014-4h8M14.5 4.5L19 9l-4.5 4.5"/></svg>',
    left:'<svg class="glyph" viewBox="0 0 24 24"><path d="M17 20v-7a4 4 0 00-4-4H5M9.5 4.5L5 9l4.5 4.5"/></svg>',
    arrive:'<svg class="glyph" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  };
  const goTo = s => scrollTo({top: hero.offsetTop + s*H, behavior: reduce?'auto':'smooth'});
  function scrollToProg(p){ goTo(p>=1 ? PH_A+.05 : p*PH_A); }
  function scrollToNode(j){ goTo(PH_A+PH_LEAD+(j+.5)*SLOT); }
  { const ro=new ResizeObserver(()=>{ if(!dead){ sizeHero(); onScroll(); } }); ro.observe(coverEl); signal.addEventListener('abort', ()=>ro.disconnect()); }   // the sheet's height sets the page length
  $('covergrab').onclick=()=>goTo(PH_A+PH_LEAD+phB()+DIR_SLOTS*DSLOT()+PH_C);
  const toHow=()=>goTo(PH_A+PH_LEAD+phB()+DSLOT()*.5);   // footer "How we work": the start of the directions
  document.addEventListener('click', e=>{ const a=e.target.closest?.('a[href="#how"]'); if(a){ e.preventDefault(); toHow(); } }, {signal});
  addEventListener('scroll', onScroll, {passive:true, signal});
  stick.addEventListener('scroll', ()=>{ if(stick.scrollLeft||stick.scrollTop){ stick.scrollLeft=0; stick.scrollTop=0; } }, {passive:true, signal});
  // sections below the map ask it to open a place: window.dispatchEvent(new CustomEvent('tcg:open', {detail:{id}}))
  const showPlace = id => { const j=NODES.findIndex(n=>n.id===id); if(j>=0) scrollToNode(j); else openPlace(id); };
  addEventListener('tcg:open', e=>showPlace(e.detail.id), {signal});
  const mapReady = () => target>=1 && prog>.97;
  // dev-only: jump the camera to a progress value without waiting for the eased scroll (stripped in production)
  if(process.env.NODE_ENV !== 'production') window.__tcgJump = v => { target=prog=Math.min(1,Math.max(0,v)); };
  function goStreet(p){ INTRO.el = (p && INTRO.stopT[p.id]!==undefined) ? INTRO.stopT[p.id] : 0; streetAnchor = (p && p.pos) ? {x:xAt(p.pos.z+420), z:p.pos.z+420} : {x:X0,z:900}; buildCurves(); if(!mapDirty) resetView(); scrollToProg(0); }
  $('pegman').onclick=()=>goStreet(selected ? ALL.find(p=>p.id===selected) : null);

  // ---------- map gestures (embedded-maps conventions) ----------
  const ray=new THREE.Raycaster(), plane=new THREE.Plane(new THREE.Vector3(0,1,0),0), hit=new THREE.Vector3(), ndc=new THREE.Vector2();
  function groundAt(px,py){ const r=stick.getBoundingClientRect(); ndc.set(((px-r.left)/W)*2-1, -((py-r.top)/H)*2+1); ray.setFromCamera(ndc,camera); return ray.ray.intersectPlane(plane, hit) ? hit.clone() : new THREE.Vector3(goal.cx,0,goal.cz); }
  function zoomAt(px,py,f){
    if(!mapReady()){ scrollToProg(1); return; }
    mapDirty=true; const P=groundAt(px,py); const nd=Math.min(16000,Math.max(300,goal.dist*f)), ff=nd/goal.dist;
    setGoal({dist:nd, cx:P.x+(goal.cx-P.x)*ff, cz:P.z+(goal.cz-P.z)*ff});
  }
  function panPx(dx,dy){ mapDirty=true; const m=mpp(view3.dist), r=rgt(view3.bearing), f=fwd(view3.bearing), k=1/Math.max(.45,Math.cos(view3.pitch));
    setGoal({cx: goal.cx - r.x*dx*m + f.x*dy*m*k, cz: goal.cz - r.z*dx*m + f.z*dy*m*k}, true); }
  function turn(db,dp){ mapDirty=true; setGoal({bearing:goal.bearing+db, pitch: mapView.view==='2d' ? 0 : goal.pitch+dp}, true); }
  const ghint=$('ghint'), ghintTxt=$('ghintTxt');
  // secondary chrome (pegman, coords) appears after the first real map interaction
  const touched = () => stick.classList.add('touched');
  stage.addEventListener('pointerdown', ()=>{ if(mapReady()) touched(); }, {signal});
  stage.addEventListener('wheel', ()=>{ if(mapReady()) touched(); }, {passive:true, signal});
  stage.addEventListener('keydown', ()=>{ if(mapReady()) touched(); }, {signal});
  // one-time compass hint: the drag gesture is otherwise only in a hover tooltip
  let compassHinted=false;
  const compassHint = () => { if(compassHinted) return; compassHinted=true; ghintTxt.textContent='Drag the compass to rotate the map';
    ghint.classList.add('on'); setTimeout(()=>ghint.classList.remove('on'), 2200); };
  const ownScroll = el => el.closest && el.closest('.sheet,.drawer,.layers,.chipbar,.scrim,.cover,.dirsheet');
  stick.addEventListener('wheel', e=>{
    if(!mapReady() || ownScroll(e.target)) return;
    if(e.ctrlKey || e.metaKey){ e.preventDefault(); zoomAt(e.clientX,e.clientY, Math.exp(e.deltaY*(e.ctrlKey&&!e.metaKey&&Math.abs(e.deltaY)<40 ? .012 : .0022))); }
  }, {passive:false});
  let drag=null;
  stage.addEventListener('contextmenu', e=>{ if(mapReady()) e.preventDefault(); });
  stage.addEventListener('pointerdown', e=>{
    if(e.pointerType==='touch' || !mapReady()) return;
    drag={x:e.clientX, y:e.clientY, rot: e.button===2 || e.ctrlKey || e.shiftKey, moved:0};
    stage.setPointerCapture(e.pointerId); stick.classList.add('grabbing'); stage.focus({preventScroll:true});
  });
  stage.addEventListener('pointermove', e=>{
    if(!drag) return; const dx=e.clientX-drag.x, dy=e.clientY-drag.y; drag.x=e.clientX; drag.y=e.clientY; drag.moved+=Math.abs(dx)+Math.abs(dy);
    drag.rot ? turn(dx*.006, dy*.004) : panPx(dx,dy);
  });
  const endDrag=()=>{ drag=null; stick.classList.remove('grabbing'); };
  stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('dblclick', e=>zoomAt(e.clientX,e.clientY,.5));
  // touch: one finger scrolls the page, two fingers move / pinch / twist the map
  let t2=null;
  const tInfo = ts => { const a=ts[0], b=ts[1]; return {x:(a.clientX+b.clientX)/2, y:(a.clientY+b.clientY)/2, d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY), a:Math.atan2(b.clientY-a.clientY,b.clientX-a.clientX)}; };
  stage.addEventListener('touchstart', e=>{ if(e.touches.length===2 && mapReady()){ e.preventDefault(); t2=tInfo(e.touches); } }, {passive:false});
  stage.addEventListener('touchmove', e=>{
    if(!mapReady()) return;
    if(e.touches.length===2 && t2){ e.preventDefault(); const n=tInfo(e.touches);
      panPx(n.x-t2.x, n.y-t2.y); const f=t2.d/n.d; if(Math.abs(1-f)>.002){ const P=groundAt(n.x,n.y), nd=Math.min(16000,Math.max(300,view3.dist*f)), ff=nd/view3.dist; setGoal({dist:nd, cx:P.x+(goal.cx-P.x)*ff, cz:P.z+(goal.cz-P.z)*ff}, true); }
      turn(n.a-t2.a, 0); t2=n; ghint.classList.remove('on'); }
  }, {passive:false});
  stage.addEventListener('touchend', e=>{ if(e.touches.length<2) t2=null; });
  stage.addEventListener('keydown', e=>{
    if(!mapReady()) return; const step=90;
    const k={ArrowLeft:[step,0],ArrowRight:[-step,0],ArrowUp:[0,step],ArrowDown:[0,-step]}[e.key];
    if(k){ e.preventDefault(); if(e.shiftKey) turn(-k[0]*.004, k[1]*.003); else { mapDirty=true; const m=mpp(goal.dist), r=rgt(goal.bearing), f=fwd(goal.bearing), kk=1/Math.max(.45,Math.cos(goal.pitch)); setGoal({cx:goal.cx - r.x*k[0]*m + f.x*k[1]*m*kk, cz:goal.cz - r.z*k[0]*m + f.z*k[1]*m*kk}); } }
    else if(e.key==='+'||e.key==='='){ e.preventDefault(); zoomAt(W/2+stick.getBoundingClientRect().left, H/2+stick.getBoundingClientRect().top, .6); }
    else if(e.key==='-'||e.key==='_'){ e.preventDefault(); zoomAt(W/2+stick.getBoundingClientRect().left, H/2+stick.getBoundingClientRect().top, 1.6); }
  });
  function zoomCentre(f){ const r=stick.getBoundingClientRect(), o=visibleOffset(); zoomAt(r.left+W/2+o.x, r.top+H/2-o.y, f); }
  $('zin').onclick=()=>zoomCentre(.6);
  $('zout').onclick=()=>zoomCentre(1.6);
  { const btn=$('compass'); let cd=null, dragged=false;
    const angleAt = e => { const r=btn.getBoundingClientRect(); return Math.atan2(e.clientY-(r.top+r.height/2), e.clientX-(r.left+r.width/2)); };
    btn.addEventListener('pointerdown', e=>{ if(!mapReady()) return; touched(); compassHint(); cd={a:angleAt(e), moved:0}; dragged=false; try{ btn.setPointerCapture(e.pointerId); }catch{} btn.classList.add('turning'); });
    btn.addEventListener('pointermove', e=>{ if(!cd) return; const a=angleAt(e); let d=a-cd.a; d=Math.atan2(Math.sin(d),Math.cos(d)); cd.a=a; cd.moved+=Math.abs(d);
      if(cd.moved>.06){ dragged=true; turn(-d, 0); } });
    const end=()=>{ cd=null; btn.classList.remove('turning'); };
    btn.addEventListener('pointerup', end); btn.addEventListener('pointercancel', end);
    btn.onclick=()=>{
      if(dragged){ dragged=false; return; }
      if(!mapReady()) return scrollToProg(1);
      mapDirty=true; setGoal({bearing:0, pitch: mapView.view==='2d' ? 0 : defaultView().pitch});
      toast('Facing north');
    };
    btn.addEventListener('keydown', e=>{ if(e.key==='ArrowLeft'||e.key==='ArrowRight'){ e.preventDefault(); if(mapReady()) turn(e.key==='ArrowLeft' ? .15 : -.15, 0); } });
  }
  $('recenter').onclick=()=>{ if(target<1) scrollToProg(1); resetView(); };
  addEventListener('keydown', e=>{ if(e.key!=='Escape') return;
    if(!drawer.hidden) return closeDrawer();
    if(!layersEl.hidden) return setLayers(false);
    if(view.type==='place'){ view={type:query?'results':'list'}; selected=null; render(); refresh(); } }, {signal});

  const winEl=$('win'); let WIN={t:0,r:0,b:0,l:0,drop:0}; const SKY_R=.4;   /* where the skyline starts, as a share of the window's height */
  function measureWin(){ const r=winEl.getBoundingClientRect(), s=stick.getBoundingClientRect(); WIN={t:r.top-s.top, l:r.left-s.left, r:s.right-r.right, b:s.bottom-r.bottom}; stick._win=null;
    // front page: the chips sit under the standfirst, on its left edge (measured untransformed, before the scroll moves it)
    const body=$('svhero').querySelector('p'), hb=body.getBoundingClientRect(), ty=new DOMMatrix(getComputedStyle($('svhero')).transform).m42;
    stick.style.setProperty('--hc-top', (hb.bottom - s.top - ty + 24).toFixed(0)+'px'); stick.style.setProperty('--hc-left', (hb.left - s.left).toFixed(0)+'px');
    /* the hero text sits on the sky inside the window: lower the skyline (the rendered image) until it clears the text block */
    { const tb=$('svhero').getBoundingClientRect().bottom - ty - s.top, wh=H-WIN.t-WIN.b; WIN.drop=Math.max(0, tb + 28 - (WIN.t + SKY_R*wh)); } }
  function resize(){ W=stick.clientWidth; H=stick.clientHeight; renderer.setSize(W,H); sizeHero(); measureWin(); camera.aspect=W/H; camera.fov = W<H ? 64 : 48; camera.updateProjectionMatrix(); buildCurves(); if(!mapDirty) setGoal(defaultView(), true); onScroll(); }
  addEventListener('resize', resize, {signal}); resize();
  document.fonts?.ready.then(()=>{ if(!dead) measureWin(); });
  const sheetTop = () => { const r=sheet.getBoundingClientRect(), s=stick.getBoundingClientRect(); return Math.min(H, r.top - s.top); };
  { const h=location.hash.slice(1); if(ALL.some(p=>p.id===h)) setTimeout(()=>showPlace(h), 300); }

  // ---------- frame ----------
  const chipBar=$('chipbar');
  const svEl=$('sv'), svHero=$('svhero'), ctrls=document.querySelector('.ctrls');
  const v=new THREE.Vector3(), vA=new THREE.Vector3(), vB=new THREE.Vector3(), mPos=new THREE.Vector3(), mTgt=new THREE.Vector3();
  const needle=$('needle'), scaleTxt=$('scaletxt'), neatline=$('neatline'), coordsEl=$('coords');
  const smooth = (e0,e1,x) => { const t=Math.min(1,Math.max(0,(x-e0)/(e1-e0))); return t*t*(3-2*t); };
  function project(world){ v.copy(world).project(camera); return {x:(v.x+1)/2*W, y:(1-v.y)/2*H, ok:v.z<1}; }
  const setStyle = (el, key, val) => { if(el['_'+key]!==val){ el.style[key]=val; el['_'+key]=val; } };   // skip no-op writes
  let wasReady=false;

  let raf = 0, dead = false;
  const perf={t:0, n:0, slow:0};
  function frame(ts){
    if(dead) return;
    if(covered){ lastTs=ts; raf = requestAnimationFrame(frame); return; }
    const dt=Math.min(.05,(ts-lastTs)/1000||0); lastTs=ts;
    const k = reduce ? 1 : Math.min(1, dt*5), kg = reduce ? 1 : Math.min(1, dt*6);
    prog += (target-prog)*k; if(Math.abs(target-prog)<1e-4) prog=target;
    // ease the map camera toward its goal (shortest way round for bearing)
    const db=((goal.bearing-view3.bearing+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
    view3.cx+=(goal.cx-view3.cx)*kg; view3.cz+=(goal.cz-view3.cz)*kg; view3.dist+=(goal.dist-view3.dist)*kg; view3.pitch+=(goal.pitch-view3.pitch)*kg; view3.bearing+=db*kg;

    // fly-through runs whenever the visitor is at the top of the page; it pauses (not resets) while they scroll
    if(!reduce && target<=.005 && prog<=.005){   // the hero glides north up Bathurst at the raised angle
      INTRO.el += dt;
      if(INTRO.el > INTRO.total+2.4){ INTRO.el=0; stage.classList.remove('fadeout'); }      // loop back to the start
      else if(INTRO.el > INTRO.total+1.6) stage.classList.add('fadeout');
      const z=introZ(INTRO.el); if(Math.abs(z-streetAnchor.z)>.01){ streetAnchor={x:xAt(z), z}; buildCurves(); }
    } else if(stage.classList.contains('fadeout')) stage.classList.remove('fadeout');
    const u = toU(prog);
    const pos = posCurve.getPoint(u), tgt = tgtCurve.getPoint(u);
    const blend = smooth(.9, 1, prog);
    if(blend>0){ poseFrom(view3, mPos, mTgt); pos.lerp(mPos, blend); tgt.lerp(mTgt, blend); }
    const hh = (1-smooth(0,.2,prog)) * (reduce?0:1);
    pos.x += Math.sin(ts*.0006)*0.25*hh; pos.y += Math.sin(ts*.0009)*0.12*hh;
    camera.position.copy(pos); camera.up.set(0,1,0); camera.lookAt(tgt);
    const alt = pos.y;
    { const nn=Math.max(.5, Math.min(250, alt*.04)); if(Math.abs(camera.near-nn) > nn*.02){ camera.near=nn; camera.updateProjectionMatrix(); } }
    scene.fog.near = Math.max(80, alt*1.1); scene.fog.far = Math.max(1600, alt*3.6);

    const darkMap = alt > 90; if(darkMap!==stick._dark){ stick.classList.toggle('dark-map', darkMap); stick._dark=darkMap; }
    // building ink thins with altitude so the 3D corridor never reads as a dark stripe from far away
    if(city.ink){ const io = .8 - .68*smooth(1500, 7000, alt); if(Math.abs(city.ink.material.opacity-io)>.01) city.ink.material.opacity = io; }
    const mapK = smooth(.55, .92, prog), svK = 1 - smooth(.08,.28,prog), ready = mapReady();
    // front page: the view lives in a rounded window; it opens to the full screen as the headline drops away
    { const e=smooth(.02,.42,prog), f=1-e, key=e.toFixed(4);
      if(stick._win!==key){ stick._win=key; const st=stick.style, R=26*f;
        st.setProperty('--wt', (WIN.t*f).toFixed(1)+'px'); st.setProperty('--wr', (WIN.r*f).toFixed(1)+'px'); st.setProperty('--wb', (WIN.b*f).toFixed(1)+'px'); st.setProperty('--wl', (WIN.l*f).toFixed(1)+'px'); st.setProperty('--wrad', R.toFixed(1)+'px');
        const ox=((WIN.l+W-WIN.r)/2-W/2)*f, oy=((WIN.t+H-WIN.b)/2-H/2)*f;
        if(f>0) camera.setViewOffset(W,H,-ox,-oy-WIN.drop*f,W,H); else camera.clearViewOffset();
        winPx = f>0 ? {l:WIN.l*f, r:WIN.r*f, t:WIN.t*f, b:WIN.b*f} : null;   // the window, cut inside WebGL (a scissor), not by a CSS clip
        setStyle(svHero,'transform', `translate3d(${(-e*60).toFixed(1)}px,0,0)`); setStyle(svHero,"opacity", (1-smooth(0,.5,e)).toFixed(3));   /* the text column slides off left */
        setStyle(svEl,'visibility', e>.999?'hidden':'visible'); }
      // stage 1 (first scroll): wordmark into the mark, search out of it, chips settle, cue goes
      const open = prog<.02; if(stick._open!==open){ stick._open=open; flipChips(()=>stick.classList.toggle('open', open)); }
      // stage 2: map chrome slides in from its edge, then the markers pop in one by one
      const mapped = prog>.88; if(stick._mapped!==mapped){ stick._mapped=mapped; stick.classList.toggle('mapped', mapped); if(mapped) popPins(); }
      chipBar.classList.toggle('dock', mapUI.classList.contains('dock')); chipBar.classList.toggle('pc', mapUI.classList.contains('pc')); }
    if(ready!==wasReady){ stick.classList.toggle('mapready', ready); wasReady=ready;
      if(!ready){ closeDrawer(); setLayers(false); }
      else if(view.type!=='place'){ setCollapsed(true); setSheet('peek'); }
    }

    const drawn = routeCount;
    route.geometry.setDrawRange(0, drawn);
    { const zEnd=XREF.z0-(XREF.xs.length-1)*XREF.step;
      // on the map the dot glides along Bathurst to the client in focus (the first stop while nothing is selected)
      if(mapK>=.5){ const tz = NODES.length ? NODES[Math.max(0, nodeIdx)].pos.z : zEnd; runZ += (tz-runZ)*(reduce?1:Math.min(1, dt*2.2)); }
      const z = mapK<.5 ? streetAnchor.z-330 : runZ;                        // leads the camera in the hero
      if(mapK<.5) runZ=z;
      // the orange trails the runner in the hero, then completes up the whole route as the camera cranes
      const done=smooth(.3,.82,prog), zh=streetAnchor.z-330; clipZ.value = done>=1 ? -1e9 : zh + (zEnd-200-zh)*done;
      runner.visible = dirIdx<0;   // one indicator throughout: the hero dot, then the map's, then the route's (nav takes over on the same spot)
      clipS.value = done>=1 && NODES.length ? lastPin().z : 1e9;   // the runner belongs to the hero; the map view is still
      if(mapK>=.5 && DIR && trail?.visible){ const q=dirAt(Math.max(0, trailD.value)).p; runner.position.set(q.x, .5, q.z); }   /* projects: the dot is the tip of the solid journey */
      else runner.position.set(roadX(z), .5, z); /* on the painted road itself, not the smoothed line */ const sc=Math.max(10, alt*.018); runner.scale.setScalar(sc);
      const pul=(ts*.0012)%1; runner.userData.halo.scale.setScalar(1+pul*1.4); runner.userData.halo.material.opacity=.5*(1-pul); }
    routeGlow.material.opacity = .10*mapK + .06;
    if(!DIR && city.data && mapK>.1){ DIR=buildDir(); onScroll(); }   /* re-aim the journey now its pin distances exist */
    if(ghost){ ghost.material.opacity=.5*mapK; trail.visible = mapK>.15;
      if(dirIdx<0){ trailD.value += (jTarget-trailD.value)*(reduce?1:Math.min(1, dt*3)); }
      const end=DIR.pts[DIR.pts.length-1], sp=project(end), on=mapK>.15 && sp.ok;
      destEl.style.opacity = on ? '1' : '0'; if(on) destEl.style.transform=`translate3d(${sp.x.toFixed(1)}px,${sp.y.toFixed(1)}px,0)`; }
    if(dirIdx>=0){
      DIR ??= buildDir();
      const tgt = DIR ? DIR.off + dirProg*(DIR.total-DIR.off) : 0;
      dirD += (tgt-dirD)*(reduce?1:Math.min(1, dt*3)); if(Math.abs(tgt-dirD)<.5) dirD=tgt;
      const {p, i} = dirAt(dirD); dirPos.copy(p);
      trailD.value = dirD;
      nav.position.set(p.x, .6, p.z); nav.scale.setScalar(Math.max(10, alt*.02));
      const pul=(ts*.0012)%1; nav.userData.halo.scale.setScalar(1+pul*1.4); nav.userData.halo.material.opacity=.5*(1-pul);
      // follow the dot
      // inclined, facing the way it drives (south), never rotating; the dot sits in the middle of the map left
      // visible below the Route Preview card (so the tall last step never covers it)
      if(!drag){ const dist=700, pitch = mapView.view==='2d' ? 0 : 1.05, bearing=Math.PI;
        const cardB = dirCard.classList.contains('on') ? dirCard.getBoundingClientRect().bottom - stick.getBoundingClientRect().top : 0;
        // feedback: measure where the dot actually lands and nudge the look-ahead until it sits mid-way below the card
        const want=(cardB + H)/2, sy=project(dirPos).y, f=fwd(bearing);
        if(sy>0 && sy<H*1.5) dirLook = Math.min(900, Math.max(-300, dirLook + (want - sy)*mpp(dist)*.12));
        setGoal({cx: p.x + f.x*dirLook, cz: p.z + f.z*dirLook, dist, pitch, bearing}); }
    }

    const s = Math.max(1, alt/55);
    LOCAL.forEach(p=>{
      const sel = selected===p.id, on = matches(p), pulse = (ts*0.001 + p.pos.z*0.001)%1;
      p.ring.scale.setScalar(s*(sel ? 1.6+pulse*3.2 : 0.8+pulse*1.4));
      const inFocus = (dirIdx<0 && nodeIdx<0) || (dirIdx<0 && sel);
      p.ring.material.opacity = inFocus ? (on ? (sel? .9 : .55) : .1) * (1-pulse) * (mapK>.15 ? 1 : 0) : 0;
    });

    // callouts: marker on the point, card on a leader line. Positions every frame, DOM writes only on change.
    // In map view each card's leader grows (12px steps) until the card clears the cards already placed.
    const placedCards=[], streetMode = alt<60;
    const order = LOCAL.filter(p=>p.pos).map(p=>{ vA.copy(p.pos); vA.y += streetMode ? 14 : 0; return {p, sp:project(vA), dist:camera.position.distanceTo(p.pos)}; })
      .sort((a,b)=> (selected===b.p.id) - (selected===a.p.id) || b.sp.y - a.sp.y);
    order.forEach(({p, sp, dist})=>{
      // walking the clients: only the one in focus is on screen; on the route, none (the dot is the focus)
      const focusOnly = dirIdx>=0 || nodeIdx>=0;
      const visible = stick._mapped && (!focusOnly || (dirIdx<0 && selected===p.id)) && sp.ok && sp.x>-260 && sp.x<W+260 && sp.y>-160 && sp.y<H+200 && dist < (streetMode ? 2600 : 1e9);
      if(p._vis!==visible){ p.el.classList.toggle('hide', !visible); p._vis=visible; }
      const passing = streetMode && Math.abs(camera.position.z-p.pos.z)<180; if(p._near!==passing){ p.el.classList.toggle('near', passing); p._near=passing; }
      if(!visible) return;
      const sc = streetMode ? Math.min(1.5, Math.max(.6, 260/dist)) : 1;
      if(!p.cw){ p.cw=p.co.offsetWidth; p.ch=p.co.offsetHeight; }
      let L = 44, side = p._side || p.side;
      if(!streetMode){
        // obstacles: cards and leaders already placed, plus every marker; try both sides, keep the shorter leader
        const box = (sd, L) => { const x0 = sd==='r' ? sp.x-18 : sp.x-p.cw+18; return {x0, x1:x0+p.cw, y0:sp.y-L-p.ch, y1:sp.y-L}; };
        const hits = b => placedCards.some(o=> b.x0<o.x1+8 && b.x1>o.x0-8 && b.y0<o.y1+8 && b.y1>o.y0-8)
          || order.some(o=> o.p!==p && o.sp.ok && o.sp.x>b.x0-14 && o.sp.x<b.x1+14 && o.sp.y>b.y0-14 && o.sp.y<b.y1+14);
        const fit = sd => { let l=44; while(l<260 && hits(box(sd,l))) l+=12; return l; };
        // keep the current side unless the other one needs a clearly shorter leader (no flip-flopping while panning)
        const a = fit(side), o = side==='r' ? 'l' : 'r', bL = a>44 ? fit(o) : 1e9;
        if(bL + 24 <= a){ side=o; L=bL; } else L=a;
        placedCards.push(box(side,L), {x0:sp.x-3, x1:sp.x+3, y0:sp.y-L, y1:sp.y});
      }
      if(p._side!==side){ p.el.classList.remove('l','r'); p.el.classList.add(side); p._side=side; }
      if(p._L!==L){ p.el.style.setProperty('--L', L+'px'); p._L=L; }
      p.el.style.transform = `translate3d(${sp.x.toFixed(1)}px, ${sp.y.toFixed(1)}px,0) scale(${sc.toFixed(3)})`;
      setStyle(p.el,'zIndex', String(selected===p.id ? 200000 : Math.round(100000 - dist)));
    });

    // road labels: stable priority order, hysteresis so labels do not blink at the collision edge
    const taken=[];
    roadLabels.forEach(r=>{
      const w = r.pos;
      let show = r.hero ? prog<.45 && camera.position.distanceTo(w)<1000 : mapK>.15 && (!r.min || alt>r.min) && (!r.max || alt<r.max), sp=null;
      if(show){ sp=project(w); show = sp.ok && sp.x>20 && sp.x<W-20 && sp.y>20 && sp.y<H-20;
        if(show && winPx) show = sp.x>winPx.l+24 && sp.x<W-winPx.r-24 && sp.y>winPx.t+16 && sp.y<H-winPx.b-16; }   // on the front page: only inside the window
      if(show){ const pad = r._on ? 12 : 20; show = !taken.some(o=>Math.abs(o.y-sp.y)<pad && Math.abs(o.x-sp.x)<130); }
      if(show) taken.push(sp);
      if(r._on!==show){ r.el.style.display = show?'':'none'; r._on=show; }
      if(!show) return;
      setStyle(r.el,'opacity', (r.hero ? 1-smooth(.2,.45,prog) : smooth(120,700,alt)).toFixed(2));
      r.el.style.transform=`translate3d(${sp.x.toFixed(1)}px,${sp.y.toFixed(1)}px,0) translate(-50%,-50%)`;
    });

    // off-screen places pulled in to the map edge (option C)
    const phone = W<760, st = phone ? sheetTop() : H;
    const R = phone ? {l:12, r:W-12, t:176, b:st-24} : {l:mapUI.classList.contains('pc') ? 96 : 24+392+24, r:W-112, t:104, b:H-72};
    const placed=[];
    tabs.forEach(t=>{
      let vis = mapK>.2;
      if(vis && t.local){ const sp=project(t.world); if(sp.ok && sp.x>R.l && sp.x<R.r && sp.y>R.t && sp.y<R.b) vis=false; }
      if(t._on!==vis){ t.el.style.display = vis?'':'none'; t._on=vis; }
      if(!vis) return;
      const a = project(tgt), b = project(vB.copy(tgt).addScaledVector(t.dir, 300));
      let dx=b.x-a.x, dy=b.y-a.y; const L=Math.hypot(dx,dy)||1; dx/=L; dy/=L;
      const cx=Math.min(R.r,Math.max(R.l,a.x)), cy=Math.min(R.b,Math.max(R.t,a.y));
      const tx = dx>0 ? (R.r-cx)/dx : dx<0 ? (R.l-cx)/dx : 1e9, ty = dy>0 ? (R.b-cy)/dy : dy<0 ? (R.t-cy)/dy : 1e9, tt=Math.min(tx,ty);
      if(!t.w || !t.h){ t.w=t.el.offsetWidth; t.h=t.el.offsetHeight; }
      const w=t.w||150, h=t.h||40;
      let x=Math.min(R.r-w, Math.max(R.l, cx+dx*tt - w/2)), y=Math.min(R.b-h, Math.max(R.t, cy+dy*tt - h/2));
      for(let i=0;i<6;i++){ const o=placed.find(o=>Math.abs(o.x-x)<(o.w+w)/2+6 && Math.abs(o.y-y)<h+6); if(!o) break; if(tx<ty) y=o.y+(y>=o.y?h+8:-(h+8)); else x=o.x+(x>=o.x?o.w+8:-(w+8)); }
      x = Math.min(R.r-w, Math.max(R.l, x)); y = Math.min(R.b-h, Math.max(R.t, y));
      for(let i=0;i<6;i++){ const c=placedCards.find(c=> x<c.x1+8 && x+w>c.x0-8 && y<c.y1+8 && y+h>c.y0-8); if(!c) break; y = Math.min(R.b-h, c.y1+8); }
      placed.push({x,y,w});
      t.el.style.transform=`translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;
      t.el.querySelector('.ar').style.transform=`rotate(${Math.atan2(dy,dx).toFixed(3)}rad)`;
    });

    if(phone){ setStyle(ctrls,'transform', `translateY(${Math.round(Math.max(190, st - ctrls.offsetHeight - 14))}px)`); }

    const yaw = Math.atan2(tgt.x-pos.x, -(tgt.z-pos.z));
    needle.style.transform=`rotate(${(-yaw).toFixed(3)}rad)`;
    const m = mpp(pos.distanceTo(tgt));
    // neatline blocks: the largest round distance that draws no longer than 90px
    const nice=[10,20,25,50,100,200,250,500,1000,2000,2500,5000]; let pick=nice[0]; for(const n of nice){ if(n/m<=90) pick=n; }
    const segPx=Math.max(8, Math.round(pick/m));
    if(neatline._seg!==segPx){ neatline.style.setProperty('--seg', segPx+'px'); neatline._seg=segPx; }
    { const lat=O.lat - tgt.z/111000, lon=O.lon + tgt.x/80300, ctx=`${lat.toFixed(3)}°N  ${Math.abs(lon).toFixed(3)}°W`; if(coordsEl._t!==ctx){ coordsEl.textContent=ctx; coordsEl._t=ctx; } }
    const stxt = '1 block = ' + (pick>=1000 ? (pick/1000)+' km' : pick+' m'); if(scaleTxt._t!==stxt){ scaleTxt.textContent=stxt; scaleTxt._t=stxt; }

    if(winPx){ renderer.setScissorTest(false); renderer.clear(); renderer.setScissorTest(true);
      renderer.setScissor(winPx.l, winPx.b, Math.max(0, W-winPx.l-winPx.r), Math.max(0, H-winPx.t-winPx.b)); }
    else renderer.setScissorTest(false);
    renderer.render(scene,camera);
    // adaptive quality: if frames keep running long (a slow GPU), step the resolution down once or twice
    perf.t += dt; perf.n++; if(dt > 1/40) perf.slow++;
    if(perf.t > 2){ if(perf.slow/perf.n > .35 && dprCap > 1){ dprCap = Math.max(1, dprCap - .25); renderer.setPixelRatio(dprCap); resize(); } perf.t=perf.n=perf.slow=0; }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    openPlace: (id) => showPlace(id),
    destroy(){
      dead = true; cancelAnimationFrame(raf); clearInterval(phTimer); ac.abort();
      for(const m of city.meshes){ m.geometry.dispose(); m.material.dispose(); }
      renderer.dispose(); renderer.domElement.remove();
      document.getElementById('labels').innerHTML=''; document.getElementById('chips').innerHTML=''; document.getElementById('sheetBody').innerHTML='';
    },
  };

}
