export interface Character {
  id: string;
  name: string;
  image: string;
  gender?: string;
  age?: string;
  style?: string;
  description?: string;
}

export interface EmotionVector {
  valence: number;  // X axis: -100 (亲近/Intimate) to +100 (疏离/Distant)
  arousal: number;  // Y axis: -100 (平静/Calm) to +100 (激动/Excited)
  distance: number; // Z-depth: -100 to +100
}

export interface EyeParams {
  openness: number;  // -50% to +50%
  focus: number;     // 0 to 100
  direction: 'direct gaze' | 'avoid gaze' | 'cold stare' | 'soft gaze' | 'down' | 'up' | 'side';
  asymmetry?: number; // -100 to +100, used for winks and uneven eyelid tension
}

export interface EyebrowParams {
  tension: number;  // 0 to 100
  height: number;   // -50 to +50
  innerLift?: number; // -100 to +100, separates sadness/fear from anger
}

export interface MouthParams {
  curve: number;    // -100 (frown) to +100 (smile)
  tension: number;  // 0 to 100
  state: 'pressed lips' | 'slight opening' | 'smile' | 'trembling' | 'neutral';
  asymmetry?: number; // -100 to +100, lifts one mouth corner for a smirk
}

export interface FaceParams {
  muscleTension: number; // 0 to 100
  headTilt: number;      // -30 to +30 degrees
  breathing: 'calm breathing' | 'fast breathing' | 'holding breath';
  tearLevel?: number;    // 0 to 100
  pupilSize?: number;    // -50 to +50
}

export interface FacialState {
  eye: EyeParams;
  eyebrow: EyebrowParams;
  mouth: MouthParams;
  face: FaceParams;
}

export interface EmotionPreset {
  id: string;
  name: string;
  nameEn: string;
  category: 'calm' | 'positive' | 'negative' | 'advanced';
  vector: EmotionVector;
  facialState: FacialState;
  description: string;
  keywords: string[];
}

export interface EmotionKeyframe {
  id: string;
  time: number; // in seconds, e.g. 0s to 10s
  emotionVector: EmotionVector;
  facialState: FacialState;
  label: string;
}

export interface GeneratedPrompts {
  emotionPrompt: string;
  cameraPrompt: string;
  characterPrompt: string;
  videoMotionPrompt: string;
  timelineMotionPrompt?: string;
  directorNotes?: string;
}

export interface SkillScenario {
  id: string;
  title: string;
  role: string;
  description: string;
  examplePrompt: string;
}
