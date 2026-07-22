import { Character, EmotionPreset, EmotionVector, FacialState } from '../types';

// Helper SVG Data URIs for realistic default character avatars
export const DEFAULT_CHARACTERS: Character[] = [
  {
    id: 'char-1',
    name: '陆沉 (霸总/CEO)',
    gender: '男',
    age: '28',
    style: '现代写实 / 商务精英',
    description: '面容冷峻，眼神深邃，穿着剪裁合身的深色西装。',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'char-2',
    name: '林微 (温柔主角)',
    gender: '女',
    age: '24',
    style: '都市情感 / 唯美写实',
    description: '眼神清澈温柔，微卷长发，气质优雅动人。',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'char-3',
    name: '楚风 (古装侠客)',
    gender: '男',
    age: '22',
    style: '国风仙侠 / 东方美学',
    description: '剑眉星目，长发束起，带着清冷高傲的武侠气质。',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'char-4',
    name: '墨影 (阴郁反派)',
    gender: '男',
    age: '32',
    style: '悬疑暗黑 / 戏剧张力',
    description: '眼神犀利充满压迫感，嘴角带有一丝克制的冷笑。',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'char-5',
    name: '星野 (赛博科幻)',
    gender: '女',
    age: '20',
    style: '赛博朋克 / 未来主义',
    description: '面无表情的AI仿生人，眼神疏离而精准。',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop',
  },
];

// Helper to compute facial state from Valence, Arousal, Distance
export function computeFacialStateFromVector(vector: EmotionVector): FacialState {
  const { valence, arousal, distance } = vector;

  // Eye openness: higher arousal = wider eye, negative arousal = drooping
  const eyeOpenness = Math.round(arousal * 0.35 - (valence > 50 ? 10 : 0));
  // Eye focus: high absolute arousal or distance = high focus
  const eyeFocus = Math.min(100, Math.max(10, Math.round(Math.abs(arousal) * 0.6 + Math.abs(distance) * 0.4)));
  
  // Eye direction:
  let direction: FacialState['eye']['direction'] = 'direct gaze';
  if (distance > 60 && arousal < 0) direction = 'cold stare';
  else if (valence < -50 && arousal < -20) direction = 'soft gaze';
  else if (valence > 40 && arousal < -40) direction = 'avoid gaze';
  else if (arousal < -70) direction = 'down';

  // Eyebrow tension: high arousal or high distance = high tension
  const eyebrowTension = Math.min(100, Math.max(0, Math.round(Math.abs(arousal) * 0.7 + (distance > 0 ? distance * 0.3 : 0))));
  // Eyebrow height: negative valence (intimate/warm) = relaxed lower, high negative arousal (sad) = raised inner brow
  const eyebrowHeight = Math.round((arousal * 0.3) - (valence * 0.2));

  // Mouth curve: valence negative (intimate/positive) = smile (+), valence positive (distant/sad/cold) = frown (-)
  // In our model: valence -100 is 親近 (intimate), +100 is 疏離 (distant). So curve = -valence
  let mouthCurve = Math.round(-valence * 0.8 + arousal * 0.2);
  mouthCurve = Math.max(-100, Math.min(100, mouthCurve));

  const mouthTension = Math.min(100, Math.max(0, Math.round(Math.abs(arousal) * 0.5 + Math.abs(valence) * 0.4)));

  let mouthState: FacialState['mouth']['state'] = 'neutral';
  if (mouthCurve > 35) mouthState = 'smile';
  else if (mouthTension > 60 && mouthCurve < -20) mouthState = 'pressed lips';
  else if (arousal > 60) mouthState = 'slight opening';
  else if (valence > 50 && arousal < -40) mouthState = 'pressed lips';

  // Face muscle tension & head tilt
  const muscleTension = Math.min(100, Math.max(0, Math.round(Math.abs(arousal) * 0.8 + Math.abs(distance) * 0.2)));
  const headTilt = Math.round((valence * 0.15) - (arousal * 0.1));

  let breathing: FacialState['face']['breathing'] = 'calm breathing';
  if (arousal > 50) breathing = 'fast breathing';
  else if (muscleTension > 70 && arousal > 20) breathing = 'holding breath';

  const tearLevel = Math.max(0, Math.round((arousal < -30 && valence > 30) ? (Math.abs(arousal) + valence) * 0.4 : 0));
  const pupilSize = Math.round(valence < 0 ? 20 : -15);

  return {
    eye: {
      openness: Math.max(-50, Math.min(50, eyeOpenness)),
      focus: eyeFocus,
      direction,
    },
    eyebrow: {
      tension: eyebrowTension,
      height: Math.max(-50, Math.min(50, eyebrowHeight)),
    },
    mouth: {
      curve: mouthCurve,
      tension: mouthTension,
      state: mouthState,
    },
    face: {
      muscleTension,
      headTilt: Math.max(-30, Math.min(30, headTilt)),
      breathing,
      tearLevel,
      pupilSize,
    },
  };
}

type FacialStateOverride = {
  eye?: Partial<FacialState['eye']>;
  eyebrow?: Partial<FacialState['eyebrow']>;
  mouth?: Partial<FacialState['mouth']>;
  face?: Partial<FacialState['face']>;
};

// Each named acting preset needs its own physical performance direction.
// Relational distance is not the same thing as happiness or sadness, so these
// overrides intentionally avoid deriving every expression from one formula.
const PRESET_FACIAL_OVERRIDES: Record<string, FacialStateOverride> = {
  'preset-1': {
    eye: { openness: 0, focus: 55, direction: 'direct gaze', asymmetry: 0 },
    eyebrow: { tension: 8, height: 0 },
    mouth: { curve: 2, tension: 8, state: 'neutral', asymmetry: 0 },
    face: { muscleTension: 8, headTilt: 0, breathing: 'calm breathing', tearLevel: 0, pupilSize: 0 },
  },
  'preset-2': {
    eye: { openness: -14, focus: 76, direction: 'down', asymmetry: 0 },
    eyebrow: { tension: 42, height: -6 },
    mouth: { curve: -4, tension: 32, state: 'pressed lips', asymmetry: 0 },
    face: { muscleTension: 28, headTilt: -7, breathing: 'calm breathing', tearLevel: 0, pupilSize: -5 },
  },
  'preset-3': {
    eye: { openness: -7, focus: 92, direction: 'cold stare', asymmetry: 0 },
    eyebrow: { tension: 38, height: -10 },
    mouth: { curve: 0, tension: 58, state: 'pressed lips', asymmetry: 0 },
    face: { muscleTension: 50, headTilt: 3, breathing: 'calm breathing', tearLevel: 0, pupilSize: -15 },
  },
  'preset-4': {
    eye: { openness: -40, focus: 20, direction: 'down', asymmetry: 8 },
    eyebrow: { tension: 12, height: -13 },
    mouth: { curve: -12, tension: 12, state: 'slight opening', asymmetry: 5 },
    face: { muscleTension: 8, headTilt: -9, breathing: 'calm breathing', tearLevel: 0, pupilSize: -8 },
  },
  'preset-5': {
    eye: { openness: -10, focus: 52, direction: 'soft gaze', asymmetry: 0 },
    eyebrow: { tension: 4, height: 5 },
    mouth: { curve: 28, tension: 6, state: 'smile', asymmetry: 0 },
    face: { muscleTension: 4, headTilt: 4, breathing: 'calm breathing', tearLevel: 0, pupilSize: 12 },
  },
  'preset-6': {
    eye: { openness: 20, focus: 78, direction: 'direct gaze', asymmetry: 0 },
    eyebrow: { tension: 12, height: 22 },
    mouth: { curve: 88, tension: 28, state: 'smile', asymmetry: 0 },
    face: { muscleTension: 32, headTilt: -3, breathing: 'fast breathing', tearLevel: 0, pupilSize: 28 },
  },
  'preset-7': {
    eye: { openness: 12, focus: 72, direction: 'soft gaze', asymmetry: 0 },
    eyebrow: { tension: 8, height: 15 },
    mouth: { curve: 32, tension: 8, state: 'smile', asymmetry: 0 },
    face: { muscleTension: 10, headTilt: 4, breathing: 'calm breathing', tearLevel: 0, pupilSize: 22 },
  },
  'preset-8': {
    eye: { openness: -6, focus: 74, direction: 'soft gaze', asymmetry: 0 },
    eyebrow: { tension: 4, height: 10 },
    mouth: { curve: 48, tension: 8, state: 'smile', asymmetry: 8 },
    face: { muscleTension: 8, headTilt: 6, breathing: 'calm breathing', tearLevel: 0, pupilSize: 30 },
  },
  'preset-9': {
    eye: { openness: 46, focus: 82, direction: 'direct gaze', asymmetry: 0 },
    eyebrow: { tension: 30, height: 40 },
    mouth: { curve: 62, tension: 32, state: 'smile', asymmetry: 0 },
    face: { muscleTension: 68, headTilt: -5, breathing: 'fast breathing', tearLevel: 0, pupilSize: 38 },
  },
  'preset-10': {
    eye: { openness: -20, focus: 42, direction: 'down', asymmetry: 0 },
    eyebrow: { tension: 28, height: 20, innerLift: 48 },
    mouth: { curve: -38, tension: 28, state: 'neutral', asymmetry: 0 },
    face: { muscleTension: 24, headTilt: -6, breathing: 'calm breathing', tearLevel: 18, pupilSize: 5 },
  },
  'preset-11': {
    eye: { openness: -28, focus: 28, direction: 'down', asymmetry: 6 },
    eyebrow: { tension: 52, height: 36, innerLift: 86 },
    mouth: { curve: -82, tension: 44, state: 'trembling', asymmetry: -6 },
    face: { muscleTension: 42, headTilt: -11, breathing: 'holding breath', tearLevel: 95, pupilSize: 18 },
  },
  'preset-12': {
    eye: { openness: -10, focus: 100, direction: 'cold stare', asymmetry: 0 },
    eyebrow: { tension: 94, height: -36, innerLift: -72 },
    mouth: { curve: -42, tension: 100, state: 'pressed lips', asymmetry: 0 },
    face: { muscleTension: 96, headTilt: 2, breathing: 'holding breath', tearLevel: 0, pupilSize: -28 },
  },
  'preset-13': {
    eye: { openness: 50, focus: 92, direction: 'avoid gaze', asymmetry: 10 },
    eyebrow: { tension: 66, height: 44, innerLift: 74 },
    mouth: { curve: -15, tension: 58, state: 'slight opening', asymmetry: 0 },
    face: { muscleTension: 90, headTilt: -8, breathing: 'fast breathing', tearLevel: 20, pupilSize: 42 },
  },
  'preset-14': {
    eye: { openness: -26, focus: 34, direction: 'avoid gaze', asymmetry: 0 },
    eyebrow: { tension: 40, height: 12, innerLift: 38 },
    mouth: { curve: -48, tension: 58, state: 'pressed lips', asymmetry: -5 },
    face: { muscleTension: 38, headTilt: -7, breathing: 'calm breathing', tearLevel: 12, pupilSize: -5 },
  },
  'preset-15': {
    eye: { openness: -14, focus: 96, direction: 'cold stare', asymmetry: 0 },
    eyebrow: { tension: 44, height: -17 },
    mouth: { curve: 0, tension: 68, state: 'pressed lips', asymmetry: 0 },
    face: { muscleTension: 62, headTilt: 9, breathing: 'calm breathing', tearLevel: 0, pupilSize: -25 },
  },
  'preset-16': {
    eye: { openness: 38, focus: 100, direction: 'direct gaze', asymmetry: 5 },
    eyebrow: { tension: 64, height: -6, innerLift: -24 },
    mouth: { curve: 42, tension: 58, state: 'smile', asymmetry: 10 },
    face: { muscleTension: 88, headTilt: 8, breathing: 'fast breathing', tearLevel: 0, pupilSize: 48 },
  },
  'preset-17': {
    eye: { openness: -22, focus: 42, direction: 'down', asymmetry: 0 },
    eyebrow: { tension: 34, height: 24, innerLift: 56 },
    mouth: { curve: -40, tension: 24, state: 'neutral', asymmetry: 0 },
    face: { muscleTension: 25, headTilt: -6, breathing: 'calm breathing', tearLevel: 26, pupilSize: 8 },
  },
  'preset-18': {
    eye: { openness: -12, focus: 100, direction: 'cold stare', asymmetry: -5 },
    eyebrow: { tension: 92, height: -34, innerLift: -78 },
    mouth: { curve: 20, tension: 62, state: 'smile', asymmetry: 22 },
    face: { muscleTension: 92, headTilt: 11, breathing: 'holding breath', tearLevel: 0, pupilSize: -30 },
  },
  'preset-19': {
    eye: { openness: -18, focus: 82, direction: 'cold stare', asymmetry: 0 },
    eyebrow: { tension: 8, height: 8 },
    mouth: { curve: 0, tension: 24, state: 'neutral', asymmetry: 0 },
    face: { muscleTension: 18, headTilt: 3, breathing: 'calm breathing', tearLevel: 0, pupilSize: -15 },
  },
  'preset-20': {
    eye: { openness: -4, focus: 100, direction: 'direct gaze', asymmetry: 0 },
    eyebrow: { tension: 0, height: 0 },
    mouth: { curve: 0, tension: 4, state: 'neutral', asymmetry: 0 },
    face: { muscleTension: 0, headTilt: 0, breathing: 'calm breathing', tearLevel: 0, pupilSize: -38 },
  },
  'preset-21': {
    eye: { openness: -50, focus: 10, direction: 'down', asymmetry: 0 },
    eyebrow: { tension: 0, height: 0 },
    mouth: { curve: 8, tension: 0, state: 'neutral', asymmetry: 0 },
    face: { muscleTension: 0, headTilt: 0, breathing: 'calm breathing', tearLevel: 0, pupilSize: 0 },
  },
  'preset-22': {
    eye: { openness: 2, focus: 92, direction: 'direct gaze', asymmetry: 0 },
    eyebrow: { tension: 18, height: 13 },
    mouth: { curve: 42, tension: 34, state: 'smile', asymmetry: 16 },
    face: { muscleTension: 45, headTilt: 9, breathing: 'calm breathing', tearLevel: 0, pupilSize: 12 },
  },
  'preset-23': {
    eye: { openness: 18, focus: 78, direction: 'side', asymmetry: 34 },
    eyebrow: { tension: 12, height: 22 },
    mouth: { curve: 52, tension: 20, state: 'smile', asymmetry: 16 },
    face: { muscleTension: 34, headTilt: -8, breathing: 'fast breathing', tearLevel: 0, pupilSize: 30 },
  },
  'preset-24': {
    eye: { openness: -20, focus: 95, direction: 'cold stare', asymmetry: -12 },
    eyebrow: { tension: 42, height: -18 },
    mouth: { curve: 10, tension: 62, state: 'pressed lips', asymmetry: 24 },
    face: { muscleTension: 62, headTilt: 12, breathing: 'calm breathing', tearLevel: 0, pupilSize: -26 },
  },
  'preset-25': {
    eye: { openness: 50, focus: 100, direction: 'direct gaze', asymmetry: -8 },
    eyebrow: { tension: 94, height: 30, innerLift: -18 },
    mouth: { curve: 58, tension: 62, state: 'smile', asymmetry: 8 },
    face: { muscleTension: 100, headTilt: -7, breathing: 'fast breathing', tearLevel: 0, pupilSize: 48 },
  },
};

const buildPresetFacialState = (presetId: string, vector: EmotionVector): FacialState => {
  const base = computeFacialStateFromVector(vector);
  const overrides = PRESET_FACIAL_OVERRIDES[presetId] ?? {};
  return {
    eye: { ...base.eye, ...overrides.eye },
    eyebrow: { ...base.eyebrow, ...overrides.eyebrow },
    mouth: { ...base.mouth, ...overrides.mouth },
    face: { ...base.face, ...overrides.face },
  };
};

// 20+ Comprehensive Emotion Presets
export const EMOTION_PRESETS: EmotionPreset[] = [
  // --- 平静类 Calm ---
  {
    id: 'preset-1',
    name: '淡然自若',
    nameEn: 'Calm & Composed',
    category: 'calm',
    vector: { valence: 0, arousal: 0, distance: 0 },
    facialState: buildPresetFacialState('preset-1', { valence: 0, arousal: 0, distance: 0 }),
    description: '内心波澜不惊，眼神温和平视，面部肌肉完全放松。',
    keywords: ['平静从容神态', '柔和放松双眼', '自然泰然神色', '沉稳呼吸'],
  },
  {
    id: 'preset-2',
    name: '沉思',
    nameEn: 'Deep Contemplation',
    category: 'calm',
    vector: { valence: 0, arousal: -50, distance: 30 },
    facialState: buildPresetFacialState('preset-2', { valence: 0, arousal: -50, distance: 30 }),
    description: '目光向下方聚焦，眉头微蹙，带着思考的沉静。',
    keywords: ['沉思凝视', '眼神低垂', '深思专注神情', '眉宇微敛'],
  },
  {
    id: 'preset-3',
    name: '冷静理智',
    nameEn: 'Analytical Coldness',
    category: 'calm',
    vector: { valence: -100, arousal: -50, distance: 50 },
    facialState: buildPresetFacialState('preset-3', { valence: -100, arousal: -50, distance: 50 }),
    description: '视线冷峻专注，嘴唇紧闭，带有清醒的逻辑洞察力。',
    keywords: ['冷静理智目光', '专注锐利眼神', '紧闭中性双唇', '克制沉稳'],
  },
  {
    id: 'preset-4',
    name: '疲惫倦怠',
    nameEn: 'Weary Fatigue',
    category: 'calm',
    vector: { valence: -50, arousal: -100, distance: 20 },
    facialState: buildPresetFacialState('preset-4', { valence: -50, arousal: -100, distance: 20 }),
    description: '眼皮微垂，眼神缺乏焦点，呼吸缓慢深沉。',
    keywords: ['疲惫无神双眼', '眼皮耷拉', '倦怠神情', '叹息沉吟'],
  },
  {
    id: 'preset-5',
    name: '释然放下',
    nameEn: 'Relieved Peace',
    category: 'calm',
    vector: { valence: -50, arousal: 0, distance: -10 },
    facialState: buildPresetFacialState('preset-5', { valence: -50, arousal: 0, distance: -10 }),
    description: '嘴角微翘，长舒一口气，眉宇间冰雪消融。',
    keywords: ['释然舒缓', '若有若无微笑', '和平安宁眼神', '舒展额头'],
  },

  // --- 正向类 Positive ---
  {
    id: 'preset-6',
    name: '开心欢愉',
    nameEn: 'Joyful Brightness',
    category: 'positive',
    vector: { valence: -100, arousal: 50, distance: -50 },
    facialState: buildPresetFacialState('preset-6', { valence: -100, arousal: 50, distance: -50 }),
    description: '嘴角扬起，眼睛弯成新月，面部充满阳光活力。',
    keywords: ['灿烂阳光笑脸', '欢快闪烁双眸', '笑意盈盈苹果肌', '喜悦活力'],
  },
  {
    id: 'preset-7',
    name: '温柔期待',
    nameEn: 'Gentle Expectation',
    category: 'positive',
    vector: { valence: 0, arousal: 50, distance: -30 },
    facialState: buildPresetFacialState('preset-7', { valence: 0, arousal: 50, distance: -30 }),
    description: '目光深情款款，嘴角带浅笑，眼神中闪烁着向往。',
    keywords: ['温柔深情凝视', '甜美柔和浅笑', '期盼明亮眼神', '优雅微倾'],
  },
  {
    id: 'preset-8',
    name: '宠溺凝视',
    nameEn: 'Doting Devotion',
    category: 'positive',
    vector: { valence: -100, arousal: 0, distance: -80 },
    facialState: buildPresetFacialState('preset-8', { valence: -100, arousal: 0, distance: -80 }),
    description: '极度亲密的情感，目光专注而包容，略带倾斜的宠溺。',
    keywords: ['宠溺专注目光', '深情爱慕眼神', '温暖眷恋微笑', '磁性亲近'],
  },
  {
    id: 'preset-9',
    name: '狂喜冲动',
    nameEn: 'Ecstatic Exuberance',
    category: 'positive',
    vector: { valence: 0, arousal: 100, distance: -60 },
    facialState: buildPresetFacialState('preset-9', { valence: 0, arousal: 100, distance: -60 }),
    description: '瞳孔放大，嘴唇张开欢呼，情感能量达到巅峰。',
    keywords: ['狂喜张口大笑', '激动睁大双眼', '能量爆发面容', '极度亢奋'],
  },

  // --- 负向类 Negative ---
  {
    id: 'preset-10',
    name: '淡淡忧伤',
    nameEn: 'Melancholic Sorrow',
    category: 'negative',
    vector: { valence: 50, arousal: -50, distance: 0 },
    facialState: buildPresetFacialState('preset-10', { valence: 50, arousal: -50, distance: 0 }),
    description: '视线微下垂，眉头轻缩，有一种安静而克制的伤感。',
    keywords: ['清冷忧伤神情', '眼神低垂', '克制落寞眉宇', '低调感伤'],
  },
  {
    id: 'preset-11',
    name: '悲伤流泪',
    nameEn: 'Weeping Heartbreak',
    category: 'negative',
    vector: { valence: -100, arousal: -100, distance: -20 },
    facialState: buildPresetFacialState('preset-11', { valence: -100, arousal: -100, distance: -20 }),
    description: '眼眶泛红微湿，嘴角压低，抑制不住的委屈与伤痛。',
    keywords: ['泪眼婆娑闪烁', '嘴唇微微颤抖', '心碎悲痛面容', '委屈泣不成声'],
  },
  {
    id: 'preset-12',
    name: '克制怒火',
    nameEn: 'Seething Rage',
    category: 'negative',
    vector: { valence: 50, arousal: 50, distance: 40 },
    facialState: buildPresetFacialState('preset-12', { valence: 50, arousal: 50, distance: 40 }),
    description: '眉头剧烈压低，眼神如利刃，咬紧牙关压抑怒气。',
    keywords: ['怒火中烧目光', '咬紧牙关', '紧皱双眉压抑怒火', '凌厉杀气'],
  },
  {
    id: 'preset-13',
    name: '惊慌恐惧',
    nameEn: 'Terrified Panic',
    category: 'negative',
    vector: { valence: 50, arousal: 100, distance: 60 },
    facialState: buildPresetFacialState('preset-13', { valence: 50, arousal: 100, distance: 60 }),
    description: '瞳孔急剧收缩，双眼放大，急促呼吸，面部紧绷。',
    keywords: ['瞳孔惊恐放大', '急促呼吸', '紧绷惊吓面容', '警惕惧怕'],
  },
  {
    id: 'preset-14',
    name: '失望寒心',
    nameEn: 'Disillusioned Hurt',
    category: 'negative',
    vector: { valence: 100, arousal: -50, distance: 70 },
    facialState: buildPresetFacialState('preset-14', { valence: 100, arousal: -50, distance: 70 }),
    description: '目光移开避开视线，嘴角抿紧，带着心灰意冷的冰冷疏离。',
    keywords: ['心灰意冷眼神', '回避视线', '失望紧抿嘴角', '疏离孤寂'],
  },

  // --- 高级角色类 Advanced Roles ---
  {
    id: 'preset-15',
    name: '霸总冷漠',
    nameEn: 'Domineering CEO Coldness',
    category: 'advanced',
    vector: { valence: 50, arousal: 0, distance: 80 },
    facialState: buildPresetFacialState('preset-15', { valence: 50, arousal: 0, distance: 80 }),
    description: '下巴微扬，俯视视角，眼神深不可测，充满掌控感与疏离。',
    keywords: ['下巴微扬傲慢', '冷酷主导凝视', '高高在上威严', '看穿一切微笑'],
  },
  {
    id: 'preset-16',
    name: '病娇占有',
    nameEn: 'Yandere Obsession',
    category: 'advanced',
    vector: { valence: -100, arousal: 100, distance: -90 },
    facialState: buildPresetFacialState('preset-16', { valence: -100, arousal: 100, distance: -90 }),
    description: '极度扭曲的亲密与狂热，眼神发亮微张嘴角，令人心悸的执念。',
    keywords: ['病娇狂热眼神', '执念放大瞳孔', '诡异微勾嘴角', '狂乱气场'],
  },
  {
    id: 'preset-17',
    name: '古装忧伤',
    nameEn: 'Wuxia Poetic Sorrow',
    category: 'advanced',
    vector: { valence: -50, arousal: -50, distance: 20 },
    facialState: buildPresetFacialState('preset-17', { valence: -50, arousal: -50, distance: 20 }),
    description: '带有一丝东方诗意的落寞，眼神似看透沧桑的平静。',
    keywords: ['东方诗意落寞', '国风清冷忧郁', '看透沧桑眼神', '温润典雅'],
  },
  {
    id: 'preset-18',
    name: '反派压迫',
    nameEn: 'Villainous Intimidation',
    category: 'advanced',
    vector: { valence: 100, arousal: 50, distance: 90 },
    facialState: buildPresetFacialState('preset-18', { valence: 100, arousal: 50, distance: 90 }),
    description: '低头阴郁上视，眉骨带阴影，嘴角勾起危险玩味的冷笑。',
    keywords: ['低头暗黑上视', '玩味邪魅冷笑', '阴郁压迫感面容', '危险气场'],
  },
  {
    id: 'preset-19',
    name: '仙侠清冷',
    nameEn: 'Immortal Unearthly Calm',
    category: 'advanced',
    vector: { valence: 50, arousal: -100, distance: 90 },
    facialState: buildPresetFacialState('preset-19', { valence: 50, arousal: -100, distance: 90 }),
    description: '不食人间烟火的高洁，超脱凡俗的无欲无求。',
    keywords: ['仙侠超凡脱俗', '出尘超然凝视', '无欲无求平静', '冷艳神圣'],
  },
  {
    id: 'preset-20',
    name: '赛博麻木',
    nameEn: 'Cyberpunk Android Numbness',
    category: 'advanced',
    vector: { valence: 100, arousal: -100, distance: 100 },
    facialState: buildPresetFacialState('preset-20', { valence: 100, arousal: -100, distance: 100 }),
    description: '绝对理性的AI仿生人状态，零情绪波动的机器视线。',
    keywords: ['赛博机械无情', '零面部抽搐', '仿生人无焦点视线', '精密冰冷'],
  },
  {
    id: 'preset-21',
    name: '空灵修禅',
    nameEn: 'Zen Transcendence',
    category: 'calm',
    vector: { valence: 0, arousal: -100, distance: 40 },
    facialState: buildPresetFacialState('preset-21', { valence: 0, arousal: -100, distance: 40 }),
    description: '闭目或敛容凝神，完全脱离外界嘈杂，神态极度空灵与安详。',
    keywords: ['空灵凝神', '呼吸平缓绵长', '超然物外神色', '极度安详'],
  },
  {
    id: 'preset-22',
    name: '自信得意',
    nameEn: 'Confident Pride',
    category: 'positive',
    vector: { valence: -50, arousal: 50, distance: 10 },
    facialState: buildPresetFacialState('preset-22', { valence: -50, arousal: 50, distance: 10 }),
    description: '下巴微扬，嘴角勾起自信的弧度，眼神神采奕奕。',
    keywords: ['自信扬眉', '笃定神采眼神', '嘴角轻扬笑意', '意气风发'],
  },
  {
    id: 'preset-23',
    name: '俏皮恶作剧',
    nameEn: 'Playful Mischief',
    category: 'positive',
    vector: { valence: -50, arousal: 100, distance: -40 },
    facialState: buildPresetFacialState('preset-23', { valence: -50, arousal: 100, distance: -40 }),
    description: '单眼微眨，嘴角带着鬼马灵动的坏笑，充满趣味与活力。',
    keywords: ['鬼马灵动眼神', '俏皮坏笑', '活力充沛神情', '灵动俏皮'],
  },
  {
    id: 'preset-24',
    name: '傲慢蔑视',
    nameEn: 'Arrogant Scorn',
    category: 'negative',
    vector: { valence: 100, arousal: 0, distance: 80 },
    facialState: buildPresetFacialState('preset-24', { valence: 100, arousal: 0, distance: 80 }),
    description: '眼神充满不屑与轻蔑，单侧嘴角微抿，神色高傲冷漠。',
    keywords: ['不屑轻蔑目光', '高傲冷漠姿态', '单侧抿嘴讥笑', '居高临下'],
  },
  {
    id: 'preset-25',
    name: '黑化癫狂',
    nameEn: 'Unhinged Madness',
    category: 'advanced',
    vector: { valence: 100, arousal: 100, distance: 50 },
    facialState: buildPresetFacialState('preset-25', { valence: 100, arousal: 100, distance: 50 }),
    description: '面部张力拉满，双眼发红放大，带着崩塌与癫狂的神情。',
    keywords: ['极端黑化杀气', '狂乱失控眼神', '癫狂大笑', '情绪彻底崩塌'],
  }
];

// Determine Emotion Label & Keywords from Vector Coordinates
export function deriveEmotionLabelFromVector(vector: EmotionVector): {
  title: string;
  subtitle: string;
  keywords: string[];
  zoneName: string;
} {
  const { valence, arousal, distance } = vector;

  // Find exact or closest 2D preset (Valence-Arousal Matrix primary match)
  let closest = EMOTION_PRESETS[0];
  let minDistance = Infinity;

  for (const preset of EMOTION_PRESETS) {
    const dVal = preset.vector.valence - valence;
    const dAro = preset.vector.arousal - arousal;
    // 2D distance gets primary weight, distance parameter gets minimal tie-breaker weight
    const dDis = preset.vector.distance - distance;
    const dist2D = dVal * dVal + dAro * dAro;
    const totalDist = dist2D + (dDis * dDis) * 0.001;

    if (totalDist < minDistance) {
      minDistance = totalDist;
      closest = preset;
    }
  }

  // Zone determination
  let zoneName = '中性平衡区';
  if (arousal > 40 && valence < -40) zoneName = '高能亲热区 (狂喜/炽热)';
  else if (arousal > 40 && valence > 40) zoneName = '高能防备区 (怒火/压迫)';
  else if (arousal < -40 && valence < -40) zoneName = '低能亲密区 (柔情/沉醉)';
  else if (arousal < -40 && valence > 40) zoneName = '低能冷漠区 (绝望/疏离)';
  else if (distance > 60) zoneName = '高度疏离区 (霸总/克制)';
  else if (distance < -60) zoneName = '高度亲近区 (病娇/执恋)';

  return {
    title: closest.name,
    subtitle: closest.nameEn,
    keywords: closest.keywords,
    zoneName,
  };
}
