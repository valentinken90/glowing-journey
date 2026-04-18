import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import ConfirmDialog from './ConfirmDialog';
import { formatDate, formatDateShort } from '../utils/helpers';
import type { HistoryView, SessionType } from '../types';

function entryLabel(stars: number, sessionType?: SessionType) {
  if (stars < 0) return '⬇️ Removed';
  if (sessionType === 'maths') return '🔢 Maths';
  if (sessionType === 'chores') return '🧹 Chores';
  return '📖 Reading';
}

export default function History() {
  const { entries, redemptions, deleteRedemption } = useApp();
  const [view, setView] = useState<HistoryView>('timeline');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const timeline = useMemo(() => {
    type Item =
      | { kind: 'entry'; id: string; date: string; createdAt: string; title: string; note?: string; stars: number; sessionType?: SessionType }
      | { kind: 'redemption'; id: string; date: string; createdAt: string; name: string; stars: number };

    const items: Item[] = [
      ...entries.map(e => ({
        kind: 'entry' as const,
        id: e.id,
        date: e.date,
        createdAt: e.createdAt,
        sessionType: e.sessionType,
        title: e.stars < 0 ? (e.bookTitle ?? 'Stars removed') : (e.bookTitle ?? (e.sessionType === 'maths' ? 'Maths session' : e.sessionType === 'chores' ? 'Chores' : 'Reading session')),
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
    ];
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [entries, redemptions]);

  const dailyGroups = useMemo(() => {
    interface DayData {
      date: string;
      earned: number;
      deducted: number;
      redeemed: number;
      items: typeof timeline;
    }
    const map = new Map<string, DayData>();
    for (const item of timeline) {
      const existing = map.get(item.date) ?? { date: item.date, earned: 0, deducted: 0, redeemed: 0, items: [] };
      if (item.kind === 'entry') {
        if (item.stars > 0) existing.earned += item.stars;
        else existing.deducted += Math.abs(item.stars);
      } else {
        existing.redeemed += item.stars;
      }
      existing.items.push(item);
      map.set(item.date, existing);
    }
    return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
  }, [timeline]);

  const barData = useMemo(() => {
    const days = dailyGroups.slice(0, 7);
    const max = Math.max(1, ...days.map(d => d.earned));
    return days.map(d => ({ ...d, pct: (d.earned / max) * 100 }));
  }, [dailyGroups]);

  function dotColor(item: typeof timeline[number]) {
    if (item.kind === 'entry' && item.stars < 0) return 'var(--red)';
    if (item.kind === 'entry') return 'var(--star)';
    return 'var(--purple)';
  }

  function amountText(item: typeof timeline[number]) {
    if (item.kind === 'redemption') return `−${item.stars} ⭐`;
    return `${item.stars > 0 ? '+' : ''}${item.stars} ⭐`;
  }

  function amountStyle(item: typeof timeline[number]) {
    if (item.kind === 'redemption' || (item.kind === 'entry' && item.stars < 0)) return { color: 'var(--red)' };
    return undefined;
  }

  return (
    <div>
      <div className="screen-header">
        <h1 className="screen-title">History 🕐</h1>
        <p className="screen-subtitle">Every star earned and redeemed</p>
      </div>

      <div className="sub-tabs">
        <button className={`sub-tab${view === 'timeline' ? ' active' : ''}`} onClick={() => setView('timeline')}>
          📋 Timeline
        </button>
        <button className={`sub-tab${view === 'daily' ? ' active' : ''}`} onClick={() => setView('daily')}>
          📅 By Day
        </button>
      </div>

      {/* ── Timeline ── */}
      {view === 'timeline' && (
        <>
          {timeline.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p className="empty-state-title">Nothing yet</p>
              <p className="empty-state-text">Start logging sessions and they'll appear here.</p>
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 14px', boxShadow: 'var(--shadow-sm)' }}>
              {timeline.map(item => (
                <div key={item.id} className="history-item">
                  <span className="history-dot" style={{ background: dotColor(item) }} />
                  <div className="history-body">
                    <p className="history-title">
                      {item.kind === 'entry' ? item.title : item.name}
                    </p>
                    <p className="history-meta">
                      {item.kind === 'entry' ? entryLabel(item.stars, item.sessionType) : '🎁 Redeemed'} · {formatDateShort(item.date)}
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
                  <span className="history-amount" style={amountStyle(item)}>
                    {amountText(item)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── By Day ── */}
      {view === 'daily' && (
        <>
          {dailyGroups.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <p className="empty-state-title">Nothing yet</p>
              <p className="empty-state-text">Daily summaries will appear once you've logged some sessions.</p>
            </div>
          ) : (
            <>
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

              <div className="stack stack-lg">
                {dailyGroups.map(day => (
                  <div key={day.date} className="day-group">
                    <div className="day-group-header">
                      <span className="day-group-date">{formatDate(day.date)}</span>
                      <span className="day-group-total">
                        +{day.earned} ⭐
                        {day.deducted > 0 && <span style={{ color: 'var(--red)' }}> ⬇️{day.deducted}</span>}
                        {day.redeemed > 0 ? ` −${day.redeemed} ⭐` : ''}
                      </span>
                    </div>
                    <div className="day-group-card">
                      {day.items.map(item => (
                        <div key={item.id} className="history-item">
                          <span className="history-dot" style={{ background: dotColor(item) }} />
                          <div className="history-body">
                            <p className="history-title">{item.kind === 'entry' ? item.title : item.name}</p>
                            <p className="history-meta">
                              {item.kind === 'entry' ? entryLabel(item.stars, item.sessionType) : '🎁 Redeemed'}
                            </p>
                          </div>
                          <span className="history-amount" style={amountStyle(item)}>
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

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Undo Redemption?"
        message="This will remove the redemption and add the stars back to the balance."
        confirmLabel="Undo"
        onConfirm={() => { if (deleteConfirm) deleteRedemption(deleteConfirm); setDeleteConfirm(null); }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
