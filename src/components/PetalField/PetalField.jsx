import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styled from 'styled-components';
import flower1 from '../../assets/flowers/flower1.svg';
import flower2 from '../../assets/flowers/flower2.svg';
import flower3 from '../../assets/flowers/flower3.svg';
import flower4 from '../../assets/flowers/flower4.svg';
import flower5 from '../../assets/flowers/flower5.svg';
import flower6 from '../../assets/flowers/flower6.svg';
import flower7 from '../../assets/flowers/flower7.svg';
import flower8 from '../../assets/flowers/flower8.svg';
import flower9 from '../../assets/flowers/flower9.svg';

const FLOWER_SOURCES = [flower1, flower2, flower3, flower4, flower5, flower6, flower7, flower8, flower9];

// How fast the ring turns per pixel scrolled, and per second of idle time
// (so the space keeps a faint breath of motion even without scrolling).
// Lower than before — the old value swept petals through a full rotation
// (and then some) over one scroll pass, which read as a huge room to travel
// through rather than a small cluster of petals drifting in place.
const RADIANS_PER_SCROLL_PX = 0.00095;
const IDLE_RADIANS_PER_SEC = 0.05;

// Ellipse (in world units) around the statue's silhouette. Petals whose
// projected position drifts inside this get pushed out / faded so they read
// as passing beside her rather than through her.
const SHIELD_X = 2.6;
const SHIELD_Y = 4.6;
const SHIELD_SOFT = 1.2;

// Ring radius range petals orbit at, in world units. Narrower span = less
// near/far spread = flatter, shallower-feeling depth between petals.
const RING_R_MIN = 5.5;
const RING_R_MAX = 7.5;

// How far above/below center petals can drift, in world units. Kept tight
// so they stay clustered near the statue instead of scattered through a
// tall, roomy-feeling column of space.
const Y_SPREAD_MIN = -2.6;
const Y_SPREAD_MAX = 3;

// These constants above were tuned against a wide/short (landscape) frame.
// A tall/narrow (portrait, mobile) frame has a much tighter horizontal FOV
// at the same distance, so the same ring radius mostly falls outside the
// visible width — that's why petals were disappearing off both edges on
// mobile while the tall unused space above/below the statue sat empty.
// Shrinking the ring and widening the vertical spread (plus scaling the
// shield ellipse down to match, so it doesn't swallow the now-smaller ring)
// redistributes the same petals into the shape the portrait frame actually
// has room for.
const PORTRAIT_RING_R_MIN = 2.4;
const PORTRAIT_RING_R_MAX = 3.6;
const PORTRAIT_Y_SPREAD_MIN = -6;
const PORTRAIT_Y_SPREAD_MAX = 5.2;
const PORTRAIT_SHIELD_X = 1.3;
const PORTRAIT_SHIELD_Y = 3.4;

const PETAL_SCALE_MIN = 1.4;
const PETAL_SCALE_MAX = 2.2;

const SWIRL_FAR = 0.65;
const SWIRL_NEAR = 1.6;

const rand = (a, b) => a + Math.random() * (b - a);
const smoothstep = (a, b, x) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

const Container = styled.div`
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: auto;
    /* Applied to the whole (alpha-transparent) canvas rather than per-petal —
       since each petal is a separate island of non-transparent pixels, this
       still reads as an individual glow around each one. */
    filter: drop-shadow(0 0 20px #fffda4);
  }
`;

function PetalField({ scrollY = 0, offerings = [], onPetalClick }) {
  const containerRef = useRef(null);
  const scrollYRef = useRef(scrollY);
  scrollYRef.current = scrollY;
  const onPetalClickRef = useRef(onPetalClick);
  onPetalClickRef.current = onPetalClick;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    // One petal per offering — the field starts empty and grows as people offer flowers.
    const count = offerings.length;

    const isPortrait = container.clientWidth < container.clientHeight;
    const ringRMin = isPortrait ? PORTRAIT_RING_R_MIN : RING_R_MIN;
    const ringRMax = isPortrait ? PORTRAIT_RING_R_MAX : RING_R_MAX;
    const ringRSpan = ringRMax - ringRMin;
    const ySpreadMin = isPortrait ? PORTRAIT_Y_SPREAD_MIN : Y_SPREAD_MIN;
    const ySpreadMax = isPortrait ? PORTRAIT_Y_SPREAD_MAX : Y_SPREAD_MAX;
    const shieldX = isPortrait ? PORTRAIT_SHIELD_X : SHIELD_X;
    const shieldY = isPortrait ? PORTRAIT_SHIELD_Y : SHIELD_Y;

    const scene = new THREE.Scene();
    // Wider near/far span than the petals' own distance range means the far
    // side of the ring no longer fades out as hard against the near side —
    // flattens how "deep" the space between petals reads.
    scene.fog = new THREE.Fog(0x1c1d1f, 10, 48);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(0, 0.4, 14);
    camera.lookAt(0, 0.2, 0);
    const camDistance = camera.position.length();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const loader = new THREE.TextureLoader();
    const materials = FLOWER_SOURCES.map((src) => {
      const texture = loader.load(src);
      texture.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.3,
        side: THREE.DoubleSide,
        fog: true,
      });
    });

    const geometry = new THREE.PlaneGeometry(1, 1);

    const petals = Array.from({ length: count }, (_, index) => {
      const r = rand(ringRMin, ringRMax);
      const near = 1 - (r - ringRMin) / ringRSpan; // 1 = close ring, 0 = far ring
      const material = materials[Math.floor(Math.random() * materials.length)];
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.offering = offerings[index];
      scene.add(mesh);
      return {
        mesh,
        a0: rand(0, Math.PI * 2),
        r,
        y0: rand(ySpreadMin, ySpreadMax),
        s: rand(PETAL_SCALE_MIN, PETAL_SCALE_MAX) * (0.7 + near * 0.6),
        roll: rand(0, Math.PI * 2),
        spin: rand(-0.4, 0.4),
        bob: rand(0.25, 0.6),
        ph: rand(0, Math.PI * 2),
        flut: rand(0.5, 1.3),
        swirl: SWIRL_FAR + near * (SWIRL_NEAR - SWIRL_FAR), // closer petals swirl faster → parallax
      };
    });

    const timer = new THREE.Timer();
    let rafId;

    const animate = () => {
      timer.update();
      const t = timer.getElapsed();
      const theta = scrollYRef.current * RADIANS_PER_SCROLL_PX + t * IDLE_RADIANS_PER_SEC;

      petals.forEach((p) => {
        const ang = p.a0 + theta * p.swirl;
        let x = Math.cos(ang) * p.r;
        const z = Math.sin(ang) * p.r;
        let y = p.y0 + Math.sin(t * p.bob + p.ph) * 0.5;

        // z > 0 is the half of the ring nearer the camera (in front of the statue).
        let vis = 1;
        if (z > 0) {
          const k = (camDistance - z) / camDistance;
          const ax = shieldX * k;
          const ay = shieldY * k;
          let d = Math.hypot(x / ax, y / ay);
          if (d < SHIELD_SOFT) {
            const push = 1 + (SHIELD_SOFT - d) * 0.4;
            x *= push;
            y *= push;
            d = Math.hypot(x / ax, y / ay);
            vis = smoothstep(0.9, SHIELD_SOFT, d);
          }
        }

        p.mesh.visible = vis > 0.02;
        if (!p.mesh.visible) return;

        p.mesh.position.set(x, y, z);
        p.mesh.quaternion.copy(camera.quaternion);
        p.mesh.rotateZ(p.roll + t * p.spin);
        const flutter = 0.4 + 0.6 * Math.abs(Math.cos(t * p.flut + p.ph));
        p.mesh.scale.set(p.s * flutter * vis, p.s * vis, 1);
      });

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    animate();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const pickPetal = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const visibleMeshes = petals.filter((p) => p.mesh.visible).map((p) => p.mesh);
      const hits = raycaster.intersectObjects(visibleMeshes);
      return hits.length > 0 ? hits[0].object.userData.offering : null;
    };

    const handleClick = (event) => {
      const offering = pickPetal(event);
      if (offering && onPetalClickRef.current) onPetalClickRef.current(offering);
    };

    const handlePointerMove = (event) => {
      renderer.domElement.style.cursor = pickPetal(event) ? 'pointer' : 'default';
    };

    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      geometry.dispose();
      materials.forEach((material) => {
        material.map?.dispose();
        material.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [offerings]);

  return <Container ref={containerRef} aria-hidden="true" />;
}

export default PetalField;
