// Vercel Serverless Function: proxy sicuro verso Groq (la chiave resta segreta sul server)
const SB = 'https://syfqjhxwpxxnfwdsfmfd.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZnFqaHh3cHh4bmZ3ZHNmbWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMDY5MjEsImV4cCI6MjEwNjg4MjkyMX0.u92QIsN5fh0eReTtmvLSqjS96HuuNqvycHNk3JkhTxk';
const CATS = ['Maglie','Camicie','Felpe','Maglioni','Jeans','Pantaloni','Gonne','Vestiti','Giacche','Scarpe','Accessori'];
const VISION = process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b';
const TEXT = process.env.GROQ_TEXT_MODEL || 'llama-3.3-70b-versatile';

async function groq(model, messages) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.GROQ_API_KEY },
    body: JSON.stringify({ model, messages, temperature: 0.4 }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || 'Errore Groq');
  const txt = (j.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '');
  const m = txt.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Risposta AI non valida');
  return JSON.parse(m[0]);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' });
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY non configurata su Vercel' });
  // Solo utenti loggati su Supabase
  const tok = (req.headers.authorization || '').replace('Bearer ', '');
  const u = tok && await fetch(SB + '/auth/v1/user', { headers: { apikey: ANON, Authorization: 'Bearer ' + tok } });
  if (!u || !u.ok) return res.status(401).json({ error: 'Non autorizzato' });
  try {
    const b = req.body || {};
    if (b.task === 'tag') {
      const out = await groq(VISION, [{ role: 'user', content: [
        { type: 'text', text: `Sei un esperto di moda. Guarda questo capo e rispondi SOLO con un JSON: {"name":"nome breve in italiano (es. Maglione a trecce beige)","category":"una tra ${CATS.join(', ')}","color":"colore principale in italiano","brand":"marca se visibile, altrimenti stringa vuota"}` },
        { type: 'image_url', image_url: { url: b.image } }] }]);
      return res.json(out);
    }
    if (b.task === 'stylist') {
      const out = await groq(TEXT, [
        { role: 'system', content: 'Sei uno stylist personale. Usa ESCLUSIVAMENTE i capi della lista, citandoli con il loro id esatto. Ogni look deve avere un capo sopra (o un vestito), un capo sotto (se non è un vestito), scarpe se disponibili, e facoltativamente giacca o accessorio. Tieni conto di meteo e richiesta, abbina bene i colori. Se le persone sono due, crea look coordinati ma non identici, dando a ciascuno capi del proprio guardaroba. Rispondi SOLO con JSON: {"looks":[{"title":"...","reason":"una frase in italiano","ids":["id1","id2"]}]} con 3 look.' },
        { role: 'user', content: `Persone: ${b.people.join(', ')}\nMeteo a Firenze: ${b.weather}\nRichiesta: ${b.request || 'un outfit per oggi'}\nCapi: ${JSON.stringify(b.items)}` }]);
      return res.json(out);
    }
    return res.status(400).json({ error: 'Richiesta sconosciuta' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
