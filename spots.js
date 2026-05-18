import { kv } from '@vercel/kv';

const DEFAULTS = { base: 20, dance: 10 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const base  = await kv.get('spots_base')  ?? DEFAULTS.base;
    const dance = await kv.get('spots_dance') ?? DEFAULTS.dance;
    return res.json({ base: Number(base), dance: Number(dance) });
  }

  if (req.method === 'POST') {
    const { tariff } = req.body;
    if (!['base', 'dance'].includes(tariff)) {
      return res.status(400).json({ error: 'invalid tariff' });
    }

    const key     = `spots_${tariff}`;
    const current = Number(await kv.get(key) ?? DEFAULTS[tariff]);

    if (current <= 0) {
      return res.status(409).json({ error: 'no spots left' });
    }

    // Инициализируем если ключа не было, потом декрементируем
    await kv.set(key, current - 1);
    return res.json({ remaining: current - 1 });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
