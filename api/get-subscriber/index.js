import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  const { email } = request.body
  const data = await kv.getall(email);
  return response.status(200).json(data);
}