import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { todayStr, localDateStr, pluralStars } from '../utils/helpers';
import type { StarEntry, Redemption, StatsView } from '../types';
import LineChart, { type SeriesEntry } from './LineChart';
import HistoryPanel from './HistoryPanel';

// ── Helpers ────────────────────────────────────────────────────────────────

type TimeWindow = 'today' | 'week' | 'month' | 'custom' | 'all';

const WINDOW_LABELS: Record<TimeWindow, string> = {
  today: 'Today', week: 'This Week', month: 'This Month', custom: 'Custom', all: 'All Time',
};

function prevDayStr(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function getMondayStr(): string {
  const d = new Date();
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return localDateStr(d);
}

function getFirstOfMonthStr(): string {
  const d = new Date();
  d.setDate(1);
  return localDateStr(d);
}

function calcStreaks(entries: StarEntry[]): { current: number; best: number } {
  if (entries.length === 0) return { current: 0, best: 0 };
  const dateSet = [...new Set(entries.map(e => e.date))].sort();
  let best = 1, run = 1;
  for (let i = 1; i < dateSet.length; i++) {
    if (dateSet[i - 1] === prevDayStr(dateSet[i])) { run++; if (run > best) best = run; }
    else run = 1;
  }
  const today = todayStr();
  const descDates = [...dateSet].reverse();
  let current = 0;
  const mostRecent = descDates[0];
  if (mostRecent === today || mostRecent === prevDayStr(today)) {
    let expected = mostRecent;
    for (const d of descDates) {
      if (d === expected) { current++; expected = prevDayStr(expected); }
      else break;
    }
  }
  return { current, best: Math.max(best, current) };
}

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function dowIndex(dateStr: string): number {
  const day = new Date(`${dateStr}T12:00:00`).getDay();
  return day === 0 ? 6 : day - 1;
}

function filterEntries(entries: StarEntry[], win: TimeWindow, from: string, to: string): StarEntry[] {
  const today = todayStr();
  if (win === 'today') return entries.filter(e => e.date === today);
  if (win === 'week') { const mon = getMondayStr(); return entries.filter(e => e.date >= mon && e.date <= today); }
  if (win === 'month') { const first = getFirstOfMonthStr(); return entries.filter(e => e.date >= first && e.date <= today); }
  if (win === 'custom' && from && to) return entries.filter(e => e.date >= from && e.date <= to);
  return entries;
}

function filterRedemptions(redemptions: Redemption[], win: TimeWindow, from: string, to: string): Redemption[] {
  const today = todayStr();
  if (win === 'today') return redemptions.filter(r => r.date === today);
  if (win === 'week') { const mon = getMondayStr(); return redemptions.filter(r => r.date >= mon && r.date <= today); }
  if (win === 'month') { const first = getFirstOfMonthStr(); return redemptions.filter(r => r.date >= first && r.date <= today); }
  if (win === 'custom' && from && to) return redemptions.filter(r => r.date >= from && r.date <= to);
  return redemptions;
}

interface MultiChartData {
  labels: string[];
  readingMaths: number[];
  chores: number[];
  removed: number[];
}

function buildMultiChartData(win: TimeWindow, entries: StarEntry[], from: string, to: string): MultiChartData | null {
  if (win === 'today') return null;

  const rmMap = new Map<string, number>();
  const chMap = new Map<string, number>();
  const reMap = new Map<string, number>();

  for (const e of entries) {
    if (e.stars > 0 && e.sessionType === 'chores') {
      chMap.set(e.date, (chMap.get(e.date) ?? 0) + e.stars);
    } else if (e.stars > 0) {
      rmMap.set(e.date, (rmMap.get(e.date) ?? 0) + e.stars);
    } else if (e.stars < 0) {
      reMap.set(e.date, (reMap.get(e.date) ?? 0) + Math.abs(e.stars));
    }
  }

  function toSeries(labels: string[], keys: string[]): MultiChartData {
    return {
      labels,
      readingMaths: keys.map(k => rmMap.get(k) ?? 0),
      chores: keys.map(k => chMap.get(k) ?? 0),
      removed: keys.map(k => reMap.get(k) ?? 0),
    };
  }

  if (win === 'week') {
    const mon = getMondayStr();
    const labels: string[] = [];
    const keys: string[] = [];
    DOW_LABELS.forEach((label, i) => {
      const d = new Date(`${mon}T12:00:00`);
      d.setDate(d.getDate() + i);
      labels.push(label);
      keys.push(localDateStr(d));
    });
    return toSeries(labels, keys);
  }

  if (win === 'month') {
    const now = new Date();
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const labels: string[] = [];
    const keys: string[] = [];
    for (let i = 1; i <= days; i++) {
      labels.push(String(i));
      keys.push(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
    }
    return toSeries(labels, keys);
  }

  if (win === 'custom' && from && to) {
    const labels: string[] = [];
    const keys: string[] = [];
    const end = new Date(`${to}T12:00:00`);
    const cur = new Date(`${from}T12:00:00`);
    while (cur <= end) {
      labels.push(`${cur.getDate()}/${cur.getMonth() + 1}`);
      keys.push(localDateStr(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return toSeries(labels, keys);
  }

  // All time: weekly aggregation
  const weekMap = new Map<string, { rm: number; ch: number; re: number }>();
  for (const e of entries) {
    const d = new Date(`${e.date}T12:00:00`);
    const dow = d.getDay();
    const mon = new Date(d);
    mon.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    const key = localDateStr(mon);
    const prev = weekMap.get(key) ?? { rm: 0, ch: 0, re: 0 };
    if (e.stars > 0 && e.sessionType === 'chores') weekMap.set(key, { ...prev, ch: prev.ch + e.stars });
    else if (e.stars > 0) weekMap.set(key, { ...prev, rm: prev.rm + e.stars });
    else if (e.stars < 0) weekMap.set(key, { ...prev, re: prev.re + Math.abs(e.stars) });
  }
  const sorted = [...weekMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
  return {
    labels: sorted.map(([key]) => {
      const d = new Date(`${key}T12:00:00`);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    }),
    readingMaths: sorted.map(([, v]) => v.rm),
    chores: sorted.map(([, v]) => v.ch),
    removed: sorted.map(([, v]) => v.re),
  };
}

const CHART_TITLE: Record<TimeWindow, string> = {
  today: '',
  week: 'Daily Stars — This Week',
  month: 'Daily Stars — This Month',
  custom: 'Daily Stars',
  all: 'Weekly Stars',
};

// ── Component ──────────────────────────────────────────────────────────────

export default function Stats() {
  const { entries, redemptions } = useApp();
  const [statsView, setStatsView] = useState<StatsView>('overview');
  const [win, setWin] = useState<TimeWindow>('all');
  const [customFrom, setCustomFrom] = useState(getFirstOfMonthStr);
  const [customTo, setCustomTo] = useState(todayStr);
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(
    () => new Set(['readingMaths', 'chores']),
  );

  const filtered = useMemo(() => filterEntries(entries, win, customFrom, customTo), [entries, win, customFrom, customTo]);
  const filteredRedemptions = useMemo(() => filterRedemptions(redemptions, win, customFrom, customTo), [redemptions, win, customFrom, customTo]);

  const stats = useMemo(() => {
    const positive = filtered.filter(e => e.stars > 0);
    const negative = filtered.filter(e => e.stars < 0);

    const readingMathsStars = positive.filter(e => (e.sessionType ?? 'reading') !== 'chores').reduce((s, e) => s + e.stars, 0);
    const choresStars = positive.filter(e => e.sessionType === 'chores').reduce((s, e) => s + e.stars, 0);
    const removedStars = Math.abs(negative.reduce((s, e) => s + e.stars, 0));
    const totalPositive = readingMathsStars + choresStars;
    const totalAbsolute = totalPositive + removedStars;

    const totalSessions = positive.length;
    const activeDays = new Set(positive.map(e => e.date)).size;
    const avgPerDay = activeDays > 0 ? (totalPositive / activeDays).toFixed(1) : '0';
    const avgPerSession = totalSessions > 0 ? (totalPositive / totalSessions).toFixed(1) : '0';

    const bookMap = new Map<string, { count: number; stars: number }>();
    for (const e of positive) {
      const t = e.bookTitle?.trim();
      if (!t || e.sessionType === 'chores') continue;
      const prev = bookMap.get(t) ?? { count: 0, stars: 0 };
      bookMap.set(t, { count: prev.count + 1, stars: prev.stars + e.stars });
    }
    const books = [...bookMap.entries()]
      .map(([title, v]) => ({ title, ...v }))
      .sort((a, b) => b.count - a.count || b.stars - a.stars);

    const dowCounts = Array(7).fill(0) as number[];
    for (const e of positive) dowCounts[dowIndex(e.date)]++;

    return {
      positive,
      readingMathsStars, choresStars, removedStars,
      totalPositive, totalAbsolute,
      totalSessions, activeDays,
      avgPerDay, avgPerSession,
      books,
      dowCounts,
      totalRedemptions: filteredRedemptions.length,
    };
  }, [filtered, filteredRedemptions]);

  // Streaks are always all-time (not window-filtered)
  const { current: streakCurrent, best: streakBest } = useMemo(
    () => calcStreaks(entries.filter(e => e.stars > 0)),
    [entries]
  );

  const multiChartData = useMemo(
    () => buildMultiChartData(win, filtered, customFrom, customTo),
    [win, filtered, customFrom, customTo],
  );

  const chartSeries: SeriesEntry[] = multiChartData
    ? [
        { key: 'readingMaths', values: multiChartData.readingMaths, color: 'var(--star)' },
        { key: 'chores', values: multiChartData.chores, color: 'var(--purple)' },
        { key: 'removed', values: multiChartData.removed, color: 'var(--red)' },
      ]
    : [];

  const hasAnyData = entries.filter(e => e.stars > 0).length > 0;

  const maxDow = stats ? Math.max(1, ...stats.dowCounts) : 1;
  const pct = (n: number) => stats && stats.totalAbsolute > 0 ? `${Math.round((n / stats.totalAbsolute) * 100)}%` : '0%';
  const noDataForWindow = !stats || (stats.totalSessions === 0 && stats.removedStars === 0);

  return (
    <div>
      <div className="screen-header">
        <h1 className="screen-title">Stats 📊</h1>
      </div>

      <div className="sub-tabs">
        <button className={`sub-tab${statsView === 'overview' ? ' active' : ''}`} onClick={() => setStatsView('overview')}>
          📊 Overview
        </button>
        <button className={`sub-tab${statsView === 'history' ? ' active' : ''}`} onClick={() => setStatsView('history')}>
          🕐 History
        </button>
      </div>

      {statsView === 'history' && <HistoryPanel />}

      {statsView === 'overview' && !hasAnyData && (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <p className="empty-state-title">No data yet</p>
          <p className="empty-state-text">Log some sessions and stats will appear here.</p>
        </div>
      )}

      {statsView === 'overview' && hasAnyData && (<div>

      {/* ── Time window pills ── */}
      <div className="window-pills">
        {(Object.keys(WINDOW_LABELS) as TimeWindow[]).map(w => (
          <button
            key={w}
            className={`window-pill${win === w ? ' active' : ''}`}
            onClick={() => setWin(w)}
          >
            {WINDOW_LABELS[w]}
          </button>
        ))}
      </div>

      {/* ── Custom date inputs ── */}
      {win === 'custom' && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          <input
            type="date"
            className="form-input"
            value={customFrom}
            max={customTo}
            onChange={e => setCustomFrom(e.target.value)}
            style={{ flex: 1 }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 13, flexShrink: 0 }}>to</span>
          <input
            type="date"
            className="form-input"
            value={customTo}
            min={customFrom}
            max={todayStr()}
            onChange={e => setCustomTo(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
      )}

      {noDataForWindow ? (
        <div className="empty-state" style={{ marginTop: 0 }}>
          <div className="empty-state-icon">🔍</div>
          <p className="empty-state-title">No data for this period</p>
          <p className="empty-state-text">Try a different time window.</p>
        </div>
      ) : (
        <>
          {/* ── Stars breakdown ── */}
          <div className="stats-section">
            <p className="stats-section-title">Stars Breakdown ⭐</p>
            <div className="stat-bar-container">
              <div className="stat-bar-row">
                <span className="stat-bar-label stat-bar-label-wide">📖 Reading & Maths</span>
                <div className="stat-bar-track">
                  <div className="stat-bar-fill-primary" style={{ width: pct(stats.readingMathsStars) }} />
                </div>
                <span className="stat-bar-val">{stats.readingMathsStars}</span>
              </div>
              <div className="stat-bar-row">
                <span className="stat-bar-label stat-bar-label-wide">🧹 Chores</span>
                <div className="stat-bar-track">
                  <div className="stat-bar-fill-purple" style={{ width: pct(stats.choresStars) }} />
                </div>
                <span className="stat-bar-val">{stats.choresStars}</span>
              </div>
              <div className="stat-bar-row">
                <span className="stat-bar-label stat-bar-label-wide">⬇️ Removed</span>
                <div className="stat-bar-track">
                  <div className="stat-bar-fill-red" style={{ width: pct(stats.removedStars) }} />
                </div>
                <span className="stat-bar-val" style={stats.removedStars > 0 ? { color: 'var(--red)' } : undefined}>
                  {stats.removedStars}
                </span>
              </div>
            </div>
          </div>

          {/* ── Chart ── */}
          {multiChartData && multiChartData.labels.length > 1 && (
            <div className="stats-section">
              <p className="stats-section-title">{CHART_TITLE[win]} 📈</p>
              {/* Series toggles */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                {[
                  { key: 'readingMaths', label: '📖 Reading & Maths', color: 'var(--star)' },
                  { key: 'chores', label: '🧹 Chores', color: 'var(--purple)' },
                  { key: 'removed', label: '⬇️ Removed', color: 'var(--red)' },
                ].map(({ key, label, color }) => {
                  const on = visibleSeries.has(key);
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setVisibleSeries(prev => {
                          const next = new Set(prev);
                          if (next.has(key)) next.delete(key);
                          else next.add(key);
                          return next;
                        });
                      }}
                      style={{
                        fontSize: 11,
                        padding: '3px 10px',
                        borderRadius: 99,
                        border: `1.5px solid ${color}`,
                        background: on ? color : 'transparent',
                        color: on ? '#fff' : color,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <LineChart
                labels={multiChartData.labels}
                series={chartSeries}
                visibleKeys={visibleSeries}
                height={160}
                showDots={win === 'week'}
              />
            </div>
          )}

          {/* ── Overview tiles ── */}
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stats-tile">
              <div className="stats-tile-icon">🎯</div>
              <div className="stats-tile-val">{stats.totalSessions}</div>
              <div className="stats-tile-label">Sessions</div>
            </div>
            <div className="stats-tile">
              <div className="stats-tile-icon">📅</div>
              <div className="stats-tile-val">{stats.activeDays}</div>
              <div className="stats-tile-label">Active days</div>
            </div>
            <div className="stats-tile">
              <div className="stats-tile-icon">📚</div>
              <div className="stats-tile-val">{stats.books.length}</div>
              <div className="stats-tile-label">Books read</div>
            </div>
            <div className="stats-tile">
              <div className="stats-tile-icon">⭐</div>
              <div className="stats-tile-val">{stats.avgPerDay}</div>
              <div className="stats-tile-label">Avg stars / day</div>
            </div>
            <div className="stats-tile">
              <div className="stats-tile-icon">✨</div>
              <div className="stats-tile-val">{stats.avgPerSession}</div>
              <div className="stats-tile-label">Avg stars / session</div>
            </div>
            <div className="stats-tile">
              <div className="stats-tile-icon">🎁</div>
              <div className="stats-tile-val">{stats.totalRedemptions}</div>
              <div className="stats-tile-label">Rewards redeemed</div>
            </div>
          </div>

          {/* ── Streak (all-time only) ── */}
          {win === 'all' && (
            <div className="streak-card" style={{ marginBottom: 20 }}>
              <div className="streak-item">
                <div className="streak-num">🔥 {streakCurrent}</div>
                <div className="streak-label">Day streak</div>
              </div>
              <div className="streak-divider" />
              <div className="streak-item">
                <div className="streak-num">🏆 {streakBest}</div>
                <div className="streak-label">Best streak</div>
              </div>
            </div>
          )}

          {/* ── Books leaderboard ── */}
          {stats.books.length > 0 && (
            <div className="stats-section">
              <p className="stats-section-title">Books Leaderboard 📚</p>
              <div className="card" style={{ padding: '4px 14px', boxShadow: 'var(--shadow-sm)' }}>
                {stats.books.map((book, i) => (
                  <div key={book.title} className="book-list-item">
                    <span className={`book-rank book-rank-${i + 1}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                    </span>
                    <div className="book-info">
                      <p className="book-title">{book.title}</p>
                      <p className="book-meta">{pluralStars(book.stars)} earned</p>
                    </div>
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div className="book-count">{book.count}×</div>
                      <div className="book-count-label">times read</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Most active days ── */}
          {win !== 'today' && (
            <div className="stats-section">
              <p className="stats-section-title">Most Active Days 📅</p>
              <div className="stat-bar-container">
                {DOW_LABELS.map((label, i) => (
                  <div key={label} className="stat-bar-row">
                    <span className="stat-bar-label">{label}</span>
                    <div className="stat-bar-track">
                      <div className="stat-bar-fill-purple" style={{ width: `${(stats.dowCounts[i] / maxDow) * 100}%` }} />
                    </div>
                    <span className="stat-bar-val">{stats.dowCounts[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>)}
    </div>
  );
}
