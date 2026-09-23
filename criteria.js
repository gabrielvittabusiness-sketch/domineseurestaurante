import { kv } from '@vercel/kv';

const DEFAULT_CRITERIA = [
  { id: 'rapport', name: 'Rapport / Abertura', weight: 10 },
  { id: 'diagnostico', name: 'Diagnóstico', weight: 15 },
  { id: 'implicacao', name: 'Implicação / Aprofundamento da dor', weight: 20 },
  { id: 'pitch', name: 'Apresentação da solução', weight: 20 },
  { id: 'revisao', name: 'Revisão da proposta', weight: 10 },
  { id: 'transicao', name: 'Transição para fechamento', weight: 10 },
  { id: 'fechamento', name: 'Fechamento', weight: 15 },
];

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const items = await kv.get('criteria');
    return res.status(200).json({ items: items && items.length ? items : DEFAULT_CRITERIA });
  }
  if (req.method === 'POST') {
    const { items } = req.body || {};
    if (!Array.isArray(items)) return res.status(400).json({ error: 'invalid_items' });
    await kv.set('criteria', items);
    return res.status(200).json({ ok: true });
  }
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
}
