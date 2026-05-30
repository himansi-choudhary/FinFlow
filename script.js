/**
 * FinFlow — Smart Expense Tracker
 * script.js — Main application logic
 *
 * Sections:
 *  1. State & Constants
 *  2. Storage Helpers
 *  3. Utility Functions
 *  4. Navigation & Pages
 *  5. Dashboard
 *  6. Transactions Page
 *  7. Charts (Chart.js)
 *  8. Analytics Page
 *  9. Budget Page
 * 10. Goals Page
 * 11. Recurring Page
 * 12. Modals
 * 13. CSV Import/Export
 * 14. Toast Notifications
 * 15. Theme & Currency
 * 16. Init
 */

/* ════════════════════════════════════
   1. STATE & CONSTANTS
════════════════════════════════════ */

/** Category metadata: emoji, color */
const CATEGORIES = {
  Food:          { emoji: '🍔', color: '#f97316' },
  Travel:        { emoji: '✈️', color: '#60a5fa' },
  Shopping:      { emoji: '🛍️', color: '#a78bfa' },
  Bills:         { emoji: '💡', color: '#fbbf24' },
  Entertainment: { emoji: '🎬', color: '#f472b6' },
  Other:         { emoji: '📦', color: '#94a3b8' },
  Salary:        { emoji: '💼', color: '#00e5a0' },
  Freelance:     { emoji: '💻', color: '#34d399' },
  Investment:    { emoji: '📈', color: '#22d3ee' },
};

const INCOME_CATEGORIES  = ['Salary', 'Freelance', 'Investment', 'Other'];
const EXPENSE_CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Other'];

const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', CAD: 'C$', AUD: 'A$',
};

/** Application state */
const state = {
  transactions: [],
  budgets:      {},   // { Category: limit }
  goals:        [],
  recurring:    [],
  currency:     'USD',
  theme:        'dark',

  // UI state
  currentPage: 'dashboard',
  currentMonth: new Date(),
  editingId: null,

  // Transactions page
  filters: { search: '', type: 'all', category: 'all', month: '' },
  sort:    { key: 'date', dir: 'desc' },
  page:    1,
  perPage: 10,

  // Chart instances (kept for destroy/re-create)
  charts: {},
};

/* ════════════════════════════════════
   2. STORAGE HELPERS
════════════════════════════════════ */

function saveToStorage() {
  localStorage.setItem('finflow_transactions', JSON.stringify(state.transactions));
  localStorage.setItem('finflow_budgets',      JSON.stringify(state.budgets));
  localStorage.setItem('finflow_goals',        JSON.stringify(state.goals));
  localStorage.setItem('finflow_recurring',    JSON.stringify(state.recurring));
  localStorage.setItem('finflow_currency',     state.currency);
  localStorage.setItem('finflow_theme',        state.theme);
}

function loadFromStorage() {
  state.transactions = JSON.parse(localStorage.getItem('finflow_transactions') || '[]');
  state.budgets      = JSON.parse(localStorage.getItem('finflow_budgets')      || '{}');
  state.goals        = JSON.parse(localStorage.getItem('finflow_goals')        || '[]');
  state.recurring    = JSON.parse(localStorage.getItem('finflow_recurring')    || '[]');
  state.currency     = localStorage.getItem('finflow_currency') || 'USD';
  state.theme        = localStorage.getItem('finflow_theme')    || 'dark';
}

/* ════════════════════════════════════
   3. UTILITY FUNCTIONS
════════════════════════════════════ */

/** Format a number as currency */
function fmt(amount) {
  const sym = CURRENCY_SYMBOLS[state.currency] || '$';
  return sym + Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format date string to readable */
function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Get today's date as YYYY-MM-DD */
function today() {
  return new Date().toISOString().split('T')[0];
}

/** Generate a unique ID */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Get month key from date string: "2024-03" */
function monthKey(dateStr) {
  return dateStr ? dateStr.slice(0, 7) : '';
}

/** Get total income from transactions array */
function totalIncome(txs) {
  return txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
}
/** Get total expenses from transactions array */
function totalExpenses(txs) {
  return txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
}

/** Compute monthly spending per category */
function categorySpendThisMonth() {
  const now = monthKey(today());
  return state.transactions
    .filter(t => t.type === 'expense' && monthKey(t.date) === now)
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
}

/** Greeting based on time */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ════════════════════════════════════
   4. NAVIGATION & PAGES
════════════════════════════════════ */

function navigateTo(pageId) {
  // Update nav items
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === pageId);
  });

  // Show correct page
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + pageId);
  if (el) el.classList.add('active');

  state.currentPage = pageId;

  // Render page content
  switch (pageId) {
    case 'dashboard':    renderDashboard();    break;
    case 'transactions': renderTransactions(); break;
    case 'analytics':    renderAnalytics();    break;
    case 'budget':       renderBudgetPage();   break;
    case 'recurring':    renderRecurring();    break;
  }

  // Close mobile sidebar
  closeMobileSidebar();
}

/* ════════════════════════════════════
   5. DASHBOARD
════════════════════════════════════ */

function renderDashboard() {
  // Summary numbers
  const inc  = totalIncome(state.transactions);
  const exp  = totalExpenses(state.transactions);
  const bal  = inc - exp;
  const rate = inc > 0 ? Math.round(((inc - exp) / inc) * 100) : 0;

  document.getElementById('totalBalance').textContent  = fmt(bal);
  document.getElementById('totalIncome').textContent   = fmt(inc);
  document.getElementById('totalExpenses').textContent = fmt(exp);
  document.getElementById('savingsRate').textContent   = rate + '%';

  const balEl = document.getElementById('totalBalance');
  balEl.style.color = bal >= 0 ? 'var(--accent)' : 'var(--red)';

  // Greeting
  document.getElementById('dashGreeting').textContent =
    greeting() + '! Here\'s your financial overview.';

  // Budget warning
  checkBudgetWarnings();

  // Pie chart (spending by category this month)
  renderPieChart();

  // Bar chart (income vs expenses)
  renderBarChart();

  // Monthly summary
  renderMonthlySummary();

  // Recent transactions (last 8)
  renderRecentTransactions();

  // Re-init icons
  lucide.createIcons();
}

function renderMonthlySummary() {
  const key   = monthKey(
    state.currentMonth.toISOString().split('T')[0]
  );
  const month = state.currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  document.getElementById('currentMonthLabel').textContent = month;

  const txs   = state.transactions.filter(t => monthKey(t.date) === key);
  const inc   = totalIncome(txs);
  const exp   = totalExpenses(txs);
  const net   = inc - exp;
  const count = txs.length;

  const html = `
    <div class="month-stat">
      <div class="label">Income</div>
      <div class="value income">${fmt(inc)}</div>
    </div>
    <div class="month-stat">
      <div class="label">Expenses</div>
      <div class="value expense">${fmt(exp)}</div>
    </div>
    <div class="month-stat">
      <div class="label">Net</div>
      <div class="value" style="color:${net >= 0 ? 'var(--accent)' : 'var(--red)'}">${fmt(net)}</div>
    </div>
    <div class="month-stat">
      <div class="label">Transactions</div>
      <div class="value">${count}</div>
    </div>
    <div class="month-stat">
      <div class="label">Avg/Day</div>
      <div class="value">${exp > 0 ? fmt(exp / 30) : fmt(0)}</div>
    </div>
  `;

  document.getElementById('monthlyStats').innerHTML = html;
}

function renderRecentTransactions() {
  const container = document.getElementById('recentTransactions');
  const empty     = document.getElementById('recentEmpty');

  const recent = [...state.transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  if (recent.length === 0) {
    container.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  container.innerHTML = recent.map(tx => txItemHTML(tx)).join('');
  lucide.createIcons();
}

/** HTML for a transaction list item */
function txItemHTML(tx) {
  const cat  = CATEGORIES[tx.category] || CATEGORIES.Other;
  const sign = tx.type === 'income' ? '+' : '-';
  return `
    <div class="tx-item" data-id="${tx.id}">
      <div class="tx-icon" style="background:${cat.color}18;font-size:1.1rem">${cat.emoji}</div>
      <div class="tx-info">
        <div class="tx-desc">${escHtml(tx.description)}</div>
        <div class="tx-meta">${fmtDate(tx.date)} · ${tx.category}</div>
      </div>
      <div class="tx-amount ${tx.type}">${sign}${fmt(tx.amount)}</div>
      <div class="tx-actions">
        <button class="tx-action-btn edit" onclick="openEditModal('${tx.id}')" title="Edit">
          <i data-lucide="pencil"></i>
        </button>
        <button class="tx-action-btn delete" onclick="deleteTransaction('${tx.id}')" title="Delete">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    </div>
  `;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function checkBudgetWarnings() {
  const spend = categorySpendThisMonth();
  const warns = [];

  for (const [cat, limit] of Object.entries(state.budgets)) {
    const spent = spend[cat] || 0;
    const pct   = (spent / limit) * 100;
    if (pct >= 90) {
      warns.push(`${cat}: ${Math.round(pct)}% of budget used (${fmt(spent)} / ${fmt(limit)})`);
    }
  }

  const banner = document.getElementById('budgetWarning');
  if (warns.length > 0) {
    document.getElementById('budgetWarningText').textContent = warns[0];
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

/* ════════════════════════════════════
   6. TRANSACTIONS PAGE
════════════════════════════════════ */

function renderTransactions() {
  const filtered = getFilteredTransactions();
  const sorted   = sortTransactions(filtered);
  const total    = sorted.length;
  const pages    = Math.max(1, Math.ceil(total / state.perPage));
  state.page     = Math.min(state.page, pages);

  const slice = sorted.slice((state.page - 1) * state.perPage, state.page * state.perPage);

  const tbody = document.getElementById('transactionTableBody');
  const empty = document.getElementById('tableEmpty');

  if (slice.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    tbody.innerHTML = slice.map(tx => txRowHTML(tx)).join('');
  }

  renderPagination(pages);
  lucide.createIcons();
}

function txRowHTML(tx) {
  const cat  = CATEGORIES[tx.category] || CATEGORIES.Other;
  const sign = tx.type === 'income' ? '+' : '-';
  return `
    <tr>
      <td>${fmtDate(tx.date)}</td>
      <td>
        <div style="font-weight:500">${escHtml(tx.description)}</div>
        ${tx.note ? `<div style="font-size:.75rem;color:var(--text-2)">${escHtml(tx.note)}</div>` : ''}
      </td>
      <td><span class="cat-badge">${cat.emoji} ${tx.category}</span></td>
      <td><span class="type-badge ${tx.type}">${tx.type}</span></td>
      <td class="tx-amount ${tx.type}" style="font-size:.9rem">${sign}${fmt(tx.amount)}</td>
      <td>
        <div class="tx-actions" style="opacity:1">
          <button class="tx-action-btn edit" onclick="openEditModal('${tx.id}')" title="Edit">
            <i data-lucide="pencil"></i>
          </button>
          <button class="tx-action-btn delete" onclick="deleteTransaction('${tx.id}')" title="Delete">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function getFilteredTransactions() {
  const { search, type, category, month } = state.filters;
  return state.transactions.filter(tx => {
    if (type !== 'all' && tx.type !== type) return false;
    if (category !== 'all' && tx.category !== category) return false;
    if (month && monthKey(tx.date) !== month) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!tx.description.toLowerCase().includes(q) &&
          !tx.category.toLowerCase().includes(q) &&
          !(tx.note || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

function sortTransactions(txs) {
  const { key, dir } = state.sort;
  return [...txs].sort((a, b) => {
    let va = a[key], vb = b[key];
    if (key === 'date') { va = new Date(va); vb = new Date(vb); }
    if (key === 'amount') { va = +va; vb = +vb; }
    if (key === 'description') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
    if (va < vb) return dir === 'asc' ? -1 : 1;
    if (va > vb) return dir === 'asc' ?  1 : -1;
    return 0;
  });
}

function renderPagination(pages) {
  const cont = document.getElementById('pagination');
  if (pages <= 1) { cont.innerHTML = ''; return; }

  let html = '';
  for (let i = 1; i <= pages; i++) {
    html += `<button class="page-btn${i === state.page ? ' active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
  cont.innerHTML = html;
}

function goToPage(p) {
  state.page = p;
  renderTransactions();
}

/* ════════════════════════════════════
   7. CHARTS
════════════════════════════════════ */

/** Chart.js default options helper */
function chartDefaults() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    textColor:  dark ? '#8891aa' : '#4b5563',
    gridColor:  dark ? '#ffffff0d' : '#0000000d',
  };
}

function destroyChart(name) {
  if (state.charts[name]) {
    state.charts[name].destroy();
    delete state.charts[name];
  }
}

/* ── Pie Chart (Dashboard) ── */
function renderPieChart() {
  destroyChart('pie');

  const key = monthKey(today());
  const txs = state.transactions.filter(t => t.type === 'expense' && monthKey(t.date) === key);

  const catTotals = {};
  txs.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });

  const labels = Object.keys(catTotals);
  const data   = Object.values(catTotals);
  const colors = labels.map(l => (CATEGORIES[l] || CATEGORIES.Other).color);

  const ctx = document.getElementById('pieChart');
  if (!ctx) return;

  const { textColor } = chartDefaults();

  state.charts.pie = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${fmt(ctx.raw)}`,
          },
        },
      },
    },
  });

  // Custom legend
  const legend = document.getElementById('pieLegend');
  if (legend) {
    if (labels.length === 0) {
      legend.innerHTML = '<span style="font-size:.8rem;color:var(--text-3)">No expenses this month</span>';
    } else {
      legend.innerHTML = labels.map((l, i) =>
        `<div class="legend-item">
          <div class="legend-dot" style="background:${colors[i]}"></div>
          ${l}
        </div>`
      ).join('');
    }
  }
}

/* ── Bar Chart (Dashboard) ── */
function renderBarChart() {
  destroyChart('bar');

  const months = +document.getElementById('barChartRange').value || 6;
  const labels = [], incData = [], expData = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key   = d.toISOString().slice(0, 7);
    const label = d.toLocaleString('default', { month: 'short' });
    const txs   = state.transactions.filter(t => monthKey(t.date) === key);
    labels.push(label);
    incData.push(totalIncome(txs));
    expData.push(totalExpenses(txs));
  }

  const ctx = document.getElementById('barChart');
  if (!ctx) return;

  const { textColor, gridColor } = chartDefaults();

  state.charts.bar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incData,
          backgroundColor: '#00e5a040',
          borderColor: '#00e5a0',
          borderWidth: 2,
          borderRadius: 6,
        },
        {
          label: 'Expenses',
          data: expData,
          backgroundColor: '#ff4d6d30',
          borderColor: '#ff4d6d',
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: { color: textColor, boxWidth: 12, boxHeight: 12, borderRadius: 4, useBorderRadius: true },
        },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.raw)}` } },
      },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: { ticks: { color: textColor, callback: v => fmt(v) }, grid: { color: gridColor } },
      },
    },
  });
}

/* ════════════════════════════════════
   8. ANALYTICS PAGE
════════════════════════════════════ */

function renderAnalytics() {
  renderTrendChart();
  renderDonutChart();
  renderInsights();
  renderCategoryBars();
  lucide.createIcons();
}

/* ── Trend Chart ── */
function renderTrendChart() {
  destroyChart('trend');

  const days   = +document.getElementById('trendRange').value || 30;
  const labels = [], data = [];

  for (let i = days - 1; i >= 0; i--) {
    const d    = new Date();
    d.setDate(d.getDate() - i);
    const key  = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const total = state.transactions
      .filter(t => t.type === 'expense' && t.date === key)
      .reduce((s, t) => s + t.amount, 0);
    labels.push(label);
    data.push(total);
  }

  const ctx = document.getElementById('trendChart');
  if (!ctx) return;

  const { textColor, gridColor } = chartDefaults();

  state.charts.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Daily Spending',
        data,
        borderColor: '#00e5a0',
        backgroundColor: 'rgba(0,229,160,.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#00e5a0',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { labels: { color: textColor } },
        tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.raw)}` } },
      },
      scales: {
        x: { ticks: { color: textColor, maxTicksLimit: 10 }, grid: { color: gridColor } },
        y: { ticks: { color: textColor, callback: v => fmt(v) }, grid: { color: gridColor } },
      },
    },
  });
}

/* ── Donut Chart (Analytics) ── */
function renderDonutChart() {
  destroyChart('donut');

  const catTotals = {};
  state.transactions
    .filter(t => t.type === 'expense')
    .forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });

  const labels = Object.keys(catTotals);
  const data   = Object.values(catTotals);
  const colors = labels.map(l => (CATEGORIES[l] || CATEGORIES.Other).color);

  const ctx = document.getElementById('donutChart');
  if (!ctx) return;

  const { textColor } = chartDefaults();

  state.charts.donut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '55%',
      plugins: {
        legend: { position: 'bottom', labels: { color: textColor, boxWidth: 12, padding: 12, useBorderRadius: true, borderRadius: 4 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmt(ctx.raw)}` } },
      },
    },
  });
}

/* ── Insights ── */
function renderInsights() {
  const list = document.getElementById('insightsList');
  const insights = [];

  const expenses = state.transactions.filter(t => t.type === 'expense');

  if (expenses.length === 0) {
    list.innerHTML = '<div class="insight-item"><div class="insight-icon">💡</div><div class="insight-text">Add some transactions to get spending insights.</div></div>';
    return;
  }

  // Highest category
  const catTotals = {};
  expenses.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });
  const topCat = Object.entries(catTotals).sort((a,b) => b[1] - a[1])[0];
  if (topCat) {
    insights.push({ icon: '🏆', text: `Your biggest spend category is <strong>${topCat[0]}</strong> at <strong>${fmt(topCat[1])}</strong> total.` });
  }

  // This month vs last month
  const thisKey = monthKey(today());
  const lastDate = new Date(); lastDate.setMonth(lastDate.getMonth() - 1);
  const lastKey = monthKey(lastDate.toISOString().split('T')[0]);
  const thisMonthExp = totalExpenses(state.transactions.filter(t => monthKey(t.date) === thisKey));
  const lastMonthExp = totalExpenses(state.transactions.filter(t => monthKey(t.date) === lastKey));
  if (lastMonthExp > 0) {
    const diff = thisMonthExp - lastMonthExp;
    const pct  = Math.abs(Math.round((diff / lastMonthExp) * 100));
    const dir  = diff >= 0 ? 'up' : 'down';
    insights.push({
      icon: diff >= 0 ? '📈' : '📉',
      text: `Spending is <strong>${pct}% ${dir}</strong> compared to last month (${fmt(thisMonthExp)} vs ${fmt(lastMonthExp)}).`,
    });
  }

  // Average transaction
  const avg = expenses.reduce((s, t) => s + t.amount, 0) / expenses.length;
  insights.push({ icon: '📊', text: `Average transaction is <strong>${fmt(avg)}</strong>.` });

  // Savings rate
  const inc  = totalIncome(state.transactions);
  const exp  = totalExpenses(state.transactions);
  const rate = inc > 0 ? Math.round(((inc - exp) / inc) * 100) : 0;
  insights.push({ icon: rate >= 20 ? '🌟' : '💡', text: `Overall savings rate: <strong>${rate}%</strong>. ${rate >= 20 ? 'Great job!' : 'Try to aim for 20%+.'}` });

  list.innerHTML = insights.map(i =>
    `<div class="insight-item">
      <div class="insight-icon">${i.icon}</div>
      <div class="insight-text">${i.text}</div>
    </div>`
  ).join('');
}

/* ── Category Progress Bars ── */
function renderCategoryBars() {
  const container = document.getElementById('categoryBars');
  const catTotals = {};
  state.transactions.filter(t => t.type === 'expense').forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });

  const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const max    = sorted[0]?.[1] || 1;

  if (sorted.length === 0) {
    container.innerHTML = '<div class="insight-item"><div class="insight-text">No expense data yet.</div></div>';
    return;
  }

  container.innerHTML = sorted.map(([cat, amt]) => {
    const pct   = (amt / max) * 100;
    const color = (CATEGORIES[cat] || CATEGORIES.Other).color;
    return `
      <div class="cat-bar-item">
        <div class="cat-bar-header">
          <span class="cat-bar-name">${(CATEGORIES[cat] || CATEGORIES.Other).emoji} ${cat}</span>
          <span class="cat-bar-amt">${fmt(amt)}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${pct}%;background:${color}"></div>
        </div>
      </div>
    `;
  }).join('');
}

/* ════════════════════════════════════
   9. BUDGET PAGE
════════════════════════════════════ */

function renderBudgetPage() {
  const list    = document.getElementById('budgetList');
  const empty   = document.getElementById('budgetEmpty');
  const spend   = categorySpendThisMonth();
  const entries = Object.entries(state.budgets);

  if (entries.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    list.innerHTML = entries.map(([cat, limit]) => {
      const spent  = spend[cat] || 0;
      const pct    = Math.min(100, Math.round((spent / limit) * 100));
      const cls    = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'safe';
      const color  = (CATEGORIES[cat] || CATEGORIES.Other).color;
      const emoji  = (CATEGORIES[cat] || CATEGORIES.Other).emoji;
      return `
        <div class="budget-item">
          <div class="budget-item-header">
            <div class="budget-item-name">
              <span>${emoji}</span>
              <span>${cat}</span>
              ${pct >= 90 ? '<span style="color:var(--yellow);font-size:.75rem">⚠️ Near limit</span>' : ''}
              ${pct >= 100 ? '<span style="color:var(--red);font-size:.75rem">🚨 Over budget!</span>' : ''}
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <div class="budget-item-amounts">${fmt(spent)} / <strong>${fmt(limit)}</strong> · ${pct}%</div>
              <button class="icon-btn" onclick="deleteBudget('${cat}')" title="Remove"><i data-lucide="x"></i></button>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${cls}" style="width:${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderGoals();
  lucide.createIcons();
}

function deleteBudget(cat) {
  delete state.budgets[cat];
  saveToStorage();
  renderBudgetPage();
  showToast('Budget removed.', 'warning');
}

/* ════════════════════════════════════
   10. GOALS PAGE
════════════════════════════════════ */

function renderGoals() {
  const list  = document.getElementById('goalsList');
  const empty = document.getElementById('goalsEmpty');

  if (state.goals.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  list.innerHTML = state.goals.map(g => {
    const pct     = Math.min(100, Math.round((g.saved / g.target) * 100));
    const remain  = Math.max(0, g.target - g.saved);
    const deadline = g.date ? ` · Target: ${fmtDate(g.date)}` : '';
    return `
      <div class="goal-item">
        <div class="goal-header">
          <div class="goal-name">🎯 ${escHtml(g.name)}</div>
          <div style="display:flex;gap:6px;align-items:center">
            <div class="goal-deadline">${pct}%${deadline}</div>
            <button class="icon-btn" onclick="deleteGoal('${g.id}')" title="Delete"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill safe" style="width:${pct}%"></div>
        </div>
        <div class="goal-amounts">
          <span>Saved: <strong>${fmt(g.saved)}</strong></span>
          <span>Remaining: <strong style="color:var(--red)">${fmt(remain)}</strong></span>
          <span>Goal: <strong>${fmt(g.target)}</strong></span>
        </div>
      </div>
    `;
  }).join('');
  lucide.createIcons();
}

function deleteGoal(id) {
  state.goals = state.goals.filter(g => g.id !== id);
  saveToStorage();
  renderGoals();
  showToast('Goal removed.', 'warning');
}

/* ════════════════════════════════════
   11. RECURRING PAGE
════════════════════════════════════ */

function renderRecurring() {
  const list  = document.getElementById('recurringList');
  const empty = document.getElementById('recurringEmpty');

  if (state.recurring.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  list.innerHTML = state.recurring.map(r => {
    const cat = CATEGORIES[r.category] || CATEGORIES.Other;
    return `
      <div class="recurring-item">
        <div class="rec-icon">${cat.emoji}</div>
        <div class="rec-info">
          <div class="rec-name">${escHtml(r.name)}</div>
          <div class="rec-meta">${r.frequency} · Next: ${fmtDate(r.nextDate)} · ${r.category}</div>
        </div>
        <div class="rec-amount">-${fmt(r.amount)}</div>
        <button class="icon-btn" onclick="deleteRecurring('${r.id}')" title="Delete"><i data-lucide="trash-2"></i></button>
      </div>
    `;
  }).join('');
  lucide.createIcons();
}

function deleteRecurring(id) {
  state.recurring = state.recurring.filter(r => r.id !== id);
  saveToStorage();
  renderRecurring();
  showToast('Recurring expense removed.', 'warning');
}

/* ════════════════════════════════════
   12. MODALS
════════════════════════════════════ */

/* ── Transaction Modal ── */
function openAddModal(type = 'expense') {
  state.editingId = null;
  document.getElementById('modalTitle').textContent = 'Add Transaction';
  document.getElementById('transactionForm').reset();
  clearFormErrors();

  // Set correct tab
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === type));
  populateCategorySelect(type);

  // Default date to today
  document.getElementById('txDate').value = today();

  // Hide recurring freq
  document.getElementById('txRecurringFreq').classList.add('hidden');

  updateCurrencySymbols();
  document.getElementById('transactionModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('txDesc').focus(), 100);
}

function openEditModal(id) {
  const tx = state.transactions.find(t => t.id === id);
  if (!tx) return;

  state.editingId = id;
  document.getElementById('modalTitle').textContent = 'Edit Transaction';
  clearFormErrors();

  // Set tab
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tx.type));
  populateCategorySelect(tx.type);

  document.getElementById('txDesc').value     = tx.description;
  document.getElementById('txAmount').value   = tx.amount;
  document.getElementById('txDate').value     = tx.date;
  document.getElementById('txCategory').value = tx.category;
  document.getElementById('txNote').value     = tx.note || '';

  updateCurrencySymbols();
  document.getElementById('transactionModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('transactionModal').classList.add('hidden');
  state.editingId = null;
}

function populateCategorySelect(type) {
  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const sel  = document.getElementById('txCategory');
  sel.innerHTML = '<option value="">Select category…</option>' +
    cats.map(c => `<option value="${c}">${(CATEGORIES[c]||CATEGORIES.Other).emoji} ${c}</option>`).join('');
}

function validateTransactionForm() {
  clearFormErrors();
  let valid = true;

  const desc   = document.getElementById('txDesc').value.trim();
  const amount = parseFloat(document.getElementById('txAmount').value);
  const date   = document.getElementById('txDate').value;
  const cat    = document.getElementById('txCategory').value;

  if (!desc) { showFieldError('errDesc', 'Description is required.'); valid = false; document.getElementById('txDesc').classList.add('error'); }
  if (!amount || amount <= 0) { showFieldError('errAmount', 'Enter a valid amount.'); valid = false; document.getElementById('txAmount').classList.add('error'); }
  if (!cat) { showFieldError('errCategory', 'Please select a category.'); valid = false; document.getElementById('txCategory').classList.add('error'); }
  if (!date) { valid = false; }

  return valid;
}

function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}
function clearFormErrors() {
  ['errDesc', 'errAmount', 'errCategory'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
  ['txDesc', 'txAmount', 'txCategory'].forEach(id => {
    document.getElementById(id)?.classList.remove('error');
  });
}

function saveTransaction(e) {
  e.preventDefault();
  if (!validateTransactionForm()) return;

  const activeTab = document.querySelector('.tab.active');
  const type      = activeTab?.dataset.tab || 'expense';
  const tx = {
    id:          state.editingId || uid(),
    type,
    description: document.getElementById('txDesc').value.trim(),
    amount:      parseFloat(document.getElementById('txAmount').value),
    date:        document.getElementById('txDate').value,
    category:    document.getElementById('txCategory').value,
    note:        document.getElementById('txNote').value.trim(),
    recurring:   document.getElementById('txRecurring').checked,
    recurringFreq: document.getElementById('txRecurringFreq').value,
    createdAt:   new Date().toISOString(),
  };

  if (state.editingId) {
    const idx = state.transactions.findIndex(t => t.id === state.editingId);
    if (idx !== -1) state.transactions[idx] = tx;
    showToast('Transaction updated! ✅', 'success');
  } else {
    state.transactions.push(tx);
    showToast('Transaction added! 🎉', 'success');
  }

  saveToStorage();
  closeModal();

  // Refresh current page
  if (state.currentPage === 'dashboard')    renderDashboard();
  else if (state.currentPage === 'transactions') renderTransactions();
  else if (state.currentPage === 'analytics')    renderAnalytics();
  else if (state.currentPage === 'budget')       renderBudgetPage();
}

function deleteTransaction(id) {
  if (!confirm('Delete this transaction?')) return;
  state.transactions = state.transactions.filter(t => t.id !== id);
  saveToStorage();
  showToast('Transaction deleted.', 'warning');
  if (state.currentPage === 'dashboard')         renderDashboard();
  else if (state.currentPage === 'transactions') renderTransactions();
}

/* ── Budget Modal ── */
function openBudgetModal() {
  document.getElementById('budgetForm').reset();
  updateCurrencySymbols();
  document.getElementById('budgetModal').classList.remove('hidden');
}
function closeBudgetModal() {
  document.getElementById('budgetModal').classList.add('hidden');
}
function saveBudget(e) {
  e.preventDefault();
  const cat    = document.getElementById('budgetCategory').value;
  const amount = parseFloat(document.getElementById('budgetAmount').value);
  if (!cat || !amount || amount <= 0) { showToast('Fill in all fields.', 'error'); return; }
  state.budgets[cat] = amount;
  saveToStorage();
  closeBudgetModal();
  renderBudgetPage();
  showToast(`Budget set for ${cat}!`, 'success');
}

/* ── Goal Modal ── */
function openGoalModal() {
  document.getElementById('goalForm').reset();
  updateCurrencySymbols();
  document.getElementById('goalModal').classList.remove('hidden');
}
function closeGoalModal() {
  document.getElementById('goalModal').classList.add('hidden');
}
function saveGoal(e) {
  e.preventDefault();
  const name   = document.getElementById('goalName').value.trim();
  const target = parseFloat(document.getElementById('goalTarget').value);
  const saved  = parseFloat(document.getElementById('goalSaved').value) || 0;
  const date   = document.getElementById('goalDate').value;
  if (!name || !target || target <= 0) { showToast('Fill in all fields.', 'error'); return; }
  state.goals.push({ id: uid(), name, target, saved, date });
  saveToStorage();
  closeGoalModal();
  renderGoals();
  showToast('Goal created! 🎯', 'success');
}

/* ── Recurring Modal ── */
function openRecurringModal() {
  document.getElementById('recurringForm').reset();
  document.getElementById('recDate').value = today();
  updateCurrencySymbols();
  document.getElementById('recurringModal').classList.remove('hidden');
}
function closeRecurringModal() {
  document.getElementById('recurringModal').classList.add('hidden');
}
function saveRecurring(e) {
  e.preventDefault();
  const name     = document.getElementById('recName').value.trim();
  const amount   = parseFloat(document.getElementById('recAmount').value);
  const freq     = document.getElementById('recFreq').value;
  const category = document.getElementById('recCategory').value;
  const nextDate = document.getElementById('recDate').value;
  if (!name || !amount || amount <= 0 || !nextDate) { showToast('Fill in all fields.', 'error'); return; }
  state.recurring.push({ id: uid(), name, amount, frequency: freq, category, nextDate });
  saveToStorage();
  closeRecurringModal();
  renderRecurring();
  showToast('Recurring expense added!', 'success');
}

/* ════════════════════════════════════
   13. CSV IMPORT / EXPORT
════════════════════════════════════ */

function exportCSV() {
  if (state.transactions.length === 0) { showToast('No transactions to export.', 'warning'); return; }

  const headers = ['Date', 'Description', 'Type', 'Category', 'Amount', 'Note'];
  const rows    = state.transactions.map(t =>
    [t.date, `"${t.description}"`, t.type, t.category, t.amount, `"${t.note || ''}"`].join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `finflow-transactions-${today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Transactions exported!', 'success');
}

function importCSV(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = ev => {
    const lines  = ev.target.result.split('\n').filter(Boolean);
    const header = lines[0].toLowerCase();

    if (!header.includes('date') || !header.includes('amount')) {
      showToast('Invalid CSV format. Expected: Date, Description, Type, Category, Amount, Note', 'error');
      return;
    }

    let added = 0, skipped = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      const date = cols[0]?.trim();
      const desc = (cols[1] || '').replace(/"/g, '').trim();
      const type = cols[2]?.trim().toLowerCase();
      const cat  = cols[3]?.trim();
      const amt  = parseFloat(cols[4]);
      const note = (cols[5] || '').replace(/"/g, '').trim();

      if (!date || !desc || !amt || !['income', 'expense'].includes(type)) { skipped++; continue; }

      state.transactions.push({ id: uid(), date, description: desc, type, category: cat || 'Other', amount: amt, note, createdAt: new Date().toISOString() });
      added++;
    }

    saveToStorage();
    renderDashboard();
    showToast(`Imported ${added} transactions.${skipped ? ` (${skipped} skipped)` : ''}`, 'success');
  };
  reader.readAsText(file);
  e.target.value = ''; // reset
}

/* ════════════════════════════════════
   14. TOAST NOTIFICATIONS
════════════════════════════════════ */

function showToast(message, type = 'success') {
  const icons = { success: '✅', error: '❌', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;

  const container = document.getElementById('toastContainer');
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ════════════════════════════════════
   15. THEME & CURRENCY
════════════════════════════════════ */

function setTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  saveToStorage();
  // Recreate charts with updated colors
  if (state.currentPage === 'dashboard')  { renderPieChart(); renderBarChart(); }
  if (state.currentPage === 'analytics')  { renderAnalytics(); }
}

function toggleTheme() {
  setTheme(state.theme === 'dark' ? 'light' : 'dark');
}

function updateCurrencySymbols() {
  const sym = CURRENCY_SYMBOLS[state.currency] || '$';
  document.querySelectorAll('.currency-symbol').forEach(el => { el.textContent = sym; });
  document.getElementById('currencySymbol').textContent      = sym;
  document.getElementById('budgetCurrencySymbol').textContent = sym;
  document.getElementById('goalCurrencySymbol').textContent   = sym;
  document.getElementById('recCurrencySymbol').textContent    = sym;
}

/* ════════════════════════════════════
   16. INIT
════════════════════════════════════ */

function init() {
  // Load persisted data
  loadFromStorage();

  // Apply theme
  document.documentElement.setAttribute('data-theme', state.theme);

  // Apply currency
  document.getElementById('currencySelect').value = state.currency;
  updateCurrencySymbols();

  // Initialize Lucide icons
  lucide.createIcons();

  // ── Event Listeners ──

  // Nav items
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  // View-all link on dashboard
  document.querySelectorAll('.btn-link[data-page]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  // Open transaction modal buttons
  document.getElementById('openAddModal')?.addEventListener('click', () => openAddModal());
  document.getElementById('openAddModal2')?.addEventListener('click', () => openAddModal());

  // Close modal
  document.getElementById('closeModal')?.addEventListener('click', closeModal);
  document.getElementById('cancelModal')?.addEventListener('click', closeModal);
  document.getElementById('transactionModal')?.addEventListener('click', e => { if (e.target.id === 'transactionModal') closeModal(); });

  // Transaction form tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      populateCategorySelect(tab.dataset.tab);
      // Reset category when switching
      document.getElementById('txCategory').value = '';
    });
  });

  // Save transaction
  document.getElementById('transactionForm')?.addEventListener('submit', saveTransaction);

  // Recurring checkbox
  document.getElementById('txRecurring')?.addEventListener('change', e => {
    document.getElementById('txRecurringFreq').classList.toggle('hidden', !e.target.checked);
  });

  // Transaction filters
  document.getElementById('searchInput')?.addEventListener('input', e => {
    state.filters.search = e.target.value; state.page = 1; renderTransactions();
  });
  document.getElementById('filterType')?.addEventListener('change', e => {
    state.filters.type = e.target.value; state.page = 1; renderTransactions();
  });
  document.getElementById('filterCategory')?.addEventListener('change', e => {
    state.filters.category = e.target.value; state.page = 1; renderTransactions();
  });
  document.getElementById('filterMonth')?.addEventListener('change', e => {
    state.filters.month = e.target.value; state.page = 1; renderTransactions();
  });
  document.getElementById('clearFilters')?.addEventListener('click', () => {
    state.filters = { search: '', type: 'all', category: 'all', month: '' };
    document.getElementById('searchInput').value    = '';
    document.getElementById('filterType').value     = 'all';
    document.getElementById('filterCategory').value = 'all';
    document.getElementById('filterMonth').value    = '';
    state.page = 1;
    renderTransactions();
  });

  // Table sort
  document.querySelectorAll('.transaction-table th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (state.sort.key === key) state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
      else { state.sort.key = key; state.sort.dir = 'asc'; }
      state.page = 1;
      renderTransactions();
    });
  });

  // CSV
  document.getElementById('exportCSV')?.addEventListener('click', exportCSV);
  document.getElementById('importCSV')?.addEventListener('change', importCSV);

  // Budget
  document.getElementById('openBudgetModal')?.addEventListener('click', openBudgetModal);
  document.getElementById('closeBudgetModal')?.addEventListener('click', closeBudgetModal);
  document.getElementById('cancelBudgetModal')?.addEventListener('click', closeBudgetModal);
  document.getElementById('budgetModal')?.addEventListener('click', e => { if (e.target.id === 'budgetModal') closeBudgetModal(); });
  document.getElementById('budgetForm')?.addEventListener('submit', saveBudget);

  // Goals
  document.getElementById('openGoalModal')?.addEventListener('click', openGoalModal);
  document.getElementById('closeGoalModal')?.addEventListener('click', closeGoalModal);
  document.getElementById('cancelGoalModal')?.addEventListener('click', closeGoalModal);
  document.getElementById('goalModal')?.addEventListener('click', e => { if (e.target.id === 'goalModal') closeGoalModal(); });
  document.getElementById('goalForm')?.addEventListener('submit', saveGoal);

  // Recurring
  document.getElementById('openRecurringModal')?.addEventListener('click', openRecurringModal);
  document.getElementById('closeRecurringModal')?.addEventListener('click', closeRecurringModal);
  document.getElementById('cancelRecurringModal')?.addEventListener('click', closeRecurringModal);
  document.getElementById('recurringModal')?.addEventListener('click', e => { if (e.target.id === 'recurringModal') closeRecurringModal(); });
  document.getElementById('recurringForm')?.addEventListener('submit', saveRecurring);

  // Theme toggles
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  document.getElementById('themeToggleMobile')?.addEventListener('click', toggleTheme);

  // Currency selector
  document.getElementById('currencySelect')?.addEventListener('change', e => {
    state.currency = e.target.value;
    saveToStorage();
    updateCurrencySymbols();
    renderCurrentPage();
  });

  // Month navigation
  document.getElementById('prevMonth')?.addEventListener('click', () => {
    state.currentMonth.setMonth(state.currentMonth.getMonth() - 1);
    renderMonthlySummary();
  });
  document.getElementById('nextMonth')?.addEventListener('click', () => {
    const next = new Date(state.currentMonth);
    next.setMonth(next.getMonth() + 1);
    if (next <= new Date()) { state.currentMonth = next; renderMonthlySummary(); }
  });

  // Bar chart range
  document.getElementById('barChartRange')?.addEventListener('change', renderBarChart);

  // Trend chart range
  document.getElementById('trendRange')?.addEventListener('change', renderTrendChart);

  // Mobile hamburger
  document.getElementById('hamburger')?.addEventListener('click', openMobileSidebar);
  document.getElementById('sidebarOverlay')?.addEventListener('click', closeMobileSidebar);

  // Keyboard: ESC closes modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal(); closeBudgetModal(); closeGoalModal(); closeRecurringModal();
    }
  });

  // ── Initial render ──
  renderDashboard();
}

function renderCurrentPage() {
  navigateTo(state.currentPage);
}

/* ── Mobile Sidebar ── */
function openMobileSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('visible');
}
function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('visible');
}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', init);