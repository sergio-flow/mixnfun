import fs from 'fs';
import fetch from 'node-fetch'; // Make sure to install this dependency
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = `https://sujivvlajjatemfgpkzd.supabase.co`;
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1aml2dmxhamphdGVtZmdwa3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA2OTM3MzUsImV4cCI6MjAzNjI2OTczNX0.9OKOimiuCukVDxo1ulGIPyjd56i3CuQda7HuN0PDel0";
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(request, response) {
    const { book, chapter } = request.body

    const chapterNumber = parseInt(chapter.split('.')[0])

    const textResponse = await fetch(`https://www.mixnfun.com/books/${encodeURIComponent(book)}/${encodeURIComponent(chapter)}.txt`);
    const text = await textResponse.text();

    const chapterTexts = text.split("\n").filter(o => o)

    const { data, error } = await supabase
        .storage
        .from('books')
        .list(`${encodeFilename(book)}/${chapterNumber}`, {
            limit: 1000,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' },
        })

    let chapterAudios = data
        .map(o => `${supabaseUrl}/storage/v1/object/public/books/${encodeFilename(book)}/${chapterNumber}/${o.name}.mp3`)

    for (const index in chapterTexts) {
        const fileName = `${parseInt(index) + 1}`
        const check = data.find(o => o.name === fileName)
        
        if (!check) {
            const blob = await generateAudio(chapterTexts[index])

            const filePathName = `${fileName}.mp3`;

            const { data, error } = await supabase.storage
                .from("books")
                .upload(`${encodeFilename(book)}/${chapterNumber}/${filePathName}`, blob, {
                    contentType: 'audio/mpeg',
                });

            if (error) {
                console.error('Error uploading to Supabase bucket:', error.message);
            } else {
                console.log('File uploaded successfully to Supabase bucket:', data);
            }
        }
    }

    chapterAudios = data
        .map(o => `${supabaseUrl}/storage/v1/object/public/books/${encodeFilename(book)}/${chapterNumber}/${o.name}.mp3`)

    return response.status(200).json({
        chapterTexts,
        chapterAudios
    });
}

function encodeFilename(str) {
    // Define the characters that are invalid in filenames and folder names
    const invalidChars = /[<>:"\/\\|?*\x00-\x1F\s]/g;
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

    // Replace invalid characters and whitespace with underscores
    let encodedStr = str.replace(invalidChars, '_');

    // Trim any leading or trailing underscores
    encodedStr = encodedStr.replace(/^_+|_+$/g, '');

    // Replace reserved names entirely with underscores
    if (reservedNames.test(encodedStr)) {
        encodedStr = '_';
    }

    // Return the encoded string
    return encodedStr;
}

async function generateAudio(text) {
    const voice = "flq6f7yk4E4fJM5XTYuZ"
    const apiKey = "sk_99b01f9369e57ea13ebfd8bb57321126ed4ff6e93d188d22"

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice}`;

    const headers = {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
    };

    const data = {
        text: `${text}`,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
        },
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
    });

    return await response.blob()
}

function getRandomDelay(min = 500, max = 2000) {
    return Math.random() * (max - min) + min;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}