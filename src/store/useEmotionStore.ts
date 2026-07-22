import { create } from 'zustand';
import {
  Character,
  EmotionKeyframe,
  EmotionPreset,
  EmotionVector,
  FacialState,
  GeneratedPrompts,
} from '../types';
import {
  DEFAULT_CHARACTERS,
  EMOTION_PRESETS,
  computeFacialStateFromVector,
  deriveEmotionLabelFromVector,
} from '../data/presets';
import { buildConcretePerformancePrompt, buildTimelinePerformancePrompt } from '../utils/promptBuilder';

const INITIAL_KEYFRAMES: EmotionKeyframe[] = [
  {
    id: 'kf-0',
    time: 0,
    emotionVector: { valence: 10, arousal: -60, distance: 0 },
    facialState: computeFacialStateFromVector({ valence: 10, arousal: -60, distance: 0 }),
    label: '0s 平静淡然',
  },
  {
    id: 'kf-8',
    time: 8,
    emotionVector: { valence: 30, arousal: 20, distance: 30 },
    facialState: computeFacialStateFromVector({ valence: 30, arousal: 20, distance: 30 }),
    label: '8s 疑虑警惕',
  },
  {
    id: 'kf-18',
    time: 18,
    emotionVector: { valence: 60, arousal: 70, distance: 40 },
    facialState: computeFacialStateFromVector({ valence: 60, arousal: 70, distance: 40 }),
    label: '18s 克制愤怒',
  },
  {
    id: 'kf-30',
    time: 30,
    emotionVector: { valence: -30, arousal: -50, distance: -10 },
    facialState: computeFacialStateFromVector({ valence: -30, arousal: -50, distance: -10 }),
    label: '30s 释然放下',
  },
];

interface EmotionStore {
  // Characters
  characters: Character[];
  activeCharacterId: string;
  activeCharacter: Character;
  setActiveCharacterId: (id: string) => void;
  addCharacter: (character: Character) => void;
  updateActiveCharacter: (updates: Partial<Character>) => void;

  // Render settings
  renderQuality: '1K' | '2K' | '4K';
  setRenderQuality: (quality: '1K' | '2K' | '4K') => void;

  // Emotion Vector & State
  vector: EmotionVector;
  facialState: FacialState;
  activePresetId: string | null;

  setVector: (newVector: EmotionVector, syncFacial?: boolean) => void;
  setFacialState: (newState: FacialState) => void;
  updateEyeParam: <K extends keyof FacialState['eye']>(key: K, value: FacialState['eye'][K]) => void;
  updateEyebrowParam: <K extends keyof FacialState['eyebrow']>(key: K, value: FacialState['eyebrow'][K]) => void;
  updateMouthParam: <K extends keyof FacialState['mouth']>(key: K, value: FacialState['mouth'][K]) => void;
  updateFaceParam: <K extends keyof FacialState['face']>(key: K, value: FacialState['face'][K]) => void;

  applyPreset: (presetId: string) => void;

  // Timeline / Animation Mode
  keyframes: EmotionKeyframe[];
  currentTime: number;
  isPlayingTimeline: boolean;
  addKeyframe: (time?: number) => void;
  updateKeyframe: (id: string, updates: Partial<EmotionKeyframe>) => void;
  removeKeyframe: (id: string) => void;
  setCurrentTime: (time: number) => void;
  setIsPlayingTimeline: (playing: boolean) => void;

  // Prompts & AI Analysis
  generatedPrompts: GeneratedPrompts;
  isAiAnalyzing: boolean;
  isGeneratingPrompts: boolean;
  aiError: string | null;

  generatePrompts: () => Promise<void>;
  analyzeCharacterWithAI: (targetText?: string) => Promise<void>;

  // Skill Sandbox modal
  isSkillModalOpen: boolean;
  setIsSkillModalOpen: (open: boolean) => void;

  // Reset
  resetToDefault: () => void;
}

const computePromptsForState = (
  vector: EmotionVector,
  facialState: FacialState,
  character: Character,
  presetId?: string | null,
  renderQuality: string = '2K'
) => {
  const concrete = buildConcretePerformancePrompt(vector, facialState, character, presetId);
  const cameraPart = `电影级演播室专业柔光, 85mm人像定焦镜头, f/1.4大光圈, 浅景深景别, ${renderQuality} 高清微对比度画质, ambient light drift`;
  const charPart = `高清特写肖像电影画面：${character.name}, ${character.gender}, ${character.age}岁, ${character.style}. ${concrete.emotionPrompt}`;

  return {
    emotionPrompt: concrete.emotionPrompt,
    cameraPrompt: cameraPart,
    characterPrompt: charPart,
    videoMotionPrompt: concrete.videoMotionPrompt,
    directorNotes: concrete.directorNotes,
  };
};

const defaultVector: EmotionVector = { valence: 0, arousal: 0, distance: 0 };
const defaultFacial = EMOTION_PRESETS[0].facialState;

export const useEmotionStore = create<EmotionStore>((set, get) => ({
  characters: DEFAULT_CHARACTERS,
  activeCharacterId: DEFAULT_CHARACTERS[0].id,
  activeCharacter: DEFAULT_CHARACTERS[0],

  setActiveCharacterId: (id) => {
    set((state) => {
      const char = state.characters.find((c) => c.id === id) || state.characters[0];
      const prompts = computePromptsForState(
        state.vector,
        state.facialState,
        char,
        state.activePresetId,
        state.renderQuality
      );

      return {
        activeCharacterId: char.id,
        activeCharacter: char,
        generatedPrompts: {
          ...prompts,
          timelineMotionPrompt: buildTimelinePerformancePrompt(state.keyframes, char),
        },
      };
    });
  },

  addCharacter: (character) => {
    set((state) => ({
      characters: [character, ...state.characters],
      activeCharacterId: character.id,
      activeCharacter: character,
    }));
  },

  updateActiveCharacter: (updates) => {
    set((state) => {
      const updatedList = state.characters.map((c) =>
        c.id === state.activeCharacterId ? { ...c, ...updates } : c
      );
      const updatedActive = { ...state.activeCharacter, ...updates };
      return { characters: updatedList, activeCharacter: updatedActive };
    });
  },

  renderQuality: '2K',
  setRenderQuality: (renderQuality) => set({ renderQuality }),

  vector: defaultVector,
  facialState: defaultFacial,
  activePresetId: 'preset-1',

  setVector: (newVector, syncFacial = true) => {
    set((state) => {
      const targetCol = Math.round((newVector.valence + 100) / 50);
      const targetRow = Math.round((100 - newVector.arousal) / 50);

      const matchingPreset = EMOTION_PRESETS.find((p) => {
        const pCol = Math.round((p.vector.valence + 100) / 50);
        const pRow = Math.round((100 - p.vector.arousal) / 50);
        return pCol === targetCol && pRow === targetRow;
      });

      const presetId = matchingPreset ? matchingPreset.id : null;
      const newFacial = syncFacial
        ? matchingPreset?.facialState ?? computeFacialStateFromVector(newVector)
        : state.facialState;
      const newPrompts = computePromptsForState(newVector, newFacial, state.activeCharacter, presetId, state.renderQuality);

      return {
        vector: newVector,
        facialState: newFacial,
        activePresetId: presetId,
        generatedPrompts: newPrompts,
      };
    });
  },

  setFacialState: (facialState) => set((state) => ({
    facialState,
    generatedPrompts: computePromptsForState(state.vector, facialState, state.activeCharacter, state.activePresetId, state.renderQuality),
  })),

  updateEyeParam: (key, value) => {
    set((state) => {
      const newFacial = {
        ...state.facialState,
        eye: { ...state.facialState.eye, [key]: value },
      };
      return {
        facialState: newFacial,
        activePresetId: null,
        generatedPrompts: computePromptsForState(state.vector, newFacial, state.activeCharacter, null, state.renderQuality),
      };
    });
  },

  updateEyebrowParam: (key, value) => {
    set((state) => {
      const newFacial = {
        ...state.facialState,
        eyebrow: { ...state.facialState.eyebrow, [key]: value },
      };
      return {
        facialState: newFacial,
        activePresetId: null,
        generatedPrompts: computePromptsForState(state.vector, newFacial, state.activeCharacter, null, state.renderQuality),
      };
    });
  },

  updateMouthParam: (key, value) => {
    set((state) => {
      const newFacial = {
        ...state.facialState,
        mouth: { ...state.facialState.mouth, [key]: value },
      };
      return {
        facialState: newFacial,
        activePresetId: null,
        generatedPrompts: computePromptsForState(state.vector, newFacial, state.activeCharacter, null, state.renderQuality),
      };
    });
  },

  updateFaceParam: (key, value) => {
    set((state) => {
      const newFacial = {
        ...state.facialState,
        face: { ...state.facialState.face, [key]: value },
      };
      return {
        facialState: newFacial,
        activePresetId: null,
        generatedPrompts: computePromptsForState(state.vector, newFacial, state.activeCharacter, null, state.renderQuality),
      };
    });
  },

  applyPreset: (presetId) => {
    const preset = EMOTION_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      set((state) => ({
        vector: preset.vector,
        facialState: preset.facialState,
        activePresetId: presetId,
        generatedPrompts: computePromptsForState(preset.vector, preset.facialState, state.activeCharacter, presetId, state.renderQuality),
      }));
    }
  },

  // Keyframe timeline
  keyframes: INITIAL_KEYFRAMES,
  currentTime: 0,
  isPlayingTimeline: false,

  addKeyframe: (time) => {
    const state = get();
    const t = time !== undefined ? time : state.currentTime;
    const info = deriveEmotionLabelFromVector(state.vector);
    const newKf: EmotionKeyframe = {
      id: `kf-${Date.now()}`,
      time: parseFloat(t.toFixed(1)),
      emotionVector: { ...state.vector },
      facialState: JSON.parse(JSON.stringify(state.facialState)),
      label: `${t.toFixed(1)}s ${info.title}`,
    };

    const updated = [...state.keyframes.filter((k) => Math.abs(k.time - t) > 0.1), newKf].sort(
      (a, b) => a.time - b.time
    );

    set({
      keyframes: updated,
      generatedPrompts: {
        ...state.generatedPrompts,
        timelineMotionPrompt: buildTimelinePerformancePrompt(updated, state.activeCharacter),
      },
    });
  },

  updateKeyframe: (id, updates) => {
    const state = get();
    const updated = state.keyframes
      .map((k) => (k.id === id ? { ...k, ...updates } : k))
      .sort((a, b) => a.time - b.time);

    set({
      keyframes: updated,
      generatedPrompts: {
        ...state.generatedPrompts,
        timelineMotionPrompt: buildTimelinePerformancePrompt(updated, state.activeCharacter),
      },
    });
  },

  removeKeyframe: (id) => {
    const state = get();
    const updated = state.keyframes.filter((k) => k.id !== id);

    set({
      keyframes: updated,
      generatedPrompts: {
        ...state.generatedPrompts,
        timelineMotionPrompt: buildTimelinePerformancePrompt(updated, state.activeCharacter),
      },
    });
  },

  setCurrentTime: (currentTime) => {
    set({ currentTime });

    // Interpolate keyframe parameters if timeline is being navigated
    const kfs = get().keyframes;
    if (kfs.length === 0) return;

    if (currentTime <= kfs[0].time) {
      set({ vector: kfs[0].emotionVector, facialState: kfs[0].facialState });
      return;
    }
    if (currentTime >= kfs[kfs.length - 1].time) {
      const last = kfs[kfs.length - 1];
      set({ vector: last.emotionVector, facialState: last.facialState });
      return;
    }

    // Find bounding keyframes
    let prev = kfs[0];
    let next = kfs[kfs.length - 1];
    for (let i = 0; i < kfs.length - 1; i++) {
      if (currentTime >= kfs[i].time && currentTime <= kfs[i + 1].time) {
        prev = kfs[i];
        next = kfs[i + 1];
        break;
      }
    }

    const duration = next.time - prev.time;
    const factor = duration > 0 ? (currentTime - prev.time) / duration : 0;

    // Keep interpolation as floating point data so the face and playhead do not
    // jump between whole-number parameter values during playback.
    const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

    const interpVector: EmotionVector = {
      valence: lerp(prev.emotionVector.valence, next.emotionVector.valence, factor),
      arousal: lerp(prev.emotionVector.arousal, next.emotionVector.arousal, factor),
      distance: lerp(prev.emotionVector.distance, next.emotionVector.distance, factor),
    };

    const interpFacial: FacialState = {
      eye: {
        openness: lerp(prev.facialState.eye.openness, next.facialState.eye.openness, factor),
        focus: lerp(prev.facialState.eye.focus, next.facialState.eye.focus, factor),
        direction: factor > 0.5 ? next.facialState.eye.direction : prev.facialState.eye.direction,
        asymmetry: lerp(prev.facialState.eye.asymmetry ?? 0, next.facialState.eye.asymmetry ?? 0, factor),
      },
      eyebrow: {
        tension: lerp(prev.facialState.eyebrow.tension, next.facialState.eyebrow.tension, factor),
        height: lerp(prev.facialState.eyebrow.height, next.facialState.eyebrow.height, factor),
        innerLift: lerp(prev.facialState.eyebrow.innerLift ?? 0, next.facialState.eyebrow.innerLift ?? 0, factor),
      },
      mouth: {
        curve: lerp(prev.facialState.mouth.curve, next.facialState.mouth.curve, factor),
        tension: lerp(prev.facialState.mouth.tension, next.facialState.mouth.tension, factor),
        state: factor > 0.5 ? next.facialState.mouth.state : prev.facialState.mouth.state,
        asymmetry: lerp(prev.facialState.mouth.asymmetry ?? 0, next.facialState.mouth.asymmetry ?? 0, factor),
      },
      face: {
        muscleTension: lerp(prev.facialState.face.muscleTension, next.facialState.face.muscleTension, factor),
        headTilt: lerp(prev.facialState.face.headTilt, next.facialState.face.headTilt, factor),
        breathing: factor > 0.5 ? next.facialState.face.breathing : prev.facialState.face.breathing,
      },
    };

    set({ vector: interpVector, facialState: interpFacial });
  },

  setIsPlayingTimeline: (isPlayingTimeline) => set({ isPlayingTimeline }),

  // Prompts & AI
  generatedPrompts: (() => {
    const defaultConcrete = buildConcretePerformancePrompt(defaultVector, defaultFacial, DEFAULT_CHARACTERS[0]);
    return {
      emotionPrompt: defaultConcrete.emotionPrompt,
      cameraPrompt: '电影级演播室专业柔光, 85mm人像定焦镜头, f/1.4大光圈, 浅景深景别, 2K 高清微对比度画质, ambient light drift',
      characterPrompt: `高清特写肖像电影画面：${DEFAULT_CHARACTERS[0].name}, ${DEFAULT_CHARACTERS[0].gender}, ${DEFAULT_CHARACTERS[0].age}岁, ${DEFAULT_CHARACTERS[0].style}. ${defaultConcrete.emotionPrompt}`,
      videoMotionPrompt: defaultConcrete.videoMotionPrompt,
      timelineMotionPrompt: buildTimelinePerformancePrompt(INITIAL_KEYFRAMES, DEFAULT_CHARACTERS[0]),
      directorNotes: defaultConcrete.directorNotes,
    };
  })(),
  isAiAnalyzing: false,
  isGeneratingPrompts: false,
  aiError: null,

  generatePrompts: async () => {
    const { vector, facialState, activeCharacter, renderQuality, keyframes } = get();
    const info = deriveEmotionLabelFromVector(vector);
    const timelinePrompt = buildTimelinePerformancePrompt(keyframes, activeCharacter);

    set({ isGeneratingPrompts: true, aiError: null });

    try {
      const response = await fetch('/api/gemini/generate-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emotionVector: vector,
          facialState,
          emotionName: info.title,
          keywords: info.keywords,
          characterProfile: activeCharacter,
          renderQuality,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.result) {
          set({
            generatedPrompts: {
              emotionPrompt: data.result.emotionPrompt,
              cameraPrompt: data.result.cameraPrompt,
              characterPrompt: data.result.characterPrompt,
              videoMotionPrompt: data.result.videoMotionPrompt,
              timelineMotionPrompt: timelinePrompt,
              directorNotes: data.result.directorCritique,
            },
            isGeneratingPrompts: false,
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Backend prompt generation fallback used:', e);
    }

    // Fallback local prompt synthesis using concrete physical acting performance builder
    const concrete = buildConcretePerformancePrompt(vector, facialState, activeCharacter);
    const cameraPart = `电影级演播室专业柔光, 85mm人像定焦镜头, f/1.4大光圈, 浅景深景别, ${renderQuality} 高清微对比度画质, ambient light drift`;
    const charPart = `高清特写肖像电影画面：${activeCharacter.name}, ${activeCharacter.gender}, ${activeCharacter.age}岁, ${activeCharacter.style}. ${concrete.emotionPrompt}`;

    set({
      generatedPrompts: {
        emotionPrompt: concrete.emotionPrompt,
        cameraPrompt: cameraPart,
        characterPrompt: charPart,
        videoMotionPrompt: concrete.videoMotionPrompt,
        timelineMotionPrompt: timelinePrompt,
        directorNotes: concrete.directorNotes,
      },
      isGeneratingPrompts: false,
    });
  },

  analyzeCharacterWithAI: async (targetText) => {
    const { activeCharacter } = get();
    set({ isAiAnalyzing: true, aiError: null });

    try {
      const response = await fetch('/api/gemini/analyze-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: activeCharacter.image,
          targetEmotion: targetText || 'Analyze current character facial expression',
          characterProfile: activeCharacter,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.result) {
          const res = data.result;
          const newVec: EmotionVector = {
            valence: typeof res.valence === 'number' ? res.valence : 0,
            arousal: typeof res.arousal === 'number' ? res.arousal : 0,
            distance: typeof res.distance === 'number' ? res.distance : 0,
          };

          set({
            vector: newVec,
            facialState: res.facialState || computeFacialStateFromVector(newVec),
            isAiAnalyzing: false,
          });

          // Also trigger prompt update
          get().generatePrompts();
          return;
        }
      }
    } catch (e: any) {
      set({ aiError: e.message || 'AI analysis unavailable', isAiAnalyzing: false });
    }

    set({ isAiAnalyzing: false });
  },

  // Skill Sandbox modal
  isSkillModalOpen: false,
  setIsSkillModalOpen: (isSkillModalOpen) => set({ isSkillModalOpen }),

  resetToDefault: () => {
    set({
      vector: defaultVector,
      facialState: defaultFacial,
      activePresetId: 'preset-1',
    });
    get().generatePrompts();
  },
}));
