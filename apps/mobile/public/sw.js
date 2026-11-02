// Service worker da versão web: abre sem internet e recebe notificações.
// Os dados (tarefas, humor, gastos) já ficam no aparelho pelo próprio app;
// aqui guardamos só a casca (HTML, JS, fontes e ícones).

importScripts('/push-sw-handler.js');

const CACHE = 'sunfy-shell-v1';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/pwa-192x192.png', '/favicon.svg'];

self.addEventListener('install', (event) =>
{
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) =>
{
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) =>
{
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // só o próprio site; API, Supabase e IA sempre vão para a rede
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  // páginas: rede primeiro, sem internet abre a última versão guardada
  if (req.mode === 'navigate')
  {
    event.respondWith(
      fetch(req)
        .then((res) =>
        {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  // arquivos do build têm hash no nome: guardar na primeira vez e reaproveitar
  event.respondWith(
    caches.match(req).then((hit) =>
      hit || fetch(req).then((res) =>
      {
        if (res.ok)
        {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }),
    ),
  );
});
