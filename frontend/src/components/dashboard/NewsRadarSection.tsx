import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper, Globe, TrendingUp, ExternalLink,
  ChevronRight, Clock, Star, Rss,
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { fadeUp, staggerContainer, staggerChild } from './DashboardPrimitives';

/* ══════════════════════════════════════════════════════════════
   NewsRadarSection — Radar de Notícias Personalizado
   O usuário define tópicos de interesse e a IA busca notícias
   relevantes automaticamente. Funciona como um feed curado
   pelo JARVIS baseado nas preferências do usuário.
   ══════════════════════════════════════════════════════════════ */

import { useEffect } from 'react';
import { useTaskStore } from '../../store/useTaskStore';

function timeAgo(date: Date): string
{
  const hours = Math.round((Date.now() - date.getTime()) / 3600000);
  if (hours < 1) return 'agora';
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.round(hours / 24)}d atrás`;
}

function getTopicColor(topico: string): { bg: string; text: string }
{
  const map: Record<string, { bg: string; text: string }> = {
    'React': { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
    'Supabase': { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    'IA': { bg: 'bg-violet-500/10', text: 'text-violet-400' },
    'Produtividade': { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    'TypeScript': { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  };
  return map[topico] || { bg: 'bg-zinc-800/50', text: 'text-zinc-400' };
}

export function NewsRadarSection()
{
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const newsItems = useTaskStore((s) => s.newsItems);
  const userInterests = useTaskStore((s) => s.userInterests);
  const fetchNews = useTaskStore((s) => s.fetchNews);
  const fetchInterests = useTaskStore((s) => s.fetchInterests);

  useEffect(() => {
    fetchNews();
    fetchInterests();
  }, [fetchNews, fetchInterests]);

  const topics = userInterests.filter(i => i.ativo).map(i => i.topico);

  const filteredNews = activeFilter
    ? newsItems.filter((n) => n.topico === activeFilter)
    : newsItems;

  return (
    <motion.div {...fadeUp}>
      <GlassCard className="!border-cyan-500/10">
        {/* glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.04),transparent_50%)] pointer-events-none z-0" />

        <div className="relative z-10">
          {/* header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center relative">
                <Rss className="w-5 h-5 text-cyan-400" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-white flex items-center gap-2">
                  Radar de Notícias
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                    {newsItems.length} novas
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-600">
                  Curado pela IA com base nos seus interesses
                </p>
              </div>
            </div>

            <button className="text-[10px] text-zinc-600 hover:text-cyan-400 transition-colors flex items-center gap-1">
              Gerenciar tópicos <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* filtros de tópico */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveFilter(null)}
              className={`
                shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all duration-200
                ${!activeFilter
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'bg-zinc-900/30 text-zinc-500 border border-white/5 hover:text-zinc-300'
                }
              `}
            >
              Todos
            </button>
            {topics.map((topic) =>
            {
              const colors = getTopicColor(topic);
              const isActive = activeFilter === topic;
              return (
                <button
                  key={topic}
                  onClick={() => setActiveFilter(isActive ? null : topic)}
                  className={`
                    shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all duration-200
                    ${isActive
                      ? `${colors.bg} ${colors.text} border border-current/20`
                      : 'bg-zinc-900/30 text-zinc-500 border border-white/5 hover:text-zinc-300'
                    }
                  `}
                >
                  {topic}
                </button>
              );
            })}
          </div>

          {/* news list */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="space-y-2"
          >
            <AnimatePresence mode="popLayout">
              {filteredNews.slice(0, 4).map((news) =>
              {
                const topicColor = getTopicColor(news.topico);

                return (
                  <motion.a
                    key={news.id}
                    variants={staggerChild}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 p-4 rounded-2xl bg-zinc-900/30 border border-white/5 hover:bg-zinc-800/30 hover:border-cyan-500/15 transition-all duration-300 block"
                  >
                    {/* ícone de fonte */}
                    <div className="shrink-0 w-9 h-9 rounded-xl bg-zinc-800/50 flex items-center justify-center">
                      {news.relevancia >= 85
                        ? <Star className="w-4 h-4 text-amber-400" />
                        : <Newspaper className="w-4 h-4 text-zinc-500" />
                      }
                    </div>

                    {/* conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[9px] font-medium ${topicColor.text} ${topicColor.bg} px-1.5 py-0.5 rounded-md`}>
                          {news.topico}
                        </span>
                        <span className="text-[9px] text-zinc-600 flex items-center gap-0.5">
                          <Globe className="w-3 h-3" />
                          {news.fonte || 'Notícia'}
                        </span>
                        <span className="text-[9px] text-zinc-700 flex items-center gap-0.5 ml-auto">
                          <Clock className="w-3 h-3" />
                          {timeAgo(new Date(news.created_at))}
                        </span>
                      </div>

                      <h4 className="text-[12px] font-medium text-zinc-200 leading-snug mb-1 group-hover:text-white transition-colors">
                        {news.titulo}
                      </h4>

                      <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2">
                        {news.resumo}
                      </p>
                    </div>

                    {/* link icon */}
                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-4 h-4 text-zinc-600" />
                    </div>
                  </motion.a>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* relevância footer */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-500" />
              <span className="text-[10px] text-zinc-600">
                Relevância média: {newsItems.length ? Math.round(newsItems.reduce((s, n) => s + n.relevancia, 0) / newsItems.length) : 0}%
              </span>
            </div>
            <span className="text-[10px] text-zinc-700">
              Atualizado há 12 min
            </span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
