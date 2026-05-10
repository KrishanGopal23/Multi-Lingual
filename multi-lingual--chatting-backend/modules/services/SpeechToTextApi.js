import dotenv from "dotenv";

dotenv.config();

const extractTranscript = (payload) => {
  if (!payload) {
    return "";
  }

  return (
    payload.text ||
    payload.transcript ||
    payload.transcription ||
    payload.result ||
    payload.message ||
    ""
  );
};

async function requestTranscription(audioBuffer, mimeType, fileName, fieldName) {
  const formData = new FormData();
  const audioFile = new File([audioBuffer], fileName, { type: mimeType });

  formData.append(fieldName, audioFile);

  const response = await fetch(process.env.STT_API_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `STT API request failed with ${response.status}: ${errorText.slice(0, 200)}`
    );
  }

  const payload = await response.json();
  const transcript = extractTranscript(payload);

  if (!transcript) {
    throw new Error("STT API returned no transcript.");
  }

  return transcript;
}

export async function speechToText(
  audioBuffer,
  mimeType = "audio/webm",
  fileName = "voice-message.webm"
) {
  const attempts = ["audio_file", "file", "audio"];
  const errors = [];

  for (const fieldName of attempts) {
    try {
      return await requestTranscription(
        audioBuffer,
        mimeType,
        fileName,
        fieldName
      );
    } catch (error) {
      errors.push(`${fieldName}: ${error.message}`);
    }
  }

  throw new Error(errors.join(" | "));
}
