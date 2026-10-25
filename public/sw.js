/**
 * Service Worker com Estratégia Network-First para Arquivos Críticos (B11)
 * Plataforma Surubim · Apuração 2026
 */

const CACHE_NAME = 'apuracao-surubim-2026-v2';

const CRITICAL_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './uf-paths.js',
  './manifest.webmanifest',
  './icon.svg',
  './img/cand-1.webp',
  './img/cand-2.webp'
];

// Instalação tolerante a falhas individuais (Promise.allSettled)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        CRITICAL_ASSETS.map((asset) => cache.add(asset).catch(() => {}))
      );
    })
  );
});

// Ativação e limpeza de versões anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de Fetch
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Não armazena nem intercepta chamadas dinâmicas da API
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Network-First para scripts e páginas essenciais (evita cache preso)
  const isDocumentOrScript = 
    event.request.destination === 'document' ||
    event.request.destination === 'script' ||
    event.request.destination === 'style';

  if (isDocumentOrScript) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-First resiliente para imagens e fontes estáticas
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});