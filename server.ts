import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Initialize Google GenAI lazily or with fallback check
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Analyze character emotion / image via Gemini 3.6 Flash
app.post("/api/gemini/analyze-character", async (req, res) => {
  const { image, targetEmotion, characterProfile } = req.body;
  
  try {
    const ai = getGenAI();

    if (!ai) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const systemInstruction = `You are an elite AI Performance Director & Facial Motion Director for film and virtual avatars. 
Given a target emotion or image, analyze and convert it into a precise Valence-Arousal-Distance vector and facial parameters:
Valence (-100 to +100): Relational distance (-100 Intimate/亲密, 0 Neutral/中性, +100 Distant/疏离)
Arousal (-100 to +100): Emotional activation (-100 Calm/平静, 0 Normal/普通, +100 Excited/高能/情绪饱满)
Distance (-100 to +100): Psychological separation (-100 Closeness, +100 Detached/Suppressed)

Return ONLY valid JSON matching this schema:
{
  "emotionName": "string (e.g. 淡然自若 / 克制悲伤 / 冷酷压迫)",
  "valence": number,
  "arousal": number,
  "distance": number,
  "keywords": ["string"],
  "facialState": {
    "eye": { "openness": number (-50 to 50), "focus": number (0 to 100), "direction": "direct gaze" | "avoid gaze" | "cold stare" | "soft gaze" | "down" | "up" },
    "eyebrow": { "tension": number (0 to 100), "height": number (-50 to 50) },
    "mouth": { "curve": number (-100 to 100), "tension": number (0 to 100), "state": "pressed lips" | "slight opening" | "smile" | "trembling" },
    "face": { "muscleTension": number (0 to 100), "headTilt": number (-30 to 30), "breathing": "calm" | "fast" | "holding breath" }
  },
  "directorNotes": "string (short directorial advice on character acting)",
  "imagePrompt": "string (cinematic image prompt)",
  "videoPrompt": "string (video camera & expression performance prompt)"
}`;

    const parts: any[] = [];
    if (image && image.startsWith("data:image/")) {
      const mimeType = image.split(";")[0].replace("data:", "");
      const base64Data = image.split(",")[1];
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    parts.push({
      text: `Target Emotion Context: "${targetEmotion || "Analyze facial emotion"}". Character: ${JSON.stringify(characterProfile || {})}. Please calculate precise emotion vector and facial parameters.`,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: parts,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText);
    return res.json({ success: true, result: data });
  } catch (err: any) {
    console.log("[Info] Gemini API response fallback triggered:", err?.status || "quota/network fallback");

    const isSad = targetEmotion && (targetEmotion.includes("伤") || targetEmotion.includes("泪") || targetEmotion.includes("悲"));
    const isAngry = targetEmotion && (targetEmotion.includes("怒") || targetEmotion.includes("恨"));
    const isHappy = targetEmotion && (targetEmotion.includes("喜") || targetEmotion.includes("笑") || targetEmotion.includes("乐"));

    const fallbackResult = {
      emotionName: targetEmotion || "淡然自若",
      valence: isSad ? 50 : isAngry ? 70 : isHappy ? -60 : 10,
      arousal: isSad ? -40 : isAngry ? 80 : isHappy ? 50 : -60,
      distance: isSad ? 20 : isAngry ? 60 : isHappy ? -40 : 0,
      keywords: isSad ? ["克制落寞", "暗自伤神", "低垂眼神"] : isAngry ? ["怒火中烧", "压抑杀气", "咬紧牙关"] : isHappy ? ["喜上眉梢", "灿烂笑意", "阳光眼神"] : ["神态从容", "柔和眼神", "平静面容"],
      facialState: {
        eye: { openness: isSad ? -20 : isAngry ? 30 : 10, focus: 80, direction: isSad ? "down" : isAngry ? "cold stare" : "soft gaze" },
        eyebrow: { tension: isSad ? 60 : isAngry ? 90 : 20, height: isSad ? -10 : isAngry ? -30 : 0 },
        mouth: { curve: isSad ? -60 : isAngry ? -40 : isHappy ? 70 : 15, tension: 40, state: isSad ? "trembling" : isHappy ? "smile" : "pressed lips" },
        face: { muscleTension: isAngry ? 80 : 30, headTilt: isSad ? -10 : 0, breathing: isAngry ? "fast" : "calm" }
      },
      directorNotes: "建议控制眼神力度与微动作节奏，精准呈现情绪细微起伏。",
      imagePrompt: `Cinematic close-up portrait of character, ${targetEmotion || "calm expression"}, 85mm portrait lens, f/1.4 aperture.`,
      videoMotionPrompt: `Character subtly adjusts facial performance to ${targetEmotion || "calm composure"}.`
    };

    return res.json({ success: true, result: fallbackResult, fallback: true });
  }
});

// Generate enhanced prompts endpoint
app.post("/api/gemini/generate-prompts", async (req, res) => {
  const { emotionVector, facialState, emotionName, keywords, characterProfile, renderQuality } = req.body;
  
  try {
    const ai = getGenAI();

    if (!ai) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const promptText = `CRITICAL DIRECTORIAL RULE FOR PROMPT GENERATION:
You are an elite film director & video prompt engineer creating concrete physical acting performance prompts for Veo/Sora/Runway AI Video models.

ABSOLUTE PROHIBITION:
STRICTLY PROHIBIT ALL ABSTRACT EMOTION NOUNS AND ADJECTIVES (e.g. NEVER use "难过", "愤怒", "委屈", "失望", "崩溃", "麻木", "悲伤", "喜悦", "恐惧", "痛苦", "情绪", "表情").

Instead, describe the performance ENTIRELY through concrete, physical, camera-visible micro-acting across 5 dimensions:
1. 微表情与视线: 瞳孔骤缩或慢扩、睫毛颤动、视线失焦或重聚、咬肌收紧、嘴角肌理位移。
2. 肢体与体态: 重心微调、双肩随呼吸起伏、指尖拧抓衣角、指节泛白、手腕紧绷或松弛。
3. 动作中间态: 欲言又止、转身一滞、半步悬停、抬手悬空、触碰前微顿等未完成状态。
4. 生理应激: 喉结滚动、鼻翼微翕、额角青筋微凸、眼睑不自主抖动、胸腔节律变化。
5. 光影呼吸: 呼吸和体态变化带动皮肤与轮廓阴影实时位移，配合 "ambient light drift"。

Context:
Character: ${JSON.stringify(characterProfile || { name: '演员' })}
Valence: ${emotionVector?.valence ?? 0}, Arousal: ${emotionVector?.arousal ?? 0}, Distance: ${emotionVector?.distance ?? 0}
Facial State: ${JSON.stringify(facialState || {})}
Target Quality: ${renderQuality || "2K"}

Return ONLY JSON:
{
  "emotionPrompt": "string (5-dimension concrete physical performance prompt WITHOUT abstract emotion words)",
  "cameraPrompt": "string (camera lens 85mm f/1.4, shallow depth of field, ambient light drift)",
  "characterPrompt": "string (full close-up cinematic portrait prompt with concrete micro-expressions)",
  "videoMotionPrompt": "string (structured 5-dimension video acting directions for Veo/Sora)",
  "directorCritique": "string (directorial notes on physical muscle tension and breathing rhythm)"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text || "{}");
    return res.json({ success: true, result: data });
  } catch (err: any) {
    console.log("[Info] Gemini prompt generation fallback triggered:", err?.status || "quota/network fallback");

    const val = emotionVector?.valence ?? 0;
    const aro = emotionVector?.arousal ?? 0;
    const charName = characterProfile?.name || '演员';

    const eyeOpen = facialState?.eye?.openness ?? 0;
    const eyeFocus = facialState?.eye?.focus ?? 50;
    const eyebrowTension = facialState?.eyebrow?.tension ?? 20;
    const mouthCurve = facialState?.mouth?.curve ?? 0;
    const muscleTension = facialState?.face?.muscleTension ?? 30;

    let eyeOpenDesc = eyeOpen < -20 ? `眼睑下垂微眯掩瞳(${eyeOpen}%)` : eyeOpen > 20 ? `眼睑睁大开合(+${eyeOpen}%)` : '眼睑开合适中';
    let focusDesc = eyeFocus > 60 ? `视线焦点锁紧前方(聚焦${eyeFocus})` : '视线自然平视重聚';
    let browDesc = eyebrowTension > 40 ? `眉骨向下压低紧绷(张力${eyebrowTension}%)` : '眉骨肌理平复';
    let mouthDesc = mouthCurve > 20 ? `嘴角肌理向上微挑(+${mouthCurve})` : mouthCurve < -20 ? `嘴角肌理向下沉位移(${mouthCurve})` : '双唇平置闭合';
    let tensionDesc = muscleTension > 40 ? `下颌咬肌高张力紧绷(咬肌${muscleTension}%)` : '下颌咬肌保持自然张力';

    let posture = "重心微调平稳，双肩随匀速呼吸起伏，手腕自然垂落";
    let midAction = "欲言又止的唇部微妙停顿，抬手动作在空中一滞，触碰前微顿悬停";
    let physio = "喉结沉沉低频滚动，鼻翼自然呼吸，胸腔匀速沉稳沉浮";

    if (aro > 50 && val > 30) {
      posture = "重心前倾微晃，五指攥紧至指节泛白，手腕剧烈紧绷，双肩随重急呼吸高频起伏";
      midAction = "抬手悬空半步停顿，转身一滞，触碰前微顿半秒";
      physio = "喉结连续低频滚动，鼻翼微翕，额角青筋微凸，胸腔急促剧烈沉浮";
    } else if (aro < -40 && val > 40) {
      posture = "肌肉完全松弛无张力，双肩下垂沉降，身体重心后移，手腕松弛悬垂，免除常规胸腔起伏";
      midAction = "双唇微张呈欲言又止的半停顿，转身一滞半步悬停";
      physio = "喉结低频慢速滚动咽唾液，呼吸短暂停顿后长气缓慢吐出，胸腔沉寂塌落";
    } else if (aro > 40 && val < -20) {
      posture = "头部轻偏，手腕抬起半挡，重心欢快微侧，双肩随舒缓呼吸匀速起伏";
      midAction = "抬手半挡唇部欲言又止，转身轻快一滞";
      physio = "呼吸节律平缓明快，鼻翼微翕，胸腔保持匀速张力";
    }

    const microGaze = `${eyeOpenDesc}，${focusDesc}，${browDesc}，${tensionDesc}，${mouthDesc}`;
    const lightShadow = "配合环境光漂移 ambient light drift，呼吸与体态微调实时带动面部轮廓与皮肤阴影位移";

    const emotionPrompt = `${microGaze}，${posture}，${midAction}，${physio}，${lightShadow}。`;
    const videoMotionPrompt = `【近景表演指令】${charName}微表情与体态动态转换：\n` +
      `1. [微表情与视线] ${microGaze}；\n` +
      `2. [肢体与体态] ${posture}；\n` +
      `3. [动作中间态] ${midAction}；\n` +
      `4. [生理应激] ${physio}；\n` +
      `5. [光影位移] ${lightShadow}。`;

    const fallbackResult = {
      emotionPrompt,
      cameraPrompt: `电影级演播室专业柔光, 85mm人像定焦镜头, f/1.4大光圈, 浅景深景别, ${renderQuality || '2K'} 高清微对比度画质, ambient light drift`,
      characterPrompt: `高清特写肖像电影画面：${charName}, ${characterProfile?.gender || '男'}, ${characterProfile?.age || '28'}岁, ${characterProfile?.style || '现代'}. ${emotionPrompt}`,
      videoMotionPrompt,
      directorCritique: `导演表演建议：表演中严禁出现任何抽象情绪词汇。重点控制${charName}的咬肌张力与喉结/胸腔呼吸节律，利用 ambient light drift 强化微表情肌肉位移的电影感质感。`
    };

    return res.json({ success: true, result: fallbackResult, fallback: true });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`XiaoLuo Emotion Director Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
