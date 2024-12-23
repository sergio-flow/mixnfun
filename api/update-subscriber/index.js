import { kv } from '@vercel/kv';

export default async function handler(request, response) {
    const { email, book, chapter, gif } = request.body

    const value =  `${book || ""}:${chapter || ""}:${gif || ""}`
    await kv.set(email, value);

    return response.status(200).json(value);
}