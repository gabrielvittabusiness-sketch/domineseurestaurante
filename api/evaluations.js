import { kv } from '@vercel/kv';

function slug(s) {
  return (
    String(s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'vendedor'
  );
}

// Regra de pontos: cada call some/diminui pontos do vendedor com base na nota
// ponderada da IA, usando 60 como referência ("dentro do esperado" = neutro).
// Ex.: nota 100 -> +8 pontos · nota 60 -> 0 pontos · nota 20 -> -8 pontos.
function pointsFor(aiOverall) {
  return Math.round((Number(aiOverall) - 60) / 5);
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const list = (await kv.get('evaluations')) || [];
    const { seller } = req.query;
    const filtered = seller ? list.filter((e) => e.sellerId === seller) : list;
    return res.status(200).json({ items: filtered });
  }

  if (req.method === 'POST') {
    const ev = req.body || {};
    if (!ev.seller || !ev.role || typeof ev.aiOverall !== 'number') {
      return res.status(400).json({ error: 'invalid_evaluation' });
    }
    const sellerId = slug(ev.seller + '_' + ev.role);
    ev.sellerId = sellerId;
    ev.createdAt = Date.now();

    const list = (await kv.get('evaluations')) || [];
    list.push(ev);
    await kv.set('evaluations', list);

    const sellers = (await kv.get('sellers')) || {};
    const s = sellers[sellerId] || {
      name: ev.seller,
      role: ev.role,
      points: 0,
      stage: 'diagnostico',
      actions: [],
    };
    const delta = pointsFor(ev.aiOverall);
    s.points = (s.points || 0) + delta;
    s.name = ev.seller;
    s.role = ev.role;
    s.lastEvaluatedAt = ev.createdAt;
    sellers[sellerId] = s;
    await kv.set('sellers', sellers);

    return res.status(200).json({ ok: true, sellerId, pointsDelta: delta, pointsTotal: s.points });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
}
