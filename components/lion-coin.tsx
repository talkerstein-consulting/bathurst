"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * The Talkerstein coin, spinning over the credit line while it is hovered.
 *
 * One glb (the light cut, under a megabyte), one canvas the size of the
 * coin, mounted only once the plaque is first hovered and torn down when
 * the pointer leaves, so the footer ships nothing for it until someone
 * asks. It is fixed to the middle of the screen at most of its height
 * (see .tcg-coin). The coin turns about its vertical axis, a full turn in about three
 * seconds, and the whole thing fades in and out with CSS on the wrapper
 * (see .tcg-coin in tcg-badge.css); this component only spins.
 *
 * The model is a 40mm disc lying in the XY plane, so it is already facing
 * the camera; the camera is set close enough that the coin fills the box
 * with a little air. The environment is three rectangles of light, the
 * same kind the turntable uses, because silver reads as silver only with
 * something to reflect; a preset would fetch an HDR from a CDN.
 */
const MODEL_URL = "/models/lion-coin.glb";

/** Degrees per frame at 60fps: ~12s per turn, slow enough to read the lion. */
const SPIN_RAD = THREE.MathUtils.degToRad(0.5);

function Coin({ spin }: { spin: boolean }) {
  const { scene } = useGLTF(MODEL_URL);
  const group = useRef<THREE.Group>(null);

  /* Cloned and centred once: the file's origin is already the coin's
     middle, but measuring costs nothing and guards against a re-export. */
  const { object, scale } = useMemo(() => {
    const object = scene.clone(true);
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    object.position.sub(centre);
    /* The coin's diameter to ~1.7 world units, which at this camera fills
       the box with a hair of air on each side. */
    return { object, scale: 1.7 / Math.max(size.x, size.y) };
  }, [scene]);

  useFrame(() => {
    if (spin && group.current) group.current.rotation.y += SPIN_RAD;
  });

  return (
    <group ref={group} scale={scale}>
      <primitive object={object} />
    </group>
  );
}

export default function LionCoin({ spin }: { spin: boolean }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 4], fov: 28 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
      }}
    >
      <Suspense fallback={null}>
        <Environment resolution={128}>
          <Lightformer
            intensity={2}
            position={[0, 5, 2]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[10, 6, 1]}
            color="#ffffff"
          />
          <Lightformer
            intensity={1}
            position={[-6, 0, 3]}
            scale={[4, 8, 1]}
            color="#ffffff"
          />
          <Lightformer
            intensity={0.8}
            position={[6, -1, 3]}
            scale={[4, 8, 1]}
            color="#e9e0c8"
          />
        </Environment>
        <Coin spin={spin} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
