// Tiene sveglio il progetto Supabase gratuito (chiamata giornaliera da Vercel Cron)
module.exports = async (req, res) => {
  const r = await fetch('https://syfqjhxwpxxnfwdsfmfd.supabase.co/rest/v1/items?select=id&limit=1', {
    headers: { apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZnFqaHh3cHh4bmZ3ZHNmbWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMDY5MjEsImV4cCI6MjEwNjg4MjkyMX0.u92QIsN5fh0eReTtmvLSqjS96HuuNqvycHNk3JkhTxk' },
  });
  res.status(200).json({ ok: true, status: r.status });
};
