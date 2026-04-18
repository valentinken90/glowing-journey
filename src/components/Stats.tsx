import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { todayStr, pluralStars } from '../utils/helpers';
import type { StarEntry } from '../types';
import LineChart from './LineChart';

// ── Helpers ────────────────────────────────────────────────────────────────

function prevDayStr(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function calcStreaks(entries: StarEntry[]): { current: number; best: number } {
  if (entries.length === 0) return { current: 0, best: 0 };
  const dateSet = [...new Set(entries.map(e => e.date))].sort();

  // Best streak (ascending)
  let best = 1;
  let run = 1;
  for (let i = 1; i < dateSet.length; i++) {
    if (dateSet[i] === prevDayStr(dateSet[i - 1]) + '' || dateSet[i - 1] === prevDayStr(dateSet[i])) {
      run++;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }

  // Current streak (from today or yesterday backwards)
  const today = todayStr();
  const yesterday = prevDayStr(today);
  const descDates = [...dateSet].reverse();
  let current = 0;
  const mostRecent = descDates[0];
  if (mostRecent === today || mostRecent === yesterday) {
    let expected = mostRecent;
    for (const d of descDates) {
      if (d === expected) {
        current++;
        expected = prevDayStr(expected);
      } else {
        break;
      }
    }
  }

  return { current, best: Math.max(best, current) };
}

type TimeSlot = 'Morning' | 'Afternoon' | 'Evening' | 'Night';
function timeSlot(isoString: string): TimeSlot {
  const h = new Date(isoString).getHours();
  if (h >= 5 && h < 12) return 'Morning';
  if (h >= 12 && h < 17) return 'Afternoon';
  if (h >= 17 && h < 21) return 'Evening';
  return 'Night';
}

const TIME_EMOJI: Record<TimeSlot, string> = {
  Morning: '🌅',
  Afternoon: '☀️',
  Evening: '🌙',
  Night: '🌚',
};

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function dowIndex(dateStr: string): number {
  // JS getDay: 0=Sun…6=Sat; we want 0=Mon
  const day = new Date(`${dateStr}T12:00:00`).getDay();
  return day === 0 ? 6 : day - 1;
}

// ── Tag colours ────────────────────────────────────────────────────────────

const TAG_PALETTE = [
  { bg: '#FFE0E8', text: '#C41E61' },
  { bg: '#E0F0FF', text: '#1E4D8A' },
  { bg: '#E0FFE8', text: '#166534' },
  { bg: '#FFF0D9', text: '#92400E' },
  { bg: '#EDE0FF', text: '#5B21B6' },
  { bg: '#D9F9F6', text: '#0E7490' },
  { bg: '#FEFFD9', text: '#713F12' },
];

export function tagColor(tag: string) {
  let h = 0;
  for (const c of tag) h = (h * 31 + c.charCodeAt(0)) % TAG_PALETTE.length;
  return TAG_PALETTE[h];
}

// ── Component ──────────────────────────────────────────────────────────────

export default function Stats() {
  const { entries, redemptions, deductions } = useApp();

  const stats = useMemo(() => {
    const totalSessions = entries.length;
    const readingSessions = entries.filter(e => (e.sessionType ?? 'reading') === 'reading').length;
    const mathsSessions = entries.filter(e => e.sessionType === 'maths').length;
    const readingStars = entries.filter(e => (e.sessionType ?? 'reading') === 'reading').reduce((s, e) => s + e.stars, 0);
    const mathsStars = entries.filter(e => e.sessionType === 'maths').reduce((s, e) => s + e.stars, 0);
    const totalStars = entries.reduce((s, e) => s + e.stars, 0);
    const readingDays = new Set(entries.map(e => e.date)).size;
    const avgStarsPerSession = totalSessions > 0
      ? (totalStars / totalSessions).toFixed(1)
      : '0';
    const avgStarsPerDay = readingDays > 0
      ? (totalStars / readingDays).toFixed(1)
      : '0';

    // Books
    const bookMap = new Map<string, { count: number; stars: number }>();
    for (const e of entries) {
      const t = e.bookTitle?.trim();
      if (!t) continue;
      const prev = bookMap.get(t) ?? { count: 0, stars: 0 };
      bookMap.set(t, { count: prev.count + 1, stars: prev.stars + e.stars });
    }
    const books = [...bookMap.entries()]
      .map(([title, v]) => ({ title, ...v }))
      .sort((a, b) => b.count - a.count || b.stars - a.stars);
    const uniqueBooks = books.length;

    // Streak
    const { current: streakCurrent, best: streakBest } = calcStreaks(entries);

    // Time of day
    const timeCounts: Record<TimeSlot, number> = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    for (const e of entries) timeCounts[timeSlot(e.createdAt)]++;

    // Day of week
    const dowCounts = Array(7).fill(0) as number[];
    for (const e of entries) dowCounts[dowIndex(e.date)]++;

    // Weekly stars (last 8 weeks)
    const weekMap = new Map<string, number>();
    for (const e of entries) {
      const d = new Date(`${e.date}T12:00:00`);
      const dow = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
      const key = monday.toISOString().slice(0, 10);
      weekMap.set(key, (weekMap.get(key) ?? 0) + e.stars);
    }
    const weeks = [...weekMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([key, stars]) => {
        const d = new Date(`${key}T12:00:00`);
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        return { label, stars };
      });

    // Total redemptions
    const totalRedemptions = redemptions.length;

    // Deductions
    const totalDeductions = deductions.length;
    const totalDeductedStars = deductions.reduce((s, d) => s + d.stars, 0);

    // 30-day line chart data
    const today = new Date();
    const dailyStars = new Map<string, number>();
    for (const e of entries) {
      dailyStars.set(e.date, (dailyStars.get(e.date) ?? 0) + e.stars);
    }
    const last30: { label: string; value: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
      last30.push({ label: dayLabel, value: dailyStars.get(key) ?? 0 });
    }

    return {
      totalSessions,
      readingSessions,
      mathsSessions,
      readingStars,
      mathsStars,
      totalStars,
      readingDays,
      uniqueBooks,
      avgStarsPerSession,
      avgStarsPerDay,
      streakCurrent,
      streakBest,
      books,
      timeCounts,
      dowCounts,
      weeks,
      totalRedemptions,
      totalDeductions,
      totalDeductedStars,
      last30,
    };
  }, [entries, redemptions, deductions]);

  if (entries.length === 0) {
    return (
      <div>
        <div className="screen-header">
          <h1 className="screen-title">Stats 📊</h1>
          <p className="screen-subtitle">See your child's reading progress</p>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <p className="empty-state-title">No data yet</p>
          <p className="empty-state-text">
            Log some reading sessions and stats will appear here.
          </p>
        </div>
      </div>
    );
  }

  const maxTime = Math.max(1, ...Object.values(stats.timeCounts));
  const maxDow = Math.max(1, ...stats.dowCounts);
  const maxWeek = Math.max(1, ...stats.weeks.map(w => w.stars));

  return (
    <div>
      <div className="screen-header">
        <h1 className="screen-title">Stats 📊</h1>
        <p className="screen-subtitle">Tracking {stats.totalSessions} reading sessions</p>
      </div>

      {/* ── Streak ── */}
      <div className="streak-card">
        <div className="streak-item">
          <div className="streak-num">🔥 {stats.streakCurrent}</div>
          <div className="streak-label">Day streak</div>
        </div>
        <div className="streak-divider" />
        <div className="streak-item">
          <div className="streak-num">🏆 {stats.streakBest}</div>
          <div className="streak-label">Best streak</div>
        </div>
      </div>

      {/* ── 30-day line chart ── */}
      <div className="stats-section">
        <p className="stats-section-title">Stars — Last 30 Days 📈</p>
        <LineChart
          data={stats.last30}
          color="var(--primary)"
          areaColor="var(--primary)"
          height={160}
          showDots={false}
        />
      </div>

      {/* ── Session type breakdown ── */}
      {stats.totalSessions > 0 && (
        <div className="stats-section">
          <p className="stats-section-title">Sessions by Type</p>
          <div className="stat-bar-container">
            <div className="stat-bar-row">
              <span className="stat-bar-label stat-bar-label-wide">📖 Reading</span>
              <div className="stat-bar-track">
                <div
                  className="stat-bar-fill-primary"
                  style={{ width: `${(stats.readingSessions / stats.totalSessions) * 100}%` }}
                />
              </div>
              <span className="stat-bar-val">{stats.readingSessions}</span>
            </div>
            <div className="stat-bar-row">
              <span className="stat-bar-label stat-bar-label-wide">🔢 Maths</span>
              <div className="stat-bar-track">
                <div
                  className="stat-bar-fill-teal"
                  style={{ width: `${(stats.mathsSessions / stats.totalSessions) * 100}%` }}
                />
              </div>
              <span className="stat-bar-val">{stats.mathsSessions}</span>
            </div>
            <div className="stat-bar-row">
              <span className="stat-bar-label stat-bar-label-wide" style={{ color: 'var(--text-faint)', fontSize: 11 }}>⭐ Reading stars</span>
              <div className="stat-bar-track">
                <div className="stat-bar-fill-primary" style={{ width: `${stats.totalStars > 0 ? (stats.readingStars / stats.totalStars) * 100 : 0}%` }} />
              </div>
              <span className="stat-bar-val">{stats.readingStars}</span>
            </div>
            <div className="stat-bar-row">
              <span className="stat-bar-label stat-bar-label-wide" style={{ color: 'var(--text-faint)', fontSize: 11 }}>⭐ Maths stars</span>
              <div className="stat-bar-track">
                <div className="stat-bar-fill-teal" style={{ width: `${stats.totalStars > 0 ? (stats.mathsStars / stats.totalStars) * 100 : 0}%` }} />
              </div>
              <span className="stat-bar-val">{stats.mathsStars}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Overview tiles ── */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stats-tile">
          <div className="stats-tile-icon">📖</div>
          <div className="stats-tile-val">{stats.totalSessions}</div>
          <div className="stats-tile-label">Sessions logged</div>
        </div>
        <div className="stats-tile">
          <div className="stats-tile-icon">📅</div>
          <div className="stats-tile-val">{stats.readingDays}</div>
          <div className="stats-tile-label">Days read</div>
        </div>
        <div className="stats-tile">
          <div className="stats-tile-icon">📚</div>
          <div className="stats-tile-val">{stats.uniqueBooks}</div>
          <div className="stats-tile-label">Books read</div>
        </div>
        <div className="stats-tile">
          <div className="stats-tile-icon">⭐</div>
          <div className="stats-tile-val">{stats.avgStarsPerDay}</div>
          <div className="stats-tile-label">Avg stars / day</div>
        </div>
        <div className="stats-tile">
          <div className="stats-tile-icon">✨</div>
          <div className="stats-tile-val">{stats.avgStarsPerSession}</div>
          <div className="stats-tile-label">Avg stars / session</div>
        </div>
        <div className="stats-tile">
          <div className="stats-tile-icon">🎁</div>
          <div className="stats-tile-val">{stats.totalRedemptions}</div>
          <div className="stats-tile-label">Rewards redeemed</div>
        </div>
        {stats.totalDeductions > 0 && (
          <div className="stats-tile" style={{ borderColor: 'var(--red-light)' }}>
            <div className="stats-tile-icon">⬇️</div>
            <div className="stats-tile-val" style={{ color: 'var(--red)' }}>{stats.totalDeductedStars}</div>
            <div className="stats-tile-label">Stars deducted</div>
          </div>
        )}
      </div>

      {/* ── Weekly activity ── */}
      {stats.weeks.length > 0 && (
        <div className="stats-section">
          <p className="stats-section-title">Weekly Stars (last {stats.weeks.length} weeks)</p>
          <div className="stat-bar-container">
            {stats.weeks.map(w => (
              <div key={w.label} className="stat-bar-row">
                <span className="stat-bar-label">{w.label}</span>
                <div className="stat-bar-track">
                  <div
                    className="stat-bar-fill-primary"
                    style={{ width: `${(w.stars / maxWeek) * 100}%` }}
                  />
                </div>
                <span className="stat-bar-val">{w.stars}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Books ── */}
      {stats.books.length > 0 && (
        <div className="stats-section">
          <p className="stats-section-title">Books Leaderboard 📚</p>
          <div
            className="card"
            style={{ padding: '4px 14px', boxShadow: 'var(--shadow-sm)' }}
          >
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

      {/* ── Time of day ── */}
      <div className="stats-section">
        <p className="stats-section-title">When Does She Read? ⏰</p>
        <div className="stat-bar-container">
          {(Object.keys(stats.timeCounts) as TimeSlot[]).map(slot => (
            <div key={slot} className="stat-bar-row">
              <span className="stat-bar-label">
                {TIME_EMOJI[slot]} {slot}
              </span>
              <div className="stat-bar-track">
                <div
                  className="stat-bar-fill-teal"
                  style={{ width: `${(stats.timeCounts[slot] / maxTime) * 100}%` }}
                />
              </div>
              <span className="stat-bar-val">{stats.timeCounts[slot]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Day of week ── */}
      <div className="stats-section">
        <p className="stats-section-title">Most Active Days 📅</p>
        <div className="stat-bar-container">
          {DOW_LABELS.map((label, i) => (
            <div key={label} className="stat-bar-row">
              <span className="stat-bar-label">{label}</span>
              <div className="stat-bar-track">
                <div
                  className="stat-bar-fill-purple"
                  style={{ width: `${(stats.dowCounts[i] / maxDow) * 100}%` }}
                />
              </div>
              <span className="stat-bar-val">{stats.dowCounts[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
