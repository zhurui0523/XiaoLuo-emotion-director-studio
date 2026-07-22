import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { FacialState } from '../types';
import type { MannequinGender } from './MannequinHeadViewport';

interface ThreeMannequinViewportProps {
  facialState: FacialState;
  gender: MannequinGender;
  emotionName?: string;
  showMesh?: boolean;
}

type MorphTargetMap = Record<string, number>;
type MorphMesh = THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]> & {
  morphTargetDictionary: Record<string, number>;
  morphTargetInfluences: number[];
};

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

const setMorph = (targets: MorphTargetMap, name: string, value: number) => {
  targets[name] = Math.max(targets[name] ?? 0, clamp(value));
};

/** Convert the editor's semantic controls to the model's ARKit-style blendshapes. */
const buildMorphTargets = (facialState: FacialState): MorphTargetMap => {
  const { eye, eyebrow, mouth, face } = facialState;
  const targets: MorphTargetMap = {};

  const openness = clamp(eye.openness / 50, -1, 1);
  const eyeAsymmetry = clamp((eye.asymmetry ?? 0) / 100, -1, 1);
  const baseBlink = openness < 0 ? -openness * 0.92 : 0;
  const baseWide = openness > 0 ? openness * 0.86 : 0;
  const focus = clamp(eye.focus / 100);
  const focusSquint = clamp((focus - 0.48) / 0.52) * 0.34;

  setMorph(targets, 'eyeBlink_L', baseBlink + Math.max(0, eyeAsymmetry) * 0.82);
  setMorph(targets, 'eyeBlink_R', baseBlink + Math.max(0, -eyeAsymmetry) * 0.82);
  setMorph(targets, 'eyeWide_L', baseWide + Math.max(0, -eyeAsymmetry) * 0.28);
  setMorph(targets, 'eyeWide_R', baseWide + Math.max(0, eyeAsymmetry) * 0.28);
  setMorph(targets, 'eyeSquint_L', focusSquint);
  setMorph(targets, 'eyeSquint_R', focusSquint);

  switch (eye.direction) {
    case 'down':
      setMorph(targets, 'eyeLookDown_L', 0.72);
      setMorph(targets, 'eyeLookDown_R', 0.72);
      break;
    case 'up':
      setMorph(targets, 'eyeLookUp_L', 0.7);
      setMorph(targets, 'eyeLookUp_R', 0.7);
      break;
    case 'side':
      setMorph(targets, 'eyeLookOut_L', 0.7);
      setMorph(targets, 'eyeLookIn_R', 0.7);
      break;
    case 'avoid gaze':
      setMorph(targets, 'eyeLookIn_L', 0.46);
      setMorph(targets, 'eyeLookOut_R', 0.46);
      setMorph(targets, 'eyeBlink_L', baseBlink + 0.1);
      setMorph(targets, 'eyeBlink_R', baseBlink + 0.1);
      break;
    case 'cold stare':
      setMorph(targets, 'eyeSquint_L', focusSquint + 0.28);
      setMorph(targets, 'eyeSquint_R', focusSquint + 0.28);
      break;
    case 'soft gaze':
      setMorph(targets, 'eyeBlink_L', baseBlink + 0.12);
      setMorph(targets, 'eyeBlink_R', baseBlink + 0.12);
      setMorph(targets, 'eyeSquint_L', focusSquint + 0.08);
      setMorph(targets, 'eyeSquint_R', focusSquint + 0.08);
      break;
    default:
      break;
  }

  const browTension = clamp(eyebrow.tension / 100);
  const browHeight = clamp(eyebrow.height / 50, -1, 1);
  const innerLift = clamp((eyebrow.innerLift ?? 0) / 100, -1, 1);
  setMorph(targets, 'browDown_L', browTension * 0.82 + Math.max(0, -browHeight) * 0.28);
  setMorph(targets, 'browDown_R', browTension * 0.82 + Math.max(0, -browHeight) * 0.28);
  setMorph(targets, 'browOuterUp_L', Math.max(0, browHeight) * 0.72);
  setMorph(targets, 'browOuterUp_R', Math.max(0, browHeight) * 0.72);
  setMorph(targets, 'browInnerUp', Math.max(0, innerLift) * 0.95 + Math.max(0, browHeight) * 0.24);

  const curve = clamp(mouth.curve / 100, -1, 1);
  const tension = clamp(mouth.tension / 100);
  const mouthAsymmetry = clamp((mouth.asymmetry ?? 0) / 100, -1, 1);
  const smile = Math.max(0, curve);
  const frown = Math.max(0, -curve);
  const leftBias = mouthAsymmetry * 0.48;
  setMorph(targets, 'mouthSmile_L', smile * 0.94 + Math.max(0, leftBias));
  setMorph(targets, 'mouthSmile_R', smile * 0.94 + Math.max(0, -leftBias));
  setMorph(targets, 'mouthFrown_L', frown * 0.92 + Math.max(0, -leftBias));
  setMorph(targets, 'mouthFrown_R', frown * 0.92 + Math.max(0, leftBias));
  setMorph(targets, 'mouthPress_L', tension * 0.48);
  setMorph(targets, 'mouthPress_R', tension * 0.48);
  setMorph(targets, 'mouthDimple_L', tension * smile * 0.34);
  setMorph(targets, 'mouthDimple_R', tension * smile * 0.34);

  switch (mouth.state) {
    case 'slight opening':
      setMorph(targets, 'jawOpen', 0.28 + tension * 0.28);
      setMorph(targets, 'mouthFunnel', 0.08 + frown * 0.18);
      break;
    case 'smile':
      setMorph(targets, 'mouthSmile_L', Math.max(0.42, smile));
      setMorph(targets, 'mouthSmile_R', Math.max(0.42, smile));
      setMorph(targets, 'cheekSquint_L', 0.12 + smile * 0.26);
      setMorph(targets, 'cheekSquint_R', 0.12 + smile * 0.26);
      break;
    case 'pressed lips':
      setMorph(targets, 'mouthClose', 0.2);
      setMorph(targets, 'mouthPress_L', 0.24 + tension * 0.22);
      setMorph(targets, 'mouthPress_R', 0.24 + tension * 0.22);
      break;
    case 'trembling':
      setMorph(targets, 'jawOpen', 0.12);
      setMorph(targets, 'mouthFrown_L', frown + 0.22);
      setMorph(targets, 'mouthFrown_R', frown + 0.3);
      setMorph(targets, 'mouthLowerDown_L', 0.18);
      setMorph(targets, 'mouthLowerDown_R', 0.26);
      break;
    default:
      break;
  }

  const muscleTension = clamp(face.muscleTension / 100);
  setMorph(targets, 'cheekSquint_L', muscleTension * 0.22 + smile * 0.18);
  setMorph(targets, 'cheekSquint_R', muscleTension * 0.22 + smile * 0.18);
  setMorph(targets, 'noseSneer_L', muscleTension * frown * 0.32);
  setMorph(targets, 'noseSneer_R', muscleTension * frown * 0.32);
  setMorph(targets, 'mouthStretch_L', muscleTension * frown * 0.14);
  setMorph(targets, 'mouthStretch_R', muscleTension * frown * 0.14);

  return targets;
};

const disposeObject = (object: THREE.Object3D) => {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      const materialRecord = material as THREE.Material & Record<string, unknown>;
      Object.values(materialRecord).forEach((value) => {
        if (value instanceof THREE.Texture) value.dispose();
      });
      material.dispose();
    });
  });
};

export const ThreeMannequinViewport: React.FC<ThreeMannequinViewportProps> = ({
  facialState,
  gender,
  emotionName,
  showMesh = false,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetMorphs = useMemo(() => buildMorphTargets(facialState), [facialState]);
  const livePropsRef = useRef({ targetMorphs, gender, facialState, showMesh });
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  livePropsRef.current = { targetMorphs, gender, facialState, showMesh };

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    let disposed = false;
    let animationFrame = 0;
    let loadedScene: THREE.Object3D | null = null;
    let pupilGroup: THREE.Group | null = null;
    let lastGender: MannequinGender | null = null;
    let lastWireframe: boolean | null = null;
    const clock = new THREE.Clock();
    const morphMeshes: MorphMesh[] = [];
    const pupilMeshes: THREE.Mesh[] = [];
    const allMaterials = new Set<THREE.MeshStandardMaterial>();

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x222224, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222224);
    scene.fog = new THREE.Fog(0x222224, 5, 16);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
    const poseGroup = new THREE.Group();
    scene.add(poseGroup);

    scene.add(new THREE.HemisphereLight(0xf3f5ff, 0x24252b, 2.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.7);
    keyLight.position.set(-3.5, 4.8, 5.6);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xaebbd2, 1.7);
    fillLight.position.set(4.6, 1.4, 3.2);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.45);
    rimLight.position.set(0, 4.2, -4.8);
    scene.add(rimLight);

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const fitCamera = (object: THREE.Object3D, focusBox?: THREE.Box3) => {
      const box = focusBox ?? new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      object.position.sub(center);
      object.position.y += size.y * 0.015;
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      const distance = Math.max(
        size.y / (2 * Math.tan(vFov / 2)),
        size.x / (2 * Math.tan(hFov / 2))
      ) * 0.88;
      camera.position.set(0, size.y * 0.015, distance);
      camera.near = Math.max(0.01, distance / 100);
      camera.far = distance * 10;
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    };

    const addBustAndEyes = (
      object: THREE.Object3D,
      headBox: THREE.Box3,
      eyeBounds: THREE.Box3[]
    ) => {
      const size = headBox.getSize(new THREE.Vector3());
      const center = headBox.getCenter(new THREE.Vector3());
      const clayMaterial = new THREE.MeshStandardMaterial({
        color: 0xc8c9c9,
        roughness: 0.82,
        metalness: 0,
      });
      allMaterials.add(clayMaterial);

      const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(size.x * 0.19, size.x * 0.255, size.y * 0.5, 64, 3),
        clayMaterial
      );
      neck.position.set(center.x, headBox.min.y + size.y * 0.015, center.z - size.z * 0.16);
      object.add(neck);

      const shoulders = new THREE.Mesh(
        new THREE.SphereGeometry(1, 72, 36),
        clayMaterial
      );
      shoulders.scale.set(size.x * 0.92, size.y * 0.3, size.z * 0.62);
      shoulders.position.set(center.x, headBox.min.y - size.y * 0.34, center.z - size.z * 0.23);
      object.add(shoulders);

      pupilGroup = new THREE.Group();
      const irisMaterial = new THREE.MeshStandardMaterial({
        color: 0x8f969f,
        roughness: 0.5,
        metalness: 0,
      });
      const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x111318 });
      const fallbackEyeY = center.y - size.y * 0.035;
      const fallbackEyeZ = headBox.max.z - size.z * 0.12;
      const fallbackSpread = size.x * 0.165;
      const orderedEyeBounds = eyeBounds
        .slice(0, 2)
        .sort((left, right) => left.getCenter(new THREE.Vector3()).x - right.getCenter(new THREE.Vector3()).x);
      const irisRadius = size.x * 0.032;
      const pupilRadius = irisRadius * 0.48;

      [-1, 1].forEach((direction, index) => {
        const eyeBox = orderedEyeBounds[index];
        const eyeCenter = eyeBox?.getCenter(new THREE.Vector3());
        const eyeX = eyeCenter?.x ?? center.x + fallbackSpread * direction;
        const eyeY = eyeCenter?.y ?? fallbackEyeY;
        const eyeZ = eyeBox ? eyeBox.max.z + size.z * 0.006 : fallbackEyeZ;
        const iris = new THREE.Mesh(new THREE.CircleGeometry(irisRadius, 40), irisMaterial);
        iris.position.set(eyeX, eyeY, eyeZ);
        pupilGroup?.add(iris);
        const pupil = new THREE.Mesh(new THREE.CircleGeometry(pupilRadius, 32), pupilMaterial);
        pupil.position.set(eyeX, eyeY, eyeZ + size.z * 0.004);
        pupilGroup?.add(pupil);
        pupilMeshes.push(pupil);
      });
      object.add(pupilGroup);
    };

    const ktx2Loader = new KTX2Loader()
      .setTranscoderPath('/basis/')
      .detectSupport(renderer);
    const loader = new GLTFLoader();
    loader.setKTX2Loader(ktx2Loader);
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      '/models/facecap.glb',
      (gltf) => {
        if (disposed) {
          disposeObject(gltf.scene);
          return;
        }
        loadedScene = gltf.scene;
        const headBox = new THREE.Box3().setFromObject(loadedScene);
        const eyeBounds: THREE.Box3[] = [];
        loadedScene.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.frustumCulled = false;
          if (mesh.geometry.getAttribute('position')?.count === 530) {
            eyeBounds.push(new THREE.Box3().setFromObject(mesh));
          }
          const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          const materials = sourceMaterials.map((sourceMaterial) => {
            const material = sourceMaterial.clone() as THREE.MeshStandardMaterial;
            material.map = null;
            material.normalMap = null;
            material.color.setHex(0xc8c9c9);
            material.roughness = 0.78;
            material.metalness = 0;
            material.envMapIntensity = 0.35;
            material.needsUpdate = true;
            allMaterials.add(material);
            return material;
          });
          mesh.material = Array.isArray(mesh.material) ? materials : materials[0];
          if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
            const morphMesh = mesh as MorphMesh;
            morphMeshes.push(morphMesh);
          }
        });
        addBustAndEyes(loadedScene, headBox, eyeBounds);
        poseGroup.add(loadedScene);
        fitCamera(loadedScene);
        lastGender = livePropsRef.current.gender;
        setStatus('ready');
      },
      undefined,
      (error) => {
        console.error('Unable to load the facial blendshape model.', error);
        if (!disposed) setStatus('error');
      }
    );

    const animate = () => {
      if (disposed) return;
      animationFrame = window.requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      const {
        targetMorphs: morphTargets,
        gender: liveGender,
        facialState: liveState,
        showMesh: wireframe,
      } = livePropsRef.current;

      morphMeshes.forEach((mesh) => {
        Object.entries(mesh.morphTargetDictionary).forEach(([name, index]) => {
          const desired = morphTargets[name] ?? 0;
          mesh.morphTargetInfluences[index] = THREE.MathUtils.damp(
            mesh.morphTargetInfluences[index] ?? 0,
            desired,
            10,
            delta
          );
        });
      });

      if (liveGender !== lastGender) {
        const clayColor = liveGender === 'male' ? 0xbfc2c4 : 0xd0cdca;
        allMaterials.forEach((material) => material.color.setHex(clayColor));
        lastGender = liveGender;
      }
      if (wireframe !== lastWireframe) {
        allMaterials.forEach((material) => {
          material.wireframe = wireframe;
          material.needsUpdate = true;
        });
        lastWireframe = wireframe;
      }

      const targetScaleX = liveGender === 'male' ? 1.04 : 0.92;
      const targetScaleY = liveGender === 'male' ? 1 : 1.03;
      poseGroup.scale.x = THREE.MathUtils.damp(poseGroup.scale.x, targetScaleX, 8, delta);
      poseGroup.scale.y = THREE.MathUtils.damp(poseGroup.scale.y, targetScaleY, 8, delta);
      poseGroup.rotation.z = THREE.MathUtils.damp(
        poseGroup.rotation.z,
        THREE.MathUtils.degToRad(liveState.face.headTilt * 0.72),
        7,
        delta
      );
      const breathingSpeed = liveState.face.breathing === 'fast breathing' ? 3.2 : 1.35;
      const breathingAmount = liveState.face.breathing === 'holding breath' ? 0 : 0.0045;
      poseGroup.position.y = Math.sin(elapsed * breathingSpeed) * breathingAmount;

      if (pupilGroup) {
        const horizontalTarget = liveState.eye.direction === 'side'
          ? 0.018
          : liveState.eye.direction === 'avoid gaze'
            ? -0.014
            : 0;
        const verticalTarget = liveState.eye.direction === 'up'
          ? 0.012
          : liveState.eye.direction === 'down'
            ? -0.014
            : 0;
        pupilGroup.position.x = THREE.MathUtils.damp(pupilGroup.position.x, horizontalTarget, 12, delta);
        pupilGroup.position.y = THREE.MathUtils.damp(pupilGroup.position.y, verticalTarget, 12, delta);
        const pupilScale = 1 + clamp((liveState.face.pupilSize ?? 0) / 50, -1, 1) * 0.32;
        pupilMeshes.forEach((pupil) => pupil.scale.setScalar(pupilScale));
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      ktx2Loader.dispose();
      if (loadedScene) disposeObject(loadedScene);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={`${gender === 'female' ? '女性' : '男性'}实时三维灰模：${emotionName ?? '动态表情'}`}
      className="relative h-full w-full select-none overflow-hidden bg-[#222224]"
    >
      <canvas
        ref={canvasRef}
        data-mannequin-canvas="true"
        className="block h-full w-full grayscale contrast-[1.04]"
      />

      {status === 'loading' && (
        <div className="absolute inset-0 grid place-items-center bg-[#222224] text-sm font-medium text-white/60">
          正在加载 3D 面部模型…
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 grid place-items-center bg-[#222224] px-8 text-center text-sm font-medium text-white/70">
          3D 模型加载失败，请刷新页面重试
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_43%,transparent_48%,rgba(0,0,0,0.2)_100%)]" />
    </div>
  );
};
