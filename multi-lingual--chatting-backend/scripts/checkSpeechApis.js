import dotenv from "dotenv";
import { textToSpeech } from "../modules/services/TextToSpeechApi.js";
import { speechToText } from "../modules/services/SpeechToTextApi.js";

dotenv.config();

const sampleText = "hello";

async function main() {
  const result = {
    tts: { ok: false, details: "" },
    stt: { ok: false, details: "" },
  };

  try {
    const { audioBuffer, contentType } = await textToSpeech(sampleText, "en");
    result.tts = {
      ok: true,
      details: `Received ${audioBuffer.length} bytes as ${contentType}`,
    };

    try {
      const transcript = await speechToText(
        audioBuffer,
        "audio/mpeg",
        "speech-check.mp3"
      );
      result.stt = {
        ok: true,
        details: `Transcript: ${transcript}`,
      };
    } catch (error) {
      result.stt = {
        ok: false,
        details: error.message,
      };
    }
  } catch (error) {
    result.tts = {
      ok: false,
      details: error.message,
    };
    result.stt = {
      ok: false,
      details: "Skipped because TTS failed.",
    };
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
