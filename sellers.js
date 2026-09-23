import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const sellers = (await kv.get('sellers')) || {};
    return res.status(200).json({ items: sellers });
  }

  if (req.method === 'POST') {
    const { sellerId, stage, action } = req.body || {};
    if (!sellerId) return res.status(400).json({ error: 'seller_required' });

    const sellers = (await kv.get('sellers')) || {};
    const s = sellers[sellerId] || {
      name: sellerId,
      role: 'closer',
      points: 0,
      stage: 'diagnostico',
      actions: [],
    };
    if (stage) s.stage = stage;
    if (action && action.type) {
      s.actions = s.actions || [];
      s.actions.unshift({
        type: action.type,
        note: action.note || '',
        date: action.date || new Date().toISOString().slice(0, 10),
        at: Date.now(),
      });
    }
    sellers[sellerId] = s;
    await kv.set('sellers', sellers);
    return res.status(200).json({ ok: true, seller: s });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
}
