import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import ConfirmDialog from './ConfirmDialog';
import { formatDate, formatDateShort } from '../utils/helpers';
import type { HistoryView, SessionType } from '../types';

export default function History() {
  const { entries, redemptions, deductions, deleteRedemption } = useApp();
  const [view, setView] = useState<HistoryView>('timeline');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Merged, sorted timeline
  const timeline = useMemo(() => {
    type TimelineItem =
      | { kind: 'entry'; id: string; date: string; createdAt: string; title: string; note?: string; stars: number; sessionType?: SessionType }
      | { kind: 'redemption'; id: string; date: string; createdAt: string; name: string; stars: number }
      | { kind: 'deduction'; id: string; date: string; createdAt: string; reason: string; stars: number };

    const items: TimelineItem[] = [
      ...entries.map(e => ({
        kind: 'entry' as const,
        id: e.id,
        date: e.date,
        createdAt: e.createdAt,
        sessionType: e.sessionType,
        title: e.bookTitle ?? (e.sessionType === 'maths' ? 'Maths session' : 'Reading session'),
        note: e.note,
        stars: e.stars,
      })),
      ...redemptions.map(r => ({
        kind: 'redemption' as const,
        id: r.id,
        date: r.date,
        createdAt: r.createdAt,
        name: r.rewardName,
        stars: r.starCost,
      })),
      ...deductions.map(d => ({
        kind: 'deduction' as const,
        id: d.id,
        date: d.date,
        createdAt: d.createdAt,
        reason: d.reason,
        stars: d.stars,
      })),
    ];
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [entries, redemptions, deductions]);

  // Daily grouped data
  const dailyGroups = useMemo(() => {
    interface DayData {
      date: string;
      earned: number;
      redeemed: number;
      deducted: number;
      items: typeof timeline;
    }
    const map = new Map<string, DayData>();

    for (const item of timeline) {
      const existing = map.get(item.date) ?? {
        date: item.date,
        earned: 0,
        redeemed: 0,
        deducted: 0,
        items: [],
      };
      if (item.kind === 'entry') existing.earned += item.stars;
      else if (item.kind === 'redemption') existing.redeemed += item.stars;
      else existing.deducted += item.stars;
      existing.items.push(item);
      map.set(item.date, existing);
    }

    return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
  }, [timeline]);

  // For the daily bar chart (last 7 days)
  const barData = useMemo(() => {
    const days = dailyGroups.slice(0, 7);
    const max = Math.max(1, ...days.map(d => d.earned));
    return days.map(d => ({ ...d, pct: (d.earned / max) * 100 }));
  }, [dailyGroups]);

  function dotColor(kind: string) {
    if (kind === 'entry') return 'var(--star)';
    if (kind === 'deduction') return 'var(--red)';
    return 'var(--purple)';
  }

  function itemLabel(item: typeof timeline[number]) {
    if (item.kind === 'entry') {
      if (item.sessionType === 'maths') return '🔢 Maths';
      if (item.sessionType === 'chores') return '🧹 Chores';
      return '📖 Reading';
    }
    if (item.kind === 'deduction') return '⬇️ Deducted';
    return '🎁 Redeemed';
  }

  function itemTitle(item: typeof timeline[number]) {
    if (item.kind === 'entry') return item.title;
    if (item.kind === 'deduction') return item.reason;
    return item.name;
  }

  function amountClass(kind: string) {
    if (kind === 'entry') return 'history-amount history-amount-earn';
    return 'history-amount history-amount-redeem';
  }

  function amountText(item: typeof timeline[number]) {
    if (item.kind === 'entry') return `+${item.stars} ⭐`;
    return `−${item.stars} ⭐`;
  }

  return (
    <div>
      <div className="screen-header">
        <h1 className="screen-title">History 🕐</h1>
        <p className="screen-subtitle">Every star earned and redeemed</p>
      </div>

      {/* Sub-tabs */}
      <div className="sub-tabs">
        <button
          className={`sub-tab${view === 'timeline' ? ' active' : ''}`}
          onClick={() => setView('timeline')}
        >
          📋 Timeline
        </button>
        <button
          className={`sub-tab${view === 'daily' ? ' active' : ''}`}
          onClick={() => setView('daily')}
        >
          📅 By Day
        </button>
      </div>

      {/* ── Timeline ──────────────────────────────────── */}
      {view === 'timeline' && (
        <>
          {timeline.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p className="empty-state-title">Nothing yet</p>
              <p className="empty-state-text">
                Start logging reading sessions and they'll appear here.
              </p>
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 14px', boxShadow: 'var(--shadow-sm)' }}>
              {timeline.map(item => (
                <div key={item.id} className="history-item">
                  <span
                    className="history-dot"
                    style={{ background: dotColor(item.kind) }}
                  />
                  <div className="history-body">
                    <p className="history-title">{itemTitle(item)}</p>
                    <p className="history-meta">
                      {itemLabel(item)} · {formatDateShort(item.date)}
                    </p>
                    {item.kind === 'entry' && item.note && (
                      <p className="history-note">"{item.note}"</p>
                    )}
                    {item.kind === 'redemption' && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: 0, height: 'auto', fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}
                        onClick={() => setDeleteConfirm(item.id)}
                      >
                        Undo redemption
                      </button>
                    )}
                  </div>
                  <span
                    className={amountClass(item.kind)}
                    style={item.kind === 'deduction' ? { color: 'var(--red)' } : undefined}
                  >
                    {amountText(item)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── By Day ──────────────────────────────────────── */}
      {view === 'daily' && (
        <>
          {dailyGroups.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <p className="empty-state-title">Nothing yet</p>
              <p className="empty-state-text">
                Daily summaries will appear once you've logged some sessions.
              </p>
            </div>
          ) : (
            <>
              {/* Mini bar chart */}
              {barData.length > 1 && (
                <div style={{ marginBottom: 20 }}>
                  <p className="section-title" style={{ marginBottom: 10 }}>Stars per day (recent)</p>
                  <div className="daily-chart">
                    {barData.map(d => (
                      <div key={d.date} className="daily-bar-row">
                        <span className="daily-bar-label">{formatDateShort(d.date)}</span>
                        <div className="daily-bar-track">
                          <div className="daily-bar-fill" style={{ width: `${d.pct}%` }} />
                        </div>
                        <span className="daily-bar-val">{d.earned}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Daily groups */}
              <div className="stack stack-lg">
                {dailyGroups.map(day => (
                  <div key={day.date} className="day-group">
                    <div className="day-group-header">
                      <span className="day-group-date">{formatDate(day.date)}</span>
                      <span className="day-group-total">
                        +{day.earned} ⭐
                        {day.redeemed > 0 ? ` −${day.redeemed} ⭐` : ''}
                        {day.deducted > 0 ? <span style={{ color: 'var(--red)' }}> ⬇️{day.deducted}</span> : ''}
                      </span>
                    </div>
                    <div className="day-group-card">
                      {day.items.map(item => (
                        <div key={item.id} className="history-item">
                          <span
                            className="history-dot"
                            style={{ background: dotColor(item.kind) }}
                          />
                          <div className="history-body">
                            <p className="history-title">{itemTitle(item)}</p>
                            <p className="history-meta">{itemLabel(item)}</p>
                          </div>
                          <span
                            className={amountClass(item.kind)}
                            style={item.kind === 'deduction' ? { color: 'var(--red)' } : undefined}
                          >
                            {amountText(item)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Undo redemption confirm */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Undo Redemption?"
        message="This will remove the redemption and add the stars back to the balance."
        confirmLabel="Undo"
        onConfirm={() => {
          if (deleteConfirm) {
            deleteRedemption(deleteConfirm);
          }
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
