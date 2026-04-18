import { useMemo, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { formatDateShort, todayStr, clamp, pluralStars } from '../utils/helpers';
import type { Tab, SessionType } from '../types';

interface DashboardProps {
  showToast: (msg: string) => void;
  onNavigate: (tab: Tab) => void;
}

interface ActivityItem {
  id: string;
  type: 'entry' | 'redemption' | 'deduction';
  sessionType?: SessionType;
  title: string;
  meta: string;
  stars: number;
  createdAt: string;
}

interface DeductForm {
  stars: number;
  reason: string;
  date: string;
}

export default function Dashboard({ showToast, onNavigate }: DashboardProps) {
  const {
    availableStars, totalEarned, totalDeducted, todayStars,
    entries, redemptions, deductions,
    quickAddStar, addDeduction,
  } = useApp();

  const [deductOpen, setDeductOpen] = useState(false);
  const [deductConfirm, setDeductConfirm] = useState(false);
  const [form, setForm] = useState<DeductForm>({ stars: 1, reason: '', date: todayStr() });

  const openDeduct = useCallback(() => {
    setForm({ stars: 1, reason: '', date: todayStr() });
    setDeductOpen(true);
  }, []);

  const handleDeductSave = useCallback(() => {
    if (!form.reason.trim() || form.stars < 1) return;
    setDeductConfirm(true);
  }, [form]);

  const handleDeductConfirm = useCallback(() => {
    addDeduction({ stars: form.stars, reason: form.reason.trim(), date: form.date });
    setDeductConfirm(false);
    setDeductOpen(false);
    showToast(`⬇️ ${pluralStars(form.stars)} deducted`);
  }, [form, addDeduction, showToast]);

  const recentActivity = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = [
      ...entries.map(e => ({
        id: e.id,
        type: 'entry' as const,
        sessionType: e.sessionType,
        title: e.bookTitle ?? (e.sessionType === 'maths' ? 'Maths session' : 'Reading session'),
        meta: formatDateShort(e.date),
        stars: e.stars,
        createdAt: e.createdAt,
      })),
      ...redemptions.map(r => ({
        id: r.id,
        type: 'redemption' as const,
        title: r.rewardName,
        meta: formatDateShort(r.date),
        stars: -r.starCost,
        createdAt: r.createdAt,
      })),
      ...deductions.map(d => ({
        id: d.id,
        type: 'deduction' as const,
        title: d.reason,
        meta: formatDateShort(d.date),
        stars: -d.stars,
        createdAt: d.createdAt,
      })),
    ];
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return items.slice(0, 6);
  }, [entries, redemptions, deductions]);

  const handleQuickAdd = () => {
    quickAddStar();
    showToast('⭐ 1 star added!');
  };

  function activityIcon(item: ActivityItem) {
    if (item.type === 'redemption') return '🎁';
    if (item.type === 'deduction') return '⬇️';
    return item.sessionType === 'maths' ? '🔢' : '📖';
  }

  return (
    <div>
      {/* Star hero */}
      <div className="star-hero">
        <p className="star-hero-label">Available Stars</p>
        <div className="star-hero-count">
          <span>⭐</span>
          <span>{availableStars}</span>
          <span className="star-hero-suffix">{availableStars === 1 ? 'star' : 'stars'}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{totalEarned}</div>
          <div className="stat-label">Earned</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: totalDeducted > 0 ? 'var(--red)' : undefined }}>
            {totalDeducted}
          </div>
          <div className="stat-label">Deducted</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{todayStars}</div>
          <div className="stat-label">Today</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="quick-actions">
        <button className="quick-add-btn quick-add-primary" onClick={handleQuickAdd}>
          ⭐ +1 Star
        </button>
        <button className="quick-add-btn quick-add-secondary" onClick={() => onNavigate('log')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Session
        </button>
      </div>

      {/* Deduct button — less prominent */}
      <button
        onClick={openDeduct}
        style={{
          width: '100%',
          height: 44,
          borderRadius: 'var(--radius)',
          border: '1.5px dashed var(--red)',
          background: 'var(--red-light)',
          color: 'var(--red)',
          fontWeight: 700,
          fontSize: 14,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        ⬇️ Deduct Stars (bad behaviour)
      </button>

      {/* Recent activity */}
      <div className="section-heading">
        <h2 className="section-title">Recent Activity</h2>
        {(entries.length > 0 || redemptions.length > 0 || deductions.length > 0) && (
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('history')}>
            See all
          </button>
        )}
      </div>

      {recentActivity.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <p className="empty-state-title">No activity yet</p>
          <p className="empty-state-text">Tap <strong>+1 Star</strong> to log your first session!</p>
        </div>
      ) : (
        <div className="activity-list">
          {recentActivity.map(item => (
            <div key={item.id} className="activity-item">
              <div className={`activity-icon ${item.type === 'entry' ? 'activity-icon-star' : item.type === 'deduction' ? 'activity-icon-deduct' : 'activity-icon-redeem'}`}>
                {activityIcon(item)}
              </div>
              <div className="activity-body">
                <p className="activity-title">{item.title}</p>
                <p className="activity-meta">{item.meta}</p>
              </div>
              <span className={`activity-stars${item.stars < 0 ? ' activity-stars-neg' : ''}`}>
                {item.stars > 0 ? `+${item.stars}` : item.stars} ⭐
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Deduct modal */}
      <Modal isOpen={deductOpen} onClose={() => setDeductOpen(false)} title="Deduct Stars">
        <div className="stack stack-lg" style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Remove stars from the balance. Use this when you need to address bad behaviour.
          </p>

          <div className="form-field">
            <label className="form-label">Stars to Deduct</label>
            <div className="star-picker">
              <button className="star-picker-btn" onClick={() => setForm(f => ({ ...f, stars: clamp(f.stars - 1, 1, 20) }))}>−</button>
              <div className="star-picker-val"><span>⬇️</span><span>{form.stars}</span></div>
              <button className="star-picker-btn" onClick={() => setForm(f => ({ ...f, stars: clamp(f.stars + 1, 1, 20) }))}>+</button>
            </div>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="deduct-reason">Reason (required)</label>
            <input
              id="deduct-reason"
              type="text"
              className="form-input"
              placeholder="e.g. Didn't tidy bedroom"
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="deduct-date">Date</label>
            <input
              id="deduct-date"
              type="date"
              className="form-input"
              value={form.date}
              max={todayStr()}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>
        </div>

        <div style={{ position: 'sticky', bottom: 0, background: 'var(--surface)', paddingTop: 8, paddingBottom: 4 }}>
          <button
            className="btn btn-full"
            style={{ background: 'var(--red)', color: '#fff' }}
            onClick={handleDeductSave}
            disabled={!form.reason.trim() || form.stars < 1}
          >
            Deduct {pluralStars(form.stars)}
          </button>
        </div>
      </Modal>

      {/* Confirm deduction */}
      <ConfirmDialog
        isOpen={deductConfirm}
        title="Deduct Stars?"
        message={`Remove ${pluralStars(form.stars)} for "${form.reason}"? This will reduce the available balance.`}
        confirmLabel="Yes, deduct"
        confirmDanger
        onConfirm={handleDeductConfirm}
        onCancel={() => setDeductConfirm(false)}
      />
    </div>
  );
}
