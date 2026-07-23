import type { FastifyInstance } from 'fastify';

const trendCacheTtlMs = 6 * 60 * 60 * 1000;
const trendLexicon = [
  '古风世情', '古言脑洞', '宫斗宅斗', '种田经营', '年代重生', '民国言情', '快穿虐渣', '玄幻言情',
  '现言脑洞', '青春甜宠', '职场婚恋', '豪门总裁', '星光璀璨', '女频悬疑', '科幻末世', '星际机甲',
  '先婚后爱', '追妻火葬场', '网恋掉马', '双向暗恋', '破镜重圆', '双强', '事业升级', '大女主',
  '悬疑求生', '规则怪谈', '无限流', '末世基建', '仙侠修真', '轻喜剧', '治愈日常', '娱乐圈'
];
const fallbackKeywords = ['现言脑洞', '古言脑洞', '青春甜宠', '职场婚恋', '年代重生', '种田经营', '快穿虐渣', '女频悬疑', '末世基建', '玄幻言情'];

let cachedPayload: { keywords: string[]; fetchedAt: number; sourceLabel: string } | null = null;

function decodeXmlEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function fetchSearchTrendText(query: string) {
  const url = new URL('https://www.bing.com/search');
  url.searchParams.set('format', 'rss');
  url.searchParams.set('q', query);
  const response = await fetch(url, {
    headers: {
      Accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8',
      'User-Agent': 'BabyLink-Fanfic-Trend/1.0'
    },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) return '';
  return decodeXmlEntities((await response.text()).replace(/<[^>]+>/g, ' '));
}

async function collectTrendKeywords() {
  const year = new Date().getFullYear();
  const queries = [
    `${year} 女频网络小说 热门分类 榜单`,
    `${year} 女频小说 热门标签 新书`,
    `${year} 古言 现言 幻想言情 热门题材`
  ];
  const texts = await Promise.all(queries.map((query) => fetchSearchTrendText(query).catch(() => '')));
  const corpus = texts.join('\n');
  const scored = trendLexicon
    .map((keyword, order) => ({
      keyword,
      count: corpus.split(keyword).length - 1,
      order
    }))
    .filter((entry) => entry.count > 0)
    .sort((left, right) => right.count - left.count || left.order - right.order)
    .map((entry) => entry.keyword);
  return [...scored, ...fallbackKeywords.filter((keyword) => !scored.includes(keyword))].slice(0, 14);
}

export async function registerFanficTrendRoutes(app: FastifyInstance) {
  app.get('/api/fanfic/trends', {
    config: { rateLimit: { max: 12, timeWindow: '1 minute' } }
  }, async (_request, reply) => {
    const now = Date.now();
    if (!cachedPayload || now - cachedPayload.fetchedAt >= trendCacheTtlMs) {
      const keywords = await collectTrendKeywords().catch(() => fallbackKeywords);
      cachedPayload = {
        keywords: keywords.length ? keywords : fallbackKeywords,
        fetchedAt: now,
        sourceLabel: '公开搜索趋势 · 仅提取通用题材标签'
      };
    }
    reply.header('Cache-Control', 'private, max-age=1800');
    return cachedPayload;
  });
}