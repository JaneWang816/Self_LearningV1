// lib/speech.ts
// 文字轉語音工具

/**
 * 支援的語言列表
 */
export const supportedLanguages = [
  { code: "auto", label: "自動偵測" },
  { code: "zh-TW", label: "中文" },
  { code: "en-US", label: "英文" },
  { code: "es-ES", label: "西班牙語" },
  { code: "ja-JP", label: "日文" },
  { code: "ko-KR", label: "韓文" },
  { code: "fr-FR", label: "法文" },
  { code: "de-DE", label: "德文" },
] as const

export type LanguageCode = typeof supportedLanguages[number]["code"]

/**
 * 朗讀文字
 * @param text 要朗讀的文字
 * @param lang 語言代碼 (zh-TW, en-US, es-ES 等)
 * @param rate 語速 (0.5 - 2，預設 1)
 */
export function speak(
  text: string,
  lang: string = "zh-TW",
  rate: number = 1
): Promise<void> {
  return new Promise((resolve, reject) => {
    // 檢查瀏覽器支援
    if (!("speechSynthesis" in window)) {
      reject(new Error("瀏覽器不支援語音功能"))
      return
    }

    // 停止之前的朗讀
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = rate
    utterance.pitch = 1

    utterance.onend = () => resolve()
    utterance.onerror = (event) => reject(event.error)

    window.speechSynthesis.speak(utterance)
  })
}

/**
 * 停止朗讀
 */
export function stopSpeaking(): void {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel()
  }
}

/**
 * 檢查是否正在朗讀
 */
export function isSpeaking(): boolean {
  if ("speechSynthesis" in window) {
    return window.speechSynthesis.speaking
  }
  return false
}

/**
 * 自動偵測語言
 */
export function detectLanguage(text: string): string {
  // 中文
  const hasChineseChar = /[\u4e00-\u9fa5]/.test(text)
  if (hasChineseChar) return "zh-TW"
  
  // 日文（平假名、片假名）
  const hasJapaneseChar = /[\u3040-\u309f\u30a0-\u30ff]/.test(text)
  if (hasJapaneseChar) return "ja-JP"
  
  // 韓文
  const hasKoreanChar = /[\uac00-\ud7af]/.test(text)
  if (hasKoreanChar) return "ko-KR"
  
  // 西班牙語特有字母
  const hasSpanishChar = /[áéíóúüñ¿¡]/i.test(text)
  if (hasSpanishChar) return "es-ES"
  
  // 法文特有字母
  const hasFrenchChar = /[àâäéèêëïîôùûüÿœæç]/i.test(text)
  if (hasFrenchChar) return "fr-FR"
  
  // 德文特有字母
  const hasGermanChar = /[äöüß]/i.test(text)
  if (hasGermanChar) return "de-DE"
  
  // 預設英文
  return "en-US"
}

/**
 * 朗讀文字（使用指定語言或自動偵測）
 * @param text 要朗讀的文字
 * @param lang 語言代碼，"auto" 表示自動偵測
 * @param rate 語速
 */
export function speakWithLang(
  text: string,
  lang: LanguageCode = "auto",
  rate: number = 1
): Promise<void> {
  const actualLang = lang === "auto" ? detectLanguage(text) : lang
  return speak(text, actualLang, rate)
}

/**
 * 朗讀文字（自動偵測語言）- 向後相容
 */
export function speakAuto(text: string, rate: number = 1): Promise<void> {
  const lang = detectLanguage(text)
  return speak(text, lang, rate)
}
