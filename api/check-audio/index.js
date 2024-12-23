import fs from 'fs';
import fetch from 'node-fetch'; // Make sure to install this dependency
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = `https://sujivvlajjatemfgpkzd.supabase.co`;
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1aml2dmxhamphdGVtZmdwa3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA2OTM3MzUsImV4cCI6MjAzNjI2OTczNX0.9OKOimiuCukVDxo1ulGIPyjd56i3CuQda7HuN0PDel0";
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(request, response) {
    const { ekey, book, chapter, number } = request.body

    const chapterNumber = parseInt(chapter.split('.')[0])

    const textResponse = await fetch(`https://www.mixnfun.com/books/${encodeURIComponent(book)}/${encodeURIComponent(`${chapter}.txt`)}`);
    // console.log(`https://www.mixnfun.com/books/${encodeURIComponent(book)}/${encodeURIComponent(`${chapter}.txt`)}`)
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

    // let chapterAudios = data
    //     .map(o => `${supabaseUrl}/storage/v1/object/public/books/${encodeFilename(book)}/${chapterNumber}/${o.name}.mp3`)

    const check1 = data.filter(o => o.metadata.size != 386).find(o => parseInt(o.name) == parseInt(number) || o.name === `${parseInt(number)}.mp3`)
    // console.log('check1', check1)
    if (!check1) {
        const file1 = chapterTexts[parseInt(number) - 1]
        // console.log('file1', file1)
        const blob1 = await generateAudio(ekey, file1)
        await supabase.storage
            .from("books")
            .upload(`${encodeFilename(book)}/${chapterNumber}/${`${parseInt(number)}.mp3`}`, blob1, {
                contentType: 'audio/mpeg',
                upsert: true
            });
    }
    
    const check2 = data.filter(o => o.metadata.size != 386).find(o => parseInt(o.name) == parseInt(number) + 1  || o.name === `${parseInt(number) + 1}.mp3`)
    if (!check2 && chapterTexts[parseInt(number)]) {
        const file2 = chapterTexts[parseInt(number)]
        const blob2 = await generateAudio(ekey, file2)
        await supabase.storage
        .from("books")
        .upload(`${encodeFilename(book)}/${chapterNumber}/${`${parseInt(number) + 1}.mp3`}`, blob2, {
            contentType: 'audio/mpeg',
            upsert: true
        });
    }

    return response.status(200).json({
        ok: true,
        data
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

async function generateAudio(ekey, text) {
    const voice = "flq6f7yk4E4fJM5XTYuZ"
    const apiKey = "sk_bfc54b6b77e2dda69add283d6f79ff60bd8bce1fca501f746"

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice}`;

    const headers = {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ekey,
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

    // console.log(await response.json())

    return await response.blob()
}

function getRandomDelay(min = 500, max = 2000) {
    return Math.random() * (max - min) + min;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}