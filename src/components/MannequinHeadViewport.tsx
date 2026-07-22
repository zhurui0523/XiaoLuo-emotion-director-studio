import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FacialState } from '../types';
import { EMOTION_PRESETS } from '../data/presets';
import { ThreeMannequinViewport } from './ThreeMannequinViewport';

export type MannequinGender = 'male' | 'female';

interface MannequinHeadViewportProps {
  facialState: FacialState;
  gender?: MannequinGender;
  emotionName?: string;
  showMesh?: boolean;
}

interface PresetFrame {
  sheet: number;
  column: number;
}

interface VisibleFrame extends PresetFrame {
  gender: MannequinGender;
}

interface SheetDefinition {
  src: string;
  aspect: number;
  zoom: number;
}

const SHEETS: SheetDefinition[] = [
  { src: '/expression-preset-sheet-01-v2.png', aspect: 1983 / 793, zoom: 1 },
  { src: '/expression-preset-sheet-02-v2.png', aspect: 1619 / 971, zoom: 1.34 },
  { src: '/expression-preset-sheet-03-v2.png', aspect: 1774 / 887, zoom: 1.18 },
  { src: '/expression-preset-sheet-04-v2.png', aspect: 1619 / 971, zoom: 1.34 },
  { src: '/expression-preset-sheet-05-v2.png', aspect: 1774 / 887, zoom: 1.18 },
];

const PRESET_FRAME: Record<string, PresetFrame> = {
  'Calm & Composed': { sheet: 0, column: 0 },
  'Deep Contemplation': { sheet: 0, column: 1 },
  'Analytical Coldness': { sheet: 0, column: 2 },
  'Weary Fatigue': { sheet: 0, column: 3 },
  'Relieved Peace': { sheet: 0, column: 4 },
  'Joyful Brightness': { sheet: 1, column: 0 },
  'Gentle Expectation': { sheet: 1, column: 1 },
  'Doting Devotion': { sheet: 1, column: 2 },
  'Ecstatic Exuberance': { sheet: 1, column: 3 },
  'Melancholic Sorrow': { sheet: 1, column: 4 },
  'Weeping Heartbreak': { sheet: 2, column: 0 },
  'Seething Rage': { sheet: 2, column: 1 },
  'Terrified Panic': { sheet: 2, column: 2 },
  'Disillusioned Hurt': { sheet: 2, column: 3 },
  'Domineering CEO Coldness': { sheet: 2, column: 4 },
  'Yandere Obsession': { sheet: 3, column: 0 },
  'Wuxia Poetic Sorrow': { sheet: 3, column: 1 },
  'Villainous Intimidation': { sheet: 3, column: 2 },
  'Immortal Unearthly Calm': { sheet: 3, column: 3 },
  'Cyberpunk Android Numbness': { sheet: 3, column: 4 },
  'Zen Transcendence': { sheet: 4, column: 0 },
  'Confident Pride': { sheet: 4, column: 1 },
  'Playful Mischief': { sheet: 4, column: 2 },
  'Arrogant Scorn': { sheet: 4, column: 3 },
  'Unhinged Madness': { sheet: 4, column: 4 },
};

const inferPresetName = (facialState: FacialState) => {
  const { eye, eyebrow, mouth, face } = facialState;
  if (eye.openness > 34 && eyebrow.height > 18) return 'Terrified Panic';
  if (eyebrow.tension > 72 && eyebrow.height < 5) return 'Seething Rage';
  if ((eyebrow.innerLift ?? 0) > 24 || mouth.curve < -30) return 'Melancholic Sorrow';
  if (Math.abs(mouth.asymmetry ?? 0) > 18) return 'Arrogant Scorn';
  if (mouth.curve > 48 && face.muscleTension > 60) return 'Ecstatic Exuberance';
  if (mouth.curve > 25) return 'Joyful Brightness';
  if (eye.openness < -22) return 'Weary Fatigue';
  if (eye.focus > 82 || face.muscleTension > 55) return 'Analytical Coldness';
  return 'Calm & Composed';
};

const resolveFrame = (
  emotionName: string | undefined,
  facialState: FacialState,
  gender: MannequinGender
): VisibleFrame => {
  const presetName = emotionName && PRESET_FRAME[emotionName]
    ? emotionName
    : inferPresetName(facialState);
  return { ...PRESET_FRAME[presetName], gender };
};

const getFrameKey = (frame: VisibleFrame) =>
  `${frame.sheet}-${frame.column}-${frame.gender}`;

const ExpressionLayer: React.FC<{
  frame: VisibleFrame;
  opacity?: number;
  thumbnail?: boolean;
}> = ({ frame, opacity = 1, thumbnail = false }) => {
  const sheet = SHEETS[frame.sheet];
  const cellAspect = (sheet.aspect * 2) / 5;
  const genderRow = frame.gender === 'female' ? 1 : 0;
  const zoom = thumbnail ? sheet.zoom * 1.06 : sheet.zoom;

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-0 aspect-square -translate-x-1/2 overflow-hidden transition-opacity duration-200 ease-out"
      style={{ height: `${zoom * 100}%`, opacity, willChange: 'opacity' }}
    >
      <div
        className="absolute left-1/2 top-0 h-full -translate-x-1/2 overflow-hidden"
        style={{ width: `${cellAspect * 100}%` }}
      >
        <img
          src={sheet.src}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute h-[200%] w-auto max-w-none select-none"
          style={{ left: `${-frame.column * 100}%`, top: `${-genderRow * 100}%` }}
        />
      </div>
    </div>
  );
};

export const ExpressionPresetThumbnail: React.FC<{
  emotionName: string;
  gender?: MannequinGender;
  className?: string;
}> = ({ emotionName, gender = 'male', className = '' }) => {
  const frame = { ...(PRESET_FRAME[emotionName] ?? PRESET_FRAME['Calm & Composed']), gender };
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden bg-[#222224] ${className}`}
    >
      <ExpressionLayer frame={frame} thumbnail />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_45%,rgba(0,0,0,0.14)_100%)]" />
    </div>
  );
};

const ImageMannequinHeadViewport: React.FC<MannequinHeadViewportProps> = ({
  facialState,
  gender = 'male',
  emotionName,
  showMesh = false,
}) => {
  const targetFrame = useMemo(
    () => resolveFrame(emotionName, facialState, gender as MannequinGender),
    [emotionName, facialState, gender]
  );
  const targetKey = getFrameKey(targetFrame);
  const [visibleFrame, setVisibleFrame] = useState<VisibleFrame>(targetFrame);
  const [previousFrame, setPreviousFrame] = useState<VisibleFrame>(targetFrame);
  const [showNewFrame, setShowNewFrame] = useState(true);

  useEffect(() => {
    SHEETS.forEach(({ src }) => {
      const image = new Image();
      image.decoding = 'async';
      image.src = src;
    });
  }, []);

  useEffect(() => {
    if (targetKey === getFrameKey(visibleFrame)) return;
    setPreviousFrame(visibleFrame);
    setVisibleFrame(targetFrame);
    setShowNewFrame(false);
    const animationFrame = window.requestAnimationFrame(() => setShowNewFrame(true));
    return () => window.cancelAnimationFrame(animationFrame);
  }, [targetKey]);

  return (
    <div
      role="img"
      aria-label={`${gender === 'female' ? '写实女性' : '写实男性'}灰模：${emotionName ?? '动态表情'}`}
      className="relative h-full w-full select-none overflow-hidden bg-[#222224]"
    >
      <ExpressionLayer frame={previousFrame} opacity={showNewFrame ? 0 : 1} />
      <ExpressionLayer frame={visibleFrame} opacity={showNewFrame ? 1 : 0} />

      {showMesh && (
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <g fill="none" stroke="rgba(113,183,255,0.9)" strokeDasharray="1.2 1.4" strokeWidth="0.42">
            <path d="M38 38 Q43 35.5 48 38 Q43 41 38 38Z" />
            <path d="M52 38 Q57 35.5 62 38 Q57 41 52 38Z" />
            <path d="M38 32 Q43 29 48 32" />
            <path d="M52 32 Q57 29 62 32" />
            <path d="M42 58 Q50 62 58 58" />
            <path d="M50 41 L46 51 L50 53 L54 51Z" />
          </g>
          <g fill="#71b7ff">
            <circle cx="43" cy="38" r="0.75" />
            <circle cx="57" cy="38" r="0.75" />
            <circle cx="50" cy="53" r="0.75" />
          </g>
          <g fill="#ff7183">
            <circle cx="42" cy="58" r="0.85" />
            <circle cx="58" cy="58" r="0.85" />
          </g>
        </svg>
      )}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,transparent_45%,rgba(0,0,0,0.16)_100%)]" />
    </div>
  );
};

void ImageMannequinHeadViewport;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const gazeOffset: Record<FacialState['eye']['direction'], { x: number; y: number }> = {
  'direct gaze': { x: 0, y: 0 },
  'avoid gaze': { x: -1, y: 0.35 },
  'cold stare': { x: 0, y: -0.12 },
  'soft gaze': { x: 0, y: 0.18 },
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
  side: { x: 1, y: 0 },
};

const mouthStateScale: Record<FacialState['mouth']['state'], number> = {
  neutral: 1,
  'pressed lips': 0.96,
  'slight opening': 1.06,
  smile: 1.025,
  trembling: 1.035,
};

const getPresetFacialState = (emotionName: string | undefined) =>
  EMOTION_PRESETS.find((preset) => preset.nameEn === emotionName)?.facialState;

const createCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const drawFeatheredPatch = (
  output: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  transform: {
    translateX?: number;
    translateY?: number;
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
  }
) => {
  const patch = createCanvas(source.width, source.height);
  const patchContext = patch.getContext('2d');
  if (!patchContext) return;

  patchContext.imageSmoothingEnabled = true;
  patchContext.imageSmoothingQuality = 'high';
  patchContext.save();
  patchContext.translate(
    centerX + (transform.translateX ?? 0),
    centerY + (transform.translateY ?? 0)
  );
  patchContext.rotate(transform.rotation ?? 0);
  patchContext.scale(transform.scaleX ?? 1, transform.scaleY ?? 1);
  patchContext.translate(-centerX, -centerY);
  patchContext.drawImage(source, 0, 0);
  patchContext.restore();

  patchContext.globalCompositeOperation = 'destination-in';
  patchContext.save();
  patchContext.translate(centerX, centerY);
  patchContext.scale(1, radiusY / radiusX);
  const mask = patchContext.createRadialGradient(0, 0, radiusX * 0.46, 0, 0, radiusX);
  mask.addColorStop(0, 'rgba(0,0,0,1)');
  mask.addColorStop(0.7, 'rgba(0,0,0,0.9)');
  mask.addColorStop(1, 'rgba(0,0,0,0)');
  patchContext.fillStyle = mask;
  patchContext.fillRect(-radiusX, -radiusX, radiusX * 2, radiusX * 2);
  patchContext.restore();
  patchContext.globalCompositeOperation = 'source-over';

  output.drawImage(patch, 0, 0);
};

interface DrawnFrameGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

const drawHighFidelityFrame = (
  output: CanvasRenderingContext2D,
  image: HTMLImageElement,
  frame: VisibleFrame,
  width: number,
  height: number,
  facialState: FacialState,
  emotionName: string | undefined,
  opacity: number,
  applyControls: boolean
): DrawnFrameGeometry => {
  const sheet = SHEETS[frame.sheet];
  const sourceWidth = image.naturalWidth / 5;
  const sourceHeight = image.naturalHeight / 2;
  const sourceX = frame.column * sourceWidth;
  const sourceY = (frame.gender === 'female' ? 1 : 0) * sourceHeight;
  const drawHeight = height * sheet.zoom;
  const drawWidth = drawHeight * (sourceWidth / sourceHeight);
  const drawX = (width - drawWidth) / 2;
  const drawY = (height - drawHeight) / 2;
  const base = createCanvas(width, height);
  const baseContext = base.getContext('2d');
  if (!baseContext) return { x: drawX, y: drawY, width: drawWidth, height: drawHeight };

  baseContext.fillStyle = '#222224';
  baseContext.fillRect(0, 0, width, height);
  baseContext.imageSmoothingEnabled = true;
  baseContext.imageSmoothingQuality = 'high';
  baseContext.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    drawX,
    drawY,
    drawWidth,
    drawHeight
  );

  let finalFrame = base;
  let headRotation = 0;
  const baseline = getPresetFacialState(emotionName);

  if (applyControls && baseline) {
    const warped = createCanvas(width, height);
    const warpedContext = warped.getContext('2d');
    if (warpedContext) {
      warpedContext.drawImage(base, 0, 0);

      const opennessDelta = facialState.eye.openness - baseline.eye.openness;
      const asymmetryDelta = (facialState.eye.asymmetry ?? 0) - (baseline.eye.asymmetry ?? 0);
      const eyeScale = clamp(1 + opennessDelta / 520, 0.92, 1.08);
      const leftEyeScale = clamp(eyeScale - asymmetryDelta / 900, 0.9, 1.1);
      const rightEyeScale = clamp(eyeScale + asymmetryDelta / 900, 0.9, 1.1);
      const currentGaze = gazeOffset[facialState.eye.direction];
      const baselineGaze = gazeOffset[baseline.eye.direction];
      const gazeX = (currentGaze.x - baselineGaze.x) * drawWidth * 0.008;
      const gazeY = (currentGaze.y - baselineGaze.y) * drawHeight * 0.006;

      drawFeatheredPatch(
        warpedContext,
        base,
        drawX + drawWidth * 0.405,
        drawY + drawHeight * 0.344,
        drawWidth * 0.085,
        drawHeight * 0.048,
        { translateX: gazeX, translateY: gazeY, scaleY: leftEyeScale }
      );
      drawFeatheredPatch(
        warpedContext,
        base,
        drawX + drawWidth * 0.595,
        drawY + drawHeight * 0.344,
        drawWidth * 0.085,
        drawHeight * 0.048,
        { translateX: gazeX, translateY: gazeY, scaleY: rightEyeScale }
      );

      const eyebrowHeightDelta = facialState.eyebrow.height - baseline.eyebrow.height;
      const eyebrowTensionDelta = facialState.eyebrow.tension - baseline.eyebrow.tension;
      const innerLiftDelta = (facialState.eyebrow.innerLift ?? 0) - (baseline.eyebrow.innerLift ?? 0);
      const browY = clamp(-eyebrowHeightDelta * drawHeight * 0.00028, -drawHeight * 0.025, drawHeight * 0.025);
      const browRotation = clamp(
        (eyebrowTensionDelta * 0.00045) - (innerLiftDelta * 0.00035),
        -0.045,
        0.045
      );

      drawFeatheredPatch(
        warpedContext,
        base,
        drawX + drawWidth * 0.405,
        drawY + drawHeight * 0.286,
        drawWidth * 0.105,
        drawHeight * 0.04,
        { translateY: browY, rotation: browRotation }
      );
      drawFeatheredPatch(
        warpedContext,
        base,
        drawX + drawWidth * 0.595,
        drawY + drawHeight * 0.286,
        drawWidth * 0.105,
        drawHeight * 0.04,
        { translateY: browY, rotation: -browRotation }
      );

      const curveDelta = facialState.mouth.curve - baseline.mouth.curve;
      const mouthAsymmetryDelta = (facialState.mouth.asymmetry ?? 0) - (baseline.mouth.asymmetry ?? 0);
      const mouthRotation = clamp(curveDelta * 0.00042, -0.04, 0.04);
      const asymmetryShift = clamp(
        mouthAsymmetryDelta * drawHeight * 0.00014,
        -drawHeight * 0.012,
        drawHeight * 0.012
      );
      const mouthScale = clamp(
        mouthStateScale[facialState.mouth.state] / mouthStateScale[baseline.mouth.state],
        0.95,
        1.06
      );

      drawFeatheredPatch(
        warpedContext,
        base,
        drawX + drawWidth * 0.455,
        drawY + drawHeight * 0.515,
        drawWidth * 0.11,
        drawHeight * 0.072,
        { translateY: -asymmetryShift, scaleY: mouthScale, rotation: mouthRotation }
      );
      drawFeatheredPatch(
        warpedContext,
        base,
        drawX + drawWidth * 0.545,
        drawY + drawHeight * 0.515,
        drawWidth * 0.11,
        drawHeight * 0.072,
        { translateY: asymmetryShift, scaleY: mouthScale, rotation: -mouthRotation }
      );

      finalFrame = warped;
      headRotation = clamp(
        (facialState.face.headTilt - baseline.face.headTilt) * 0.0018,
        -0.05,
        0.05
      );
    }
  }

  output.save();
  output.globalAlpha = opacity;
  output.translate(width / 2, height * 0.46);
  output.rotate(headRotation);
  output.translate(-width / 2, -height * 0.46);
  output.drawImage(finalFrame, 0, 0);
  output.restore();

  return { x: drawX, y: drawY, width: drawWidth, height: drawHeight };
};

const HighFidelityMannequinViewport: React.FC<MannequinHeadViewportProps> = ({
  facialState,
  gender = 'male',
  emotionName,
  showMesh = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0, pixelRatio: 1 });
  const [sheetImages, setSheetImages] = useState<HTMLImageElement[]>([]);
  const targetFrame = useMemo(
    () => resolveFrame(emotionName, facialState, gender as MannequinGender),
    [emotionName, facialState, gender]
  );
  const targetKey = getFrameKey(targetFrame);
  const [visibleFrame, setVisibleFrame] = useState<VisibleFrame>(targetFrame);
  const [previousFrame, setPreviousFrame] = useState<VisibleFrame>(targetFrame);
  const [blend, setBlend] = useState(1);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      SHEETS.map(
        ({ src }) => new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.decoding = 'async';
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error(`Failed to load ${src}`));
          image.src = src;
        })
      )
    ).then((images) => {
      if (!cancelled) setSheetImages(images);
    }).catch(() => {
      if (!cancelled) setSheetImages([]);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setViewport({
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height)),
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (targetKey === getFrameKey(visibleFrame)) return;
    setPreviousFrame(visibleFrame);
    setVisibleFrame(targetFrame);
    setBlend(0);
    const startedAt = performance.now();
    let animationFrame = 0;
    const animate = (now: number) => {
      const progress = clamp((now - startedAt) / 260, 0, 1);
      setBlend(1 - Math.pow(1 - progress, 3));
      if (progress < 1) animationFrame = window.requestAnimationFrame(animate);
    };
    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [targetKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !viewport.width || !viewport.height || !sheetImages.length) return;
    const width = Math.round(viewport.width * viewport.pixelRatio);
    const height = Math.round(viewport.height * viewport.pixelRatio);
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.fillStyle = '#222224';
    context.fillRect(0, 0, width, height);

    if (blend < 1) {
      drawHighFidelityFrame(
        context,
        sheetImages[previousFrame.sheet],
        previousFrame,
        width,
        height,
        facialState,
        emotionName,
        1 - blend,
        false
      );
    }
    const geometry = drawHighFidelityFrame(
      context,
      sheetImages[visibleFrame.sheet],
      visibleFrame,
      width,
      height,
      facialState,
      emotionName,
      blend,
      true
    );

    if (showMesh) {
      const point = (x: number, y: number) => ({
        x: geometry.x + geometry.width * x,
        y: geometry.y + geometry.height * y,
      });
      const leftEye = point(0.405, 0.344);
      const rightEye = point(0.595, 0.344);
      const nose = point(0.5, 0.445);
      const mouthLeft = point(0.42, 0.515);
      const mouthRight = point(0.58, 0.515);
      context.save();
      context.strokeStyle = 'rgba(113,183,255,0.9)';
      context.fillStyle = '#71b7ff';
      context.lineWidth = Math.max(1, width * 0.0012);
      context.setLineDash([width * 0.005, width * 0.005]);
      context.beginPath();
      context.moveTo(leftEye.x, leftEye.y);
      context.lineTo(nose.x, nose.y);
      context.lineTo(rightEye.x, rightEye.y);
      context.moveTo(nose.x, nose.y);
      context.lineTo(mouthLeft.x, mouthLeft.y);
      context.lineTo(mouthRight.x, mouthRight.y);
      context.closePath();
      context.stroke();
      [leftEye, rightEye, nose].forEach(({ x, y }) => {
        context.beginPath();
        context.arc(x, y, Math.max(3, width * 0.003), 0, Math.PI * 2);
        context.fill();
      });
      context.fillStyle = '#ff7183';
      [mouthLeft, mouthRight].forEach(({ x, y }) => {
        context.beginPath();
        context.arc(x, y, Math.max(3, width * 0.0034), 0, Math.PI * 2);
        context.fill();
      });
      context.restore();
    }
  }, [
    blend,
    emotionName,
    facialState,
    previousFrame,
    sheetImages,
    showMesh,
    viewport,
    visibleFrame,
  ]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`${gender === 'female' ? '高精度女性' : '高精度男性'}灰模，${emotionName ?? '动态表情'}`}
      className="relative h-full w-full select-none overflow-hidden bg-[#222224]"
    >
      <canvas
        ref={canvasRef}
        data-mannequin-canvas="true"
        className="block h-full w-full"
      />
      {!sheetImages.length && (
        <div className="absolute inset-0 grid place-items-center text-sm text-white/45">
          正在载入高精度灰模…
        </div>
      )}
    </div>
  );
};

export const MannequinHeadViewport: React.FC<MannequinHeadViewportProps> = ({
  facialState,
  gender = 'male',
  emotionName,
  showMesh = false,
}) => (
  <ThreeMannequinViewport
    facialState={facialState}
    gender={gender}
    emotionName={emotionName}
    showMesh={showMesh}
  />
);
