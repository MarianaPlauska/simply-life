// GET /api/fetch-news?topics=React,IA,Supabase
// Busca notícias reais via Google News RSS (100% grátis, sem API key)
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topics } = req.query;

  if (!topics) {
    return res.status(400).json({ error: 'topics obrigatório (ex: topics=React,IA)' });
  }

  const topicList = topics.split(',').map(t => t.trim()).filter(Boolean);

  try {
    const allNews = [];

    for (const topic of topicList.slice(0, 5)) { // max 5 tópicos
      try {
        // Google News RSS - 100% grátis, sem key, sem limites
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
        const rssRes = await fetch(rssUrl);

        if (!rssRes.ok) continue;

        const xml = await rssRes.text();

        // parse RSS XML simples (sem dependência de lib)
        const items = parseRssItems(xml);

        items.slice(0, 3).forEach((item, idx) => {
          allNews.push({
            titulo: item.title,
            resumo: item.description || '',
            url: item.link,
            fonte: item.source || 'Google News',
            topico: topic,
            relevancia: Math.max(50, 95 - (idx * 10)), // primeiros são mais relevantes
            timestamp: item.pubDate || new Date().toISOString(),
          });
        });
      } catch (err) {
        console.warn(`Erro buscando ${topic}:`, err.message);
      }
    }

    // ordena por relevância
    allNews.sort((a, b) => b.relevancia - a.relevancia);

    return res.status(200).json({
      news: allNews.slice(0, 15), // max 15 notícias
      topicsSearched: topicList,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('News error:', err);
    return res.status(500).json({ error: 'Falha ao buscar notícias', details: err.message });
  }
}

// parser RSS simples sem dependências
function parseRssItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    items.push({
      title: extractTag(itemXml, 'title'),
      link: extractTag(itemXml, 'link'),
      description: cleanHtml(extractTag(itemXml, 'description')),
      source: extractTag(itemXml, 'source'),
      pubDate: extractTag(itemXml, 'pubDate'),
    });
  }

  return items;
}

function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const m = regex.exec(xml);
  return m ? (m[1] || m[2] || '').trim() : '';
}

function cleanHtml(html) {
  return html
    .replace(/<[^>]+>/g, '') // remove tags HTML
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .substring(0, 300);
}
