import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { formatDate, pluralStars, todayStr, clamp } from '../utils/helpers';
import type { StarEntry, SessionType } from '../types';

interface LogStarsProps {
  showToast: (msg: string) => void;
}

type ActivePanel = 'add' | 'deduct' | null;

function sessionIcon(type?: SessionType) {
  return type === 'maths' ? '🔢' : '📖';
}

function sessionLabel(type?: SessionType) {
  return type === 'maths' ? 'Maths' : 'Reading';
}

function defaultTitle(type?: SessionType) {
  return type === 'maths' ? 'Maths session' : 'Reading session';
}

export default function LogStars({ showToast }: LogStarsProps) {
  const { entries, addEntry, addDeduction, updateEntry, deleteEntry } = useApp();

  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [addForm, setAddForm] = useState({ sessionType: 'reading' as SessionType, stars: 1, bookTitle: '', note: '', date: todayStr() });
  const [deductForm, setDeductForm] = useState({ stars: 1, reason: '', date: todayStr() });
  const [deductConfirm, setDeductConfirm] = useState(false);

  const [editEntry, setEditEntry] = useState<StarEntry | null>(null);
  const [editForm, setEditForm] = useState({ sessionType: 'reading' as SessionType, stars: 1, bookTitle: '', note: '', date: todayStr() });
  const [deleteConfirm, setDeleteConfirm] = useState<StarEntry | null>(null);

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
    const icon = addForm.sessionType === 'maths' ? '🔢' : '⭐';
    showToast(`${icon} ${pluralStars(addForm.stars)} added!`);
  };

  const handleDeductSave = () => {
    if (!deductForm.reason.trim() || deductForm.stars < 1) return;
    setDeductConfirm(true);
  };

  const handleDeductConfirm = () => {
    addDeduction({ stars: deductForm.stars, reason: deductForm.reason.trim(), date: deductForm.date });
    setDeductConfirm(false);
    setActivePanel(null);
    showToast(`⬇️ ${pluralStars(deductForm.stars)} deducted`);
  };

  const openEdit = useCallback((entry: StarEntry) => {
    setEditEntry(entry);
    setEditForm({
      sessionType: entry.sessionType ?? 'reading',
      stars: entry.stars,
      bookTitle: entry.bookTitle ?? '',
      note: entry.note ?? '',
      date: entry.date,
    });
  }, []);

  const handleEditSave = useCallback(() => {
    if (!editEntry) return;
    updateEntry({
      ...editEntry,
      sessionType: editForm.sessionType,
      date: editForm.date,
      stars: editForm.stars,
      bookTitle: editForm.bookTitle.trim() || undefined,
      note: editForm.note.trim() || undefined,
    });
    setEditEntry(null);
    showToast('✏️ Entry updated');
  }, [editEntry, editForm, updateEntry, showToast]);

  const handleDelete = useCallback(() => {
    if (!deleteConfirm) return;
    deleteEntry(deleteConfirm.id);
    setDeleteConfirm(null);
    showToast('🗑️ Entry deleted');
  }, [deleteConfirm, deleteEntry, showToast]);

  const sorted = [...entries].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.createdAt.localeCompare(a.createdAt);
  });

  const isMaths = addForm.sessionType === 'maths';
  const isEditMaths = editForm.sessionType === 'maths';

  return (
    <div>
      <div className="screen-header">
        <h1 className="screen-title">Log Stars ⭐</h1>
        <p className="screen-subtitle">Record every session</p>
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
              <label className="form-label" htmlFor="log-book">
                {isMaths ? 'Topic (optional)' : 'Book Title (optional)'}
              </label>
              <input
                id="log-book"
                type="text"
                className="form-input"
                placeholder={isMaths ? 'e.g. Times tables, Fractions' : 'e.g. Charlie and the Chocolate Factory'}
                value={addForm.bookTitle}
                onChange={e => setAddForm(f => ({ ...f, bookTitle: e.target.value }))}
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="log-note">Note (optional)</label>
              <textarea
                id="log-note"
                className="form-input form-textarea"
                placeholder={isMaths ? 'e.g. Got all 7× tables right!' : 'e.g. Read two whole chapters!'}
                value={addForm.note}
                onChange={e => setAddForm(f => ({ ...f, note: e.target.value }))}
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="log-date">Date</label>
              <input
                id="log-date"
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
            style={{ background: isMaths ? 'var(--teal)' : 'var(--primary)', color: '#fff' }}
            onClick={handleAddSave}
            disabled={addForm.stars < 1 || !addForm.date}
          >
            Save — {pluralStars(addForm.stars)}
          </button>
        </div>
      )}

      {/* Deduct stars panel */}
      {activePanel === 'deduct' && (
        <div className="action-panel action-panel-deduct">
          <div className="stack stack-lg" style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Remove stars from the balance for bad behaviour.
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
              <label className="form-label" htmlFor="log-reason">Reason (required)</label>
              <input
                id="log-reason"
                type="text"
                className="form-input"
                placeholder="e.g. Didn't tidy bedroom"
                value={deductForm.reason}
                onChange={e => setDeductForm(f => ({ ...f, reason: e.target.value }))}
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="log-deduct-date">Date</label>
              <input
                id="log-deduct-date"
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

      {/* Entries list */}
      <div style={{ marginTop: activePanel ? 20 : 0 }}>
        {sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <p className="empty-state-title">No entries yet</p>
            <p className="empty-state-text">Tap <strong>Add Stars</strong> above to log your first session.</p>
          </div>
        ) : (
          <div className="stack stack-lg">
            {sorted.map(entry => {
              const type = entry.sessionType ?? 'reading';
              return (
                <div key={entry.id} className="entry-item">
                  <div className="entry-item-header">
                    <div className="entry-item-main">
                      <p className="entry-item-title">
                        {sessionIcon(type)}{' '}
                        {entry.bookTitle ?? defaultTitle(type)}
                      </p>
                      <p className="entry-item-meta">
                        {sessionLabel(type)} · {formatDate(entry.date)}
                      </p>
                    </div>
                    <span className="entry-stars-badge">⭐ {entry.stars}</span>
                  </div>
                  {entry.note && (
                    <p className="entry-item-note">"{entry.note}"</p>
                  )}
                  <div className="entry-item-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(entry)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(entry)}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Modal
        isOpen={!!editEntry}
        onClose={() => setEditEntry(null)}
        title="Edit Entry"
      >
        <div className="stack stack-lg" style={{ marginBottom: 12 }}>
          <div className="form-field">
            <label className="form-label">Session Type</label>
            <div className="session-type-toggle">
              <button
                className={`session-type-btn${editForm.sessionType === 'reading' ? ' active-reading' : ''}`}
                onClick={() => setEditForm(f => ({ ...f, sessionType: 'reading' }))}
              >📖 Reading</button>
              <button
                className={`session-type-btn${editForm.sessionType === 'maths' ? ' active-maths' : ''}`}
                onClick={() => setEditForm(f => ({ ...f, sessionType: 'maths' }))}
              >🔢 Maths</button>
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Stars Earned</label>
            <div className="star-picker">
              <button className="star-picker-btn" onClick={() => setEditForm(f => ({ ...f, stars: clamp(f.stars - 1, 1, 50) }))}>−</button>
              <div className="star-picker-val"><span>⭐</span><span>{editForm.stars}</span></div>
              <button className="star-picker-btn" onClick={() => setEditForm(f => ({ ...f, stars: clamp(f.stars + 1, 1, 50) }))}>+</button>
            </div>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="edit-date">Date</label>
            <input
              id="edit-date"
              type="date"
              className="form-input"
              value={editForm.date}
              max={todayStr()}
              onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="edit-book">
              {isEditMaths ? 'Topic (optional)' : 'Book Title (optional)'}
            </label>
            <input
              id="edit-book"
              type="text"
              className="form-input"
              placeholder={isEditMaths ? 'e.g. Times tables, Fractions' : 'e.g. Charlie and the Chocolate Factory'}
              value={editForm.bookTitle}
              onChange={e => setEditForm(f => ({ ...f, bookTitle: e.target.value }))}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="edit-note">Note (optional)</label>
            <textarea
              id="edit-note"
              className="form-input form-textarea"
              placeholder={isEditMaths ? 'e.g. Got all 7× tables right!' : 'e.g. Read two whole chapters!'}
              value={editForm.note}
              onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))}
            />
          </div>
        </div>

        <div style={{ position: 'sticky', bottom: 0, background: 'var(--surface)', paddingTop: 8, paddingBottom: 4 }}>
          <button
            className="btn btn-full"
            style={{ background: isEditMaths ? 'var(--teal)' : 'var(--primary)', color: '#fff' }}
            onClick={handleEditSave}
            disabled={editForm.stars < 1 || !editForm.date}
          >
            Save Changes
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deductConfirm}
        title="Remove Stars?"
        message={`Remove ${pluralStars(deductForm.stars)} for "${deductForm.reason}"? This will reduce the available balance.`}
        confirmLabel="Yes, remove"
        confirmDanger
        onConfirm={handleDeductConfirm}
        onCancel={() => setDeductConfirm(false)}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Entry?"
        message={`This will remove "${deleteConfirm?.bookTitle ?? defaultTitle(deleteConfirm?.sessionType)}" and adjust the star balance accordingly.`}
        confirmLabel="Delete"
        confirmDanger
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
