import { EmotionVector, FacialState, Character, EmotionKeyframe } from '../types';
import { EMOTION_PRESETS } from '../data/presets';

/**
 * Builds concrete physical performance prompts without any abstract emotion words.
 * Dynamically reacts to every change in Facial Controls (Eye Openness, Focus, Direction,
 * Eyebrow Tension/Height, Mouth Curve/State, Muscle Tension, Head Tilt, Breathing).
 */
export function buildConcretePerformancePrompt(
  vector: EmotionVector,
  facialState?: FacialState,
  character?: Partial<Character>,
  presetId?: string | null
): {
  emotionPrompt: string;
  videoMotionPrompt: string;
  directorNotes: string;
} {
  const { valence, arousal, distance } = vector;

  // Find matching preset if any
  const matchedPreset = presetId 
    ? EMOTION_PRESETS.find(p => p.id === presetId)
    : EMOTION_PRESETS.find(p => p.vector.valence === valence && p.vector.arousal === arousal);

  // 1. Dynamic Facial Parameters Decomposition
  let eyeOpennessDesc = '眼睑开合度适中';
  let eyeFocusDesc = '视线焦点平稳重聚';
  let gazeDirDesc = '眼神直视镜头焦点清晰';
  let eyebrowDesc = '眉骨肌理平复';
  let eyebrowHeightDesc = '';
  let mouthDesc = '嘴角肌理平置';
  let faceTensionDesc = '下颌咬肌自然';
  let headTiltDesc = '';
  let breathingDesc = '匀速沉稳呼吸';

  if (facialState) {
    const { eye, eyebrow, mouth, face } = facialState;

    // Eye Openness
    if (eye.openness <= -35) {
      eyeOpennessDesc = `眼睑重度下垂呈眯眼掩瞳状态(${eye.openness}%)`;
    } else if (eye.openness < -10) {
      eyeOpennessDesc = `眼睑微垂下压遮瞳(${eye.openness}%)`;
    } else if (eye.openness >= 35) {
      eyeOpennessDesc = `眼睑极大开合圆睁(+${eye.openness}%)`;
    } else if (eye.openness > 10) {
      eyeOpennessDesc = `眼眶微张开大(+${eye.openness}%)`;
    }

    // Eye Focus
    if (eye.focus >= 70) {
      eyeFocusDesc = `视线焦点极度聚焦锁紧前方(聚焦度${eye.focus})`;
    } else if (eye.focus <= 30) {
      eyeFocusDesc = `视线离轴失焦游移下坠(聚焦度${eye.focus})`;
    } else {
      eyeFocusDesc = '视线焦点清晰重聚';
    }

    // Gaze Direction
    if (eye.direction === 'avoid gaze') {
      gazeDirDesc = '眼神回避躲闪';
    } else if (eye.direction === 'cold stare') {
      gazeDirDesc = '眼神冷酷凌厉直视';
    } else if (eye.direction === 'soft gaze') {
      gazeDirDesc = '眼神柔和清澈';
    } else if (eye.direction === 'down') {
      gazeDirDesc = '垂眸凝视斜下方';
    } else if (eye.direction === 'up') {
      gazeDirDesc = '仰视镜头上方';
    }

    // Eyebrow Tension & Height
    if (eyebrow.tension >= 60) {
      eyebrowDesc = `眉骨高张力向下剧烈压低(张力${eyebrow.tension}%)`;
    } else if (eyebrow.tension >= 20) {
      eyebrowDesc = `眉心向内微敛收紧(张力${eyebrow.tension}%)`;
    } else if (eyebrow.tension <= -20) {
      eyebrowDesc = `眉头舒展开平(张力${eyebrow.tension}%)`;
    }

    if (eyebrow.height >= 25) {
      eyebrowHeightDesc = `，眉峰微挑抬高(${eyebrow.height})`;
    } else if (eyebrow.height <= -25) {
      eyebrowHeightDesc = `，眉压眼显著沉降(${eyebrow.height})`;
    }

    // Mouth Curve & State
    if (mouth.curve >= 40) {
      mouthDesc = `嘴角肌理大幅向上扬起(+${mouth.curve})`;
    } else if (mouth.curve >= 10) {
      mouthDesc = `嘴角肌理微挑向上(+${mouth.curve})`;
    } else if (mouth.curve <= -40) {
      mouthDesc = `嘴角肌理大幅向下沉降(${mouth.curve})`;
    } else if (mouth.curve <= -10) {
      mouthDesc = `嘴角肌理向下沉位移(${mouth.curve})`;
    } else if (mouth.state === 'pressed lips') {
      mouthDesc = '双唇紧抿拉平呈一字';
    } else if (mouth.state === 'slight opening') {
      mouthDesc = '双唇微张呈欲言又止缝隙';
    } else if (mouth.state === 'trembling') {
      mouthDesc = '双唇受控轻微颤抖';
    } else if (mouth.state === 'smile') {
      mouthDesc = '双唇扬起呈现微笑肌理';
    }

    // Muscle Tension & Head Tilt & Breathing
    if (face.muscleTension >= 60) {
      faceTensionDesc = `下颌咬肌高高隆起绷紧(咬肌张力${face.muscleTension}%)`;
    } else if (face.muscleTension >= 30) {
      faceTensionDesc = `下颌咬肌微敛紧绷(咬肌张力${face.muscleTension}%)`;
    } else if (face.muscleTension <= 15) {
      faceTensionDesc = '面部肌肉完全松弛无张力';
    }

    if (face.headTilt > 10) {
      headTiltDesc = `，头部向右偏斜${face.headTilt}°`;
    } else if (face.headTilt < -10) {
      headTiltDesc = `，头部向左偏斜${Math.abs(face.headTilt)}°`;
    }

    if (face.breathing) {
      breathingDesc = face.breathing;
    }
  }

  // Combine dynamic micro-gaze string
  const dynamicMicroGaze = `${eyeOpennessDesc}，${eyeFocusDesc}，${gazeDirDesc}，${eyebrowDesc}${eyebrowHeightDesc}，${faceTensionDesc}，${mouthDesc}`;

  let posture = '';
  let midAction = '';
  let physio = '';

  // Match specific preset performance signatures, while always incorporating user's slider microGaze!
  if (matchedPreset?.id === 'preset-3' || (valence === -100 && arousal === -50)) {
    // 冷静理智 Analytical Coldness
    posture = `重心微向前倾锁止${headTiltDesc}，双肩沉稳下平，五指平稳交叠，手腕关节自然扣紧`;
    midAction = '抬手停滞于半空一秒，欲言又止唇裂缝隙微顿，触碰前微顿悬停';
    physio = `喉结沉沉低频滚动一次，鼻翼呼吸沉稳收敛，胸腔随${breathingDesc}节律起伏`;
  } else if (matchedPreset?.id === 'preset-1' || (valence === 0 && arousal === 0)) {
    // 淡然自若 Calm & Composed
    posture = `重心微调平稳${headTiltDesc}，双肩随沉稳呼吸匀速起伏，手腕自然垂落放松`;
    midAction = '欲言又止的唇部微妙停顿，抬手动作在空中短暂一滞，触碰前微顿悬停';
    physio = `喉结沉沉低频滚动，鼻翼保持自然呼吸，胸腔随${breathingDesc}起伏`;
  } else if (matchedPreset?.id === 'preset-2' || (valence === 0 && arousal === -50)) {
    // 沉思 Deep Contemplation
    posture = `重心微倾后沉${headTiltDesc}，单手托下巴指尖微抵下颌，双肩随沉思慢呼吸下沉`;
    midAction = '抬手悬空半步停顿，转身微滞，欲言又止唇角抽动半秒停悬';
    physio = `喉结慢速下沉滚动咽唾液，呼吸短暂停顿后慢长吐气，胸腔沉寂塌落，节律为${breathingDesc}`;
  } else if (matchedPreset?.id === 'preset-4' || (valence === -50 && arousal === -100)) {
    // 疲惫倦怠 Weary Fatigue
    posture = `肌肉完全松弛无张力${headTiltDesc}，双肩自然沉降塌落，重心后靠支撑，手腕无力悬垂`;
    midAction = '半步悬停顿住，欲言又止唇部无力微张半秒停悬';
    physio = `喉结极低频滚动，呼吸长而微弱沉吐(${breathingDesc})，面颊肌肉无张力垂落`;
  } else if (matchedPreset?.id === 'preset-6' || (valence === -100 && arousal === 50)) {
    // 开心欢愉 Joyful Brightness
    posture = `重心欢快微侧${headTiltDesc}，手腕抬起半挡，双肩随轻快呼吸匀速高频起伏`;
    midAction = '抬手半挡唇部欲言又止，转身轻快一滞，半步悬停拍手';
    physio = `呼吸节律平缓明快(${breathingDesc})，鼻翼微翕，胸腔保持饱满张力起伏`;
  } else if (matchedPreset?.id === 'preset-11' || (valence === -100 && arousal === -100)) {
    // 悲伤流泪 Weeping Heartbreak
    posture = `双肩剧烈微收紧扣${headTiltDesc}，指尖紧拧衣角至指节泛白，重心后移微晃，手腕受控紧绷`;
    midAction = '欲言又止唇部剧烈分合停顿，抬手悬空欲擦面湿痕前微顿';
    physio = `喉结频繁连续滚动，呼吸短暂停顿哽咽后长吐，胸腔随${breathingDesc}剧烈抽搐起伏`;
  } else if (matchedPreset?.id === 'preset-12' || (valence === 50 && arousal === 50)) {
    // 克制怒火 Seething Rage
    posture = `重心前倾锁定${headTiltDesc}，五指缓慢攥紧至指节发白，手腕剧烈紧绷，双肩随重而急的呼吸高频起伏`;
    midAction = '抬手悬空半步停顿，转身一滞，触碰前微顿半秒';
    physio = `喉结高频滚动，鼻翼剧烈微翕，额角青筋微凸，胸腔随${breathingDesc}沉浮`;
  } else if (matchedPreset?.id === 'preset-13' || (valence === 50 && arousal === 100)) {
    // 惊慌恐惧 Terrified Panic
    posture = `身体本能后撤微晃${headTiltDesc}，双臂环抱，重心后缩，手腕与指节剧烈肌肉细颤`;
    midAction = '半步悬停，转身急滞，抬手防卫悬空微顿';
    physio = `喉结快速连续滚动，鼻翼剧烈收张，胸腔随${breathingDesc}高频剧烈沉浮`;
  } else if (matchedPreset?.id === 'preset-15' || (valence === 50 && arousal === 0)) {
    // 霸总冷漠 CEO Coldness
    posture = `重心高耸平稳${headTiltDesc}，双手插口袋，手腕与双肩沉稳下平挺拔`;
    midAction = '转身一滞，抬手看表停顿，触碰前微顿悬停';
    physio = `喉结沉稳低频滚动，鼻翼呼吸沉静，胸腔随${breathingDesc}匀速沉稳起伏`;
  } else if (matchedPreset?.id === 'preset-25' || (valence === 100 && arousal === 100)) {
    // 黑化癫狂 Unhinged Madness
    posture = `重心前倾剧烈摇晃${headTiltDesc}，肌肉张力拉满，指尖紧抓悬空，手腕极度紧绷`;
    midAction = '转身猛滞，抬手悬空狂乱停顿，半步悬停';
    physio = `喉结频繁剧烈滚动，额角与颈部青筋暴起，胸腔随${breathingDesc}剧烈起伏`;
  } else {
    // Dynamic generation based on continuous valence and arousal
    if (arousal > 60 && valence > 40) {
      posture = `重心前倾微晃${headTiltDesc}，五指缓慢攥紧至指节泛白，手腕剧烈紧绷，双肩随重而急的呼吸高频起伏`;
      midAction = '抬手悬空半步停顿，转身一滞，触碰前微顿半秒';
      physio = `喉结高频低频连续滚动，鼻翼微翕，额角青筋微凸，胸腔随${breathingDesc}剧烈沉浮`;
    } else if (arousal > 50 && valence < -30) {
      posture = `身体微侧${headTiltDesc}，手腕抬起半挡，重心欢快，双肩随舒缓呼吸匀速起伏`;
      midAction = '抬手半挡唇部欲言又止，转身轻快一滞';
      physio = `呼吸节律平缓明快(${breathingDesc})，鼻翼微翕，胸腔保持匀速张力起伏`;
    } else if (arousal < -40 && valence > 40) {
      posture = `肌肉完全松弛无张力${headTiltDesc}，双肩自然沉降下垂，身体重心后移沉降，手腕松弛悬垂`;
      midAction = '双唇微张呈欲言又止的半停顿，转身一滞半步悬停';
      physio = `喉结低频慢速滚动咽唾液，呼吸短暂停顿后长气缓慢吐出，胸腔随${breathingDesc}沉寂塌落`;
    } else if (arousal < -30 && valence < -30) {
      posture = `重心微倾平稳${headTiltDesc}，双肩随沉静呼吸匀速起伏，手腕自然垂落放松`;
      midAction = '欲言又止的唇部微妙分合，抬手动作在空中一滞';
      physio = `喉结平缓滚动，鼻翼呼吸沉稳，胸腔随${breathingDesc}起伏`;
    } else if (valence > 20) {
      posture = `双肩微收紧扣${headTiltDesc}，指尖拧抓衣角，重心后移微晃，手腕受控紧绷`;
      midAction = '欲言又止唇角分合停顿，半步悬停';
      physio = `喉结慢速滚动，呼吸短暂停顿后吐长气，胸腔随${breathingDesc}沉落`;
    } else {
      posture = `重心微调平稳${headTiltDesc}，双肩随沉稳呼吸匀速起伏，手腕自然垂落放松`;
      midAction = '欲言又止的唇部微妙停顿，抬手动作在空中短暂一滞，触碰前微顿悬停';
      physio = `喉结沉沉低频滚动，鼻翼保持自然呼吸，胸腔随${breathingDesc}起伏`;
    }
  }

  // 5. 光影呼吸 (Light & Shadow Drift)
  const lightShadow = '配合环境光漂移 ambient light drift，呼吸与体态微调实时带动面部轮廓与皮肤阴影位移';

  const charName = character?.name || '演员';

  const emotionPrompt = `${dynamicMicroGaze}，${posture}，${midAction}，${physio}，${lightShadow}。`;

  const videoMotionPrompt = `【近景表演指令】${charName}微表情与体态动态转换：\n` +
    `1. [微表情与视线] ${dynamicMicroGaze}；\n` +
    `2. [肢体与体态] ${posture}；\n` +
    `3. [动作中间态] ${midAction}；\n` +
    `4. [生理应激] ${physio}；\n` +
    `5. [光影位移] ${lightShadow}。`;

  const directorNotes = `导演表演建议：表演中严禁出现任何抽象情绪词汇。重点控制${charName}的咬肌张力与喉结/胸腔呼吸节律，利用 ambient light drift 强化微表情肌肉位移的电影感质感。`;

  return { emotionPrompt, videoMotionPrompt, directorNotes };
}

/**
 * Builds continuous video performance prompts based on the Timeline Keyframes sequence (for Veo/Sora multi-stage generation).
 */
export function buildTimelinePerformancePrompt(
  keyframes: EmotionKeyframe[],
  character?: Partial<Character>
): string {
  if (!keyframes || keyframes.length === 0) {
    return '（暂无时间轴关键帧，请在表演动画时间轴上添加关键帧以生成连续演进提示词）';
  }

  const charName = character?.name || '演员';
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  const maxTime = Math.max(...sorted.map((k) => k.time), 30);

  const steps = sorted.map((kf, index) => {
    const single = buildConcretePerformancePrompt(kf.emotionVector, kf.facialState, character);
    const timeStr = `${kf.time.toFixed(1)}s`;
    const stageLabel = kf.label || `阶段${index + 1}`;

    return `${index + 1}. 【${timeStr} 节点 - ${stageLabel}】\n` +
      `   • 状态特写：${single.emotionPrompt}`;
  });

  return (
    `【${maxTime.toFixed(0)}秒长镜头视频连续表演演进指令 (Veo/Sora 时间轴连续性 Prompt)】\n` +
    `演职角色：${charName} | 演进总时长：${maxTime.toFixed(1)}s | 包含 ${sorted.length} 个时间轴动态表演节点：\n\n` +
    steps.join('\n\n') +
    `\n\n【时间轴连续性与演进规范】：\n` +
    `1. [流体渐变] 眼睑开合、眼神焦距、眉骨张力与嘴角肌理需在 0s 至 ${maxTime.toFixed(0)}s 各 Keyframe 节点间呈现连续平滑演进，严禁出现跳帧；\n` +
    `2. [呼吸与光影] 胸腔起伏与喉结咽唾液节律随时间轴情绪递进同步发生物理变化，配合环境光漂移 (ambient light drift) 映照皮肤阴影流体漂移。`
  );
}

