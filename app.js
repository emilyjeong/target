/**
 * ═════════════════════════════════════════════════════════════
 * 주식 수집 목표 - app.js
 * ═════════════════════════════════════════════════════════════
 *
 * 데이터 흐름:
 *   GAS Web App (?action=targets)
 *     → JSON 응답 { generatedAt, fxRate, stocks: [...] }
 *     → 진척률 내림차순 정렬
 *     → 카드 렌더링
 * ═════════════════════════════════════════════════════════════
 */

// ─── 1. 진입 ──────────────────────────────────────────────
async function init() {
  try {
    const data = await fetchTargets();
    renderAll(data);
  } catch (err) {
    console.error('로드 실패:', err);
    showError(err.message || '알 수 없는 오류');
  }
}

async function fetchTargets() {
  const url = `${CONFIG.GAS_URL}?action=targets`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── 2. 렌더링 ────────────────────────────────────────────
function renderAll(data) {
  if (data.error) {
    showError(data.error);
    return;
  }

  // 진척률 내림차순 (완료 → 높은 순 → 낮은 순)
  const sorted = [...(data.stocks || [])].sort(
    (a, b) => b.progressPct - a.progressPct
  );

  document.getElementById('stockCount').textContent = `${sorted.length} 종목`;
  updateLastUpdateTime(data.generatedAt);

  const container = document.getElementById('stocks');
  if (sorted.length === 0) {
    container.innerHTML =
      '<div class="loading">Config_Targets 시트에 목표 종목을 입력하세요.</div>';
    return;
  }
  container.innerHTML = sorted.map(renderCard).join('');
}

function renderCard(s) {
  const pct = Math.round(s.progressPct * 100);

  // 색상: 완료 / 50%+ / 50% 미만
  let pctClass, fillClass;
  if (s.complete) {
    pctClass = 'complete';
    fillClass = 'pos';
  } else if (s.progressPct >= 0.5) {
    pctClass = '';
    fillClass = 'accent';
  } else {
    pctClass = 'low';
    fillClass = 'info';
  }

  const cardClass = s.complete ? 'stock complete' : 'stock';
  const badge = s.complete ? '<span class="badge">✓ COMPLETE</span>' : '';

  // 비용 라인 (완료 종목 숨김)
  const costLine = s.complete ? '' : `
    <div class="cost-line">
      <div>
        <div class="cost-label">💰 완료까지</div>
        <div class="cost-detail">${s.remaining}주 × ${formatWon(s.priceKRW)}</div>
      </div>
      <div class="cost-value">${formatWon(s.remainingCostKRW)}</div>
    </div>
  `;

  // 남은 주식
  const remainingLine = s.complete
    ? '<div class="count-remaining done">🎉 목표 달성!</div>'
    : `<div class="count-remaining"><span class="num">${s.remaining}</span>주 남음</div>`;

  return `
    <div class="${cardClass}">
      <div class="stock-head">
        <div class="stock-name-wrap">
          <div class="stock-name">${escapeHtml(s.name)} ${badge}</div>
          <div class="stock-ticker">${escapeHtml(s.ticker)}</div>
        </div>
        <div class="stock-pct-wrap">
          <div class="stock-pct ${pctClass}">${pct}<span style="font-size:14px;">%</span></div>
          <div class="stock-pct-sub">달성</div>
        </div>
      </div>

      <div class="progress">
        <div class="progress-fill ${fillClass}" style="width: ${Math.min(100, pct)}%"></div>
      </div>

      <div class="count-line">
        <div>
          <span class="count-current">${s.current}</span>
          <span class="count-divider">/</span>
          <span class="count-target">${s.target}<span class="count-unit">주</span></span>
        </div>
        ${remainingLine}
      </div>

      ${costLine}

      <div class="split">
        <div class="split-item"><span class="ico">🐰</span> Em <span class="qty">${s.wife}</span>주</div>
        <div class="split-item"><span class="ico">🦊</span> Fabio <span class="qty">${s.husband}</span>주</div>
      </div>
    </div>
  `;
}

// ─── 3. 유틸 ──────────────────────────────────────────────
function formatWon(amount) {
  return '₩' + Math.round(amount || 0).toLocaleString(CONFIG.LOCALE);
}

function updateLastUpdateTime(iso) {
  if (!iso) return;
  const date = new Date(iso);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  document.getElementById('lastUpdate').innerHTML =
    `<span class="live-dot"></span>${hh}:${mm}`;
}

function showError(message) {
  document.getElementById('stocks').innerHTML =
    `<div class="error">⚠️ 로드 실패<br><small style="opacity:0.7">${escapeHtml(message)}</small></div>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── 시작 ─────────────────────────────────────────────────
init();
