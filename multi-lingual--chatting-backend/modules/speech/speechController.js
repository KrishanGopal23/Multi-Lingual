import { speechToText } from "../services/SpeechToTextApi.js";
import { textToSpeech } from "../services/TextToSpeechApi.js";

const stripBase64Prefix = (value) => value.replace(/^data:.*;base64,/, "");

export const generateSpeech = async (req, res) => {
  try {
    const { text, language = "en" } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: "Text is required" });
    }

    const { audioBuffer, contentType } = await textToSpeech(text, language);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", audioBuffer.length);

    return res.status(200).send(audioBuffer);
  } catch (error) {
    return res.status(502).json({ message: error.message });
  }
};

export const transcribeSpeech = async (req, res) => {
  try {
    const {
      audio_base64,
      mime_type = "audio/webm",
      file_name = "voice-message.webm",
    } = req.body;

    if (!audio_base64) {
      return res.status(400).json({ message: "Audio payload is required" });
    }

    const cleanBase64 = stripBase64Prefix(audio_base64);
    const audioBuffer = Buffer.from(cleanBase64, "base64");

    if (!audioBuffer.length) {
      return res.status(400).json({ message: "Audio payload is empty" });
    }

    const transcript = await speechToText(audioBuffer, mime_type, file_name);

    return res.status(200).json({ transcript });
  } catch (error) {
    return res.status(502).json({ message: error.message });
  }
};
