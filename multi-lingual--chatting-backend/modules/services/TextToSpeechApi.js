import dotenv from "dotenv";

dotenv.config();

export async function textToSpeech(text, language = "en") {
  const cleanText = text?.trim();

  if (!cleanText) {
    throw new Error("Text is required for speech generation.");
  }

  const response = await fetch(process.env.TTS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: cleanText,
      lang: language,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `TTS API request failed with ${response.status}: ${errorText.slice(0, 200)}`
    );
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());

  return {
    audioBuffer,
    contentType: response.headers.get("content-type") || "audio/mpeg",
  };
}
