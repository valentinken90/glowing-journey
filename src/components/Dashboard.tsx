import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import ConfirmDialog from './ConfirmDialog';
import { formatDateShort, todayStr, clamp, pluralStars } from '../utils/helpers';
import type { Tab, SessionType } from '../types';

interface DashboardProps {
  showToast: (msg: string) => void;
  onNavigate: (tab: Tab) => void;
}

type ActivePanel = 'add' | 'deduct' | null;

function entryTitle(stars: number, bookTitle?: string, sessionType?: SessionType) {
  if (stars < 0) return bookTitle ?? 'Stars removed';
  if (bookTitle) return bookTitle;
  if (sessionType === 'maths') return 'Maths session';
  if (sessionType === 'chores') return 'Chores';
  return 'Reading session';
}

function entryIcon(stars: number, sessionType?: SessionType) {
  if (stars < 0) return '⬇️';
  if (sessionType === 'maths') return '🔢';
  if (sessionType === 'chores') return '🧹';
  return '📖';
}

export default function Dashboard({ showToast, onNavigate }: DashboardProps) {
  const {
    availableStars, totalEarned, totalDeducted, todayStars,
    entries, redemptions,
    addEntry,
  } = useApp();

  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [addForm, setAddForm] = useState({ sessionType: 'reading' as SessionType, stars: 1, bookTitle: '', note: '', date: todayStr() });
  const [deductForm, setDeductForm] = useState({ stars: 1, reason: '', date: todayStr() });
  const [deductConfirm, setDeductConfirm] = useState(false);

  const togglePanel = (panel: 'add' | 'deduct') => {
    if (activePanel === panel) {
      setActivePanel(null);
    } else {
      if (panel === 'add') setAddForm({ sessionType: 'reading', stars: 1, bookTitle: '', note: '', date: todayStr() });
      if (panel === 'deduct') setDeductForm({ stars: 1, reason: '', date: todayStr() });
      setActivePanel(panel);
    }
  };

  const handleAddSave = () => {
    addEntry({
      sessionType: addForm.sessionType,
      date: addForm.date,
      stars: addForm.stars,
      bookTitle: addForm.bookTitle.trim() || undefined,
      note: addForm.note.trim() || undefined,
    });
    setActivePanel(null);
    const icon = addForm.sessionType === 'maths' ? '🔢' : addForm.sessionType === 'chores' ? '🧹' : '⭐';
    showToast(`${icon} ${pluralStars(addForm.stars)} added!`);
  };

  const handleDeductSave = () => {
    if (!deductForm.reason.trim() || deductForm.stars < 1) return;
    setDeductConfirm(true);
  };

  const handleDeductConfirm = () => {
    addEntry({
      stars: -deductForm.stars,
      bookTitle: deductForm.reason.trim(),
      date: deductForm.date,
    });
    setDeductConfirm(false);
    setActivePanel(null);
    showToast(`⬇️ ${pluralStars(deductForm.stars)} removed`);
  };

  const recentActivity = useMemo(() => {
    type Item = { id: string; kind: 'entry' | 'redemption'; title: string; meta: string; stars: number; sessionType?: SessionType; createdAt: string };
    const items: Item[] = [
      ...entries.map(e => ({
        id: e.id,
        kind: 'entry' as const,
        sessionType: e.sessionType,
        title: entryTitle(e.stars, e.bookTitle, e.sessionType),
        meta: formatDateShort(e.date),
        stars: e.stars,
        createdAt: e.createdAt,
      })),
      ...redemptions.map(r => ({
        id: r.id,
        kind: 'redemption' as const,
        title: r.rewardName,
        meta: formatDateShort(r.date),
        stars: -r.starCost,
        createdAt: r.createdAt,
      })),
    ];
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return items.slice(0, 6);
  }, [entries, redemptions]);

  const isMaths = addForm.sessionType === 'maths';
  const isChores = addForm.sessionType === 'chores';
  const addBtnColor = isMaths ? 'var(--teal)' : isChores ? 'var(--purple)' : 'var(--primary)';

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

      {/* Action buttons */}
      <div className="quick-actions" style={{ marginBottom: activePanel ? 0 : 20 }}>
        <button
          className={`quick-add-btn ${activePanel === 'add' ? 'quick-add-primary' : 'quick-add-secondary'}`}
          onClick={() => togglePanel('add')}
        >
          ⭐ Add Stars {activePanel === 'add' ? '▲' : '▼'}
        </button>
        <button
          className="quick-add-btn quick-add-secondary"
          style={activePanel === 'deduct' ? { background: 'var(--red-light)', color: 'var(--red)', borderColor: 'var(--red)' } : {}}
          onClick={() => togglePanel('deduct')}
        >
          ⬇️ Remove Stars {activePanel === 'deduct' ? '▲' : '▼'}
        </button>
      </div>

      {/* Add stars panel */}
      {activePanel === 'add' && (
        <div className="action-panel action-panel-add">
          <div className="stack stack-lg" style={{ marginBottom: 12 }}>
            <div className="form-field">
              <label className="form-label">Session Type</label>
              <div className="session-type-toggle">
                <button
                  className={`session-type-btn${addForm.sessionType === 'reading' ? ' active-reading' : ''}`}
                  onClick={() => setAddForm(f => ({ ...f, sessionType: 'reading' }))}
                >📖 Reading</button>
                <button
                  className={`session-type-btn${addForm.sessionType === 'maths' ? ' active-maths' : ''}`}
                  onClick={() => setAddForm(f => ({ ...f, sessionType: 'maths' }))}
                >🔢 Maths</button>
                <button
                  className={`session-type-btn${addForm.sessionType === 'chores' ? ' active-chores' : ''}`}
                  onClick={() => setAddForm(f => ({ ...f, sessionType: 'chores' }))}
                >🧹 Chores</button>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Stars Earned</label>
              <div className="star-picker">
                <button className="star-picker-btn" onClick={() => setAddForm(f => ({ ...f, stars: clamp(f.stars - 1, 1, 50) }))}>−</button>
                <div className="star-picker-val"><span>⭐</span><span>{addForm.stars}</span></div>
                <button className="star-picker-btn" onClick={() => setAddForm(f => ({ ...f, stars: clamp(f.stars + 1, 1, 50) }))}>+</button>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="dash-book">
                {isMaths ? 'Topic (optional)' : isChores ? 'Task (optional)' : 'Book Title (optional)'}
              </label>
              <input
                id="dash-book"
                type="text"
                className="form-input"
                placeholder={isMaths ? 'e.g. Times tables' : isChores ? 'e.g. Tidied bedroom' : 'e.g. Charlie and the Chocolate Factory'}
                value={addForm.bookTitle}
                onChange={e => setAddForm(f => ({ ...f, bookTitle: e.target.value }))}
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="dash-note">Note (optional)</label>
              <textarea
                id="dash-note"
                className="form-input form-textarea"
                placeholder={isMaths ? 'e.g. Got all 7× tables right!' : isChores ? 'e.g. Did it without being asked!' : 'e.g. Read two whole chapters!'}
                value={addForm.note}
                onChange={e => setAddForm(f => ({ ...f, note: e.target.value }))}
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="dash-date">Date</label>
              <input
                id="dash-date"
                type="date"
                className="form-input"
                value={addForm.date}
                max={todayStr()}
                onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>

          <button
            className="btn btn-full"
            style={{ background: addBtnColor, color: '#fff' }}
            onClick={handleAddSave}
            disabled={addForm.stars < 1 || !addForm.date}
          >
            Save — {pluralStars(addForm.stars)}
          </button>
        </div>
      )}

      {/* Remove stars panel */}
      {activePanel === 'deduct' && (
        <div className="action-panel action-panel-deduct">
          <div className="stack stack-lg" style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Adds a negative entry that reduces the total balance.
            </p>

            <div className="form-field">
              <label className="form-label">Stars to Remove</label>
              <div className="star-picker">
                <button className="star-picker-btn" onClick={() => setDeductForm(f => ({ ...f, stars: clamp(f.stars - 1, 1, 20) }))}>−</button>
                <div className="star-picker-val"><span>⬇️</span><span>{deductForm.stars}</span></div>
                <button className="star-picker-btn" onClick={() => setDeductForm(f => ({ ...f, stars: clamp(f.stars + 1, 1, 20) }))}>+</button>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="dash-reason">Reason (required)</label>
              <input
                id="dash-reason"
                type="text"
                className="form-input"
                placeholder="e.g. Didn't tidy bedroom"
                value={deductForm.reason}
                onChange={e => setDeductForm(f => ({ ...f, reason: e.target.value }))}
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="dash-deduct-date">Date</label>
              <input
                id="dash-deduct-date"
                type="date"
                className="form-input"
                value={deductForm.date}
                max={todayStr()}
                onChange={e => setDeductForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>

          <button
            className="btn btn-full"
            style={{ background: 'var(--red)', color: '#fff' }}
            onClick={handleDeductSave}
            disabled={!deductForm.reason.trim() || deductForm.stars < 1}
          >
            Remove {pluralStars(deductForm.stars)}
          </button>
        </div>
      )}

      {/* Recent activity */}
      <div className="section-heading" style={{ marginTop: activePanel ? 20 : 0 }}>
        <h2 className="section-title">Recent Activity</h2>
        {(entries.length > 0 || redemptions.length > 0) && (
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('stats')}>
            See all
          </button>
        )}
      </div>

      {recentActivity.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <p className="empty-state-title">No activity yet</p>
          <p className="empty-state-text">Tap <strong>Add Stars</strong> to log your first session!</p>
        </div>
      ) : (
        <div className="activity-list">
          {recentActivity.map(item => (
            <div key={item.id} className="activity-item">
              <div className={`activity-icon ${item.kind === 'redemption' ? 'activity-icon-redeem' : item.stars < 0 ? 'activity-icon-deduct' : 'activity-icon-star'}`}>
                {item.kind === 'redemption' ? '🎁' : entryIcon(item.stars, item.sessionType)}
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

      <ConfirmDialog
        isOpen={deductConfirm}
        title="Remove Stars?"
        message={`Add −${pluralStars(deductForm.stars)} for "${deductForm.reason}"? This will reduce the available balance.`}
        confirmLabel="Yes, remove"
        confirmDanger
        onConfirm={handleDeductConfirm}
        onCancel={() => setDeductConfirm(false)}
      />
    </div>
  );
}
