import express from "express";
import axios from "axios";


import dotenv from "dotenv";
dotenv.config();


export async function translateText(text, target_lang) {
    if (target_lang === "None") {
        return text;
    }
    console.log("going into translate text")
    console.log(text);
    console.log(target_lang);
    
    const response = await axios.post(process.env.TRANSLATE_API_URL, {
        text,
        target_lang,
    },
)

    console.log("going from translate text")
    console.log(response);
    

    return response.data.translated_text;
}

// const { text, lang } = req.body;
//     const response = await axios.post(
//       "https://translatorapi-60x6.onrender.com/translate",
//       {
//         text,
//         target_lang: lang,
//       },
//     );
//     console.log(response);
//     res.json({ result: response.data.translated_text });
