/* eslint-disable @typescript-eslint/ban-ts-comment -- untyped port for the rough build; see TODO(typing) below */
// @ts-nocheck
// The client map (three.js): a static plan of TCG's clients, with the maps-app chrome around it.
// Owns the WebGL scene, the pins and their callouts, the industry filter, the place sheet and the gestures.
// React renders the markup (components/tcg/map-stage.tsx); this module wires behaviour onto it by element id.
// It was ported from a scroll-driven hero (a street fly-through, a crane move, a route and a cover sheet);
// all of that is gone — nothing here reads scrollY.
// TODO(typing): the port is intentionally untyped for the rough build; type it once the behaviour is final.
import * as THREE from "three";
import { inArea, CLIENTS, ELSEWHERE, CROSS_STREETS, ROUTE_START, OFFICE, INDUSTRIES } from "./data";
import { BATHURST_LINE } from "./bathurst-line";
import { CONTENT } from "./client-content";
import LOGOS from "./logos.json";
import { loadCity, buildBuildings, buildFlatLayers } from "./osm-layer";
import { geoXZ, xzGeo, worldGround, setLand, disposeLand, worldUniforms, worldLines, outlines, placeAt, graticule, R_E } from "./world";
import { GLOBE, uniforms as globeU, bendObject, haloMaterial, setGlobe, kAt, rAt, limbAt, bendPoint, facing, groundHit } from "./globe";

export function createBathurstEngine(area?: string, opts?: { static?: boolean }) {
  const ac = new AbortController(); const signal = ac.signal;
  // static: the map is the whole thing (components/tcg/map-stage.tsx). The page's scroll drives
  // nothing — the engine opens on the map and stays there — so the scroll listener, the page-length
  // bookkeeping and the fly-through that only runs at the top of the page are all left off.
  const STATIC = !!opts?.static;
  // dev only: ?globe=<metres> tries another planet radius (lib/bathurst/globe.ts)
  if(process.env.NODE_ENV !== 'production'){ const g=new URLSearchParams(location.search).get('globe'); if(g==='off') GLOBE.on=false; else if(Number(g)>0) GLOBE.slope=Number(g); }
  // match the approved prototype (three r149): hex colours are used as-is (no sRGB→linear conversion)
  THREE.ColorManagement.enabled = false;

  if(!STATIC){
    if('scrollRestoration' in history) history.scrollRestoration='manual';
    if(!location.hash) scrollTo(0,0);
  }
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
    beauty:'<path d="M12 3c-3 4-5 6.5-5 9.5a5 5 0 0010 0C17 9.5 15 7 12 3z"/>',
    community:'<path d="M4 20V10l8-6 8 6v10M9 20v-6h6v6"/>',
    professional:'<path d="M4 8h16v11H4zM9 8V5h6v3"/>',
    wheel:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3.8 7.5l5.6 3M14.6 13.5l5.6 3M3.8 16.5l5.6-3M14.6 10.5l5.6-3"/>',   // client icon override (Client.icon)
  };
  const svg = (k,cls='') => `<svg class="${cls}" viewBox="0 0 24 24">${ICON[k]}</svg>`;
  const IND = {
    food:{name:"Food & restaurant"}, health:{name:"Health"}, retail:{name:"Retail"}, beauty:{name:"Beauty"},
    services:{name:"Personal services"}, finance:{name:"Finance"}, industrial:{name:"Industrial & trades"},
    community:{name:"Nonprofit"}, professional:{name:"Professional services"},
  };

  // ---------- data ----------
  // Bathurst clients: from TCG email (Paymo / proposals / quotes). Elsewhere: talkerstein.com/work (metrics as published there).
  // fresh copies each mount: the engine attaches scene objects (pos, el, ring) to these records
  const LOCAL = CLIENTS.filter(p=>!p.hidden).map(p=>({...p}));
  // an area page: every client stays pinned, but the scroll route is rebuilt from that area's clients, south to north, at most seven stops
  if(area){ LOCAL.forEach(p=>{ delete p.stop; }); const r=LOCAL.filter(p=>p.lat!=null && inArea(p, area)).sort((a,b)=>a.lat-b.lat), n=Math.min(7, r.length);
    for(let i=0;i<n;i++) r[Math.round(i*(r.length-1)/Math.max(1,n-1))].stop=i+1; }
  const AWAY = ELSEWHERE.filter(p=>!p.hidden).map(p=>({...p}));
  const ALL = [...LOCAL, ...AWAY];

  // ---------- geo ----------
  const O = {lat:43.7196, lon:-79.4296};
  const toXZ = (lat,lon) => ({x:(lon-O.lon)*80300, z:-(lat-O.lat)*111000});
  // past the region the linear scale above drifts, so anything further than NEAR_M from Toronto is placed on the world
  // map's own projection (lib/bathurst/world.ts); the two agree near Toronto, so nothing jumps where they meet.
  // Clients that far out are "away": the opening view does not frame them, and they show as edge markers until reached.
  const NEAR_M = 60000;
  const placeXZ = (lat,lon) => { const a=toXZ(lat,lon); return Math.hypot(a.x,a.z) < NEAR_M ? a : geoXZ(O, lat, lon); };
  const LINE0 = [[43.6980,-79.4232],[43.7057,-79.4254],[43.71833,-79.42920],[43.7225,-79.43089],[43.72678,-79.43129],[43.7288,-79.43177],[43.7340,-79.4336],[43.74678,-79.43666],[43.7545,-79.4390],[43.7765,-79.4435],[43.7906,-79.4452],[43.79896,-79.44632],[43.8120,-79.4500]].map(p=>toXZ(...p));
  // the real centreline (smoothed a little so the camera glides), used by the camera, callouts and labels
  const XREF = { ...BATHURST_LINE, xs: BATHURST_LINE.xs.map((_,i,a)=>{ let t=0,n=0; for(let k=-4;k<=4;k++){ const v=a[i+k]; if(v!==undefined){ t+=v; n++; } } return t/n; }) };
  const xAt = z => { if(XREF){ const f=(XREF.z0-z)/XREF.step, i=Math.floor(f); if(i>=0 && i<XREF.xs.length-1) return XREF.xs[i]+(XREF.xs[i+1]-XREF.xs[i])*(f-i); } for(let i=0;i<LINE0.length-1;i++){const a=LINE0[i],b=LINE0[i+1]; if(z<=a.z&&z>=b.z){return a.x+(b.x-a.x)*(z-a.z)/(b.z-a.z);}} return z>LINE0[0].z?LINE0[0].x:LINE0[LINE0.length-1].x; };
  const LINE = []; for(let z=XREF.z0; z>=XREF.z0-(XREF.xs.length-1)*XREF.step; z-=XREF.step) LINE.push(new THREE.Vector3(xAt(z),0,z));
  const zOf = lat => -(lat-O.lat)*111000;

  // ---------- three ----------
  const stage = document.getElementById('stage');
  const mobile = W < 760;
  // lite: phones and low-power devices get flat buildings, no antialiasing, a lower resolution and a slower idle frame rate
  const weak = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
  // a phone by its hardware (touch, small physical screen), not the window: a phone held sideways is wider than 760px
  // but must still skip the 3D buildings
  const phone = matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600;
  const lite = mobile || phone || weak;
  const renderer = new THREE.WebGLRenderer({antialias:!lite, powerPreference:'high-performance'});
  // render resolution: at most 1.5x (1.25x in lite; on dense phone screens edges stay clean without MSAA); drops further if frames run slow
  // dev only: ?dpr=2.5 pins the render resolution and turns off the adaptive drop (the promo capture in ../promo renders at full device pixels)
  const pinDpr = process.env.NODE_ENV !== 'production' ? Number(new URLSearchParams(location.search).get('dpr')) || 0 : 0;
  let dprCap = pinDpr || Math.min(devicePixelRatio, lite ? 1.5 : 2);   // full sharpness: the pen lines need it
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
  const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 200000);
  scene.add(new THREE.HemisphereLight(mix(C.sea,0xffffff,.5), mix(C.steel, C.sea, .45), 0.9*Math.PI));  // ×π: three r155+ lights are physically based; matches the r149 prototype
  const sun = new THREE.DirectionalLight(mix(C.sea, C.orange, 0.12), 0.75*Math.PI); sun.position.set(-0.6, 1, 0.35); scene.add(sun);

  // Every flat map layer (ground, park, streets, route) skips the depth buffer and is painted in creation order,
  // so layers a few centimetres apart never fight for depth when seen from high up.
  let flatOrder = 1;
  const flatMat = (color, opacity=1) => new THREE.MeshBasicMaterial({color, side:THREE.DoubleSide, transparent:true, opacity, depthWrite:false});
  // the land: one flat colour on a disc that rides under the camera (frame loop). Its rings grow outward geometrically, so it
  // is dense where the small street-level planet curls tightly and still reaches past the limb of the largest one
  // (lib/bathurst/globe.ts curls every vertex over the sphere; the far side is cut in the fragment shader)
  const ground = (() => {
    const rings = 128, segs = 96, r0 = 40, r1 = 3 * GLOBE.maxR, pos = [0, 0, 0], idx = [];
    for (let i = 0; i <= rings; i++) { const r = r0 * Math.pow(r1 / r0, i / rings); for (let j = 0; j < segs; j++) { const a = j / segs * Math.PI * 2; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); } }
    for (let j = 0; j < segs; j++) idx.push(0, 1 + j, 1 + (j + 1) % segs);
    for (let i = 0; i < rings; i++) { const a = 1 + i * segs, b = a + segs; for (let j = 0; j < segs; j++) { const j1 = (j + 1) % segs; idx.push(a + j, b + j, b + j1, a + j, b + j1, a + j1); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    const m = new THREE.Mesh(g, flatMat(GROUND)); m.renderOrder = flatOrder++; m.frustumCulled = false; scene.add(m);
    worldGround(m.material, O);   // the oceans, read from the world's land mask once the camera is high enough (lib/bathurst/world.ts)
    return m;
  })();

  // the sky (light hero): pale at the horizon (the haze, so the land fades straight into it), deepening to a dusty blue
  // overhead, like a gouache poster sky. It rides with the camera, is painted first, and only shows in the light style.
  const sky = (() => {
    const R = 60000, g = new THREE.SphereGeometry(R, 48, 24), p = g.getAttribute('position');
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(p.count * 3), 3));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.BackSide, depthWrite: false, depthTest: false }));
    haloMaterial(m.material);   // the dome is never bent; it carries the atmosphere's halo just outside the planet's limb
    m.renderOrder = -100; m.frustumCulled = false; scene.add(m);
    // paint the dome for a palette's sky [horizon, low, overhead, below the horizon] (applyStyle). Below the horizon is
    // what shows past the planet's limb once the map has curled into a globe (lib/bathurst/globe.ts).
    m.userData.paint = ([a, b, c, d]) => {
      const hz = new THREE.Color(a), mid = new THREE.Color(b), top = new THREE.Color(c), below = new THREE.Color(d ?? c), t = new THREE.Color(), col = g.getAttribute('color');
      for (let i = 0; i < p.count; i++) {
        const e = p.getY(i) / R;   // sine of the elevation
        if (e <= 0) { const u = Math.min(1, Math.max(0, (-e - .03) / .47)); t.copy(hz).lerp(below, u * u * (3 - 2 * u)); }
        else if (e < .07) t.copy(hz).lerp(mid, e / .07); else t.copy(mid).lerp(top, Math.min(1, (e - .07) / .33));
        col.setXYZ(i, t.r, t.g, t.b);
      }
      col.needsUpdate = true;
    };
    m.userData.paint([0xDCDDD9, 0xB3C4D3, 0x7F9FBE]);
    return m;
  })();


  // Toronto on the horizon (Print style, hero only): a line-drawn skyline with the CN Tower, set far out ahead of the
  // camera like a poster backdrop. It rides with the camera (always on the horizon), fills with the land colour and is
  // outlined in Steel Blue, so it reads as part of the drawing. Heights are exaggerated so it holds at this distance.
  const skyline = (() => {
    const D = 16000, k = 2.0;   // distance ahead, height exaggeration
    // [x offset (m), height (m)] steps across the downtown core, west → east; the CN Tower is drawn separately
    const steps = [[-2600,0],[-2600,60],[-2300,60],[-2300,110],[-2050,110],[-2050,80],[-1800,80],[-1800,150],[-1550,150],[-1550,120],
      [-1300,120],[-1300,210],[-1120,210],[-1120,170],[-950,170],[-950,250],[-760,250],[-760,190],[-560,190],[-560,290],[-380,290],
      [-380,230],[-200,230],[-200,170],[0,170],[0,0]].concat([[420,0],[420,180],[600,180],[600,298],[780,298],[780,240],[960,240],
      [960,275],[1150,275],[1150,200],[1350,200],[1350,230],[1560,230],[1560,140],[1800,140],[1800,95],[2100,95],[2100,60],[2500,60],[2500,0]]);
    const g = new THREE.Group(); g.renderOrder = -50;
    const fill = new THREE.MeshBasicMaterial({ color: 0xEDE5CB, fog: false, depthWrite: false });   // a cream silhouette on the blue sky, no outline
    fill.userData.noBend = true;   // a backdrop on the horizon, not part of the ground: it stays where the sky is
    const block = (pts) => {
      const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y * k)));
      const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), fill); m.renderOrder = -50; g.add(m);
    };
    block(steps.slice(0, 26));
    block(steps.slice(26));
    // the CN Tower (553 m): shaft, the pod, the SkyPod, the antenna
    block([[180,0],[240,0],[226,330],[262,335],[262,352],[226,358],[221,446],[232,450],[230,458],[218,460],[214,553],[206,553],[202,460],[190,458],[188,450],[199,446],[194,358],[158,352],[158,335],[194,330]]);
    g.children.forEach((c) => c.position.z = 0);
    g.userData.D = D; g.visible = false; scene.add(g);
    return g;
  })();


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
    .forEach(([name,lat,lon])=>roadLabels.push({name, pos:at(lat,lon), cls:'hood', min:1400, max:14000}));
  // the far views: the cities and districts of the region (and the lake) in wide caps, once the camera is high enough for the
  // neighbourhoods to have thinned out; the pins' own cities first, so the map says where the work is
  [["Toronto",43.653,-79.383],["North York",43.757,-79.405],["Vaughan",43.837,-79.508],["Concord",43.800,-79.488],["Maple",43.856,-79.509],["Richmond Hill",43.883,-79.440],
   ["Markham",43.857,-79.337],["Mississauga",43.589,-79.644],["Scarborough",43.773,-79.258],["Etobicoke",43.654,-79.567],["Brampton",43.731,-79.763],["Lake Ontario",43.600,-79.420]]
    .forEach(([name,lat,lon])=>roadLabels.push({name, pos:at(lat,lon), cls:'area'+(name==='Lake Ontario' ? ' water' : ''), min:6000, max:75000}));   // past that the GTA names only pile up on the pins
  // the world, zoomed out: the continents (the countries, seas, lakes and cities arrive with the world data, loadWorld)
  const geoAt = (lat,lon) => { const {x,z}=geoXZ(O, lat, lon); return new THREE.Vector3(x,0,z); };
  [["North America",47,-100],["South America",-15,-60],["Europe",52,15],["Africa",5,20],["Asia",45,90],["Oceania",-25,135],["Antarctica",-80,20]]
    .forEach(([name,lat,lon])=>roadLabels.push({name, pos:geoAt(lat,lon), cls:'area continent', min:5000000}));
  // Southern Ontario round the GTA (city centres; the world data's 1:50m places are too sparse here): they take over from
  // the GTA's own names (max 75 km above) so the regional views around Toronto are never empty
  [["Toronto",43.6532,-79.3832,1],["Hamilton",43.2557,-79.8711],["Oshawa",43.8971,-78.8658],["Barrie",44.3894,-79.6903],["Kitchener",43.4516,-80.4925],
   ["Guelph",43.5448,-80.2482],["St. Catharines",43.1594,-79.2469],["Niagara Falls",43.0896,-79.0849],["Peterborough",44.3091,-78.3197],
   ["London",42.9849,-81.2453],["Kingston",44.2312,-76.486],["Orillia",44.6082,-79.4197],["Owen Sound",44.5690,-80.9406]]
    .forEach(([name,lat,lon,big])=>roadLabels.push({name, pos:geoAt(lat,lon), cls:'city'+(big ? ' capital' : ''), min:big ? 75000 : 40000, max:big ? 3e6 : 1.2e6}));

  // Real city from OpenStreetMap (public/map/bathurst-osm.tcgm.gz, plus the lighter region-osm.tcgm.gz around it), drawn flat like a 1940s road map.
  // Flat city layers take paint orders 2-39; the Bathurst route is painted above them.
  const CR = new THREE.Color(0xEDE5CB), INK = new THREE.Color(0x2E4F86), SKYB = new THREE.Color(0x416FA6);   // Print (the reference poster): cream paper, blue pen line, a flat blue sky
  const PALETTES = {
    // Poster: Steel Blue land, Sea Breeze city (the 1940s route-map look)
    poster: {
      ground: new THREE.Color(C.steel), haze: new THREE.Color(C.sea),   // Steel Blue land fading into a Sea Breeze sky (the dark text stays readable on it)
      roof: new THREE.Color(C.sea), wallLit: mix(C.sea, C.steel, .10), wallShade: mix(C.sea, C.steel, .34), ink: new THREE.Color(C.steel),
      roads: [mix(C.steel,C.sea,.20), mix(C.steel,C.sea,.30), mix(C.steel,C.sea,.36), mix(C.steel,C.sea,.44), mix(C.steel,C.sea,.58), mix(C.steel,C.sea,.30)],
      park: mix(C.steel, C.sea, .09), water: mix(C.steel, C.sea, .42), footprint: mix(C.steel, C.sea, .30),
    },
    // Paper (the light hero): painted like a mid-century gouache street poster. Cream sunlit facades and roofs, mauve-taupe
    // shaded walls, warm grey land with cream streets, sage parks, dusty blue water; distance fades to a pale horizon
    // that the dusty blue sky rises from (the sky dome below). Outlines stay soft (frame loop: inkK) and a printed grain
    // sits over the canvas (app/bathurst-map.css, #stage::after).
    paper: {
      ground: new THREE.Color(0xD3CBC5), haze: new THREE.Color(0xDCDDD9),
      roof: new THREE.Color(0xF4EEE2), wallLit: new THREE.Color(0xEADFCB), wallShade: new THREE.Color(0xA2948F), ink: new THREE.Color(0x5B4E5C),
      roads: [0xF1EBDF, 0xF1EBDF, 0xF4EEE3, 0xF6F1E7, 0xF8F4EC, 0xF4EEE3].map(h => new THREE.Color(h)),   // local, tertiary, secondary, primary, motorway, link
      // water carries the one clearly saturated blue in this palette: against the warm grey land and sage
      // parks it is the only cool note, so the lake and the rivers read as water at a glance rather than as
      // another grey area. Deepened from 0x93AEC6, which sat too close to the land in value to separate.
      park: new THREE.Color(0xBBC4A6), water: new THREE.Color(0x6D9AC4), footprint: new THREE.Color(0xDDD5CD),
      inkK: .45,
      sky: [0xDCDDD9, 0xB3C4D3, 0x7F9FBE],   // horizon, low, overhead
    },
    // Print (the default): a two-ink screenprint with black for the deepest shadow. Flat inks only, no gradients: a solid
    // Steel Blue sky (the brand blue), deeper steel land, white roofs as the highlight, Steel Blue sunlit walls, black shaded
    // walls; streets Steel Blue, parks black. The haze starts far out so the inks stay flat. Muted Orange stays on the route and pins.
    print: {
      // the pen-and-ink poster: cream land, lots, bases and buildings, every edge drawn in blue pen (buildings, lots,
      // building bases, parks), streets a hair darker than the paper, and a blue sky meeting the land at a clean horizon
      ground: CR, haze: CR, page: CR,
      roof: CR.clone().lerp(new THREE.Color(0xffffff), .35), wallLit: CR, wallShade: CR.clone().lerp(INK, .13), ink: INK,   // light roofs, sunlit walls in the paper cream, shaded walls a soft blue-grey
      roads: [CR, CR, CR, CR, CR, CR].map(c => c.clone().lerp(INK, .16)),
      park: CR.clone().lerp(INK, .1), water: CR.clone().lerp(SKYB, .5), footprint: CR.clone().lerp(INK, .07),   // water a clear map blue: the lakes and the coast are what make the far views read as a map   // light fills, so the shapes still read in map view without outlines
      shadow: CR.clone().lerp(INK, .17),   // contact shadows
      inkK: 1.2, fogK: .75, skyDark: true, lotLines: true,   // the haze starts sooner, so far lines soften into shapes
      // horizon, low, overhead: pale blue at the horizon deepening overhead; past the planet's limb a flat printed blue
      sky: [SKYB.clone().lerp(CR, .55).getHex(), SKYB.clone().lerp(CR, .12).getHex(), SKYB.clone().lerp(INK, .55).getHex(), SKYB.clone().lerp(CR, .3).getHex()],
      rim: 0xFFFDF4,   // the atmosphere at the limb: a warm white, the paper lit from behind
    },
    // Mono: the railway poster in one colour. Everything is a shade of the poster blue: the same dusk sky,
    // pale blue roofs, mid-blue sunlit walls, deep blue shade, navy land with blue-tint streets. No outlines.
    mono: {
      ground: new THREE.Color(C.steel), haze: mix(0x3D6385, C.sea, .32), page: new THREE.Color(C.sea),
      roof: mix(0x3D6385, C.sea, .78), wallLit: mix(0x3D6385, C.sea, .55), wallShade: mix(0x3D6385, C.sea, .2), ink: new THREE.Color(C.steel),
      roads: [mix(C.steel, 0x3D6385, .45), mix(C.steel, 0x3D6385, .6), mix(C.steel, 0x3D6385, .75), mix(C.steel, 0x3D6385, .9), mix(0x3D6385, C.sea, .15), mix(C.steel, 0x3D6385, .6)],
      park: mix(C.steel, 0x3D6385, .3), water: mix(C.steel, 0x3D6385, .7), footprint: mix(C.steel, 0x3D6385, .55),
      inkK: 0, fogK: 1.6, skyDark: true,
      sky: [mix(0x3D6385, C.sea, .32).getHex(), 0x3D6385, mix(0x3D6385, C.steel, .7).getHex()],
    },
    // Railway: a mid-century railway travel poster. A solid poster-blue sky, the city in ivory (cream roofs and
    // sunlit walls, a warmer ivory in shade, never blue), Steel Blue land like the poster's dark foreground, no outlines.
    // The far city fades into the sky blue; Muted Orange stays on the route and pins. The hero text turns Sea Breeze on it.
    railway: {
      ground: new THREE.Color(C.steel), haze: mix(0x3D6385, C.sea, .32), page: new THREE.Color(C.sea),   // haze = the sky's horizon blue
      roof: new THREE.Color(0xF4EEE2), wallLit: new THREE.Color(0xEADFCB), wallShade: new THREE.Color(0xCDBB9C), ink: new THREE.Color(C.steel),
      roads: [mix(C.steel, C.sea, .14), mix(C.steel, C.sea, .2), mix(C.steel, C.sea, .26), mix(C.steel, C.sea, .34), mix(C.steel, C.sea, .44), mix(C.steel, C.sea, .2)],
      park: mix(C.steel, 0x3D6385, .3), water: mix(C.steel, 0x3D6385, .7), footprint: mix(C.steel, C.sea, .22),
      inkK: 0, fogK: 1.6, skyDark: true,
      sky: [mix(0x3D6385, C.sea, .32).getHex(), 0x3D6385, mix(0x3D6385, C.steel, .7).getHex()],   // a dusk gradient: pale blue at the horizon, poster blue, deep navy overhead
    },
    // Flat: a two-tone screen-print poster. Steel Blue land, every building face solid Sea Breeze (no shading,
    // no outlines), streets as lighter Steel Blue tints, parks and water as quiet tints of the land; Muted Orange only on the
    // route and pins. The land fades into a flat Sea Breeze sky at the horizon.
    flat: {
      ground: new THREE.Color(C.steel), haze: new THREE.Color(C.sea),
      roof: new THREE.Color(C.sea), wallLit: mix(C.sea, C.steel, .2), wallShade: mix(C.sea, C.steel, .2), ink: new THREE.Color(C.steel),   // walls one flat tint (no light), so blocks keep their shape
      page: new THREE.Color(C.sea),   // the page around the map stays paper, not the Steel Blue land
      roads: [mix(C.steel, C.sea, .22), mix(C.steel, C.sea, .3), mix(C.steel, C.sea, .38), mix(C.steel, C.sea, .48), mix(C.steel, C.sea, .6), mix(C.steel, C.sea, .3)],
      park: mix(C.steel, C.sea, .1), water: mix(C.steel, C.sea, .22), footprint: mix(C.steel, C.sea, .3),
      inkK: 0, fogK: 1.6,   // no outlines; the haze starts further out, so the near streets stay crisp and the far rows still fade
      sky: [C.sea, C.sea, C.sea],
    },
  };
  const PALETTE = PALETTES.paper;
  const city = {meshes:[], ready:false, pen:[]};
  // thick pen lines measure their width in screen pixels, so each one needs the canvas size (kept current in resize())
  const fatLines = [];
  function fat(l){ const s=renderer.getSize(new THREE.Vector2()); l.material.resolution.set(s.x||innerWidth, s.y||innerHeight); fatLines.push(l); return l; }
  // Print style: blue pen over the flat layers. Parks get their outline; the land does not. The lot outlines and the
  // centre line down every road used to be drawn too, which tiled the whole map into polygons under the city — a road
  // reads as its own painted path, and the land as paper. Water never had an outline (rivers, ponds).
  function penOutlines(flats){
    const thin = () => new THREE.LineBasicMaterial({color:INK, transparent:true, opacity:.7, depthWrite:false});
    for(const m of flats){ const k=m.userData.kind; if(k!=='park') continue;
      const l=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 1), thin());
      l.position.y=.3; l.renderOrder=40; l.userData.kind=k; l.userData.outline=true; scene.add(l); city.meshes.push(l); city.pen.push(l); }
  }
  // the city's data waits until the page itself has loaded (text, fonts, images first), then is
  // decoded + triangulated in a worker (osm-layer.ts), so the page keeps scrolling while the city builds
  const afterPageLoad = () => new Promise(res=>{
    const idle = () => (window.requestIdleCallback || (f=>setTimeout(f, 200)))(res, {timeout:1500});
    if(document.readyState==='complete') idle(); else addEventListener('load', idle, {once:true, signal});
  });
  afterPageLoad().then(()=>dead ? Promise.reject(new DOMException('gone','AbortError')) : loadCity('/map/bathurst-osm.tcgm.gz', {lite: weak, signal})   /* 3D buildings on phones too; only weak devices get them flat */).then(baked=>{
    if(dead) return;
    const data = {roads: baked.roads};
    let o=12; const flats=buildFlatLayers(baked, PALETTE, flatMat, ()=>Math.min(39, o++));   // 2-11 stay free for the region backdrop
    for(const m of flats){ scene.add(m); city.meshes.push(m); }
    // pen outlines around every lot, building base and park (the boundary edges of each flat layer; Print only)
    penOutlines(flats);
    if(baked.buildings){ const {mesh, lines, shadow, recolor} = buildBuildings(baked.buildings, PALETTE);
      for(const m of [mesh, lines, shadow]){ scene.add(m); city.meshes.push(m); }
      fat(lines); city.recolor=recolor; city.ink=lines; city.bmesh=mesh; city.shadow=shadow; }
    city.ready=true; city.data=data; stage.classList.add('city'); poke();   // the canvas fades in once the city is there
    applyStyle(); applyShow();
    loadRegion(); loadWorld();
  }).catch(err=>{ if(err?.name!=='AbortError') console.warn('Bathurst map data failed to load', err); });
  // the wider GTA (public/map/region-osm.tcgm.gz: big roads, water, parks, no buildings) so the far pins sit on a map.
  // Fetched only once the corridor is up, painted underneath it (orders 2-11).
  const loadRegion = () => loadCity('/map/region-osm.tcgm.gz', {lite:true, signal}).then(baked=>{
    if(dead) return;
    let o=2; const flats=buildFlatLayers(baked, PALETTE, flatMat, ()=>Math.min(11, o++)); for(const m of flats){ scene.add(m); city.meshes.push(m); }
    penOutlines(flats);   // the region's parks outlined; the land itself stays paper
    applyStyle(); applyShow(); poke();
  }).catch(err=>{ if(err?.name!=='AbortError') console.warn('Region map data failed to load', err); });
  // the world (public/map/world.json, Natural Earth 1:50m; lib/bathurst/world.ts): land and lakes painted into the ground's
  // mask, coasts and borders, province and state lines and rivers drawn in pen, and the names of countries, seas, lakes and cities
  const world = {data:null, borders:null, states:null, rivers:null, grid1:null, grid10:null};
  const loadWorld = () => fetch('/map/world.json', {signal}).then(r=>r.json()).then(w=>{
    if(dead) return;
    world.data = w; setLand(w, !lite);
    const pal = PALETTES[mapView.style];
    world.borders = worldLines(O, [...outlines(w.countries), ...outlines(w.lakes)], pal.ink, 1.6);   // coasts, borders and lake shores in pen: crisp over the soft water fill
    world.states = worldLines(O, w.states, pal.ink, 1.5);
    world.rivers = worldLines(O, w.rivers.filter(r=>r.r<=8).flatMap(r=>r.l), pal.water, 1.5);
    world.grid10 = worldLines(O, graticule(10), pal.ink, 1.4); world.grid1 = worldLines(O, graticule(1), pal.ink, 1.4);   // the atlas grid
    for(const l of [world.grid10, world.grid1, world.rivers, world.states, world.borders]) scene.add(l);
    // names: countries by their own rank, then seas, cities and lakes; the array order is the collision priority
    const add = r => { roadLabels.push(r); labelEl(r); };
    const cMax = r => r<=2 ? 6e6 : r<=3 ? 3e6 : r<=4 ? 1.5e6 : r<=5 ? 8e5 : 4e5;
    [...w.countries].filter(c=>c.n && c.at).sort((a,b)=>a.r-b.r).forEach(c=>add({name:c.n, pos:geoAt(c.at[1], c.at[0]), cls:'area country', min:150000, max:cMax(c.r)}));
    w.seas.filter(c=>c.at).sort((a,b)=>a.min-b.min).forEach(c=>add({name:c.n, pos:geoAt(c.at[1], c.at[0]), cls:'area water', min:100000, max:c.min<=1 ? Infinity : 2.4e7/Math.pow(2, c.min-1)}));
    const pMax = r => r<=1 ? 6e6 : r<=3 ? 2.5e6 : r<=5 ? 1e6 : r<=7 ? 4e5 : 2e5;
    [...w.places].sort((a,b)=>a[3]-b[3]).forEach(([name,lon,lat,rank,cap])=>{
      const pos=geoAt(lat,lon); if(Math.hypot(pos.x,pos.z) < NEAR_M) return;   // the region has its own hand-placed names
      add({name, pos, cls:'city'+(cap ? ' capital' : ''), max:pMax(rank)}); });
    // lakes by their real extent (the data's rank is not their size): the Great Lakes from the continent view, a small lake only up close
    const extent = c => Math.max(...c.p.map(poly=>{ const r=poly[0]; let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; for(let k=0;k<r.length;k+=2){ x0=Math.min(x0,r[k]); x1=Math.max(x1,r[k]); y0=Math.min(y0,r[k+1]); y1=Math.max(y1,r[k+1]); } return (x1-x0)*(y1-y0)*Math.cos(c.at[1]*Math.PI/180); }));
    w.lakes.filter(c=>c.n && c.at && c.n!=='Lake Ontario').map(c=>({c, e:extent(c)})).filter(o=>o.e>.08).sort((a,b)=>b.e-a.e)
      .forEach(({c,e})=>add({name:c.n, pos:geoAt(c.at[1], c.at[0]), cls:'area water lake', min:30000, max: e>6 ? 4e6 : e>1.5 ? 1.6e6 : e>.4 ? 6e5 : 2.5e5}));
    poke();
  }).catch(err=>{ if(err?.name!=='AbortError') console.warn('World map data failed to load', err); });
  flatOrder = 40;  flatOrder = 40;

  // the two ends the opening view is framed around
  const START = (()=>{ const {x,z}=toXZ(ROUTE_START.lat, ROUTE_START.lon); return new THREE.Vector3(x,0,z); })();
  const OFFICE_P = (()=>{ const {x,z}=toXZ(OFFICE.lat, OFFICE.lon); return new THREE.Vector3(x,0,z); })();
  // 3D pin rings (pulse under selected + all pins)
  const ringGeo = new THREE.RingGeometry(.72, 1, 48);
  LOCAL.forEach(p=>{
    const {x,z} = placeXZ(p.lat,p.lon); p.far = Math.hypot(x,z) >= NEAR_M; const lx = p.far ? Infinity : xAt(z);
    p.pos = new THREE.Vector3(Math.abs(x-lx)<22 ? lx+22 : x, 0, z);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({color:C.orange, transparent:true, opacity:.8, side:THREE.DoubleSide, depthWrite:false}));
    ring.rotation.x=-Math.PI/2; ring.position.copy(p.pos); ring.position.y=.4; ring.renderOrder=1000; scene.add(ring); p.ring=ring;
  });

  // ---------- DOM overlays ----------
  // Callouts: a location marker, a leader line, and a rounded card with the business thumbnail.
  // Cards alternate sides along the street and the leader grows until the card clears its neighbours.
  const labels = document.getElementById('labels');
  [...LOCAL].sort((a,b)=>b.pos.z-a.pos.z).forEach((p,i)=>{ p.side = i%2 ? 'l' : 'r'; });
  const thumbHTML = p => (p.thumb = p.thumb || (CONTENT[p.id] && CONTENT[p.id].banner.replace(/\.webp$/, '-sm.webp')) || (p.youtube && `https://i.ytimg.com/vi/${p.youtube}/hqdefault.jpg`)) ?`<img src="${p.thumb}" alt="" loading="lazy" decoding="async">` : svg(p.icon||p.ind,'glyph');
  LOCAL.forEach(p=>{
    const el=document.createElement('div'); el.className=`pin ${p.side}`+(p.maybe?' maybe':'')+(p.feat?' feat':''); el.style.setProperty('--ind', INDUSTRIES[p.ind]?.color); el.tabIndex=0; el.setAttribute('role','button'); el.setAttribute('aria-label', `${p.name}, ${p.addr}`);
    const logo=(LOGOS as Record<string,string>)[p.id]; if(logo){ el.classList.add('has-logo'); el.dataset.logo=p.id; }   // the client's own logo in the pin; the industry icon only when we have none
    el.innerHTML=`<span class="ic" aria-hidden="true">${logo ? `<img class="lg" src="${logo}" alt="" decoding="async">` : svg(p.icon||p.ind,'glyph')}</span><span class="nm" aria-hidden="true">${p.name}</span><svg class="mk" viewBox="-9 -9 18 18" aria-hidden="true"><g filter="url(#grunge)"><circle r="7"/><circle class="dot" r="2.6"/></g></svg><span class="ld" aria-hidden="true"></span><div class="co sprout" data-no-tumble><span class="th single hair">${thumbHTML(p)}</span><span class="txt"><b>${p.name}</b><small></small>${CONTENT[p.id]?.rating ? `<span class="co-rate"><b>${CONTENT[p.id].rating.toFixed(1)}</b> ★ <span>(${CONTENT[p.id].count.toLocaleString('en-CA')})</span></span>` : ''}<span class="co-act"><button type="button" class="sprout btn orange co-view" data-view>${p.youtube ? 'Watch video' : 'View case study'}</button><button type="button" class="sprout btn icon co-next" data-next aria-label="Next case study"><svg class="glyph" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button></span></span></div>`;
    el.onclick=()=>pinClick(p.id); el.onkeydown=e=>{if(e.key==='Enter')pinClick(p.id);};
    // phones: the selected card is the preview; View opens the case study sheet, Next moves the tour on
    el.querySelector('[data-view]').onclick=e=>{ e.stopPropagation(); viewPlace(p.id); };
    el.querySelector('[data-next]').onclick=e=>{ e.stopPropagation(); const j=NODES.findIndex(n=>n.id===p.id);
      if(j<0){ const off=ALL.filter(x=>!NODES.some(n=>n.id===x.id)), k=off.findIndex(x=>x.id===p.id); pinClick(off[(k+1)%off.length].id); }   // off the route: the next of the other cases
      else scrollToNode(Math.min(j+1, NODES.length-1)); };
    labels.appendChild(el); p.el=el; p.sub=el.querySelector('small'); p.co=el.querySelector('.co');
  });
  const labelEl = r=>{ const el=document.createElement('div'); el.className='road '+r.cls; el.textContent = r.name; labels.appendChild(el); r.el=el; };
  roadLabels.forEach(labelEl);
  // the Toronto clients (NEAR) and the ones away from them (FAR: Montreal, Queens, Aventura, George Town).
  // The opening view frames both, so the spread between them is what the map opens on.
  const NEAR = LOCAL.filter(p=>p.pos && !p.far);
  const FAR = LOCAL.filter(p=>p.pos && p.far);
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

  // ---------- filters / search / layers ----------
  let filter='all', layer='industry', query='';
  const chips=$('chips');
  // chips run in the order the industries first appear while scrolling the map (north first), then All clients
  const CHIP = {food:'Restaurants', retail:'Retail', beauty:'Beauty', health:'Health', services:'Personal services', community:'Nonprofits', finance:'Finance', professional:'Professional', industrial:'Industrial'};
  // the route's industries first, then those only off the route (AR26's Personal services, Professional), so every case has a chip
  // only industries with a pin on the map get a chip (a chip whose clients are all off the map, e.g. Finance, would frame nothing)
  const INDS=[...new Set([...LOCAL.filter(p=>p.pos && p.stop).sort((a,b)=>a.stop-b.stop), ...LOCAL.filter(p=>p.pos)].map(p=>p.ind))].filter(k=>CHIP[k]).map(k=>[k,CHIP[k],k]).concat([['all','All clients',null]]);
  INDS.forEach(([k,n,ic],idx)=>{
    const b=document.createElement('button'); b.type='button'; b.className='chip sprout btn sm'; b.setAttribute('aria-pressed',k==='all'); b.setAttribute('aria-label', n);
    b.innerHTML=(ic?svg(ic,'glyph'):'')+n; if(ic) b.style.setProperty('--ind', INDUSTRIES[k]?.color);
    // a chip filters the map: only that industry's pins stay, framed on screen; press it again (or All) to bring the rest back
    b.onclick=()=>{
      filter = (k==='all' || filter===k) ? 'all' : k;
      [...chips.children].forEach((c,j)=>c.setAttribute('aria-pressed', INDS[j][0]===filter)); centreChip(chips.children[INDS.findIndex(x=>x[0]===filter)]);
      // like Google Maps: the open place closes and the matching pins are framed in the middle of the map left visible
      selected=null; view={type:'list'}; setCollapsed(true); if(W<760) setSheet('peek');
      render(); refresh(); mapDirty=true;
      const hit=LOCAL.filter(p=>p.pos && matches(p)), here=hit.filter(p=>!p.far), r=(here.length ? here : hit).map(p=>p.pos), pad=new THREE.Vector3(500,0,500);   // away matches show as edge markers
      const fit=()=>{ if(filter==='all'){ setGoal(defaultView()); return; }   /* All clients: back to the overview's own framing */ if(!r.length) return; const bot = W<760 ? Math.max(60, H - sheetTop() + 16) : 56;
        const top = W<760 ? 124 : 84, padY = (H - top - bot)*.18;   // Google-style: the results sit in the middle with room around them, not stretched to the edges
        setGoal(viewOf(r.length>1 ? r : [r[0].clone().add(pad), r[0].clone().sub(pad)], mapView.view==='2d' ? 0 : .3, top+padY, bot+padY, W*(W<760 ? .12 : .2))); };
      fit(); setTimeout(fit, 420); };   // again once the panel has finished moving
    chips.appendChild(b);
  });
  // chevrons step to the previous / next category; the row itself swipes (native horizontal scroll)
  const chipPrev=$('chipprev'), chipNext=$('chipnext');
  // Front page → map: the chip row glides from inside the view to its map slot (FLIP, no fading)
  // markers arrive one by one, top of the screen first
  function popPins(){ LOCAL.filter(p=>p.pos).map(p=>({p, y:project(p.pos).y})).sort((a,b)=>a.y-b.y).forEach(({p},i)=>{ p.el.style.setProperty('--d', '0ms');   /* every pin at once, no stagger */ p.el.classList.remove('pop'); void p.el.offsetWidth; p.el.classList.add('pop'); }); }
  // Google-style: an arrow only shows at an end the row can still scroll toward (i.e. when the chips overflow)
  const pageChips = d => chips.scrollBy({left: d*chips.clientWidth*.7, behavior: reduce?'auto':'smooth'});
  chipPrev.onclick=()=>pageChips(-1); chipNext.onclick=()=>pageChips(1);
  function chipEnds(){ const max=chips.scrollWidth-chips.clientWidth-2; chipPrev.hidden = chips.scrollLeft<=2; chipNext.hidden = chips.scrollLeft>=max; }
  chips.addEventListener('scroll', chipEnds, {passive:true, signal});
  addEventListener('resize', chipEnds, {signal});
  const NODES = LOCAL.filter(p=>p.pos && p.stop).sort((a,b)=>a.stop-b.stop);   // the scroll route, in order
  let nodeIdx=-1;
  // the chip row is the category indicator: it lights the current node's industry
  // centre a chip by scrolling only the chip row (scrollIntoView would also slide the whole map container sideways)
  // a finger on the chip row owns it: no programmatic re-centring until a moment after it lifts
  let chipTouchUntil=0;
  chips.addEventListener('touchstart', ()=>{ chipTouchUntil=Infinity; }, {passive:true, signal});
  for(const ev of ['touchend','touchcancel']) chips.addEventListener(ev, ()=>{ chipTouchUntil=performance.now()+1200; }, {passive:true, signal});
  function centreChip(c){ if(performance.now()<chipTouchUntil) return; if(c) chips.scrollTo({left: c.offsetLeft - (chips.clientWidth - c.offsetWidth)/2, behavior: reduce?'auto':'smooth'}); }
  function markChip(k){ if(!INDS.some(x=>x[0]===k)) k='all';   /* an industry with no chip (off the route, e.g. Personal services) lights All clients, not the first chip */ const i=INDS.findIndex(x=>x[0]===k); [...chips.children].forEach((c,j)=>c.setAttribute('aria-pressed', j===i)); if(k==='all' && performance.now()>=chipTouchUntil) chips.scrollTo({left:0, behavior:'smooth'}); else centreChip(chips.children[i]); }
  const matches = p => (filter==='all'||p.ind===filter) && (!query || (p.name+' '+p.addr+' '+IND[p.ind].name+' '+p.services.join(' ')).toLowerCase().includes(query));
  const q=$('q'), qclear=$('qclear');
  q.addEventListener('input',()=>{ query=q.value.trim().toLowerCase(); qclear.hidden=!q.value; view={type:query?'results':'list'}; selected=null; render(); refresh(); });
  $('searchform').addEventListener('submit', e=>{ e.preventDefault(); const r=ALL.filter(matches); if(!query) return; if(r.length===1) openPlace(r[0].id); else if(r.length){ fitTo(r.filter(p=>p.pos)); setSheet('half'); } q.blur(); });
  // Back to map (in place of the search field): closes whatever is open, clears the chip filter, returns to the overview
  $('backmap').onclick=()=>{ filter='all'; query=''; q.value=''; markChip('all');
    selected=null; view={type:'list'}; render(); refresh(); if(W<760) setSheet('peek');
    resetView(); };
  qclear.onclick=()=>{ q.value=''; query=''; qclear.hidden=true; view={type:'list'}; selected=null; render(); refresh(); q.focus(); };
  const PH=["Search “bagels”","Search “website”","Search “brand identity”","Search “menu”","Search “booking”"]; let phI=0;
  const phTimer = setInterval(()=>{ if(!q.value && document.activeElement!==q && view.type!=='place'){ q.placeholder=PH[phI++%PH.length]; } }, 2600);
  const layerBtn=$('layerbtn') || document.createElement('button'), layersEl=$('layers');   // the map view button gave its slot to Directions
  const setLayers = open => { layersEl.hidden=!open; layerBtn.setAttribute('aria-expanded', open); };
  layerBtn.onclick=()=>setLayers(layersEl.hidden);
  layersEl.querySelectorAll('[data-layer]').forEach(b=>b.onclick=()=>{ layer=b.dataset.layer; layersEl.querySelectorAll('[data-layer]').forEach(x=>x.setAttribute('aria-pressed',x===b)); refresh(); });
  $('mvclose').onclick=()=>{ setLayers(false); layerBtn.focus(); };
  // Map view settings: view (3D / 2D), style (poster / paper), what to show
  const mapView = {view:'2d', style:'print', show:{buildings:true, blocks:true, nature:true}};
  const pressGroup = (attr, val) => layersEl.querySelectorAll(`[data-${attr}]`).forEach(x=>x.setAttribute('aria-pressed', x.dataset[attr]===val));
  layersEl.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{ mapView.view=b.dataset.view; pressGroup('view', mapView.view); applyView(); });
  layersEl.querySelectorAll('[data-style]').forEach(b=>b.onclick=()=>{ mapView.style=b.dataset.style; pressGroup('style', mapView.style); applyStyle(); });
  layersEl.querySelectorAll('[data-show]').forEach(inp=>inp.onchange=()=>{ mapView.show[inp.dataset.show]=inp.checked; applyShow(); });
  function applyView(){
    mapDirty=true;
    setGoal(mapView.view==='2d' ? {pitch:0} : {pitch:TILT_PITCH});
  }
  function applyStyle(){
    const pal = PALETTES[mapView.style];
    ground.material.color.copy(pal.ground); worldUniforms.uSea.value.copy(pal.water);
    if(typeof world!=='undefined' && world.borders){ for(const l of [world.borders, world.states, world.grid1, world.grid10]) l.material.color.copy(pal.ink); world.rivers.material.color.copy(pal.water); }
    // one seamless grey: sky, fog, the clear colour and the page behind all match the land, so far-out views have no edge
    const haze = pal.haze ?? pal.ground;
    HAZE.copy(haze); scene.fog.color.copy(haze); renderer.setClearColor(haze, 1);
    document.documentElement.style.setProperty('--map-ground', '#'+(pal.page ?? pal.ground).getHexString());
    for(const m of city.meshes){
      const k=m.userData.kind;
      if(m.userData.outline){ m.material.color.copy(pal.ink); continue; }
      if(k==='park') m.material.color.copy(pal.park);
      else if(k==='water') m.material.color.copy(pal.water);
      else if(k==='blocks') m.material.color.copy(pal.footprint);
      else if(k?.startsWith('road')) m.material.color.copy(pal.roads[+k.slice(4)]);
    }
    city.recolor?.(pal);
    if(pal.sky) sky.userData.paint(pal.sky);
    // the globe's atmosphere: the rim inside the limb and the halo outside it take the palette's rim, else a lit haze
    globeU.uRim.value.set(pal.rim ?? mix(haze, 0xffffff, .6)); globeU.uGlow.value.copy(globeU.uRim.value);
    // paper is the light-land style (printed grain, dark-ink labels); the others have dark land and take the paper labels
    document.getElementById('stick').classList.toggle('paper-map', mapView.style==='paper');
    document.getElementById('stick')._skyDark=undefined;   // sky-dark itself is set per frame (frame loop), with the sky   // railway: the hero text turns Sea Breeze on the blue sky
    if(city.ink) city.ink.visible = (pal.inkK ?? 1) > 0;   // flat: no outlines at all, not just transparent ones
    if(city.ready) applyShow();   // (not on the first call: the page elements applyShow reads are set up further down)
  }
  applyStyle();
  function applyShow(){
    for(const m of city.meshes){
      const k=m.userData.kind;
      if(m.userData.outline && !PALETTES[mapView.style].lotLines){ m.visible=false; continue; }
      if(k==='buildings') m.visible=mapView.show.buildings && !stick._work;   // Our Work Across Toronto: a clean overview, no 3D corridor
      else if(k==='blocks') m.visible=mapView.show.blocks;
      else if(k==='park' || k==='water') m.visible=mapView.show.nature;
    }
  }
  document.addEventListener('pointerdown', e=>{ if(!layersEl.hidden && !layersEl.contains(e.target) && !layerBtn.contains(e.target)) setLayers(false); }, {signal});
  function subLine(p){ if(layer==='services') return p.services.slice(0,2).join(' · ') || IND[p.ind].name; if(layer==='results') return p.result || 'Case study in progress'; return CONTENT[p.id]?.gcat || IND[p.ind].name; }

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
  const thumb = p => `<span class="th single hair" style="--ind:${INDUSTRIES[p.ind]?.color}">${thumbHTML(p)}</span>`;
  const item = p => `<button class="item${matches(p)?'':' dim'}" type="button" data-id="${p.id}">${thumb(p)}<span><b>${p.name}${saved.has(p.id)?'<span class="sv-badge">Saved</span>':''}</b><span class="sub">${IND[p.ind].name} · ${p.addr}</span>${p.result?`<span class="res">${p.result}</span>`:p.services.length?`<span class="sub">${p.services.join(' · ')}</span>`:''}</span></button>`;
  const group = (title, list, extra='') => `<div class="sec"><span class="eyebrow">${title} · ${list.length}</span>${extra}</div><div class="items">${list.map(item).join('')}</div>`;
  function listHTML(){
    const loc = LOCAL.filter(p=>!p.group), th = ALL.filter(p=>p.group==='thornhill'), away = AWAY.filter(p=>p.group!=='thornhill');
    return `<div class="biz">
      <h2 class="tcg-logo biz-logo" role="img" aria-label="Talkerstein Consulting Group"></h2>
      <div class="meta"><b>5.0</b><span class="stars" aria-label="5 out of 5">★★★★★</span><span>7 reviews on Clutch · Toronto consulting agency</span></div>
      <div class="acts">
        ${act('pri','Book Free Consult',I.diag)}
        <a class="act sprout btn sm" href="https://talkerstein.com" target="_blank" rel="noopener" aria-label="Website"><svg class="glyph" viewBox="0 0 24 24">${I.web}</svg>Website</a>
        ${act('','Save',I.bookmark,`aria-pressed="${saved.has('tcg')}"`)}
        ${act('','Share',I.share)}
      </div>
    </div>
    ${group('Projects', loc, `<button class="sprout link" type="button" id="routecard" aria-label="Show all of Bathurst">Show all</button>`)}
    ${th.length ? group('Thornhill', th) : ''}
    ${away.length ? group('Elsewhere', away) : ''}
    <p class="sheet-credit">Map data © OpenStreetMap contributors · Elevation: AWS Terrain Tiles</p>`;
  }
  function resultsHTML(){
    const r=ALL.filter(matches), term=q.value.trim().replace(/[<>&"]/g,'');
    if(!r.length) return `<div class="results-h"><p><b>No results for “${term}”</b></p><p>Try a service like “website” or “menu”.</p><button class="sprout link" type="button" id="clearq" aria-label="Clear the search">Clear the search</button></div>`;
    return `<div class="results-h"><p><b>${r.length}</b> result${r.length===1?'':'s'} for “${term}”</p></div><div class="items">${r.map(item).join('')}</div>`;
  }
  // a client's sidebar, Google Maps style: a big lifestyle banner, a photo row whose last tile is "+N",
  // the name with the Google category and rating, then Overview (SEO copy) / Reviews (published) / About (their words)
  const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const sm = u => u.replace(/\.webp$/, '-sm.webp');
  const stars = (r, cls='') => `<span class="gstars${cls}" aria-hidden="true">${[1,2,3,4,5].map(i=>`<i class="${r>=i-.25?'f':r>=i-.75?'h':''}">★</i>`).join('')}</span>`;
  // everything the place can show: banner, then the scrolling-website clip, then photos and screenshots
  const mediaOf = c => { if(!c) return [];
    // phones: the site as a phone sees it (portrait clip and snapshots), then the lifestyle photos; desktop: the desktop captures
    if(W<760 && c.mvideo) return [{ video: c.mvideo, poster: c.mvideo.replace(/\.mp4$/, '.jpg'), portrait: true }, ...(c.mphotos||[]).map(src => ({ src, portrait: true })),
      { src: c.banner }, ...c.photos.filter(u => !/\/site-\d/.test(u)).map(src => ({ src }))];
    return [...(c.video ? [{ video: c.video, poster: c.video.replace(/\.mp4$/, '.jpg') }] : []), { src: c.banner }, ...c.photos.map(src => ({ src }))]; };
  const host = u => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  function placeHTML(p){
    const tab = placeTab[p.id] || 'overview', c = CONTENT[p.id];
    const addr = `${p.addr}${/Thornhill|ON$|Concord|Mississauga|Richmond Hill|North York|Toronto/.test(p.addr)?'':', Toronto'}`;
    const pin = '<svg class="glyph" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
    const globe = '<svg class="glyph" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>';
    const tool = '<svg class="glyph" viewBox="0 0 24 24"><path d="M14 7l3-3 3 3-3 3M4 20l9-9"/></svg>';
    const rating = c && c.rating ? `<span class="grate"><b>${c.rating.toFixed(1)}</b>${stars(c.rating)}<span>(${c.count.toLocaleString('en-CA')})</span></span>` : '';
    const panel = {
      overview: `${c ? `<p class="seo">${esc(c.overview)}</p>` : ''}
        ${p.result?`<div class="result"><b>${p.result}</b><small>Published on talkerstein.com/work</small></div>`:''}
        <dl class="kv">
          <dt>${pin}<span class="sr-only">Address</span></dt><dd>${esc(addr)}</dd>
          ${(c?.site || p.site) ? `<dt>${globe}<span class="sr-only">Website</span></dt><dd><a class="plink" href="${c?.site || p.site}" target="_blank" rel="noopener">${host(c?.site || p.site)}</a></dd>` : ''}
          ${p.services.length ? `<dt>${tool}<span class="sr-only">Services</span></dt><dd class="tags">${p.services.map(x=>`<span class="single hair">${x}</span>`).join('')}</dd>` : ''}
        </dl>`,
      reviews: c && c.reviews.length
        ? `${c.rating ? `<div class="rsum"><b>${c.rating.toFixed(1)}</b><span>${stars(c.rating)}<small>${c.count.toLocaleString('en-CA')} reviews on Google</small></span></div>` : ''}
           <ul class="revs">${c.reviews.map(r=>`<li><div class="rh"><span class="av" aria-hidden="true">${esc(r.who.trim()[0])}</span><span><b>${esc(r.who)}</b><small>${r.source==='Google'?'Google review':'Review on '+esc(c.site ? host(c.site) : r.source)}</small></span></div><p>${esc(r.quote)}</p></li>`).join('')}</ul>`
        : p.testimonial ? `<blockquote class="quote">“${p.testimonial.quote}”<cite>${p.testimonial.who}</cite></blockquote>`
        : `<p class="note">No published reviews for ${p.name} yet.</p>`,
      about: c?.about.length ? `${c.about.map(t=>`<p class="about">${esc(t)}</p>`).join('')}${c.site ? `<p class="note">From <a class="plink" href="${c.site}" target="_blank" rel="noopener">${host(c.site)}</a></p>` : ''}`
        : `<p class="about">${IND[p.ind].name}, ${p.addr}.</p>`,
    }[tab];
    const T = [['overview','Overview'],['reviews','Reviews'],['about','About']];
    const media = mediaOf(c);
    // the grid: the website clip across the full width, a row of four tiles under it; the fourth carries the rest as "+N"
    const SHOWN = 5, more = media.length - SHOWN;
    const plus = i => i === SHOWN - 2 && more > 0 ? `<span class="pmore">+${more}</span>` : '';
    // the hero: the website scrolling (poster first, the branded play button starts it in place), else the banner
    const hero = !c ? '' : media[0].video
      ? `<div class="pban phero single hair${media[0].portrait ? ' port' : ''}"><video src="${media[0].video}" poster="${media[0].poster}" muted loop playsinline preload="none" aria-label="${esc(p.name)} website, scrolling"></video>
          <span class="pvid">${esc(host(c.site))}</span>
          <button type="button" class="sprout btn icon orange pplay" aria-label="Play the ${esc(p.name)} website"><svg class="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg></button>
          <button type="button" class="pexp" data-ph="0" aria-label="Open the website video full size"><svg class="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button></div>`
      : `<button type="button" class="pban single hair" data-ph="0" aria-label="Photos of ${esc(p.name)}"><img src="${c.banner}" alt="" decoding="async"></button>`;
    // TCG Studios ads: the YouTube video is the case study's media, in place of website captures and photos
    const ytGal = p.youtube ? `<div class="pgal"><div class="pban pyt single hair${p.short ? ' port' : ''}"><iframe src="https://www.youtube-nocookie.com/embed/${p.youtube}?rel=0&amp;modestbranding=1&amp;playsinline=1" title="${esc(p.name)}: ad by TCG Studios" loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div></div>` : '';
    const gallery = p.youtube ? ytGal : c ? `<div class="pgal">
        ${hero}
        ${media.slice(1, SHOWN).map((m,i)=>`<button type="button" class="ptile single hair${m.portrait ? ' port' : ''}" data-ph="${i+1}" aria-label="Photo ${i+2} of ${media.length}"><img src="${sm(m.src)}" alt="" loading="lazy" decoding="async">${plus(i)}</button>`).join('')}
      </div>`
      : `<div class="gallery"><div class="single hair" style="--ind:${INDUSTRIES[p.ind]?.color}">${thumbHTML(p)}</div></div>`;
    // the tour's own controls (Previous / Next) sit after the content, so the case study is read on the way
    // to them; Next names where it leads. The handle only resizes the sheet; the edge tab collapses it.
    const j = NODES.findIndex(n=>n.id===p.id), last = j===NODES.length-1;
    // off the route: Previous / Next step through the other cases (the ones the tour doesn't stop at), wrapping round
    const off = ALL.filter(x=>!NODES.some(n=>n.id===x.id)), k = off.findIndex(x=>x.id===p.id);
    const offPrev = off[(k-1+off.length)%off.length], offNext = off[(k+1)%off.length];
    const nav = j<0 ? (off.length<2 ? '' : `<nav class="pnav" aria-label="Case studies">
        <button type="button" class="sprout btn pprev" data-open="${offPrev.id}" aria-label="Previous: ${esc(offPrev.name)}"><svg class="glyph" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg><span>Previous</span></button>
        <button type="button" class="sprout btn orange pnext" data-open="${offNext.id}" aria-label="Next: ${esc(offNext.name)}"><span class="pn-t"><small>Next</small><b>${esc(offNext.name)}</b></span><svg class="glyph" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
      </nav>`) : `<nav class="pnav" aria-label="Case studies">
        <button type="button" class="sprout btn pprev" data-go="${j-1}" aria-label="${j>0 ? `Previous: ${esc(NODES[j-1].name)}` : 'Back to the overview'}"><svg class="glyph" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg><span>${j>0 ? 'Previous' : 'Overview'}</span></button>
        <button type="button" class="sprout btn orange pnext" data-go="${j+1}" aria-label="${last ? 'Next: The Way Forward' : `Next: ${esc(NODES[j+1].name)}`}"><span class="pn-t"><small>Next</small><b>${last ? 'The Way Forward' : esc(NODES[j+1].name)}</b></span><svg class="glyph" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
      </nav>`;
    return `<div class="place">
      ${gallery}
      <div class="hd"><div><h2>${p.name}</h2><div class="meta">${rating}${c?`<span class="gcat">${esc(c.gcat)}</span>`:IND[p.ind].name}${p.maybe?' · <b>to confirm</b>':''}</div></div></div>
      <div class="ptabs" role="tablist" aria-label="${p.name}">${T.map(([k,n])=>`<button type="button" role="tab" class="ptab" data-tab="${k}" aria-selected="${k===tab}">${n}</button>`).join('')}</div>
      <div class="ppanel" role="tabpanel">${panel}</div>
      ${nav ? `<div class="pfoot">${nav}</div>` : ''}
    </div>`;
  }
  // the photo viewer: every image of the place; arrows, swipe or keys to step, Esc or the backdrop closes
  function openPhotos(p, at){
    const c = CONTENT[p.id]; if(!c) return;
    const media = mediaOf(c), imgs = media.map(m => m.src || m.poster); let i = at;
    const d = document.createElement('dialog'); d.className = 'phbox';
    d.innerHTML = `<div class="phin frame"><div class="phtop"><b>${esc(p.name)}</b><span class="phn"></span><button type="button" class="sprout btn icon" data-x aria-label="Close photos"><svg class="glyph" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <div class="phstage"><button type="button" class="sprout btn icon phprev" aria-label="Previous photo"><svg class="glyph" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><img alt=""><video muted loop playsinline controls hidden></video><button type="button" class="sprout btn icon phnext" aria-label="Next photo"><svg class="glyph" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button></div>
      <div class="phstrip">${media.map((m,k)=>`<button type="button" data-k="${k}" aria-label="${m.video?'Website video':`Photo ${k+1}`}"${m.video?' class="isvid"':''}><img src="${m.video?m.poster:sm(m.src)}" alt="" loading="lazy"></button>`).join('')}</div></div>`;
    document.body.appendChild(d);
    const img = d.querySelector('.phstage img'), vid = d.querySelector('.phstage video'), n = d.querySelector('.phn');
    vid.muted = true;   // the attribute alone (from innerHTML) doesn't let Chrome autoplay
    vid.oncanplay = () => { if(!vid.hidden) vid.play().catch(()=>{}); };   // a play() before the clip has loaded can be dropped
    const show = k => { i = (k + imgs.length) % imgs.length; const m = media[i];
      img.hidden = !!m.video; vid.hidden = !m.video; d.classList.toggle('port', !!m.portrait);
      if(m.video){ if(vid.getAttribute('src')!==m.video){ vid.src = m.video; vid.poster = m.poster; } vid.play().catch(()=>{}); } else { vid.pause(); img.src = m.src; }
      n.textContent = `${i+1} / ${imgs.length}`;
      d.querySelectorAll('.phstrip button').forEach((b,j)=>{ b.classList.toggle('on', j===i); if(j===i) b.scrollIntoView({block:'nearest',inline:'center'}); }); };
    d.querySelector('.phprev').onclick = () => show(i-1); d.querySelector('.phnext').onclick = () => show(i+1);
    d.querySelectorAll('.phstrip button').forEach(b => b.onclick = () => show(+b.dataset.k));
    d.querySelector('[data-x]').onclick = () => d.close();
    d.onclick = e => { if(e.target === d) d.close(); };
    d.onkeydown = e => { if(e.key==='ArrowLeft') show(i-1); if(e.key==='ArrowRight') show(i+1); };
    let x0 = null; img.onpointerdown = e => { x0 = e.clientX; }; img.onpointerup = e => { if(x0!==null && Math.abs(e.clientX-x0)>40) show(i + (e.clientX<x0?1:-1)); x0 = null; };
    d.onclose = () => d.remove();
    d.showModal(); show(i);
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
    if(p) sheetBody.querySelectorAll('[data-ph]').forEach(b=>b.onclick=()=>openPhotos(p, +b.dataset.ph));
    // case-study controls: the stop before or after (it opens half way on phones), the overview before the first, The Way Forward after the last
    sheetBody.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openPlace(b.dataset.open));   // off-route cases: open the neighbour in place
    sheetBody.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{ const k=+b.dataset.go;
      if(k>=0 && k<NODES.length) scrollToNode(k); });   // Previous / Next: open the stop before or after this one
    // the hero clip: the play button starts it in place; a click on the playing clip pauses it again
    const hv = sheetBody.querySelector('.phero');
    if(hv){ const v = hv.querySelector('video'), pb = hv.querySelector('.pplay'); v.muted = true;
      pb.onclick = () => { v.play().catch(()=>{}); };
      v.onclick = () => { if(!v.paused) v.pause(); else v.play().catch(()=>{}); };
      v.onplay = () => hv.classList.add('playing'); v.onpause = () => hv.classList.remove('playing'); }
    placeClose.onclick=()=>{ if(W<760 && p && NODES.some(n=>n.id===p.id) && !mapUI.classList.contains('pc')){ setCollapsed(true); return; }   // phones: back to the map card
      closePlace(); };
    const cq=sheetBody.querySelector('#clearq'); if(cq) cq.onclick=()=>qclear.onclick();
    const rc=sheetBody.querySelector('#routecard'); if(rc) rc.onclick=fitRoute;
    sheetBody.querySelectorAll('[data-a]').forEach(b=>{
      const a=b.dataset.a;
      b.onclick = () => {
        if(a==='Book Free Consult') location.href='/book';
        else if(a==='Save') toggleSave(p ? p.id : 'tcg');
        else if(a==='Share') copyText(p ? `${p.name}, ${p.addr}${/Thornhill|ON$/.test(p.addr)?'':', Toronto'}` : 'Talkerstein Consulting Group · talkerstein.com', p ? 'Address copied' : 'Details copied');
        else if(a==='Case study'){ open('https://talkerstein.com/work','_blank','noopener'); }   // TODO(content): link each client's case study
      };
    });
  }
  // a clicked pin wins over whatever is on screen (Route Preview, Find Your Way Forward, the heading):
  // leave the directions for the map, then open that project
  let beforePin=null;   // the map as it was before a pin opened its sidebar: a click on the map goes back to it
  function pinClick(id){
    if(!selected) beforePin={goal:{...goal}, filter};
    openPlace(id, false);   // opens the panel: the sidebar on desktop, the half sheet on phones
    // glide (same zoom) so the pin and its card sit together in the middle of the map the panel leaves free (beside the
    // sidebar, or above the sheet). Measured now and again once the panel has finished sliding in.
    const p=ALL.find(x=>x.id===id);
    const dist = goal.dist > 4000 ? Math.max(4000, goal.dist*.55) : goal.dist;   // zoom in a step (like Google Maps), never closer than the street view
    const glide=()=>{ if(!p?.pos || selected!==id) return;
      const o=visibleOffset(); o.y -= 28;   // (y is up) the pin stands ~56px tall on its address: centre the pin, not its tip
      const m=mpp(dist), r=rgt(goal.bearing), f=fwd(goal.bearing), k=1/Math.max(.45,Math.cos(goal.pitch));
      mapDirty=true; setGoal({cx: p.pos.x - r.x*o.x*m - f.x*o.y*m*k, cz: p.pos.z - r.z*o.x*m - f.z*o.y*m*k, dist}); };
    requestAnimationFrame(glide); setTimeout(glide, 450);
  }
  // closing a place leaves the map alone: no list, no sheet — the map is the resting state
  function closePlace(){ selected=null; view={type:'list'}; render(); refresh(); setCollapsed(true); setSheet('peek'); }
  function viewPlace(id){ openPlace(id, false); setSheet('half'); setCollapsed(false); }
  function openPlace(id, fly=true){
    const p=ALL.find(x=>x.id===id); if(!p) return;
    view={type:'place',id}; selected=id; { const j=NODES.findIndex(n=>n.id===id); if(j>=0) nodeIdx=j; markChip(p.ind); } render(); refresh(); setSheet('half'); setCollapsed(false);
    if(fly && p.pos){ const stop = nodeIdx>=0 && NODES[nodeIdx]?.id===id; requestAnimationFrame(()=>flyTo(p.pos, stop ? 4200 : Math.min(goal.dist, 1500), false)); }   // the client in focus lands in the centre of the free map (next frame: the panel and sheet have opened by then)   // scroll stops: wide enough that the neighbouring icons stay on screen
  }
  function refresh(){
    document.getElementById('stick')?.classList.toggle('filtered', filter!=='all');   // a category chip is on: its pins grow, logo with the name underneath
    LOCAL.forEach(p=>{ p.el.classList.toggle('dim', !matches(p)); if(p.el.classList.contains('sel')!==(selected===p.id)){ p.el.classList.toggle('sel', selected===p.id); p.cw=0; } if(p.sub.textContent!==subLine(p)){ p.sub.textContent=subLine(p); p.cw=0; } });
    // the place panel only exists while a place is open: no list, no empty sheet over the map
    mapUI.classList.toggle('place', view.type==='place');
  }
  // phone bottom sheet: peek / half / full, drag or tap the handle
  const ORDER=['peek','half','full'];
  function setSheet(st){ sheet.dataset.state=st; }
  // the handle drags the sheet live (it follows the finger), then settles on the nearest state; a quick flick
  // goes one state further in its direction, and a tap steps to the next state
  { const grab=$('grab'); let d=null;
    const offsetOf = () => new DOMMatrix(getComputedStyle(sheet).transform).m42;   // current translateY in px
    const stateY = () => { const was=sheet.style.transform; sheet.style.transform=''; const cur=sheet.dataset.state, y={};
      for(const st of ORDER){ sheet.dataset.state=st; y[st]=offsetOf(); } sheet.dataset.state=cur; sheet.style.transform=was; return y; };
    grab.addEventListener('pointerdown', e=>{ if(e.pointerType==='touch') return;   /* touch: the whole-sheet gesture below */ const y=offsetOf(); sheet.classList.add('dragging'); sheet.style.transform=`translateY(${y}px)`;   // freeze where it is (mid-transition too)
      d={y0:e.clientY, start:y, y, t:performance.now(), v:0, moved:false, pos:stateY()}; grab.setPointerCapture(e.pointerId); });
    grab.addEventListener('touchmove', e=>{ if(e.cancelable) e.preventDefault(); }, {passive:false});   // the handle moves the panel, never scrolls the page
    grab.addEventListener('pointermove', e=>{ if(!d) return; const dy=e.clientY-d.y0; if(Math.abs(dy)>6) d.moved=true; if(!d.moved) return;
      const lo=d.pos.full, hi=d.pos.peek, y=Math.min(hi+24, Math.max(lo-24, d.start+dy)), now=performance.now();
      d.v = (y-d.y)/Math.max(1, now-d.t); d.y=y; d.t=now; sheet.style.transform=`translateY(${y}px)`; });
    const end = () => { if(!d) return; const {moved, y, v, pos}=d; d=null; sheet.classList.remove('dragging'); sheet.style.transform='';
      if(!moved){ const i=ORDER.indexOf(sheet.dataset.state); setSheet(ORDER[(i+1)%3]); return; }
      let best=ORDER.reduce((a,st)=>Math.abs(pos[st]-y)<Math.abs(pos[a]-y)?st:a, 'half');
      if(Math.abs(v)>.5){ const i=ORDER.indexOf(best), j=Math.max(0, Math.min(2, i + (v<0?1:-1))); if((v<0 && pos[ORDER[j]]<y) || (v>0 && pos[ORDER[j]]>y)) best=ORDER[j]; }   // flick
      setSheet(best); };
    grab.addEventListener('pointerup', end); grab.addEventListener('pointercancel', end);

    // touch, Google Maps style: drag anywhere on the sheet. Below full height every vertical drag moves the sheet;
    // at full height the content scrolls, and a pull down from its top drags the sheet back down. A tap on the
    // handle steps to the next state; taps anywhere else are ordinary taps. Flicks carry on in their direction.
    const body = sheetBody; let t=null;
    const snap = (y, v, pos) => {
      if(v < -.25) return ['peek','half','full'].find(st=>pos[st] < y-8) ?? 'full';    // flick up: the next state above
      if(v >  .25) return ['full','half','peek'].find(st=>pos[st] > y+8) ?? 'peek';    // flick down: the next state below
      return ORDER.reduce((a,st)=>Math.abs(pos[st]-y)<Math.abs(pos[a]-y)?st:a, 'half'); };   // otherwise the nearest
    sheet.addEventListener('touchstart', e=>{
      if(W>=760 || e.touches.length!==1) { t=null; return; }
      t={y0:e.touches[0].clientY, x0:e.touches[0].clientX, mode:null, st:sheet.dataset.state, top:body.scrollTop, start:0, y:0, v:0, tm:performance.now(), pos:null, onGrab:!!e.target.closest('.grab')};
    }, {passive:true});
    sheet.addEventListener('touchmove', e=>{
      if(!t) return; const cy=e.touches[0].clientY, dy=cy-t.y0, dx=e.touches[0].clientX-t.x0;
      if(!t.mode){
        if(Math.abs(dy)<7 && Math.abs(dx)<7) return;
        if(Math.abs(dx)>Math.abs(dy)*1.2 && !t.onGrab) { t.mode='x'; return; }   // sideways: leave it to swipeable rows
        const full = t.st==='full', atTop = body.scrollTop<=0;
        t.mode = !full || t.onGrab || (atTop && dy>0) ? 'sheet' : 'scroll';
        // freeze where it is (mid-transition too), then measure the states with the transition off
        if(t.mode==='sheet'){ t.start=offsetOf(); sheet.classList.add('dragging'); t.pos=stateY(); t.y=t.start; sheet.style.transform=`translateY(${t.start}px)`; t.y0=cy; }
      }
      if(t.mode!=='sheet') return;
      if(e.cancelable) e.preventDefault();
      const d=cy-t.y0, lo=t.pos.full, hi=t.pos.peek;
      let y=t.start+d; if(y<lo) y=lo-(lo-y)*.25; if(y>hi) y=hi+(y-hi)*.25;   // rubber-band past the ends
      const now=performance.now(); t.y=y; t.tm=now; (t.hist ??= []).push([now, y]); while(t.hist.length>2 && now-t.hist[0][0]>100) t.hist.shift();   // the last 100 ms, for the flick speed
      sheet.style.transform=`translateY(${y}px)`;
    }, {passive:false});
    const tEnd = e => { if(!t) return; const m=t; t=null;
      // a tap on the handle steps the state; cancel its follow-up click, which would land on whatever slides in under the finger
      if(m.mode!=='sheet'){ if(!m.mode && m.onGrab){ if(e.cancelable) e.preventDefault(); const i=ORDER.indexOf(sheet.dataset.state); setSheet(ORDER[(i+1)%3]); } return; }
      if(e.cancelable) e.preventDefault();   // after a drag, no click either
      sheet.classList.remove('dragging'); sheet.style.transform='';
      const h=m.hist||[], a=h[0], b=h[h.length-1];
      m.v = a && b && b[0]>a[0] && performance.now()-m.tm<120 ? (b[1]-a[1])/(b[0]-a[0]) : 0;   // px/ms over the last 100 ms; held still before letting go: no flick
      setSheet(snap(m.y, m.v, m.pos)); };
    sheet.addEventListener('touchend', tEnd); sheet.addEventListener('touchcancel', tEnd);
  }
  const mapUI=$('mapui');
  function setCollapsed(c){ mapUI.classList.toggle('pc', c); const et=$('edgetab'); et.setAttribute('aria-label', c?'Expand side panel':'Collapse side panel'); et.setAttribute('aria-expanded', String(!c));  }
  // the TCG mark opens the Talkerstein sidebar (the home listing)
  $('brandbtn').onclick=e=>{ e.preventDefault(); scrollTo({top:0, behavior: reduce?'auto':'smooth'}); };   // the TCG mark: back to the top, nothing else
  $('edgetab').onclick=()=>setCollapsed(!mapUI.classList.contains('pc'));
  render(); refresh(); chipEnds();

  // ---------- map camera: centre, distance, bearing, pitch ----------
  const view3 = {cx:0, cz:0, dist:4000, bearing:0, pitch:.5};   // what is drawn
  const goal  = {cx:0, cz:0, dist:4000, bearing:0, pitch:.5};   // where it is easing to
  let mapDirty=false;
  // frame a set of ground points (the whole route after the hero; every pin after the directions)
  // exact fit: project the points through a scratch camera and re-aim / pull in until they fill the safe area
  // (below the top bar, above the footer), centred on screen
  const fitCam = new THREE.PerspectiveCamera();
  function viewOf(list, pitch=.3, topPx, botPx, sidePx, bearing=0){
    const xs=list.map(p=>p.x), zs=list.map(p=>p.z);
    // start from the flat span: a far-flung set (Toronto to Florida) measured on a street-sized planet would wrap round its back
    const v={cx:(Math.min(...xs)+Math.max(...xs))/2, cz:(Math.min(...zs)+Math.max(...zs))/2, dist:Math.max(20000, Math.hypot(Math.max(...xs)-Math.min(...xs), Math.max(...zs)-Math.min(...zs))*1.3), bearing, pitch};
    const flat={...v};
    const top=topPx ?? (W<760?150:84), bot=botPx ?? (W<760?60:56), side=sidePx ?? (W<760?16:48);   // px kept clear for the chrome
    const P=new THREE.Vector3(), T=new THREE.Vector3(), q=new THREE.Vector3(), R=new THREE.Vector3(), U=new THREE.Vector3(), G=new THREE.Vector3();
    fitCam.fov=camera.fov; fitCam.aspect=W/H; fitCam.near=10; fitCam.far=1e9; fitCam.updateProjectionMatrix();
    for(let it=0; it<12; it++){
      // the points are measured where the globe puts them for a camera at this height (lib/bathurst/globe.ts), so the fit
      // made on the street still holds once the map has curled
      poseFrom(v,P,T); const gk=kAt(), gr=rAt(P.y); fitCam.position.copy(P); fitCam.up.set(0,1,0); fitCam.lookAt(bendPoint(G,T,P,gk,gr)); fitCam.updateMatrixWorld();
      let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
      for(const p of list){ bendPoint(q,p,P,gk,gr).project(fitCam); const sx=(q.x+1)/2*W, sy=(1-q.y)/2*H; x0=Math.min(x0,sx); x1=Math.max(x1,sx); y0=Math.min(y0,sy); y1=Math.max(y1,sy); }
      // move the centre so the box sits in the middle of the safe area, then scale the distance to fill it
      const wantX=W/2, wantY=(top+H-bot)/2, dx=(x0+x1)/2-wantX, dy=(y0+y1)/2-wantY, m=mpp(v.dist), k=1/Math.max(.45,Math.cos(pitch));
      // screen right / screen up on the ground, so the correction works at any bearing
      R.setFromMatrixColumn(fitCam.matrixWorld,0).setY(0).normalize(); U.setFromMatrixColumn(fitCam.matrixWorld,1).setY(0).normalize();
      v.cx += R.x*dx*m - U.x*dy*m*k; v.cz += R.z*dx*m - U.z*dy*m*k;
      v.dist *= Math.max((x1-x0)/(W-2*side), (y1-y0)/(H-top-bot));
      if(!Number.isFinite(v.dist+v.cx+v.cz) || v.dist<=0) return flat;   // the fit lost the points (behind the camera): the flat estimate
    }
    v.dist=Math.max(1400, v.dist); return v;
  }
  /** The plan view's tilt (none) and the tilt the 3D toggle restores. Kept apart because the default is now
   *  flat: reading defaultView().pitch for the 3D case would hand 3D a pitch of zero and do nothing. */
  const PLAN_PITCH = 0, TILT_PITCH = .3;
  // the bearing that fills the screen best: north need not be up. Tries headings within ±80° (never upside down)
  // and keeps the one that frames the points closest, so a tall spread of pins lies along a wide screen.
  /**
   * Phones only: the clients span roughly 40 km east to west (Mississauga out
   * to Scarborough) while most of them sit in one band along Bathurst. Framing
   * the full spread on a narrow screen sets the scale by those few outliers,
   * and everything else collapses into one clump in the middle of the map.
   *
   * So the phone's opening view frames the core and lets the outliers sit off
   * screen: points are kept when they are within 1.6x the MEDIAN distance from
   * the median centre. The median is the point here -- a mean would be dragged
   * out by the very outliers this is meant to ignore. Nothing is hidden: the
   * outlying pins are still on the map a pan away, and the chips, All clients
   * and the zoom-out limit (zoomAllView) all still frame every client.
   */
  function core(pts){
    if(pts.length < 4) return pts;
    const mid = a => { const b=[...a].sort((x,y)=>x-y), h=b.length>>1; return b.length%2 ? b[h] : (b[h-1]+b[h])/2; };
    const cx = mid(pts.map(p=>p.x)), cz = mid(pts.map(p=>p.z));
    const d  = pts.map(p=>Math.hypot(p.x-cx, p.z-cz));
    const md = mid(d) || 0;
    if(!md) return pts;
    const keep = pts.filter((p,i)=> d[i] <= md*1.6);
    return keep.length >= 3 ? keep : pts;   /* never frame on one or two pins */
  }

  // an area page frames only that area's clients; /map frames them all
  const FOCUS = area ? LOCAL.filter(p=>p.pos && inArea(p, area)) : null;
  /** The near end of the reveal: the Toronto bunch, framed as the map always framed it. */
  const routeView = () => {
    const list = FOCUS?.length ? FOCUS.map(p=>p.pos) : [START, ...NEAR.map(p=>p.pos), OFFICE_P];
    /* phones: frame the core so the pins separate; 56px clears the control column on the left */
    return W<760
      ? viewOf(core(list), PLAN_PITCH, 120, 80, 56, 0)
      : viewOf(list, PLAN_PITCH, 215, 80, 140, 0);
  };
  // the zoom-out limit: the whole planet, filling the map's shorter side edge to edge but never cropped
  const worldAlt = () => { const hv=camera.fov*Math.PI/360, hh=Math.atan(Math.tan(hv)*W/H); return R_E/Math.sin(Math.min(hv,hh)*.985) - R_E; };
  const maxDist = pitch => worldAlt()/Math.max(.45, Math.cos(pitch));
  /** The far end of the reveal: the whole globe, centred on every client — the Toronto bunch and the away ones. */
  const worldView = () => {
    const all = FOCUS?.length ? FOCUS.map(p=>p.pos) : [START, ...NEAR.map(p=>p.pos), ...FAR.map(p=>p.pos), OFFICE_P];
    const xs = all.map(q=>q.x), zs = all.map(q=>q.z);
    return {cx:(Math.min(...xs)+Math.max(...xs))/2, cz:(Math.min(...zs)+Math.max(...zs))/2,
            dist: maxDist(PLAN_PITCH), bearing: 0, pitch: PLAN_PITCH};
  };
  function defaultView(){ return revealView(reveal); }
  // the centre stays within 7,000 km of Toronto: the world map is drawn round Toronto, and it is truest near it
  function setGoal(v, instant){ if(!Object.values(v).every(x=>typeof x!=='number' || Number.isFinite(x))) return;   // never let a bad fit poison the camera
    Object.assign(goal, v); goal.pitch=Math.min(1.15,Math.max(0,goal.pitch)); goal.dist=Math.min(maxDist(goal.pitch),Math.max(300,goal.dist));
    { const cr=Math.hypot(goal.cx,goal.cz), CMAX=7e6; if(cr>CMAX){ goal.cx*=CMAX/cr; goal.cz*=CMAX/cr; } }
    if(instant) Object.assign(view3, goal); }
  function resetView(){ mapDirty=false; setGoal(defaultView()); }
  /**
   * The reveal: the page the map is framed in (components/tcg/footprint.tsx) drives this with its own
   * scroll. 0 is the whole globe, filling the map and centred on every client; 1 is the Toronto bunch
   * at the framing the map has always opened on. Scrolling the section flies the camera in between the
   * two — the centre eased in longitude and latitude, so the planet turns as it comes closer, and the
   * distance eased geometrically, so each scrolled pixel halves the altitude by the same share.
   * It stops as soon as the visitor touches the map themselves (mapDirty).
   */
  let reveal = 0;   // the framed page sets this; /map opened on its own is driven by its own page (map/page.tsx)
  const geoOf = v => Math.hypot(v.cx, v.cz) < NEAR_M
    ? {lat:O.lat - v.cz/111000, lon:O.lon + v.cx/80300} : xzGeo(O, v.cx, v.cz);
  const REVEAL_SPIN = 18;   // degrees of extra turn at 0, so the globe is seen to rotate, not only to grow
  function revealView(p){
    const t = Math.min(1, Math.max(0, p));
    const far = worldView(), near = routeView();
    if(t >= 1) return near;
    const gf = geoOf(far), gn = geoOf(near);
    const lat = gf.lat + (gn.lat - gf.lat)*t, lon = gf.lon - REVEAL_SPIN*(1-t) + (gn.lon - gf.lon)*t;
    const c = geoXZ(O, lat, lon);
    return {...near, cx:c.x, cz:c.z, dist: Math.exp(Math.log(far.dist)*(1-t) + Math.log(near.dist)*t)};
  }
  const fwd = b => ({x:Math.sin(b), z:-Math.cos(b)}), rgt = b => ({x:Math.cos(b), z:Math.sin(b)});
  function poseFrom(vw, pos, tgt){ const sp=Math.sin(vw.pitch), cp=Math.cos(vw.pitch), f=fwd(vw.bearing); tgt.set(vw.cx,0,vw.cz); pos.set(vw.cx - f.x*vw.dist*sp, vw.dist*cp, vw.cz - f.z*vw.dist*sp); }
  const mpp = dist => 2*dist*Math.tan(camera.fov*Math.PI/360)/H;
  // pixel offset of the visible map centre (panel / sheet cover part of the canvas)
  function visibleOffset(){ const r=freeRect(); return {x:(r.left+r.right)/2 - W/2, y:H/2 - (r.top+r.bot)/2}; }
  function freeRect(edges=false){
    // the part of the map that is actually free: below the navbar, heading and chips, right of the side panel, left of the
    // control column, above the bottom sheet. Returned as how far that centre sits from the screen centre (x right, y up).
    const s=stick.getBoundingClientRect(), shown=el=>{ if(!el) return null; const cs=getComputedStyle(el); if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity<.1) return null; const r=el.getBoundingClientRect(); return r.width&&r.height ? r : null; };
    let left=0, right=W, top=0, bot=H;
    for(const sel of ['.navbar .layers-top', '#chipbar', '#workhead', '.brandpin', '.menubtn']){ const r=shown(stick.querySelector(sel)); if(r && r.bottom-s.top < H*.45) top=Math.max(top, r.bottom-s.top); }
    if(W<760) bot=Math.min(bot, sheetTop());
    else if(!mapUI.classList.contains('pc')){ const r=shown(mapUI.querySelector('.panel')); if(r && r.left-s.left < W*.4) left=Math.max(left, r.right-s.left); }
    { const r=shown(stick.querySelector('.ctrls')); if(r && r.left-s.left > W*.6) right=Math.min(right, r.left-s.left); else if(edges && r && r.right-s.left < W*.4) left=Math.max(left, r.right-s.left); }   // phones: the column is on the left (kept clear for the edge markers only; the centring ignores it as before)
    top+=28; left+=16; right-=16; bot-=16;   // air from each edge (top: the navbar's bar runs 16px below its buttons)
    return {left, right, top, bot};
  }
  function centreFor(world, dist, bearing, pitch, mid){
    // mid: the true centre of the screen. Phones: the selected pin is a teardrop standing on its address, so the address sits 28px
    // below centre and the pin's head is what lands in the middle
    const o=mid ? {x:0,y:W<760 ? -28 : 0} : visibleOffset(), m=mpp(dist), r=rgt(bearing), f=fwd(bearing), k=1/Math.max(.45,Math.cos(pitch));
    return {cx: world.x - r.x*o.x*m - f.x*o.y*m*k, cz: world.z - r.z*o.x*m - f.z*o.y*m*k};
  }
  function flyTo(world, dist, mid){ mapDirty=true; setGoal({...centreFor(world, dist, goal.bearing, goal.pitch, mid), dist}); }   // mid: the pin lands on the true centre of the screen, not the middle of what the panel leaves
  function fitTo(list){
    if(!list.length) return; if(list.length===1) return flyTo(list[0].pos, 1500);
    const zs=list.map(p=>p.pos.z), xs=list.map(p=>p.pos.x), cz=(Math.min(...zs)+Math.max(...zs))/2, cx=(Math.min(...xs)+Math.max(...xs))/2;
    const vw=Math.max(200, W-2*visibleOffset().x), span=Math.max(Math.max(...zs)-Math.min(...zs), (Math.max(...xs)-Math.min(...xs))*H/vw)*1.15;   // fit into the map the sidebar leaves visible
    flyTo(new THREE.Vector3(cx,0,cz), Math.max(1400, span*1.25));
  }
  function fitRoute(){ mapDirty=true; setGoal(routeView()); }

  // ---------- the page the map lives on ----------
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Nothing here is driven by scroll: the map is the whole thing, in from the first frame.
  let lastTs=0;
  const stick=$('stick');
  // the map's own state, set once: it is on the map, with the chips up, from the first frame.
  // (These used to be scroll states the frame loop toggled.)
  stick.classList.add('mapped', 'work');
  function openNode(j){ if(NODES[j]) openPlace(NODES[j].id); }
  const scrollToNode = openNode;
  stick.addEventListener('scroll', ()=>{ if(stick.scrollLeft||stick.scrollTop){ stick.scrollLeft=0; stick.scrollTop=0; } }, {passive:true, signal});
  // sections below the map ask it to open a place: window.dispatchEvent(new CustomEvent('tcg:open', {detail:{id}}))
  const showPlace = id => openPlace(id);
  addEventListener('tcg:open', e=>showPlace(e.detail.id), {signal});
  const mapReady = () => city.ready;   // the city is built: the map is up and can be driven
  if(process.env.NODE_ENV !== 'production') window.__tcgGlobe = () => ({ R: globeU.uRe.value, K: globeU.uK.value, limbDeg: Math.round(globeU.uLimb.value*180/Math.PI), alt: Math.round(camera.position.y), pitch: +view3.pitch.toFixed(2), dist: Math.round(view3.dist), slope: GLOBE.slope });   // dev-only: the globe as drawn

  // ---------- map gestures (embedded-maps conventions) ----------
  const ray=new THREE.Raycaster(), plane=new THREE.Plane(new THREE.Vector3(0,1,0),0), hit=new THREE.Vector3(), ndc=new THREE.Vector2();
  function groundAt(px,py){ const r=stick.getBoundingClientRect(); ndc.set(((px-r.left)/W)*2-1, -((py-r.top)/H)*2+1); ray.setFromCamera(ndc,camera); return groundHit(ray.ray, camera.position, hit) ? hit.clone() : new THREE.Vector3(goal.cx,0,goal.cz); }   // on the globe, through its curve (lib/bathurst/globe.ts)
  void plane;
  function zoomAt(px,py,f){
    if(!mapReady()) return;   // nothing to zoom until the city is there
    mapDirty=true; const top=maxDist(goal.pitch);
    if(f>1 && goal.dist >= top*.999) return;   // the whole world is in view: nothing further out
    const P=groundAt(px,py); const nd=Math.min(top,Math.max(300,goal.dist*f)), ff=nd/goal.dist;
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
  const ownScroll = el => el.closest && el.closest('.sheet,.drawer,.layers,.chipbar,.scrim,.cover,.dirsheet,.menu');
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
  let dragMoved=0;
  const endDrag=()=>{ dragMoved=drag?.moved||0; drag=null; stick.classList.remove('grabbing'); };
  stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);
  // a plain click on the map (not a drag) closes the open project's sidebar and returns to the view from before it opened
  stage.addEventListener('click', ()=>{ const moved=dragMoved; dragMoved=0; if(moved>6 || !selected || !mapReady()) return;
    selected=null; view={type:'list'}; nodeIdx=-1; render(); refresh(); setCollapsed(true); if(W<760) setSheet('peek');
    markChip(beforePin?.filter ?? filter); if(beforePin){ mapDirty=true; setGoal(beforePin.goal); } beforePin=null; }, {signal});
  stage.addEventListener('dblclick', e=>zoomAt(e.clientX,e.clientY,.5));
  // touch: one finger scrolls the page, two fingers move / pinch / twist the map.
  // Except where the map IS the page (/map, and the section that frames it — app/map/MapOnly.tsx sets the flag):
  // there the page is parked, so a one-finger drag has nothing to scroll and the map feels dead to a phone.
  // On those pages one finger pans the map, the way it does in any maps app; two fingers still pinch and twist.
  const mapOnly = () => document.documentElement.dataset.mapOnly === '1';
  let t2=null, t1=null;
  const tInfo = ts => { const a=ts[0], b=ts[1]; return {x:(a.clientX+b.clientX)/2, y:(a.clientY+b.clientY)/2, d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY), a:Math.atan2(b.clientY-a.clientY,b.clientX-a.clientX)}; };
  stage.addEventListener('touchstart', e=>{ if(e.touches.length===2 && mapReady()){ e.preventDefault(); t2=tInfo(e.touches); t1=null; }
    else if(e.touches.length===1 && mapReady() && mapOnly()){ t1={x:e.touches[0].clientX, y:e.touches[0].clientY, moved:0}; } }, {passive:false});
  stage.addEventListener('touchmove', e=>{
    if(!mapReady()) return;
    if(e.touches.length===2 && t2){ e.preventDefault(); const n=tInfo(e.touches);
      panPx(n.x-t2.x, n.y-t2.y); const f=t2.d/n.d; if(Math.abs(1-f)>.002){ const P=groundAt(n.x,n.y), nd=Math.min(maxDist(view3.pitch),Math.max(300,view3.dist*f)), ff=nd/view3.dist; setGoal({dist:nd, cx:P.x+(goal.cx-P.x)*ff, cz:P.z+(goal.cz-P.z)*ff}, true); }
      turn(n.a-t2.a, 0); t2=n; ghint.classList.remove('on'); }
    else if(e.touches.length===1 && t1){ const t=e.touches[0], dx=t.clientX-t1.x, dy=t.clientY-t1.y;
      t1.moved += Math.abs(dx)+Math.abs(dy);
      if(t1.moved < 6) return;                      // a tap, not a drag: leave the click alone
      if(e.cancelable) e.preventDefault();
      panPx(dx, dy); t1.x=t.clientX; t1.y=t.clientY; ghint.classList.remove('on'); }
  }, {passive:false});
  stage.addEventListener('touchend', e=>{ if(e.touches.length<2) t2=null; if(!e.touches.length) t1=null; });
  stage.addEventListener('touchcancel', ()=>{ t2=null; t1=null; });
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
      if(!mapReady()) return;
      mapDirty=true; setGoal({bearing:0, pitch: mapView.view==='2d' ? 0 : TILT_PITCH});
      toast('Facing north');
    };
    btn.addEventListener('keydown', e=>{ if(e.key==='ArrowLeft'||e.key==='ArrowRight'){ e.preventDefault(); if(mapReady()) turn(e.key==='ArrowLeft' ? .15 : -.15, 0); } });
  }
  $('recenter').onclick=()=>resetView();
  addEventListener('keydown', e=>{ if(e.key!=='Escape') return;
    if(document.querySelector('dialog[open]')) return;   // a photo viewer or video dialog takes Escape for itself; the place stays open
    if(!drawer.hidden) return closeDrawer();
    if(!layersEl.hidden) return setLayers(false);
    if(view.type==='place'){ view={type:query?'results':'list'}; selected=null; render(); refresh(); } }, {signal});

  function resize(){ W=stick.clientWidth; H=stick.clientHeight; renderer.setSize(W,H); for(const l of fatLines) l.material.resolution.set(W,H); camera.aspect=W/H; camera.fov = W<H ? 64 : 48; camera.updateProjectionMatrix(); if(!mapDirty) setGoal(defaultView(), true); }
  addEventListener('resize', resize, {signal}); resize();
  // the map fills the large viewport; while a phone's toolbar shows, the visible bottom is innerHeight, not H
  const visH = () => Math.min(H, innerHeight);
  const sheetTop = () => { const r=sheet.getBoundingClientRect(), s=stick.getBoundingClientRect(); return r.height ? Math.min(visH(), r.top - s.top) : visH(); };   // hidden sheet (route overview): the controls rest at the bottom
  { const h=location.hash.slice(1); if(ALL.some(p=>p.id===h)) setTimeout(()=>showPlace(h), 300); }

  // ---------- edge markers ----------
  // Like a game's off-screen indicators: every client the view has lost waits on the edge of the free map, in its true
  // direction. Nothing is merged: clients that would land on the same stretch of edge are bunched together, each its own
  // icon (its logo, its tap target, its name on hover), in rows along the edge, with one chevron pointing the way and the
  // distance to the nearest. Tap an icon to go to that client.
  const edgePool = [];
  let freeR = null, freeAt = -1e9;
  const COMPASS = ['north','northeast','east','southeast','south','southwest','west','northwest'];
  const kmTxt = m => { const k=m/1000; return k<10 ? k.toFixed(1)+' km' : Math.round(k).toLocaleString('en-CA')+' km'; };
  const iconOf = p => { const logo=LOGOS[p.id]; return logo ? `<img class="lg" src="${logo}" alt="" decoding="async">` : svg(p.icon||p.ind,'glyph'); };
  const headingOf = it => COMPASS[Math.round(((it.north/(Math.PI/4))%8+8)%8)%8];
  function makeBunch(){
    const el=document.createElement('div'); el.className='offpin hide';
    el.innerHTML='<span class="dir" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></span><div class="bunch"></div><span class="km" aria-hidden="true"></span>';
    for(const k of ['dir','bunch','km']) el['$'+k]=el.querySelector('.'+k);   // ($: el.dir is the element's own text-direction attribute)
    labels.appendChild(el); return el;
  }
  function bunchPin(p){
    const b=document.createElement('div'); const logo=LOGOS[p.id];
    b.className='pin mini'+(logo ? ' has-logo' : '')+(p.feat ? ' feat' : ''); if(logo) b.dataset.logo=p.id; b.style.setProperty('--ind', INDUSTRIES[p.ind]?.color);
    b.tabIndex=0; b.setAttribute('role','button');
    b.innerHTML=`<span class="ic" aria-hidden="true">${iconOf(p)}</span><span class="nm" aria-hidden="true"></span>`;
    b.querySelector('.nm').textContent=`${p.name} · ${p.addr}`;
    const go=e=>{ e.stopPropagation(); touched(); pinClick(p.id); };
    b.onclick=go; b.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(e); } };
    return b;
  }
  function edgeMarkers(ts){
    if(!freeR || ts-freeAt>250){ freeR=freeRect(true); freeAt=ts; }
    const inset=24, x0=freeR.left+inset, x1=freeR.right-inset, y0=freeR.top+inset, y1=freeR.bot-inset;
    const cx=(x0+x1)/2, cy=(y0+y1)/2, hw=Math.max(1,(x1-x0)/2), hh=Math.max(1,(y1-y0)/2);
    const items=[];
    if(popped){
      const r=rgt(view3.bearing), f=fwd(view3.bearing);
      LOCAL.filter(p=>p.pos && matches(p)).forEach(p=>{
        const sp=project(p.pos);
        if(sp.ok && sp.x>=0 && sp.x<=W && sp.y>=0 && sp.y<=H) return;   // on screen: the pin itself is there
        // in front of the camera: the direction on screen; round the back of the planet: the direction on the ground
        let dx, dy; const gx=p.pos.x-view3.cx, gz=p.pos.z-view3.cz;
        if(sp.ok){ dx=sp.x-cx; dy=sp.y-cy; } else { dx=gx*r.x+gz*r.z; dy=-(gx*f.x+gz*f.z); }
        const L=Math.hypot(dx,dy)||1;
        items.push({p, dx:dx/L, dy:dy/L, ang:Math.atan2(dy,dx), d:Math.hypot(gx,gz), north:Math.atan2(gx,-gz)});
      });
    }
    const place = (dx,dy) => { const t=Math.min(hw/Math.max(1e-6,Math.abs(dx)), hh/Math.max(1e-6,Math.abs(dy))); return {x:cx+dx*t, y:cy+dy*t}; };
    items.sort((a,b)=>a.ang-b.ang); items.forEach(it=>Object.assign(it, place(it.dx,it.dy)));
    // neighbours on the edge (each within 52px of the last) share one bunch
    const groups=[], NEARPX=52;
    for(const it of items){ const g=groups[groups.length-1]; if(g && Math.hypot(g[g.length-1].x-it.x, g[g.length-1].y-it.y)<NEARPX) g.push(it); else groups.push([it]); }
    if(groups.length>1){ const a=groups[0], b=groups[groups.length-1]; if(Math.hypot(a[0].x-b[b.length-1].x, a[0].y-b[b.length-1].y)<NEARPX){ a.unshift(...b); groups.pop(); } }
    // a row, not a clump: the pitch clears the widest icon (52px for a highlighted client) plus a gap,
    // so the away clients read as a line along the edge; only past the edge's length do they wrap inward
    const ALONG=60, DEPTH=64;
    groups.forEach((g,i)=>{
      const el = edgePool[i] || (edgePool[i]=makeBunch());
      let sx=0, sy=0; for(const it of g){ sx+=it.dx; sy+=it.dy; }
      const L=Math.hypot(sx,sy)||1, dx=sx/L, dy=sy/L, at=place(dx,dy);
      // which edge the bunch sits on: along it (tan) the icons line up, away from it (inward) further rows stack
      const horiz = hh/Math.max(1e-6,Math.abs(dy)) <= hw/Math.max(1e-6,Math.abs(dx));
      const tan = horiz ? [1,0] : [0,1], inward = horiz ? [0, dy>0 ? -1 : 1] : [dx>0 ? -1 : 1, 0];
      const lo = horiz ? x0 : y0, hi = horiz ? x1 : y1, per = Math.max(1, Math.min(16, Math.floor((hi-lo)/ALONG)+1));
      g.sort((a,b)=> horiz ? a.x-b.x : a.y-b.y);   // the icons keep their order along the edge
      const n=g.length, rows=Math.ceil(n/per), half=(Math.min(n,per)-1)*ALONG/2;
      let c0 = horiz ? at.x : at.y; c0 = hi-lo < 2*half ? (lo+hi)/2 : Math.max(lo+half, Math.min(hi-half, c0));
      const bx = horiz ? c0 : at.x, by = horiz ? at.y : c0;
      const key=g.map(it=>it.p.id).join(',');
      if(el._key!==key){ el._key=key; el.$bunch.replaceChildren(...g.map(it=>{ const b=bunchPin(it.p); b._id=it.p.id; return b; })); el._pins=[...el.$bunch.children]; el._sig=''; }
      // layout: rows of up to `per`, each row centred on the bunch's middle
      const sig=`${tan}|${inward}|${per}`;
      if(el._sig!==sig){ el._sig=sig;
        el._pins.forEach((b,k)=>{ const row=Math.floor(k/per), inRow = row<rows-1 ? per : n-(rows-1)*per, off=(k%per-(inRow-1)/2)*ALONG, dep=row*DEPTH;
          b.style.transform=`translate3d(${tan[0]*off+inward[0]*dep}px, ${tan[1]*off+inward[1]*dep}px,0)`; }); }
      g.forEach((it,k)=>{ const b=el._pins[k], km=kmTxt(it.d); if(b._km!==km){ b._km=km; b.setAttribute('aria-label', `${it.p.name}, ${it.p.addr}, off screen, ${km} ${headingOf(it)}`); } });
      const near=g.reduce((a,b)=>a.d<=b.d?a:b), km=kmTxt(near.d); if(el._km!==km){ el._km=km; el.$km.textContent=km; }
      const a=Math.atan2(dy,dx), kd=(rows-1)*DEPTH + (horiz ? 30 : 48);
      if(el._a===undefined || Math.abs(el._a-a)>.005 || el._kd!==kd){ el._a=a; el._kd=kd;
        el.$dir.style.transform=`rotate(${a.toFixed(3)}rad) translateX(26px)`;
        el.$km.style.transform=`translate(-50%,-50%) translate(${inward[0]*kd}px, ${inward[1]*kd}px)`; }
      const flip = dx>0; if(el._flip!==flip){ el._flip=flip; el.classList.toggle('flip', flip); }
      el.style.transform=`translate3d(${bx.toFixed(1)}px, ${by.toFixed(1)}px,0)`;
      if(el._vis!==true){ el._vis=true; el.classList.remove('hide'); }
    });
    for(let i=groups.length;i<edgePool.length;i++){ const el=edgePool[i]; if(el._vis!==false){ el._vis=false; el.classList.add('hide'); } }
  }

  // ---------- frame ----------
  const chipBar=$('chipbar');
  const ctrls=document.querySelector('.ctrls');
  const v=new THREE.Vector3(), vA=new THREE.Vector3(), vG=new THREE.Vector3(), mPos=new THREE.Vector3(), mTgt=new THREE.Vector3();
  let bentN=-1;   // scene children already given the globe bend (frame loop: new objects are patched before their first draw)
  const needle=$('needle'), placeEl=$('placename'); let placeT=-1e9;   // the readout: what country (or sea) the view is over
  const smooth = (e0,e1,x) => { const t=Math.min(1,Math.max(0,(x-e0)/(e1-e0))); return t*t*(3-2*t); };
  // screen position of a flat world point, where the globe puts it; ok is false past the camera or round the back of the planet
  function project(world){ bendPoint(v, world, camera.position).project(camera); return {x:(v.x+1)/2*W, y:(1-v.y)/2*H, ok:v.z<1 && facing(world, camera.position)>=0}; }

  // ---------- phones: pin clustering ----------
  // The spread solver in the frame loop only guarantees that two pins do not
  // OVERLAP. On a 375px screen that is not enough: 55 icons at 44px (the
  // smallest target a finger hits reliably) cannot all be on screen at once
  // however they are spread, and the result is a blob that fills the viewport
  // and answers a tap with whichever pin happens to be on top.
  //
  // So below 760px the pins that fall within one bubble of each other collapse
  // into a count, and a tap frames that group (fitTo). Every target stays 44px
  // at every zoom, and the map reads as a map instead of a pile of logos.
  //
  // Scope, deliberately narrow:
  //  - phones only. The desktop spread is hand-tuned and stays exactly as it was.
  //  - plan view only. In street mode (alt < 60) the pins are already apart.
  //  - unfiltered only. A filter draws each pin as a logo-plus-name box with its
  //    own solver (`big`); clustering those would fight it for no gain, since a
  //    filter leaves few enough pins to show whole.
  //  - never the selected pin: it owns the open callout.
  const CLUSTER_R = 46;   // px between bubble centres: the 44px target plus air
  const clusterPool = [];
  function clusterBubble(i){
    if(clusterPool[i]) return clusterPool[i];
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'pin-cluster hide';
    el.innerHTML = '<span class="pc-n" aria-hidden="true"></span>';
    // stopPropagation: the stage's own click handler reads a plain click as
    // "close the open sidebar and go back", which would undo the zoom.
    el.addEventListener('click', e => {
      e.stopPropagation();
      const m = el._members;
      if(!m || m.length < 2) return;
      touched(); mapDirty = true; fitTo(m);
    });
    labels.appendChild(el);
    clusterPool[i] = el;
    return el;
  }
  const hideClusters = () => { for(const el of clusterPool){ if(el._hid!==true){ el.classList.add('hide'); el._hid=true; el._members=null; } } };
  /**
   * Greedy screen-space grouping, in the order the frame loop already sorted.
   *
   * Greedy rather than k-means or a quadtree because the input is at most ~55
   * points and this runs inside the frame loop: one pass over an already sorted
   * list is cheaper than any structure that would have to be rebuilt every frame
   * as the camera moves, and the fixed order keeps the same pins grouping the
   * same way, so bubbles do not flicker while panning.
   *
   * Returns the set of pins a bubble has swallowed; the caller hides those.
   */
  function clusterPins(order){
    const swallowed = new Set(), taken = new Set();
    const live = order.filter(o => o.sp.ok && o.p.id !== selected
      && o.sp.x > -40 && o.sp.x < W + 40 && o.sp.y > -40 && o.sp.y < H + 40);
    let n = 0;
    for(const a of live){
      if(taken.has(a.p)) continue;
      const group = [a];
      for(const b of live){
        if(b === a || taken.has(b.p)) continue;
        if(Math.hypot(b.sp.x - a.sp.x, b.sp.y - a.sp.y) < CLUSTER_R) group.push(b);
      }
      if(group.length < 2) continue;              // a pin on its own stays a pin
      for(const g of group){ taken.add(g.p); swallowed.add(g.p); }
      // the bubble sits on the group's centroid, not on its first member
      const cx = group.reduce((t,g)=>t+g.sp.x,0)/group.length;
      const cy = group.reduce((t,g)=>t+g.sp.y,0)/group.length;
      const el = clusterBubble(n++);
      el._members = group.map(g=>g.p);
      const label = `${group.length} clients here. Zoom in to see them.`;
      if(el._label !== label){ el.setAttribute('aria-label', label); el._label = label; }
      const txt = String(group.length);
      if(el._n !== txt){ el.firstChild.textContent = txt; el._n = txt; }
      setStyle(el, 'transform', `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`);
      if(el._hid !== false){ el.classList.remove('hide'); el._hid = false; }
    }
    // retire the bubbles this frame did not need, without destroying them
    for(let i=n; i<clusterPool.length; i++){
      const el = clusterPool[i];
      if(el._hid !== true){ el.classList.add('hide'); el._hid = true; el._members = null; }
    }
    return swallowed;
  }
  const setStyle = (el, key, val) => { if(el['_'+key]!==val){ el.style[key]=val; el['_'+key]=val; } };   // skip no-op writes
  let wasReady=false;

  let raf = 0, dead = false, staticFitted = false, popped = false;
  const perf={t:0, n:0, slow:0};
  // render on demand: full rate while anything moves; once settled only the pin pulses run, at a low rate
  // (none at all on weak devices or with reduced motion). Any input or scroll wakes it straight back up.
  let settled=0, lastDraw=0, wakeUntil=0;   // wakeUntil: input keeps full rate a moment longer, so CSS transitions (the sheet) are tracked smoothly
  const IDLE_GAP = reduce || weak ? Infinity : lite ? 1000/15 : 1000/30;
  function poke(){ wakeUntil = performance.now() + 700; }
  for(const ev of ['scroll','wheel','pointerdown','pointermove','touchmove','keydown','resize']) addEventListener(ev, poke, {passive:true, signal});
  const snap = () => view3.cx+view3.cz+view3.dist+view3.pitch+view3.bearing;
  function frame(ts){
    if(dead) return;
    if(ts>wakeUntil && settled>20 && ts-lastDraw < IDLE_GAP){ raf = requestAnimationFrame(frame); return; }
    lastDraw=ts;
    const before = snap();
    const dt=Math.min(.05,(ts-lastTs)/1000||0); lastTs=ts;
    // exponential easing: frame-rate independent, so uneven phone scroll events land as one smooth glide
    const ease = r => reduce ? 1 : 1-Math.exp(-dt*r);
    const kg = ease(7.5);   // the map camera's ease: quick enough that the pins are there as soon as a move stops
    // ease the map camera toward its goal (shortest way round for bearing)
    const db=((goal.bearing-view3.bearing+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
    view3.cx+=(goal.cx-view3.cx)*kg; view3.cz+=(goal.cz-view3.cz)*kg; view3.dist+=(goal.dist-view3.dist)*kg; view3.pitch+=(goal.pitch-view3.pitch)*kg; view3.bearing+=db*kg;

    // the camera is the map camera: where it is eased to, looked at through the globe's curve
    poseFrom(view3, mPos, mTgt);
    const pos = mPos, tgt = mTgt;
    // the globe: flat on the street, curled into a planet from the crane up; the camera looks at the target where the curve puts it
    const gk = setGlobe(pos.y);
    worldUniforms.uWorldK.value = smooth(12000, 40000, pos.y);   // up close the region bake owns the ground; from the opening view up, the world's water and tints show
    if(world.borders){ const a=pos.y, op=(l,o)=>{ if(Math.abs(l.material.opacity-o)>.005){ l.material.opacity=o; l.material.visible=o>.01; } };
      op(world.borders, .55*smooth(15000, 60000, a));                                // coasts and borders: from the region up
      op(world.states, .3*smooth(30000, 120000, a)*(1-smooth(5e6, 1.1e7, a)));       // provinces and states: gone on the whole globe
      op(world.rivers, .7*smooth(20000, 80000, a)*(1-smooth(2e6, 6e6, a)));
      op(world.grid1, .16*smooth(40000, 120000, a)*(1-smooth(6e5, 1.5e6, a)));      // a degree grid on the regional views
      op(world.grid10, .2*smooth(5e5, 1.5e6, a)); }                                   // every ten degrees on the continents and the globe         // rivers: the continent views
    camera.position.copy(pos); camera.up.set(0,1,0); camera.lookAt(bendPoint(vG, tgt, pos));
    ground.position.set(pos.x, 0, pos.z);   // the land rides under the camera, so its limb is always a full circle
    sky.position.copy(pos); sky.visible = mapView.style !== 'poster' && (gk > 0 || !(PALETTES[mapView.style].lotLines && pos.y > 1500));   // print, flat: from above, the land runs to the page edge; as a globe the sky shows past the limb
    { const dark = !!PALETTES[mapView.style].skyDark && city.ready && (!PALETTES[mapView.style].lotLines || pos.y < 1500);   /* city.ready: the canvas (and its blue sky) only fades in once the city is there */ if(stick._skyDark!==dark){ stick._skyDark=dark; stick.classList.toggle('sky-dark', dark); } }   // light text only over the blue sky
    { const look = tgt.clone().sub(pos).setY(0).normalize();
      // on the globe the backdrop stands on the limb itself (scaled down with it), so downtown rises just past the curve
      let D = skyline.userData.D, y = 0;
      if(gk > 0){ const R = globeU.uRe.value, th = limbAt(pos.y) / R; D = R*Math.sin(th); y = -R*(1-Math.cos(th)); }
      skyline.position.set(pos.x + look.x*D, y, pos.z + look.z*D); skyline.lookAt(pos.x, y, pos.z); skyline.scale.setScalar(D / skyline.userData.D);
      skyline.visible = mapView.style === 'print' && pos.y < 1200; }
    const alt = pos.y;
    // depth range: a half-metre near plane against a 200 km far plane leaves so little precision past a block that walls
    // stop hiding the pen lines behind them (the city reads see-through). Both planes follow the altitude instead, kept
    // wide enough for the sky sphere (R 60000) and the planet's limb.
    { const nn=Math.max(3, Math.min(400, alt*.2)), ff=Math.max(70000, Math.min(Math.max(200000, alt*4), alt*60));   // the world view: the far limb is ~1.4x the altitude away
      if(Math.abs(camera.near-nn) > nn*.02 || Math.abs(camera.far-ff) > ff*.02){ camera.near=nn; camera.far=ff; camera.updateProjectionMatrix(); } }
    { const fk = PALETTES[mapView.style].fogK ?? 1; scene.fog.near = Math.max(260, alt*1.1)*fk; scene.fog.far = Math.max(2800, alt*3.6)*fk; }   // at street height the haze starts a few blocks out, so the near city keeps its full shading

    { const named = alt < 2600 || filter!=='all'; /* zoomed in, or a chip filter is on */ if(stick._named!==named){ stick.classList.toggle('named', named); stick._named=named; } }
    const darkMap = alt > 90 && mapView.style !== 'print'; /* print is light land: the nav keeps its dark ink */ if(darkMap!==stick._dark){ stick.classList.toggle('dark-map', darkMap); stick._dark=darkMap; }
    // building ink thins with altitude so the 3D corridor never reads as a dark stripe from far away
    // top view: the 3D buildings flatten into their footprints as the camera rises (walls fold down, roofs + bases stay outlined)
    { const po=.7*(1-smooth(900, 2200, alt)); for(const l of city.pen){ if(Math.abs(l.material.opacity-po)>.01) l.material.opacity=po; l.material.visible = po>.01; } }   // fully faded: not drawn at all   // map view: shapes only, no pen outlines
    if(city.bmesh){ const fy=Math.max(.002, 1-smooth(900, 2200, alt)); if(Math.abs(city.bmesh.scale.y-fy)>.001){ city.bmesh.scale.y=fy; city.ink.scale.y=fy; city.shadow.visible = fy>.4; } }
    if(city.ink){ const io = (.8 - .68*smooth(1500, 7000, alt)) * (PALETTES[mapView.style].inkK ?? 1) * (PALETTES[mapView.style].lotLines ? 1-smooth(900, 2200, alt) : 1); if(Math.abs(city.ink.material.opacity-io)>.01) city.ink.material.opacity = io; city.ink.material.visible = io>.01; }
    const ready = mapReady();
    // the map is in from the first frame; the pins pop in once they have somewhere to be
    if(!popped && city.ready){ popped=true; popPins(); }   // the markers arrive once there is a city under them
    chipBar.classList.toggle('dock', mapUI.classList.contains('dock')); chipBar.classList.toggle('pc', mapUI.classList.contains('pc'));
    // static: the opening view is fitted at mount, before the city, the region and the pins are
    // there, so the camera settles on a half-measured frame. Fit it once more the moment the map is
    // really ready — the same fit the recenter button does.
    if(STATIC && ready && !staticFitted){ staticFitted=true; if(!mapDirty) setGoal(revealView(reveal)); }
    if(ready!==wasReady){ stick.classList.toggle('mapready', ready); wasReady=ready;
      if(!ready){ closeDrawer(); setLayers(false); }
      else if(view.type!=='place'){ setCollapsed(true); setSheet('peek'); }
    }

    const s = Math.max(1, alt/55);
    LOCAL.forEach(p=>{
      const sel = selected===p.id, on = matches(p), pulse = (ts*0.001 + p.pos.z*0.001)%1;
      p.ring.scale.setScalar(s*(sel ? 1.6+pulse*3.2 : 0.8+pulse*1.4));
      p.ring.material.opacity = sel ? (on ? .9 : .1) * (1-pulse) : 0;   // only the client in focus pulses
    });

    // callouts: marker on the point, card on a leader line. Positions every frame, DOM writes only on change.
    // In map view each card's leader grows (12px steps) until the card clears the cards already placed.
    const placedCards=[], streetMode = alt<60;   // placedCards: every card, pin head and address dot on screen, for the declutter
    const order = LOCAL.filter(p=>p.pos).map(p=>{ vA.copy(p.pos); vA.y += streetMode ? 14 : 0; return {p, sp:project(vA), dist:camera.position.distanceTo(p.pos)}; })
      .sort((a,b)=> (selected===b.p.id) - (selected===a.p.id) || b.sp.y - a.sp.y);
    // zoomed out, neighbouring icons would sit on top of each other: spread them so every icon is the same size and none
    // overlap. Each pin keeps its offset from the last frame (warm start) and is eased back toward its address, so a
    // cluster settles once and stays still instead of being re-solved from scratch every frame (which jittered).
    // Zoomed in, the overlaps go away and every icon eases back onto its own address.
    const big = filter!=='all';   // filtered: logo 56px with its name underneath, so each pin is a box, not a circle
    // GAP is the clear distance the solver keeps between two icon pins. On a phone
    // the icon is 44px (Fitts), so 38 left the circles touching and a tap landed on
    // whichever happened to be on top; 52 gives every target its own air. Desktop
    // keeps 38 -- the pins are smaller there and 52 would scatter the street.
    // phones, plan view, no filter: bubbles instead of a spread (see clusterPins above)
    const CLUSTERING = W<760 && !streetMode && !big;
    const swallowed = CLUSTERING ? clusterPins(order) : (hideClusters(), null);
    if(!streetMode && !CLUSTERING){ const GAP = W<760 ? 52 : 38, live=order.filter(o=>o.sp.ok && (!big || matches(o.p)));
      if(big) live.forEach(o=>{ if(!o.p.nw){ const n=o.p.el.querySelector('.nm'); o.p.nw=n?.offsetWidth||0; } o.hw=Math.max(64, o.p.nw+12)/2; });
      live.forEach(o=>{ o.ox=(o.p._ox||0)*.9; o.oy=(o.p._oy||0)*.9; });   // the .9 is the gentle pull home
      for(let it=0; it<(big?150:40); it++){ let moved=false;
        for(let i=0;i<live.length;i++) for(let j=i+1;j<live.length;j++){ const a=live[i], b=live[j];
          let dx=(b.sp.x+b.ox)-(a.sp.x+a.ox), dy=(b.sp.y+b.oy)-(a.sp.y+a.oy), d=Math.hypot(dx,dy);
          if(big){ const px=a.hw+b.hw+8-Math.abs(dx), py=96-Math.abs(dy);   // box: icon (56) + gap + name (~26), plus breathing room
            if(px<=0 || py<=0) continue; moved=true;
            const fa = selected===a.p.id ? 0 : selected===b.p.id ? 1 : .5;
            if(px<py){ const m=(dx>=0?1:-1)*px; a.ox-=m*fa; b.ox+=m*(1-fa); } else { const m=(dy>=0?1:-1)*py; a.oy-=m*fa; b.oy+=m*(1-fa); }
            continue; }
          if(d>=GAP) continue; moved=true;
          if(d<.5){ const t=((a.p._k??=LOCAL.indexOf(a.p))*2.399+(b.p._k??=LOCAL.indexOf(b.p))*1.17)%(2*Math.PI); dx=Math.cos(t); dy=Math.sin(t); d=1; }   // same spot: a fixed direction per pair
          const fa = selected===a.p.id ? 0 : selected===b.p.id ? 1 : .5, push=(GAP-d)/d;   // the pin in focus stays on its address
          a.ox-=dx*push*fa; a.oy-=dy*push*fa; b.ox+=dx*push*(1-fa); b.oy+=dy*push*(1-fa); }
        if(big) live.forEach(o=>{ const x=o.sp.x+o.ox, y=o.sp.y+o.oy, m=10;   // keep every enlarged pin and its name on screen (Fitts: no half-hidden targets), inside the spread so it can't re-create overlaps
          const cx=Math.max(0, o.hw+m-x) - Math.max(0, x-(W-o.hw-m)), cy=Math.max(0, 28+m-y) - Math.max(0, y-(H-70-m));
          if(cx||cy){ o.ox+=cx; o.oy+=cy; moved=true; } });
        if(!moved) break; }
      live.forEach(o=>{ if(Math.abs(o.ox)<.3) o.ox=0; if(Math.abs(o.oy)<.3) o.oy=0; o.p._ox=o.ox; o.p._oy=o.oy; }); }
    else LOCAL.forEach(p=>{ p._ox=p._oy=0; });   // street view, and clustered: every pin sits on its own address
    order.forEach(({p, sp, dist, ox=0, oy=0})=>{
      // walking the clients: only the one in focus is on screen; on the route, none (the dot is the focus)
      // the project in focus gets the full callout; every other pin is a small service icon (none while driving the directions)
      const full = selected===p.id;
      if(p._full!==full){ p.el.classList.toggle('mini', !full); p._full=full; }
      // every client stays on the map at every camera view (front page, tour, route, filters: a filter only fades the others, .dim)
      // front page (the hero window): only the clients near the camera, along the stretch being travelled; they fade in and out
      // between 1.2 and 1.6 km rather than popping. The map views show every client.
      const visible = sp.ok && sp.x>-260 && sp.x<W+260 && sp.y>-160 && sp.y<H+200
        && !(swallowed && swallowed.has(p));   // inside a bubble: the count stands for it
      if(p._vis!==visible){ p.el.classList.toggle('hide', !visible); p._vis=visible; }
      const passing = streetMode && Math.abs(camera.position.z-p.pos.z)<180; if(p._near!==passing){ p.el.classList.toggle('near', passing); p._near=passing; }
      if(!visible) return;
      const sc = streetMode ? Math.min(1.5, Math.max(.6, 260/dist)) : 1;
      if(!p.cw){ p.cw=p.co.offsetWidth; p.ch=p.co.offsetHeight; }
      let L = 44, side = p._side || p.side;
      if(!streetMode && full){
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
      // icon pins: the round icon on the address itself, kept clear of the open callout
      if(!full){
        if(!streetMode) placedCards.push(big && matches(p) ? {x0:sp.x+ox-(p.nw||56)/2-6, x1:sp.x+ox+(p.nw||56)/2+6, y0:sp.y+oy-32, y1:sp.y+oy+60} : {x0:sp.x-22, x1:sp.x+22, y0:sp.y-22, y1:sp.y+22});   // the icon circle sits on the address (no stem)
      }
      if(p._side!==side){ p.el.classList.remove('l','r'); p.el.classList.add(side); p._side=side; }
      // phones: the selected card is wide, so it centres over its pin and stays 10px inside the screen edges
      if(W<760 && full && p.cw){ const x0=Math.max(10, Math.min(W-10-p.cw, sp.x-p.cw/2)), dx=Math.round(x0-sp.x); if(p._dx!==dx){ p.co.style.setProperty('--dx', dx+'px'); p._dx=dx; } }
      if(p._L!==L){ p.el.style.setProperty('--L', L+'px'); p._L=L; }
      p.el.style.transform = `translate3d(${(sp.x+ox).toFixed(1)}px, ${(sp.y+oy).toFixed(1)}px,0) scale(${sc.toFixed(3)})`;
      setStyle(p.el,'zIndex', String(selected===p.id ? 200000 : Math.round(100000 - dist)));
    });

    edgeMarkers(ts);

    // road labels: stable priority order, hysteresis so labels do not blink at the collision edge
    const taken=[];
    roadLabels.forEach(r=>{
      const w = r.pos;
      let show = (!r.min || alt>r.min) && alt < (r.max ?? (r.cls.startsWith('area') ? Infinity : 60000)), sp=null;   // street and neighbourhood names stop at the region
      if(show){ sp=project(w); show = sp.ok && sp.x>20 && sp.x<W-20 && sp.y>20 && sp.y<H-20;
      }
      if(show){ const pad = r._on ? 12 : 20; show = !taken.some(o=>Math.abs(o.y-sp.y)<pad && Math.abs(o.x-sp.x)<130); }
      if(show) taken.push(sp);
      if(r._on!==show){ r.el.style.display = show?'':'none'; r._on=show; }
      if(!show) return;
      setStyle(r.el,'opacity', smooth(120,700,alt).toFixed(2));
      r.el.style.transform=`translate3d(${sp.x.toFixed(1)}px,${sp.y.toFixed(1)}px,0) translate(-50%,-50%)`;
    });

    const phone = W<760, st = phone ? sheetTop() : H;
    setStyle(ctrls,'transform', phone ? `translateY(${Math.round(Math.max(96, st - ctrls.offsetHeight - 14))}px)` : '');   // phones: resting at the bottom, pushed up by the project sheet (the floor clears the chip row, nothing more: at 190 the column still ran under a half-open sheet)

    const yaw = Math.atan2(tgt.x-pos.x, -(tgt.z-pos.z));
    needle.style.transform=`rotate(${(-yaw).toFixed(3)}rad)`;
    if(world.data && ts-placeT>200){ placeT=ts;
      const g = Math.hypot(tgt.x, tgt.z) < NEAR_M ? {lat:O.lat - tgt.z/111000, lon:O.lon + tgt.x/80300} : xzGeo(O, tgt.x, tgt.z), pl = placeAt(world.data, g.lat, g.lon);
      const txt = pl ? pl.name : 'Open water'; if(placeEl._t!==txt){ placeEl.textContent=txt; placeEl._t=txt; } }

    renderer.setScissorTest(false);
    if(scene.children.length!==bentN){ bentN=scene.children.length; bendObject(scene); }   // anything new (city layers, the route) joins the globe before it is first drawn
    renderer.render(scene,camera);
    // adaptive quality: if frames keep running long (a slow GPU), step the resolution down once or twice
    perf.t += dt; perf.n++; if(dt > 1/40) perf.slow++;
    if(perf.t > 2){ if(!pinDpr && perf.slow/perf.n > .35 && dprCap > 1){ dprCap = Math.max(1, dprCap - .25); renderer.setPixelRatio(dprCap); resize(); } perf.t=perf.n=perf.slow=0; }
    // settled: nothing eased this frame and nothing is being dragged
    settled = !drag && Math.abs(snap()-before) < 1e-3 ? settled+1 : 0;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    openPlace: (id) => showPlace(id),
    /** 0 = the globe turned away from the clients, 1 = the opening view. The framed page drives it with its scroll. */
    reveal(p){ if(!Number.isFinite(p)) return; reveal = Math.min(1, Math.max(0, p)); if(!mapDirty) setGoal(revealView(reveal)); },
    destroy(){
      dead = true; cancelAnimationFrame(raf); clearInterval(phTimer); ac.abort(); disposeLand();
      for(const m of city.meshes){ m.geometry.dispose(); m.material.dispose(); }
      renderer.dispose(); renderer.domElement.remove();
       for(const id of ['labels','chips','sheetBody']){ const el=document.getElementById(id); if(el) el.innerHTML=''; }   // some may already be gone when React unmounts first
    },
  };

}
