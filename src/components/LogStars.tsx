import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { formatDate, pluralStars, todayStr, clamp } from '../utils/helpers';
import type { StarEntry, SessionType } from '../types';

interface LogStarsProps {
  showToast: (msg: string) => void;
}

interface FormState {
  sessionType: SessionType;
  date: string;
  stars: number;
  bookTitle: string;
  note: string;
}

const emptyForm = (): FormState => ({
  sessionType: 'reading',
  date: todayStr(),
  stars: 1,
  bookTitle: '',
  note: '',
});

function sessionLabel(type: SessionType) {
  return type === 'maths' ? 'Maths' : 'Reading';
}

function sessionIcon(type?: SessionType) {
  return type === 'maths' ? '🔢' : '📖';
}

function defaultTitle(type?: SessionType) {
  return type === 'maths' ? 'Maths session' : 'Reading session';
}

export default function LogStars({ showToast }: LogStarsProps) {
  const { entries, addEntry, updateEntry, deleteEntry } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<StarEntry | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [deleteConfirm, setDeleteConfirm] = useState<StarEntry | null>(null);

  const openAdd = useCallback(() => {
    setEditingEntry(null);
    setForm(emptyForm());
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((entry: StarEntry) => {
    setEditingEntry(entry);
    setForm({
      sessionType: entry.sessionType ?? 'reading',
      date: entry.date,
      stars: entry.stars,
      bookTitle: entry.bookTitle ?? '',
      note: entry.note ?? '',
    });
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (form.stars < 1) return;
    const data = {
      sessionType: form.sessionType,
      date: form.date,
      stars: form.stars,
      bookTitle: form.bookTitle.trim() || undefined,
      note: form.note.trim() || undefined,
    };
    if (editingEntry) {
      updateEntry({ ...editingEntry, ...data });
      showToast('✏️ Entry updated');
    } else {
      addEntry(data);
      showToast(`${sessionIcon(form.sessionType)} ${pluralStars(form.stars)} added!`);
    }
    setModalOpen(false);
  }, [form, editingEntry, addEntry, updateEntry, showToast]);

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

  const isMaths = form.sessionType === 'maths';

  return (
    <div>
      <div className="screen-header">
        <h1 className="screen-title">Log Stars ⭐</h1>
        <p className="screen-subtitle">Record every session</p>
      </div>

      <button className="btn btn-primary btn-full" style={{ marginBottom: 20 }} onClick={openAdd}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Session
      </button>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <p className="empty-state-title">No entries yet</p>
          <p className="empty-state-text">Tap the button above to log your first session.</p>
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

      {/* Add / Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEntry ? 'Edit Entry' : 'Add Session'}
      >
        <div className="stack stack-lg" style={{ marginBottom: 20 }}>

          {/* Session type toggle */}
          <div className="form-field">
            <label className="form-label">Session Type</label>
            <div className="session-type-toggle">
              <button
                className={`session-type-btn${form.sessionType === 'reading' ? ' active-reading' : ''}`}
                onClick={() => setForm(f => ({ ...f, sessionType: 'reading' }))}
              >
                📖 Reading
              </button>
              <button
                className={`session-type-btn${form.sessionType === 'maths' ? ' active-maths' : ''}`}
                onClick={() => setForm(f => ({ ...f, sessionType: 'maths' }))}
              >
                🔢 Maths
              </button>
            </div>
          </div>

          {/* Stars */}
          <div className="form-field">
            <label className="form-label">Stars Earned</label>
            <div className="star-picker">
              <button className="star-picker-btn" onClick={() => setForm(f => ({ ...f, stars: clamp(f.stars - 1, 1, 50) }))}>−</button>
              <div className="star-picker-val"><span>⭐</span><span>{form.stars}</span></div>
              <button className="star-picker-btn" onClick={() => setForm(f => ({ ...f, stars: clamp(f.stars + 1, 1, 50) }))}>+</button>
            </div>
          </div>

          {/* Date */}
          <div className="form-field">
            <label className="form-label" htmlFor="entry-date">Date</label>
            <input
              id="entry-date"
              type="date"
              className="form-input"
              value={form.date}
              max={todayStr()}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>

          {/* Book / Topic */}
          <div className="form-field">
            <label className="form-label" htmlFor="entry-book">
              {isMaths ? 'Topic (optional)' : 'Book Title (optional)'}
            </label>
            <input
              id="entry-book"
              type="text"
              className="form-input"
              placeholder={isMaths ? 'e.g. Times tables, Fractions' : 'e.g. Charlie and the Chocolate Factory'}
              value={form.bookTitle}
              onChange={e => setForm(f => ({ ...f, bookTitle: e.target.value }))}
            />
          </div>

          {/* Note */}
          <div className="form-field">
            <label className="form-label" htmlFor="entry-note">Note (optional)</label>
            <textarea
              id="entry-note"
              className="form-input form-textarea"
              placeholder={isMaths ? 'e.g. Got all her 7× table right!' : 'e.g. Read two whole chapters!'}
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            />
          </div>
        </div>

        <button
          className="btn btn-full"
          style={{ background: isMaths ? 'var(--teal)' : 'var(--primary)', color: '#fff' }}
          onClick={handleSave}
          disabled={form.stars < 1 || !form.date}
        >
          {editingEntry ? 'Save Changes' : `Save — ${pluralStars(form.stars)}`}
        </button>
      </Modal>

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
