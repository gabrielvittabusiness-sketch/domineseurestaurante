// /api/analyze — recebe a transcrição + critérios, chama o Gemini e devolve a análise.
// A chave do Gemini nunca é exposta ao navegador: ela vive só aqui, no servidor.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { transcript, role, criteria, outcome } = req.body || {};
  if (!transcript || typeof transcript !== 'string') {
    return res.status(400).json({ error: 'transcript_required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'missing_api_key' });

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const critList = (criteria || [])
    .map((c) => `- id "${c.id}": ${c.name} (peso ${c.weight})`)
    .join('\n');

  const outcomeLabel =
    outcome === 'venda' ? 'Esta foi uma call VENCEDORA (resultou em venda).'
    : outcome === 'perdida' ? 'Esta foi uma call PERDIDA (o cliente não fechou).'
    : 'Esta foi uma call de FOLLOW-UP (ainda em negociação).';

  const prompt = `Você é um especialista em treinamento comercial (sales enablement) para a Domine Seu Restaurante, empresa que vende consultoria/assessoria para donos de restaurante (food service). Avalie a call de vendas abaixo, feita por um(a) ${role === 'sdr' ? 'SDR' : 'closer'}, segundo estes critérios e pesos definidos pela gestão comercial:
${critList}

${outcomeLabel} Leve isso em conta na sua análise: se foi vencedora, destaque o que funcionou e pode virar padrão; se foi perdida ou follow-up, aprofunde os gaps que provavelmente custaram a venda.

Para cada critério dê uma nota de 0 a 100 baseada em evidências concretas da transcrição (não invente eventos). Identifique pontos fortes, gaps de melhoria e sugestões de treinamento específicas e acionáveis para este vendedor, e monte um plano de ação com 3 a 5 passos e prazo sugerido para cada um.

Responda SOMENTE com um JSON válido, sem texto antes ou depois, no formato exato:
{"scores":[{"id":"<id do critério>","nota":0,"comentario":"..."}],"forcas":["..."],"gaps":["..."],"sugestoesTreino":["..."],"roadmap":[{"acao":"...","prazo":"..."}]}

TRANSCRIÇÃO DA CALL:
${transcript.slice(0, 45000)}`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
        }),
      }
    );
    const data = await r.json();
    if (!r.ok) {
      return res.status(502).json({ error: 'gemini_error', detail: data });
    }
    const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text).join('');
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return res.status(502).json({ error: 'invalid_json', raw: text });
    }
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: 'server_error', message: String(e) });
  }
}
