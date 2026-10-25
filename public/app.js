/**
 * Apuração Eleições 2026 - 2º Turno (Presidente e Governadores)
 * Plataforma Surubim · Arquitetura Modular ES
 */

import { UF_PATHS } from './uf-paths.js';

// ============================================================================
// CONFIGURAÇÃO GERAL E CANDIDATOS OFICIAIS (TSE)
// ============================================================================
export const CONFIG = {
  CYCLE: 'ele2026',
  ELE_PRES_OFICIAL: '6258', // 2º Turno Presidente
  ELE_GOV_OFICIAL: '6260',  // 2º Turno Governador
  POLL_INTERVAL_MS: 12000,
  UFS_GOV_DISPUTED: ['ac', 'am', 'df', 'es', 'rn', 'to'],
};

// Configuração oficial de candidatos a Presidente
export const PRES_CANDIDATES = {
  13: { name: 'Lula', full: 'Luiz Inácio Lula da Silva', party: 'PT', number: '13', color: '#e02d42', photo: 'img/cand-1.webp', slot: 0 },
  22: { name: 'Flávio Bolsonaro', full: 'Flávio Nantes Bolsonaro', party: 'PL', number: '22', color: '#1e6bf2', photo: 'img/cand-2.webp', slot: 1 }
};

// Candidatos Oficiais de Governador nas 6 UFs de 2º Turno (B8, B9, B12)
export const GOV_CANDIDATES = {
  ac: [
    { name: 'Mailza Assis', full: 'Mailza Assis', party: 'PP', number: '11', color: '#005ea6', photo: 'img/gov/ac-mailza-assis.webp', slot: 0 },
    { name: 'Alan Rick', full: 'Alan Rick Miranda', party: 'Republicanos', number: '10', color: '#108043', photo: 'img/gov/ac-alan-rick.webp', slot: 1 }
  ],
  am: [
    { name: 'Omar Aziz', full: 'Omar José Abdel Aziz', party: 'PSD', number: '55', color: '#f59e0b', photo: 'img/gov/am-omar-aziz.webp', slot: 0 },
    { name: 'Professora Maria do Carmo', full: 'Maria do Carmo Seffair', party: 'PL', number: '22', color: '#2563eb', photo: 'img/gov/am-maria-do-carmo.webp', slot: 1 }
  ],
  df: [
    { name: 'Celina Leão', full: 'Celina Leão Hizim Ferreira', party: 'PP', number: '11', color: '#005ea6', photo: 'img/gov/df-celina-leao.webp', slot: 0 },
    { name: 'Leandro Grass', full: 'Leandro Grass', party: 'PT', number: '13', color: '#dc2626', photo: 'img/gov/df-leandro-grass.webp', slot: 1 }
  ],
  es: [
    { name: 'Lorenzo Pazolini', full: 'Lorenzo Pazolini', party: 'Republicanos', number: '10', color: '#108043', photo: 'img/gov/es-lorenzo-pazolini.webp', slot: 0 },
    { name: 'Ricardo Ferraço', full: 'Ricardo de Rezende Ferraço', party: 'MDB', number: '15', color: '#0284c7', photo: 'img/gov/es-ricardo-ferraco.webp', slot: 1 }
  ],
  rn: [
    { name: 'Allyson', full: 'Allyson Leandro Bezerra Silva', party: 'União', number: '44', color: '#4f46e5', photo: 'img/gov/rn-allyson.webp', slot: 0 },
    { name: 'Cadu de Lula', full: 'Carlos Eduardo Saraiva', party: 'PT', number: '13', color: '#dc2626', photo: 'img/gov/rn-cadu-de-lula.webp', slot: 1 }
  ],
  to: [
    { name: 'Professora Dorinha', full: 'Maria Auxiliadora Seabra Rezende', party: 'União', number: '44', color: '#4f46e5', photo: 'img/gov/to-professora-dorinha.webp', slot: 0 },
    { name: 'Vicentinho Júnior', full: 'Vicente Alves de Oliveira Júnior', party: 'PP', number: '11', color: '#005ea6', photo: 'img/gov/to-vicentinho-junior.webp', slot: 1 }
  ]
};

export const UF_NAMES = {
  ac: 'Acre', al: 'Alagoas', ap: 'Amapá', am: 'Amazonas', ba: 'Bahia', ce: 'Ceará',
  df: 'Distrito Federal', es: 'Espírito Santo', go: 'Goiás', ma: 'Maranhão', mt: 'Mato Grosso',
  ms: 'Mato Grosso do Sul', mg: 'Minas Gerais', pa: 'Pará', pb: 'Paraíba', pr: 'Paraná',
  pe: 'Pernambuco', pi: 'Piauí', rj: 'Rio de Janeiro', rn: 'Rio Grande do Norte', rs: 'Rio Grande do Sul',
  ro: 'Rondônia', rr: 'Roraima', sc: 'Santa Catarina', sp: 'São Paulo', se: 'Sergipe', to: 'Tocantins',
  br: 'Brasil'
};

// ============================================================================
// ARMAZENAMENTO SEPARADO POR CARGO (B2)
// ============================================================================
const store = {
  role: 'pres', // 'pres' ou 'gov'
  activeGovUf: 'ac',
  selectedPanelUf: null,
  pres: {
    national: null,
    states: {},
    etags: {},
    timestamps: {}
  },
  gov: {
    states: {},
    etags: {},
    timestamps: {}
  }
};

let busy = false;
let pendingTick = false;
let pollingTimer = null;

// ============================================================================
// ROTEAMENTO VIA URL (B6)
// ============================================================================
function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (!hash) return { role: 'pres', uf: null };
  const parts = hash.split('/');
  if (parts[0] === 'gov') {
    return { role: 'gov', uf: parts[1] || 'ac' };
  } else if (parts[0] === 'pres') {
    return { role: 'pres', uf: parts[1] || null };
  } else if (UF_NAMES[parts[0]]) {
    return { role: 'pres', uf: parts[0] };
  }
  return { role: 'pres', uf: null };
}

function updateUrl(push = true) {
  let newHash = `#${store.role}`;
  if (store.role === 'gov') {
    newHash += `/${store.activeGovUf}`;
  } else if (store.selectedPanelUf) {
    newHash += `/${store.selectedPanelUf}`;
  }
  if (window.location.hash !== newHash) {
    if (push) {
      window.history.pushState(null, '', newHash);
    } else {
      window.history.replaceState(null, '', newHash);
    }
  }
}

// ============================================================================
// PARSER ROBUSTO (B8, B10)
// ============================================================================
export function parseUnified(data, cargoTarget = 1, uf = null) {
  if (!data) return null;
  const targetCode = Number(cargoTarget);
  const carg = Array.isArray(data.carg) ? data.carg.find(c => Number(c.cd) === targetCode) || data.carg[0] : null;
  if (!carg || !Array.isArray(carg.agr)) return null;

  const rawCands = [];
  for (const ag of carg.agr) {
    if (Array.isArray(ag.par)) {
      for (const p of ag.par) {
        if (Array.isArray(p.cand)) {
          for (const cd of p.cand) rawCands.push(cd);
        }
      }
    } else if (Array.isArray(ag.cand)) {
      for (const cd of ag.cand) rawCands.push(cd);
    }
  }

  let candidates = [];
  if (targetCode === 1) {
    // Presidente
    candidates = rawCands.map(c => {
      const num = String(c.n);
      const conf = PRES_CANDIDATES[num] || { name: c.nm, full: c.nm, party: c.sg || '', number: num, color: '#64748b', slot: 99 };
      return {
        number: num,
        name: conf.name,
        full: conf.full,
        party: conf.party,
        color: conf.color,
        photo: conf.photo,
        slot: conf.slot,
        votes: Number(c.vap || 0),
        percent: parseFloat((c.pvap || '0').replace(',', '.'))
      };
    }).sort((a, b) => a.slot - b.slot);
  } else {
    // Governador (B8, B9)
    const ufKey = String(uf).toLowerCase();
    const govConf = GOV_CANDIDATES[ufKey] || [];
    candidates = rawCands.map(c => {
      const num = String(c.n);
      const conf = govConf.find(gc => gc.number === num) || {
        name: c.nm, full: c.nm, party: c.sg || '', number: num,
        color: '#64748b', slot: 99, photo: null
      };
      return {
        number: num,
        name: conf.name,
        full: conf.full,
        party: conf.party,
        color: conf.color,
        photo: conf.photo,
        slot: conf.slot,
        votes: Number(c.vap || 0),
        percent: parseFloat((c.pvap || '0').replace(',', '.'))
      };
    }).sort((a, b) => a.slot - b.slot);
  }

  return {
    uf: (data.uf || uf || 'br').toLowerCase(),
    st: data.st || '0',
    pst: parseFloat((data.pst || '0').replace(',', '.')),
    ht: data.ht || '--:--:--',
    candidates
  };
}

// ============================================================================
// SIMULADOR LOCAL PARA TESTES (?sim) (B12)
// ============================================================================
function buildLocalSimFallback(role, uf = 'br') {
  const isGov = role === 'gov';
  const ufKey = uf.toLowerCase();

  if (!isGov) {
    return {
      uf: 'br',
      pst: '78,40',
      ht: '18:34:10',
      carg: [{
        cd: '1',
        agr: [{
          cand: [
            { n: '13', nm: 'Lula', pvap: '51,20', vap: '61450200', sg: 'PT' },
            { n: '22', nm: 'Flávio Bolsonaro', pvap: '48,80', vap: '58570100', sg: 'PL' }
          ]
        }]
      }]
    };
  } else {
    const list = GOV_CANDIDATES[ufKey] || [
      { name: 'Candidato 1', party: 'P1', number: '10', color: '#108043' },
      { name: 'Candidato 2', party: 'P2', number: '20', color: '#005ea6' }
    ];
    return {
      uf: ufKey,
      pst: '82,10',
      ht: '18:35:22',
      carg: [{
        cd: '3',
        agr: [{
          cand: [
            { n: list[0].number, nm: list[0].name, pvap: '52,40', vap: '412000', sg: list[0].party },
            { n: list[1].number, nm: list[1].name, pvap: '47,60', vap: '374200', sg: list[1].party }
          ]
        }]
      }]
    };
  }
}

// ============================================================================
// CICLO DE CONSULTA / FETCH (B3, B4)
// ============================================================================
async function fetchEndpoint(role, uf) {
  const isSim = new URLSearchParams(window.location.search).has('sim');
  if (isSim) {
    const mock = buildLocalSimFallback(role, uf);
    return parseUnified(mock, role === 'gov' ? 3 : 1, uf);
  }

  const cycle = CONFIG.CYCLE;
  const ele = role === 'gov' ? CONFIG.ELE_GOV_OFICIAL : CONFIG.ELE_PRES_OFICIAL;
  const ufParam = uf.toLowerCase();
  const url = `/api/tse/${cycle}/${ele}/dados/${ufParam}/${ufParam}-c000${role === 'gov' ? '3' : '1'}-e00${ele}-u.json`;

  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (res.status === 304) return null; // Sem alteração
    if (!res.ok) return null;
    const data = await res.json();
    return parseUnified(data, role === 'gov' ? 3 : 1, ufParam);
  } catch {
    return null;
  }
}

export async function tick(force = false) {
  if (busy) {
    pendingTick = true;
    return;
  }
  busy = true;
  const liveIndicator = document.getElementById('live-indicator');
  if (liveIndicator) liveIndicator.textContent = '● Atualizando';

  try {
    if (store.role === 'pres') {
      const nat = await fetchEndpoint('pres', 'br');
      if (nat) store.pres.national = nat;

      // Atualiza também a UF aberta no painel, se houver
      if (store.selectedPanelUf) {
        const ufd = await fetchEndpoint('pres', store.selectedPanelUf);
        if (ufd) store.pres.states[store.selectedPanelUf] = ufd;
      }
    } else {
      // Governador: busca todas as 6 UFs em disputa (B3)
      const tasks = CONFIG.UFS_GOV_DISPUTED.map(async (uf) => {
        const parsed = await fetchEndpoint('gov', uf);
        if (parsed) store.gov.states[uf] = parsed;
      });
      await Promise.allSettled(tasks);
    }

    renderAll();
  } finally {
    busy = false;
    if (liveIndicator) liveIndicator.textContent = '● Ao vivo';
    if (pendingTick) {
      pendingTick = false;
      tick();
    }
  }
}

// ============================================================================
// RENDERIZAÇÃO DA INTERFACE
// ============================================================================
function renderAll() {
  renderOverview();
  renderGovChips();
  renderMap();
  renderPanel();
}

function renderOverview() {
  const isGov = store.role === 'gov';
  const data = isGov ? store.gov.states[store.activeGovUf] : store.pres.national;

  const titleEl = document.getElementById('overview-title');
  const subEl = document.getElementById('overview-subtitle');
  const urnasEl = document.getElementById('stat-urnas');
  const timeEl = document.getElementById('stat-update-time');
  const barEl = document.getElementById('progress-urnas');
  const candsRow = document.getElementById('candidates-row');
  const leadBanner = document.getElementById('lead-banner');

  if (isGov) {
    const ufUpper = store.activeGovUf.toUpperCase();
    titleEl.textContent = `Governador · ${UF_NAMES[store.activeGovUf] || ufUpper}`;
    subEl.textContent = `Apuração Estadual 2º Turno (${ufUpper})`;
  } else {
    titleEl.textContent = 'Presidente da República';
    subEl.textContent = 'Totalização Nacional Oficial';
  }

  if (!data || !data.candidates || data.candidates.length === 0) {
    urnasEl.textContent = '0,00%';
    timeEl.textContent = '--:--:--';
    barEl.style.width = '0%';
    candsRow.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 1.5rem;">Aguardando dados oficiais do TSE...</div>';
    leadBanner.textContent = 'Aguardando o início da apuração...';
    return;
  }

  urnasEl.textContent = `${data.pst.toFixed(2).replace('.', ',')}%`;
  timeEl.textContent = data.ht || '--:--:--';
  barEl.style.width = `${Math.min(data.pst, 100)}%`;

  candsRow.innerHTML = data.candidates.map(cand => {
    const photoMarkup = cand.photo
      ? `<img src="${cand.photo}" alt="${cand.name}" class="cand-avatar" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'),{className:'cand-avatar',textContent:'${cand.name.charAt(0)}'}))">`
      : `<div class="cand-avatar" style="background:${cand.color}">${cand.name.charAt(0)}</div>`;

    return `
      <div class="cand-card" style="--cand-color: ${cand.color}">
        ${photoMarkup}
        <div class="cand-info">
          <div class="cand-name-row">
            <span class="cand-name">${cand.name}</span>
            <span class="cand-party">${cand.party}</span>
          </div>
          <div class="cand-votes">${cand.votes.toLocaleString('pt-BR')} votos</div>
        </div>
        <div class="cand-percent" style="color:${cand.color}">${cand.percent.toFixed(2).replace('.', ',')}%</div>
      </div>
    `;
  }).join('');

  // Banner de Liderança
  if (data.candidates.length >= 2) {
    const sorted = [...data.candidates].sort((a, b) => b.votes - a.votes);
    const diffVotes = Math.abs(sorted[0].votes - sorted[1].votes);
    const diffPct = Math.abs(sorted[0].percent - sorted[1].percent).toFixed(2).replace('.', ',');
    
    if (diffVotes === 0 && sorted[0].votes === 0) {
      leadBanner.textContent = 'Aguardando primeiros boletins de urna pelo TSE.';
    } else if (diffVotes === 0) {
      leadBanner.textContent = 'Empate técnico absoluto na apuração.';
    } else {
      leadBanner.textContent = `${sorted[0].name} lidera com vantagem de ${diffPct} p.p. (${diffVotes.toLocaleString('pt-BR')} votos).`;
    }
  }
}

// Chips de UFs para Governador (B1, B7)
function renderGovChips() {
  const bar = document.getElementById('gov-chips-bar');
  const track = document.getElementById('gov-chips-track');
  if (store.role !== 'gov') {
    bar.hidden = true;
    return;
  }
  bar.hidden = false;

  // Renderiza apenas as 6 UFs oficiais
  track.innerHTML = CONFIG.UFS_GOV_DISPUTED.map(uf => {
    const isAct = store.activeGovUf === uf;
    const d = store.gov.states[uf];
    let leadColor = 'var(--neutral-gray)';
    if (d && d.candidates && d.candidates.length > 0) {
      const top = [...d.candidates].sort((a, b) => b.votes - a.votes)[0];
      if (top && top.votes > 0) leadColor = top.color;
    }

    return `
      <button class="chip-uf" role="tab" data-uf="${uf}" aria-pressed="${isAct}" aria-selected="${isAct}">
        <span class="chip-indicator" style="background:${leadColor}"></span>
        <span>${uf.toUpperCase()}</span>
      </button>
    `;
  }).join('');

  // Mantém foco e rola para o chip ativo suavemente
  const activeBtn = track.querySelector(`[data-uf="${store.activeGovUf}"]`);
  if (activeBtn) {
    activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

// ============================================================================
// MAPA INTERATIVO (B3, B5, B13)
// ============================================================================
function initMap() {
  const svg = document.getElementById('svg-map');
  const hoverTip = document.getElementById('map-hover-tip');
  if (!svg) return;

  svg.innerHTML = Object.entries(UF_PATHS).map(([uf, d]) => {
    return `<path id="map-uf-${uf}" data-uf="${uf}" d="${d}" tabindex="0" role="button" aria-label="${UF_NAMES[uf] || uf.toUpperCase()}"></path>`;
  }).join('');

  // Eventos de Pointer / Teclado
  svg.addEventListener('pointerover', (e) => {
    const path = e.target.closest('path');
    if (!path) return;
    path.classList.add('hover'); // B13: sem appendChild
    const uf = path.getAttribute('data-uf');
    if (hoverTip) {
      hoverTip.hidden = false;
      hoverTip.textContent = getMapTooltip(uf);
    }
  });

  svg.addEventListener('pointermove', (e) => {
    if (!hoverTip || hoverTip.hidden) return;
    const rect = svg.getBoundingClientRect();
    hoverTip.style.left = `${e.clientX - rect.left}px`;
    hoverTip.style.top = `${e.clientY - rect.top - 12}px`;
  });

  svg.addEventListener('pointerout', (e) => {
    const path = e.target.closest('path');
    if (path) path.classList.remove('hover');
    if (hoverTip) hoverTip.hidden = true;
  });

  svg.addEventListener('click', (e) => {
    const path = e.target.closest('path');
    if (path) {
      const uf = path.getAttribute('data-uf');
      handleSelectState(uf);
    }
  });

  svg.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const path = e.target.closest('path');
      if (path) {
        e.preventDefault();
        handleSelectState(path.getAttribute('data-uf'));
      }
    }
  });
}

function getMapTooltip(uf) {
  if (store.role === 'gov') {
    if (!CONFIG.UFS_GOV_DISPUTED.includes(uf)) {
      return `${UF_NAMES[uf]}: Governador definido no 1º turno`;
    }
    const d = store.gov.states[uf];
    if (!d || !d.candidates) return `${UF_NAMES[uf]}: Aguardando apuração`;
    const top = [...d.candidates].sort((a, b) => b.votes - a.votes)[0];
    return `${UF_NAMES[uf]}: ${top.name} (${top.percent.toFixed(1)}%)`;
  }
  return `${UF_NAMES[uf]} (Clique para ver detalhes)`;
}

function renderMap() {
  const isGov = store.role === 'gov';
  Object.keys(UF_PATHS).forEach(uf => {
    const el = document.getElementById(`map-uf-${uf}`);
    if (!el) return;

    el.classList.remove('selected', 'non-disputed');

    if (isGov) {
      if (!CONFIG.UFS_GOV_DISPUTED.includes(uf)) {
        el.classList.add('non-disputed');
        el.style.fill = 'var(--neutral-bg-state)';
        return;
      }
      if (store.activeGovUf === uf) {
        el.classList.add('selected');
      }
      const d = store.gov.states[uf];
      if (d && d.candidates && d.candidates.length > 0) {
        const top = [...d.candidates].sort((a, b) => b.votes - a.votes)[0];
        el.style.fill = top.votes > 0 ? top.color : 'var(--neutral-bg-state)';
      } else {
        el.style.fill = 'var(--neutral-bg-state)';
      }
    } else {
      if (store.selectedPanelUf === uf) {
        el.classList.add('selected');
      }
      el.style.fill = 'var(--neutral-bg-state)';
    }
  });
}

// ============================================================================
// PAINEL DE DETALHES (B5, B7, GLASS CARD & BOTTOM SHEET)
// ============================================================================
function handleSelectState(uf) {
  if (store.role === 'gov') {
    if (CONFIG.UFS_GOV_DISPUTED.includes(uf)) {
      store.activeGovUf = uf;
      store.selectedPanelUf = uf;
      updateUrl(true);
      renderAll();
    } else {
      // Estado sem segundo turno no governo (B5)
      store.selectedPanelUf = uf;
      renderPanelNonDisputed(uf);
    }
  } else {
    store.selectedPanelUf = uf;
    updateUrl(true);
    tick(); // Carrega dados específicos da UF
    renderPanel();
  }
}

function renderPanelNonDisputed(uf) {
  const panel = document.getElementById('state-panel');
  const backdrop = document.getElementById('panel-backdrop');
  const badge = document.getElementById('panel-uf-badge');
  const title = document.getElementById('panel-title');
  const tag = document.getElementById('panel-status-tag');
  const body = document.getElementById('panel-body');

  badge.textContent = uf.toUpperCase();
  title.textContent = UF_NAMES[uf] || uf.toUpperCase();
  tag.textContent = 'Definido no 1º Turno';
  body.innerHTML = `
    <div style="text-align:center; padding: 2rem 1rem; color: var(--text-muted);">
      <p style="font-weight: 600; color: var(--text-main); margin-bottom: 0.5rem;">Eleição Encerrada</p>
      <p>O cargo de Governador neste estado foi liquidado no primeiro turno com mais de 50% dos votos válidos.</p>
    </div>
  `;

  panel.hidden = false;
  backdrop.hidden = false;
}

function renderPanel() {
  const panel = document.getElementById('state-panel');
  const backdrop = document.getElementById('panel-backdrop');
  const uf = store.selectedPanelUf;

  if (!uf) {
    panel.hidden = true;
    backdrop.hidden = true;
    return;
  }

  // Se for governador e UF não disputada, já tratado
  if (store.role === 'gov' && !CONFIG.UFS_GOV_DISPUTED.includes(uf)) return;

  panel.hidden = false;
  backdrop.hidden = false;

  const badge = document.getElementById('panel-uf-badge');
  const title = document.getElementById('panel-title');
  const tag = document.getElementById('panel-status-tag');
  const body = document.getElementById('panel-body');

  badge.textContent = uf.toUpperCase();
  title.textContent = UF_NAMES[uf] || uf.toUpperCase();

  const data = store.role === 'gov' ? store.gov.states[uf] : store.pres.states[uf];

  if (!data || !data.candidates || data.candidates.length === 0) {
    tag.textContent = 'Carregando dados...';
    body.innerHTML = '<div style="text-align:center; padding: 1.5rem; color: var(--text-muted);">Consultando apuração da UF no TSE...</div>';
    return;
  }

  tag.textContent = `Apuração: ${data.pst.toFixed(1)}% das urnas`;

  const sorted = [...data.candidates].sort((a, b) => b.votes - a.votes);
  const diff = Math.abs(sorted[0].votes - (sorted[1]?.votes || 0));
  const diffPct = Math.abs(sorted[0].percent - (sorted[1]?.percent || 0)).toFixed(2);

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:0.65rem;">
      ${sorted.map(c => `
        <div class="panel-candidate-row">
          <div class="panel-cand-top">
            <div class="panel-cand-meta">
              ${c.photo ? `<img src="${c.photo}" alt="${c.name}" class="panel-cand-thumb" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'),{className:'panel-cand-thumb',textContent:'${c.name.charAt(0)}'}))">` : `<div class="panel-cand-thumb" style="background:${c.color}">${c.name.charAt(0)}</div>`}
              <div>
                <div class="panel-cand-name">${c.name}</div>
                <div class="panel-cand-party">${c.party} · Nº ${c.number}</div>
              </div>
            </div>
            <div class="panel-cand-pct" style="color:${c.color}">${c.percent.toFixed(2).replace('.', ',')}%</div>
          </div>
          <div class="panel-bar-outer">
            <div class="panel-bar-inner" style="width:${c.percent}%; background:${c.color};"></div>
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); text-align:right;">
            ${c.votes.toLocaleString('pt-BR')} votos
          </div>
        </div>
      `).join('')}
    </div>
    <div class="panel-lead-text">
      ${sorted[0].votes > 0 ? `Diferença de ${diffPct.replace('.', ',')} p.p. (${diff.toLocaleString('pt-BR')} votos)` : 'Aguardando votos apurados nesta unidade federativa.'}
    </div>
  `;
}

function closePanel() {
  store.selectedPanelUf = null;
  updateUrl(true);
  const panel = document.getElementById('state-panel');
  const backdrop = document.getElementById('panel-backdrop');
  if (panel) panel.hidden = true;
  if (backdrop) backdrop.hidden = true;
  renderMap();
}

// ============================================================================
// MUDANÇA DE CARGO (B2)
// ============================================================================
function switchRole(role) {
  if (store.role === role) return;
  store.role = role;
  store.selectedPanelUf = null;

  document.getElementById('tab-pres').classList.toggle('active', role === 'pres');
  document.getElementById('tab-pres').setAttribute('aria-selected', role === 'pres');
  document.getElementById('tab-gov').classList.toggle('active', role === 'gov');
  document.getElementById('tab-gov').setAttribute('aria-selected', role === 'gov');

  closePanel();
  updateUrl(true);
  tick(true);
}

// ============================================================================
// INICIALIZAÇÃO E EVENTOS
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
  // Configuração inicial de rota e tema
  const initialRoute = parseHash();
  store.role = initialRoute.role;
  if (initialRoute.role === 'gov' && initialRoute.uf && CONFIG.UFS_GOV_DISPUTED.includes(initialRoute.uf)) {
    store.activeGovUf = initialRoute.uf;
  }
  if (initialRoute.uf) store.selectedPanelUf = initialRoute.uf;

  document.getElementById('tab-pres').classList.toggle('active', store.role === 'pres');
  document.getElementById('tab-gov').classList.toggle('active', store.role === 'gov');

  // Modo TV
  if (new URLSearchParams(window.location.search).has('tv')) {
    document.body.classList.add('mode-tv');
  }

  // Tema Claro/Escuro
  const savedTheme = localStorage.getItem('surubim-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.getElementById('btn-theme').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('surubim-theme', next);
  });

  // Alternadores de Cargo
  document.getElementById('tab-pres').addEventListener('click', () => switchRole('pres'));
  document.getElementById('tab-gov').addEventListener('click', () => switchRole('gov'));

  // Delegação de cliques nos Chips de Governador
  document.getElementById('gov-chips-track').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-uf]');
    if (!btn) return;
    const uf = btn.getAttribute('data-uf');
    store.activeGovUf = uf;
    store.selectedPanelUf = uf;
    updateUrl(true);
    renderAll();
  });

  // Fechamento de Painel
  document.getElementById('btn-panel-close').addEventListener('click', closePanel);
  document.getElementById('panel-backdrop').addEventListener('click', closePanel);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });

  // Compartilhamento
  document.getElementById('btn-panel-share').addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link da apuração copiado para a área de transferência!');
  });

  // Histórico do Navegador: Popstate (B6)
  window.addEventListener('popstate', () => {
    const r = parseHash();
    store.role = r.role;
    if (r.role === 'gov' && r.uf) store.activeGovUf = r.uf;
    store.selectedPanelUf = r.uf;
    renderAll();
  });

  initMap();
  tick();
  pollingTimer = setInterval(tick, CONFIG.POLL_INTERVAL_MS);

  // Registro do Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
});