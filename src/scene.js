import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { LEVELS, height, connections } from "./game.js";

const C = {
  brass: 0xd5aa65,
  ivory: 0xe5d7b5,
  blue: 0x243d50,
  wood: 0x67523d,
  light: 0xffd489,
};
const UP = new THREE.Vector3(0, 1, 0),
  PERSON = new THREE.Vector3(-0.62, 0.025, 0.65);
const smooth = (x) => x * x * (3 - 2 * x);
export async function createScene(
  host,
  {
    onPick = () => {},
    onError = () => {},
    labelNode = (n) => n.id,
    reducedMotion = false,
    quality = "high",
  } = {},
) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101d2b);
  scene.fog = new THREE.FogExp2(0x101d2b, 0.024);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(
    Math.min(devicePixelRatio, quality === "low" ? 1 : 1.5),
  );
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = quality !== "low";
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.append(renderer.domElement);
  const labels = document.createElement("div");
  labels.className = "world-labels";
  host.append(labels);
  Object.assign(labels.style, {
    position: "absolute",
    inset: "0",
    pointerEvents: "none",
    overflow: "hidden",
  });
  const camera = new THREE.OrthographicCamera(-12, 12, 8, -8, 0.1, 150);
  scene.add(new THREE.HemisphereLight(0xb5d2e7, 0x1c2c35, 1.8));
  const moon = new THREE.DirectionalLight(0xb8d5e9, 2.1);
  moon.position.set(-8, 14, 8);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  Object.assign(moon.shadow.camera, {
    left: -20,
    right: 20,
    top: 14,
    bottom: -14,
  });
  moon.shadow.bias = -0.0006;
  scene.add(moon);
  const warm = new THREE.DirectionalLight(0xffcf92, 1.15);
  warm.position.set(4, 5, 8);
  scene.add(warm);
  let gltf;
  try {
    gltf = await new GLTFLoader().loadAsync(
      `${import.meta.env.BASE_URL}models/town.glb`,
    );
  } catch (e) {
    renderer.dispose();
    renderer.domElement.remove();
    labels.remove();
    throw e;
  }
  const sourceGeometries = new Set(),
    sourceMaterials = new Set(),
    ownedGeometries = new Set(),
    ownedMaterials = new Set();
  gltf.scene.traverse((o) => {
    if (o.geometry) sourceGeometries.add(o.geometry);
    if (o.material) sourceMaterials.add(o.material);
  });
  const ownGeo = (g) => (ownedGeometries.add(g), g);
  const material = (color, extra = {}) => {
    const m = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.86,
      ...extra,
    });
    ownedMaterials.add(m);
    return m;
  };
  const brass = material(C.brass, { metalness: 0.55, roughness: 0.45 }),
    wood = material(C.wood),
    navy = material(C.blue),
    white = material(C.ivory);
  const glow = material(C.light, { emissive: C.light, emissiveIntensity: 1.5 }),
    dark = material(0x142735);
  const haloCanvas = document.createElement("canvas");
  haloCanvas.width = haloCanvas.height = 64;
  const haloContext = haloCanvas.getContext("2d");
  const gradient = haloContext.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,211,126,0.9)");
  gradient.addColorStop(0.22, "rgba(255,174,64,0.42)");
  gradient.addColorStop(1, "rgba(255,155,50,0)");
  haloContext.fillStyle = gradient;
  haloContext.fillRect(0, 0, 64, 64);
  const haloTexture = new THREE.CanvasTexture(haloCanvas);
  const haloMaterial = new THREE.SpriteMaterial({
    map: haloTexture,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  ownedMaterials.add(haloMaterial);
  const patchMaterial = new THREE.MeshBasicMaterial({
    map: haloTexture,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  ownedMaterials.add(patchMaterial);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: C.brass,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  });
  ownedMaterials.add(ringMaterial);
  const sphereGeo = ownGeo(new THREE.SphereGeometry(0.075, 10, 8));
  const roots = {};
  gltf.scene.children.forEach((o) => (roots[o.name] = o));
  function asset(name) {
    const source = roots[name];
    if (!source) throw new Error(`Missing asset ${name}`);
    const g = source.clone(true);
    g.traverse((m) => {
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    g.position.set(0, 0, 0);
    return g;
  }
  function box(w, h, d, mat) {
    const o = new THREE.Mesh(ownGeo(new THREE.BoxGeometry(w, h, d)), mat);
    o.castShadow = true;
    o.receiveShadow = true;
    return o;
  }
  function cylinder(a, b, r, mat = brass) {
    const delta = new THREE.Vector3().subVectors(b, a),
      o = new THREE.Mesh(
        ownGeo(new THREE.CylinderGeometry(r, r, delta.length(), 7)),
        mat,
      );
    o.position.copy(a).add(b).multiplyScalar(0.5);
    o.quaternion.setFromUnitVectors(UP, delta.normalize());
    return o;
  }
  // Background geometry is batched by pigment: a quiet street, not a second foreground.
  const backdrop = new THREE.Group(),
    batches = new Map();
  for (let i = 0; i < 7; i++) {
    const h = asset(["house_a", "house_b", "house_c"][i % 3]);
    h.scale.setScalar(0.54 + (i % 3) * 0.07);
    h.position.set((i - 3) * 2.2, -1.8, -9 - (i % 2) * 1.3);
    h.updateMatrixWorld(true);
    h.traverse((o) => {
      if (o.isMesh) {
        const key = o.material.uuid;
        if (!batches.has(key)) {
          const m = o.material.clone();
          m.color.multiplyScalar(0.3);
          m.emissiveIntensity *= 0.12;
          ownedMaterials.add(m);
          batches.set(key, { material: m, geometries: [] });
        }
        const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
        batches.get(key).geometries.push(g);
      }
    });
  }
  for (const batch of batches.values()) {
    const geometry = mergeGeometries(batch.geometries, false);
    if (geometry) {
      const mesh = new THREE.Mesh(ownGeo(geometry), batch.material);
      backdrop.add(mesh);
    }
    batch.geometries.forEach((g) => g.dispose());
  }
  const beacon = asset("lighthouse");
  beacon.position.set(8, -2.6, -7);
  beacon.scale.setScalar(0.7);
  beacon.traverse((o) => {
    if (o.isMesh) {
      const m = o.material.clone();
      m.color.multiplyScalar(0.48);
      m.emissiveIntensity *= 0.18;
      ownedMaterials.add(m);
      o.material = m;
      o.castShadow = false;
    }
  });
  backdrop.add(beacon);
  const beaconLight = new THREE.Mesh(
    ownGeo(new THREE.SphereGeometry(0.22, 12, 8)),
    glow,
  );
  beaconLight.position.set(8, 0.14, -7);
  beaconLight.visible = false;
  backdrop.add(beaconLight);
  scene.add(backdrop);
  const floor = new THREE.Mesh(
    ownGeo(new THREE.CircleGeometry(38, 64)),
    material(0x152735),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -3.3;
  floor.receiveShadow = true;
  scene.add(floor);
  const stars = [];
  for (let i = 0; i < 75; i++)
    stars.push(
      Math.sin(i * 127.1) * 30,
      5 + (Math.sin(i * 41.2) + 1) * 11,
      -18 - Math.cos(i) * 8,
    );
  const starsGeo = ownGeo(new THREE.BufferGeometry());
  starsGeo.setAttribute("position", new THREE.Float32BufferAttribute(stars, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xd8caa6,
    size: 0.035,
    transparent: true,
    opacity: 0.4,
  });
  ownedMaterials.add(starMat);
  scene.add(new THREE.Points(starsGeo, starMat));

  let group = new THREE.Group();
  scene.add(group);
  let objects = new Map(),
    markers = [],
    ropes = [],
    labelEntries = [],
    state = null,
    level = null;
  let frame = 0,
    paused = false,
    disposed = false,
    last = 0,
    elapsed = 0,
    transition = null,
    hover = null,
    preview = null,
    ghost = null,
    paths = null;
  let noya,
    mixer,
    clips = {},
    cameraCenter = new THREE.Vector3(),
    baseWidth = 18,
    baseDepth = 6,
    compactLayout = false;
  const stageGeometries = new Set(),
    stageMaterials = new Set();
  const ray = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  const compactCoordinates = {
    aL: [-2.5, 3.5],
    aR: [1.5, 3.5],
    balcony: [4.4, 0.2],
    bL: [-2.5, -3.5],
    bR: [1.5, -3.5],
    trace: [-2.5, -6.5],
    recording: [4.4, -3.5],
    homeA: [-2.5, 6.8],
    homeB: [1.5, 6.8],
  };
  const position = (node, s = state) => {
    let x = node.x,
      z = node.z || 0;
    if (compactLayout) {
      const point =
        node.id === "exit"
          ? [4.4, s.chapter === 3 ? 6.8 : -3.5]
          : compactCoordinates[node.id];
      if (point) [x, z] = point;
    }
    return new THREE.Vector3(
      x,
      (node.platform ? height(s, ...node.platform) : node.y || 0) *
        (compactLayout ? 0.65 : 1),
      z,
    );
  };
  const nodeBy = (id) => level.nodes.find((n) => n.id === id);
  function rememberStage() {
    group.traverse((o) => {
      if (
        o.geometry &&
        o.geometry !== sphereGeo &&
        ownedGeometries.has(o.geometry)
      )
        stageGeometries.add(o.geometry);
      if (o.material && o.userData.uniqueMaterial)
        stageMaterials.add(o.material);
    });
  }
  function clearGroup() {
    if (transition) {
      transition.resolve();
      transition = null;
    }
    rememberStage();
    scene.remove(group);
    stageGeometries.forEach((g) => {
      g.dispose();
      ownedGeometries.delete(g);
    });
    stageMaterials.forEach((m) => {
      m.dispose();
      ownedMaterials.delete(m);
    });
    stageGeometries.clear();
    stageMaterials.clear();
    labels.replaceChildren();
    labelEntries = [];
    group = new THREE.Group();
    scene.add(group);
    objects = new Map();
    markers = [];
    ropes = [];
    paths = null;
    ghost = null;
    preview = null;
    mixer?.stopAllAction();
    mixer = null;
  }
  function makeLabel(node) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.node = node.id;
    button.className = "world-node";
    Object.assign(button.style, {
      pointerEvents: "auto",
      position: "absolute",
      maxWidth: "135px",
      whiteSpace: "normal",
      lineHeight: "1.3",
      minHeight: "44px",
      padding: "5px 8px",
      textAlign: "center",
    });
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!paused && !transition) onPick(node.id);
    });
    button.addEventListener("focus", () => {
      hover = node.id;
    });
    button.addEventListener("blur", () => {
      hover = null;
    });
    labels.append(button);
    labelEntries.push({ node, button });
  }
  function addHome(g, node) {
    const house = asset(node.id === "homeB" ? "house_b" : "house_c");
    house.scale.setScalar(0.66);
    house.position.set(0.35, 0, -0.4);
    house.traverse((o) => {
      if (o.isMesh && o.material.emissiveIntensity > 0) {
        const m = o.material.clone();
        m.emissiveIntensity = 0.08;
        ownedMaterials.add(m);
        o.material = m;
        o.userData.uniqueMaterial = true;
        o.userData.window = true;
      }
    });
    g.add(house);
    const resident = new THREE.Group();
    resident.name = "resident";
    resident.position.set(0.58, 0.83, 0.11);
    resident.visible = false;
    const body = box(0.12, 0.18, 0.04, dark);
    resident.add(body);
    const head = new THREE.Mesh(sphereGeo, white);
    head.scale.setScalar(0.55);
    head.position.y = 0.12;
    resident.add(head);
    g.add(resident);
    const prop = asset(node.id === "homeB" ? "toy" : "bench");
    prop.scale.setScalar(node.id === "homeB" ? 1 : 0.55);
    prop.position.set(-0.45, 0.02, -0.25);
    g.add(prop);
  }
  function build(s) {
    clearGroup();
    state = s;
    level = LEVELS[s.chapter];
    compactLayout = host.clientWidth < 650 && s.counts.length > 1;
    host.dataset.mechanisms = String(s.counts.length);
    backdrop.children.forEach((o) => {
      if (o !== beacon && o !== beaconLight) o.visible = !compactLayout;
    });
    let min = Infinity,
      max = -Infinity,
      minZ = Infinity,
      maxZ = -Infinity;
    for (const node of level.nodes) {
      const p = position(node, s);
      min = Math.min(min, p.x);
      max = Math.max(max, p.x);
      minZ = Math.min(minZ, p.z);
      maxZ = Math.max(maxZ, p.z);
      const g = new THREE.Group();
      g.position.copy(p);
      group.add(g);
      objects.set(node.id, g);
      if (node.platform) {
        g.add(asset("platform"));
        const house = asset(
          ["house_a", "house_b", "house_c"][
            (node.platform[0] * 2 + node.platform[1] + s.chapter) % 3
          ],
        );
        house.scale.setScalar(compactLayout ? 0.6 : 0.74);
        house.position.set(0.37, 0, -0.32);
        g.add(house);
        const v = asset("vial");
        v.position.set(-0.82, 0, 0.17);
        v.traverse((o) => {
          if (o.isMesh && o.material.name.includes("milk glass")) {
            const m = o.material.clone();
            m.emissive.set(0xffae4d);
            m.emissiveIntensity = 1;
            ownedMaterials.add(m);
            o.material = m;
            o.userData.uniqueMaterial = true;
            o.userData.vialGlass = true;
          }
        });
        g.add(v);
        const halo = new THREE.Sprite(haloMaterial);
        halo.name = "vial-halo";
        halo.position.set(-0.82, 0.42, 0.2);
        halo.scale.set(0.9, 0.9, 1);
        g.add(halo);
        const dots = new THREE.Group();
        dots.name = "charges";
        dots.position.set(-0.82, 0.38, 0.17);
        g.add(dots);
        // Suspension eyes are at ±1.4 x / -.85 z; ropes stay behind the playable strip.
        const top = p.clone();
        top.y = compactLayout ? 4.2 : 6.1;
        top.z -= 0.85;
        const yoke = box(2.92, 0.1, 0.12, brass);
        yoke.position.copy(top);
        group.add(yoke);
        for (const side of [-1, 1]) {
          const a = top.clone().add(new THREE.Vector3(side * 1.4, 0, 0));
          const b = p.clone().add(new THREE.Vector3(side * 1.4, 0.1, -0.85));
          const rope = cylinder(a, b, 0.017, wood);
          group.add(rope);
          ropes.push({ rope, a, node, side });
        }
      } else {
        const base = box(node.kind === "exit" ? 1.75 : 2.15, 0.22, 1.65, navy);
        base.position.y = -0.11;
        g.add(base);
        const trim = box(
          node.kind === "exit" ? 1.78 : 2.18,
          0.035,
          1.68,
          brass,
        );
        trim.position.y = -0.025;
        g.add(trim);
        if (node.kind === "home") addHome(g, node);
        else if (node.kind === "balcony") {
          const bench = asset("bench");
          bench.scale.setScalar(0.65);
          bench.position.set(0.25, 0, -0.4);
          g.add(bench);
        }
        if (node.lamp) {
          const l = asset("lamp");
          l.position.set(-0.4, 0, -0.2);
          l.traverse((o) => {
            if (o.isMesh && o.material.emissiveIntensity > 0) {
              const m = o.material.clone();
              m.emissiveIntensity = 0;
              ownedMaterials.add(m);
              o.material = m;
              o.userData.uniqueMaterial = true;
              o.userData.window = true;
            }
          });
          g.add(l);
          const lit = new THREE.Mesh(sphereGeo, glow);
          lit.name = "lit-orb";
          lit.position.set(-0.4, 0.42, -0.2);
          lit.scale.setScalar(1.3);
          g.add(lit);
          const patch = new THREE.Mesh(
            ownGeo(new THREE.PlaneGeometry(1.3, 1.3)),
            patchMaterial,
          );
          patch.name = "lamp-patch";
          patch.position.set(-0.4, 0.012, -0.2);
          patch.rotation.x = -Math.PI / 2;
          g.add(patch);
        }
        if (node.kind === "recording") {
          const tower = asset("lighthouse");
          tower.scale.setScalar(0.46);
          tower.position.set(0.23, 0, -0.52);
          g.add(tower);
          const shutters = new THREE.Group();
          shutters.name = "recording-shutters";
          shutters.position.set(0.23, 1.84, -0.3);
          for (const side of [-1, 1]) {
            const hinge = new THREE.Group();
            hinge.position.x = side * 0.19;
            const panel = box(0.18, 0.3, 0.035, navy);
            panel.position.x = -side * 0.09;
            hinge.add(panel);
            hinge.userData.side = side;
            shutters.add(hinge);
          }
          g.add(shutters);
        }
        if (node.kind === "trace") {
          const book = box(0.34, 0.035, 0.25, white);
          book.position.set(0.15, 0.035, 0.02);
          book.rotation.y = 0.2;
          g.add(book);
          const ribbon = box(0.025, 0.04, 0.28, brass);
          ribbon.position.copy(book.position);
          ribbon.rotation.y = 0.2;
          g.add(ribbon);
        }
        if (node.kind === "exit") {
          const post = box(0.04, 0.8, 0.04, brass);
          post.position.set(0.45, 0.4, -0.55);
          g.add(post);
          const flag = box(0.35, 0.18, 0.025, white);
          flag.position.set(0.6, 0.72, -0.55);
          g.add(flag);
        }
      }
      const ringMat = ringMaterial.clone();
      ownedMaterials.add(ringMat);
      const ring = new THREE.Mesh(
        ownGeo(new THREE.RingGeometry(0.23, 0.26, 24)),
        ringMat,
      );
      ring.userData.uniqueMaterial = true;
      ring.name = "selection-ring";
      ring.rotation.x = -Math.PI / 2;
      ring.position.copy(PERSON);
      ring.position.y = 0.012;
      g.add(ring);
      const pick = new THREE.Mesh(
        ownGeo(new THREE.BoxGeometry(node.platform ? 2.9 : 2.15, 1.2, 1.75)),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      ownedMaterials.add(pick.material);
      pick.userData.uniqueMaterial = true;
      pick.position.y = 0.5;
      pick.userData.nodeId = node.id;
      g.add(pick);
      markers.push(pick);
      makeLabel(node);
    }
    for (let m = 0; m < s.counts.length; m++) {
      const a = level.nodes.find(
          (n) => n.platform?.[0] === m && n.platform[1] === 0,
        ),
        b = level.nodes.find(
          (n) => n.platform?.[0] === m && n.platform[1] === 1,
        );
      if (a && b) {
        const pa = position(a, s),
          pb = position(b, s),
          top = compactLayout ? 4.2 : 6.1;
        pa.y = pb.y = top;
        pa.z -= 0.85;
        pb.z -= 0.85;
        group.add(cylinder(pa, pb, 0.045));
        const hub = new THREE.Mesh(
          ownGeo(new THREE.TorusGeometry(0.24, 0.045, 7, 20)),
          brass,
        );
        hub.position.copy(pa).add(pb).multiplyScalar(0.5);
        group.add(hub);
      }
    }
    noya = asset("noya");
    noya.scale.setScalar(0.94);
    group.add(noya);
    noya.position.copy(position(nodeBy(s.node), s)).add(PERSON);
    mixer = new THREE.AnimationMixer(noya);
    clips = {};
    gltf.animations.forEach((c) => (clips[c.name] = mixer.clipAction(c)));
    playClip("idle");
    baseWidth = Math.max(12, max - min + 4.2);
    baseDepth = maxZ - minZ;
    cameraCenter.set(
      (min + max) / 2,
      compactLayout ? 1.1 : 2.15,
      (minZ + maxZ) / 2,
    );
    resize();
    refresh(s);
    rememberStage();
  }
  function playClip(name) {
    if (name === "light") name = "give";
    if (name === "reclaim") name = "take";
    if (name === "listen" || name === "read") name = "discovery";
    Object.values(clips).forEach((c) => c.fadeOut(0.12));
    const clip = clips[name] || clips.idle;
    if (clip) {
      clip
        .reset()
        .setLoop(
          ["walk", "idle"].includes(name) ? THREE.LoopRepeat : THREE.LoopOnce,
          Infinity,
        );
      clip.clampWhenFinished = true;
      clip.fadeIn(0.1).play();
    }
  }
  function labelText(node, s) {
    const data = {
      charges: node.platform
        ? s.counts[node.platform[0]][node.platform[1]]
        : node.lamp
          ? s.lamps[node.lamp]
          : undefined,
      carry: s.carry,
      height: node.platform ? height(s, ...node.platform) : node.y,
      current: s.node === node.id,
    };
    return labelNode(node, s, data);
  }
  function updateLabelsText(s) {
    const open = new Set(
      connections(s)
        .filter((e) => e.open && (e.a === s.node || e.b === s.node))
        .map((e) => (e.a === s.node ? e.b : e.a)),
    );
    for (const { node, button } of labelEntries) {
      button.textContent = labelText(node, s);
      button.setAttribute("aria-label", labelText(node, s));
      button.dataset.current = String(node.id === s.node);
      button.dataset.reachable = String(open.has(node.id));
      button.setAttribute("aria-pressed", String(node.id === s.node));
      button.setAttribute(
        "aria-disabled",
        String(node.id !== s.node && !open.has(node.id)),
      );
      button.style.opacity =
        node.id === s.node || open.has(node.id) ? "1" : ".65";
    }
  }
  function refresh(s) {
    for (const node of level.nodes) {
      const g = objects.get(node.id);
      if (node.platform) {
        const dots = g.getObjectByName("charges");
        dots.clear();
        const n = s.counts[node.platform[0]][node.platform[1]];
        g.getObjectByName("vial-halo").visible = n > 0;
        g.traverse((o) => {
          if (o.userData.vialGlass) {
            o.material.emissiveIntensity =
              n > 0 ? 0.65 + Math.min(n, 3) * 0.18 : 0;
            o.material.color.set(n > 0 ? 0xf2cf8d : 0xacb6ad);
          }
        });
        for (let i = 0; i < n; i++) {
          const d = new THREE.Mesh(sphereGeo, glow);
          d.scale.setScalar(0.8);
          d.position.set(((i % 2) - 0.5) * 0.1, Math.floor(i / 2) * 0.12, 0.11);
          dots.add(d);
        }
      }
      const ring = g.getObjectByName("selection-ring");
      ring.material.color.set(s.node === node.id ? 0xffe2a3 : C.brass);
      ring.material.opacity = s.node === node.id ? 1 : 0.35;
      if (node.lamp) {
        const lit = (s.lamps[node.lamp] || 0) > 0;
        g.getObjectByName("lit-orb").visible = lit;
        g.getObjectByName("lamp-patch").visible = lit;
        const resident = g.getObjectByName("resident");
        if (resident) resident.visible = lit;
        g.traverse((o) => {
          if (o.userData.window)
            o.material.emissiveIntensity = lit ? 1.8 : 0.04;
        });
      }
      const shutters = g.getObjectByName("recording-shutters");
      if (shutters)
        shutters.children.forEach(
          (h) => (h.rotation.y = s.heard ? h.userData.side * 1.35 : 0),
        );
    }
    beaconLight.visible = s.heard && s.ending !== "homes";
    updateLabelsText(s);
    drawPaths(s);
    updatePreview();
  }
  function disposeLayer(layer) {
    if (!layer) return;
    group.remove(layer);
    layer.traverse((o) => {
      if (o.geometry && (o.userData.disposable || o.userData.geometryOnly)) {
        o.geometry.dispose();
        ownedGeometries.delete(o.geometry);
      }
      if (o.material && o.userData.disposable) {
        o.material.dispose();
        ownedMaterials.delete(o.material);
      }
    });
  }
  function drawPaths(s) {
    disposeLayer(paths);
    paths = new THREE.Group();
    group.add(paths);
    for (const e of connections(s)) {
      const a = nodeBy(e.a),
        b = nodeBy(e.b),
        pa = position(a, s),
        pb = position(b, s);
      pa.add(new THREE.Vector3(-0.2, 0.035, 0.66));
      pb.add(new THREE.Vector3(-0.2, 0.035, 0.66));
      const delta = pb.clone().sub(pa),
        distance = delta.length();
      // Trim routes at the edge of each landing instead of slicing through houses.
      const trim = Math.min(0.8, distance * 0.2),
        dir = delta.clone().normalize();
      pa.addScaledVector(dir, trim);
      pb.addScaledVector(dir, -trim);
      const mat = new THREE.LineDashedMaterial({
        color: e.open ? 0xe3bd79 : 0x79909c,
        dashSize: 0.16,
        gapSize: e.open ? 0.06 : 0.18,
        transparent: true,
        opacity: e.open ? 0.85 : 0.32,
      });
      ownedMaterials.add(mat);
      const line = new THREE.Line(
        ownGeo(new THREE.BufferGeometry().setFromPoints([pa, pb])),
        mat,
      );
      line.computeLineDistances();
      line.userData.disposable = true;
      paths.add(line);
      if (e.open) {
        const n = Math.max(2, Math.ceil(pa.distanceTo(pb) / 0.24));
        for (let i = 0; i < n; i++) {
          const plank = box(0.19, 0.055, 0.48, wood);
          plank.position.lerpVectors(pa, pb, (i + 0.5) / n);
          plank.rotation.y = -Math.atan2(delta.z, delta.x);
          paths.add(plank);
        }
      }
      if (e.gate) {
        const gateNode = level.nodes.find((n) => n.lamp === e.gate);
        if (gateNode) {
          const p = position(gateNode, s);
          const bar = box(0.7, 0.035, 0.035, e.open ? brass : navy);
          bar.position.copy(p).add(new THREE.Vector3(0.58, 0.55, 0.55));
          bar.rotation.z = e.open ? Math.PI / 2 : 0;
          paths.add(bar);
        }
      }
    }
    // Merge all planks/gates by shared material, keeping route geometry cheap.
    const batches = new Map();
    for (const o of [...paths.children])
      if (o.isMesh) {
        o.updateMatrix();
        const key = o.material.uuid;
        if (!batches.has(key))
          batches.set(key, { material: o.material, geos: [] });
        batches.get(key).geos.push(o.geometry.clone().applyMatrix4(o.matrix));
        paths.remove(o);
        o.geometry.dispose();
        ownedGeometries.delete(o.geometry);
      }
    for (const b of batches.values()) {
      const g = mergeGeometries(b.geos, false);
      b.geos.forEach((x) => x.dispose());
      if (g) {
        const mesh = new THREE.Mesh(ownGeo(g), b.material);
        mesh.userData.geometryOnly = true;
        paths.add(mesh);
      }
    }
  }
  function updatePreview() {
    disposeLayer(ghost);
    ghost = null;
    if (!preview || !level) return;
    ghost = new THREE.Group();
    group.add(ghost);
    for (const node of level.nodes) {
      if (!node.platform) continue;
      const current = height(state, ...node.platform),
        future = height(preview, ...node.platform);
      if (current === future) continue;
      const geo = ownGeo(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(3, 0.1, 2)),
      );
      const mat = new THREE.LineDashedMaterial({
        color: 0xffd397,
        dashSize: 0.14,
        gapSize: 0.08,
        transparent: true,
        opacity: 0.85,
      });
      ownedMaterials.add(mat);
      const outline = new THREE.LineSegments(geo, mat);
      outline.computeLineDistances();
      outline.position.copy(position(node, preview));
      outline.userData.disposable = true;
      ghost.add(outline);
      const lineGeo = ownGeo(
        new THREE.BufferGeometry().setFromPoints([
          position(node, state),
          position(node, preview),
        ]),
      );
      const guide = new THREE.Line(lineGeo, mat.clone());
      ownedMaterials.add(guide.material);
      guide.userData.disposable = true;
      guide.computeLineDistances();
      ghost.add(guide);
    }
  }
  function resize() {
    if (disposed) return;
    const w = host.clientWidth || 1,
      h = host.clientHeight || 1;
    if (
      state &&
      compactLayout !== (w < 650 && state.counts.length > 1) &&
      !transition
    ) {
      build(state);
      return;
    }
    renderer.setSize(w, h);
    const ar = w / h;
    const mobile = w < 650;
    const span = Math.max(
      baseWidth,
      (compactLayout
        ? 12.2 + Math.max(0, baseDepth - 10) * 0.4
        : mobile
          ? 8.1 + baseDepth * 0.22
          : 9.7 + baseDepth * 0.25) * ar,
    );
    camera.left = -span / 2;
    camera.right = span / 2;
    camera.top = span / ar / 2;
    camera.bottom = -span / ar / 2;
    // A higher portrait view separates landings and the optional side balconies.
    camera.position
      .copy(cameraCenter)
      .add(
        new THREE.Vector3(
          mobile ? 0.8 : 1.6,
          compactLayout ? 21 : mobile ? 13 : 10.5,
          compactLayout ? 18 : 20,
        ),
      );
    camera.lookAt(cameraCenter);
    camera.updateProjectionMatrix();
    beacon.position.x = mobile ? cameraCenter.x + baseWidth * 0.34 : 8;
    beaconLight.position.x = beacon.position.x;
    for (const { button } of labelEntries) {
      button.style.maxWidth = compactLayout
        ? "70px"
        : mobile
          ? "92px"
          : "135px";
      button.style.fontSize = mobile ? "8px" : "9px";
      button.style.background = compactLayout ? "rgba(16,29,43,.6)" : "";
      button.style.backdropFilter = compactLayout ? "none" : "";
    }
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  function pick(event) {
    if (paused || transition) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(markers)[0];
    if (hit) onPick(hit.object.userData.nodeId);
  }
  const lose = (e) => {
    e.preventDefault();
    paused = true;
    labels.inert = true;
    onError("contextLost");
  };
  renderer.domElement.addEventListener("pointerup", pick);
  renderer.domElement.addEventListener("webglcontextlost", lose);
  function updateProjectedLabels() {
    const w = host.clientWidth,
      h = host.clientHeight;
    for (const { node, button } of labelEntries) {
      const g = objects.get(node.id);
      if (!g) continue;
      const p = g.position
        .clone()
        .add(new THREE.Vector3(-0.05, compactLayout ? -1.05 : -0.23, 1.08))
        .project(camera);
      const half = Math.min(button.offsetWidth / 2 + 2, w / 2);
      button.style.left = `${Math.max(half, Math.min(w - half, (p.x * 0.5 + 0.5) * w))}px`;
      button.style.top = `${(-p.y * 0.5 + 0.5) * h}px`;
      button.style.visibility =
        p.z > 1 || p.x < -1.1 || p.x > 1.1 || p.y < -1.1 || p.y > 1.1
          ? "hidden"
          : "visible";
    }
  }
  function tick(now) {
    if (disposed) return;
    frame = requestAnimationFrame(tick);
    const dt = Math.min((now - last) / 1000 || 0, 0.05);
    last = now;
    if (paused) return;
    elapsed += dt;
    if (mixer && !reducedMotion) mixer.update(dt);
    if (transition) {
      const tr = transition;
      tr.time += dt;
      const p = Math.min(1, tr.time / tr.duration);
      const move = tr.spark
        ? smooth(Math.max(0, (p - 0.38) / 0.62))
        : smooth(p);
      for (const node of level.nodes) {
        const a = position(node, tr.before),
          b = position(node, tr.after);
        objects.get(node.id).position.lerpVectors(a, b, move);
      }
      const a = position(nodeBy(tr.before.node), tr.before),
        b = position(nodeBy(tr.after.node), tr.after);
      noya.position.lerpVectors(a, b, move).add(PERSON);
      if (tr.action?.type === "walk") {
        if (!reducedMotion)
          noya.position.y += Math.sin(p * Math.PI * 8) * 0.018;
        noya.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      }
      if (tr.spark) {
        const q = Math.min(1, p / 0.38);
        tr.spark.position.lerpVectors(tr.sparkA, tr.sparkB, smooth(q));
        if (!reducedMotion) tr.spark.position.y += Math.sin(q * Math.PI) * 0.4;
        tr.spark.visible = p < 0.4;
      }
      if (p >= 1) {
        if (tr.spark) group.remove(tr.spark);
        state = tr.after;
        transition = null;
        labels.inert = false;
        refresh(state);
        playClip("idle");
        tr.resolve();
      }
    }
    for (const { rope, a, node, side } of ropes) {
      const b = objects
        .get(node.id)
        .position.clone()
        .add(new THREE.Vector3(side * 1.4, 0.1, -0.85));
      const d = b.clone().sub(a);
      rope.position.copy(a).add(b).multiplyScalar(0.5);
      rope.scale.y = d.length() / rope.geometry.parameters.height;
      rope.quaternion.setFromUnitVectors(UP, d.normalize());
    }
    if (state)
      for (const n of level.nodes) {
        const ring = objects.get(n.id).getObjectByName("selection-ring");
        ring.scale.setScalar(hover === n.id ? 1.2 : 1);
      }
    updateProjectedLabels();
    renderer.render(scene, camera);
  }
  frame = requestAnimationFrame(tick);
  return {
    setState(s, before = null, action = null) {
      if (!state || s.chapter !== state.chapter) {
        build(s);
        return Promise.resolve();
      }
      preview = null;
      updatePreview();
      if (transition) {
        transition.resolve();
        transition = null;
      }
      if (!before) {
        state = s;
        for (const n of level.nodes)
          objects.get(n.id).position.copy(position(n, s));
        noya.position.copy(position(nodeBy(s.node), s)).add(PERSON);
        refresh(s);
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        transition = {
          before,
          after: s,
          action,
          time: 0,
          duration: reducedMotion
            ? 0.15
            : action?.type === "walk"
              ? 0.72
              : 1.15,
          resolve,
        };
        labels.inert = true;
        playClip(action?.type || "idle");
        if (
          ["take", "give", "light", "reclaim"].includes(action?.type) ||
          (action?.type === "undo" && s.carry !== before.carry)
        ) {
          const current = nodeBy(before.node);
          const affected =
            level.nodes.find((n) => n.lamp === action?.target) || current;
          const p = position(affected, before),
            person = position(current, before).add(PERSON);
          const from = p.add(
              new THREE.Vector3(affected.platform ? -0.82 : -0.4, 0.48, 0.2),
            ),
            to = person.add(new THREE.Vector3(0.18, 0.5, 0.04));
          const spark = new THREE.Mesh(sphereGeo, glow);
          spark.scale.setScalar(1.55);
          group.add(spark);
          const taking =
            ["take", "reclaim"].includes(action.type) ||
            (action.type === "undo" && s.carry > before.carry);
          transition.spark = spark;
          transition.sparkA = taking ? from : to;
          transition.sparkB = taking ? to : from;
        }
      });
    },
    screenX(id) {
      const node = nodeBy(id);
      return node ? position(node, state).project(camera).x : 0;
    },
    setLabel(fn) {
      labelNode = fn;
      if (state) updateLabelsText(state);
    },
    focus(id) {
      hover = id;
    },
    setPreview(s) {
      preview = s;
      updatePreview();
    },
    setOptions(o) {
      reducedMotion = o.reducedMotion ?? reducedMotion;
      quality = o.quality ?? quality;
      renderer.setPixelRatio(
        Math.min(devicePixelRatio, quality === "low" ? 1 : 1.5),
      );
      renderer.shadowMap.enabled = quality !== "low";
      resize();
    },
    pause() {
      paused = true;
      labels.inert = true;
    },
    resume() {
      paused = false;
      labels.inert = false;
      last = performance.now();
    },
    stats() {
      return {
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        geometries: renderer.info.memory.geometries,
      };
    },
    destroy() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerup", pick);
      renderer.domElement.removeEventListener("webglcontextlost", lose);
      if (transition) transition.resolve();
      mixer?.stopAllAction();
      sourceGeometries.forEach((g) => g.dispose());
      sourceMaterials.forEach((m) => m.dispose());
      ownedGeometries.forEach((g) => g.dispose());
      ownedMaterials.forEach((m) => m.dispose());
      haloTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      labels.remove();
    },
  };
}
