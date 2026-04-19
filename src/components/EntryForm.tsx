import type { SessionType } from '../types';
import { todayStr, clamp, pluralStars } from '../utils/helpers';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EntryFormState {
  sessionType: SessionType;
  stars: number;
  title: string;
  note: string;
  date: string;
}

export interface EntryFormData {
  sessionType?: SessionType;
  stars: number;      // positive for earned, negative for deduction
  title: string;      // book title / topic / task / reason
  note: string;
  date: string;
}

interface EntryFormProps {
  initial?: Partial<EntryFormState>;
  onSave: (data: EntryFormData) => void;
  onCancel?: () => void;
  saveLabel?: string;
  isDeduction?: boolean;
  inline?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sessionBtnColor(type: SessionType): string {
  if (type === 'maths') return 'var(--teal)';
  if (type === 'chores') return 'var(--purple)';
  return 'var(--primary)';
}

function titlePlaceholder(type: SessionType): string {
  if (type === 'maths') return 'e.g. Times tables, Fractions';
  if (type === 'chores') return 'e.g. Tidied bedroom';
  return 'e.g. Charlie and the Chocolate Factory';
}

function notePlaceholder(type: SessionType): string {
  if (type === 'maths') return 'e.g. Got all 7× tables right!';
  if (type === 'chores') return 'e.g. Did it without being asked!';
  return 'e.g. Read two whole chapters!';
}

function titleLabel(type: SessionType): string {
  if (type === 'maths') return 'Topic (optional)';
  if (type === 'chores') return 'Task (optional)';
  return 'Book Title (optional)';
}

// ─── Component ────────────────────────────────────────────────────────────────

import { useState } from 'react';

export default function EntryForm({
  initial,
  onSave,
  onCancel,
  saveLabel,
  isDeduction = false,
  inline = false,
}: EntryFormProps) {
  const [sessionType, setSessionType] = useState<SessionType>(
    initial?.sessionType ?? 'reading',
  );
  const [stars, setStars] = useState(initial?.stars != null ? Math.abs(initial.stars) : 1);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [date, setDate] = useState(initial?.date ?? todayStr());

  const canSave = isDeduction
    ? title.trim().length > 0 && stars >= 1 && !!date
    : stars >= 1 && !!date;

  function handleSave() {
    if (!canSave) return;
    onSave({
      sessionType: isDeduction ? undefined : sessionType,
      stars: isDeduction ? -stars : stars,
      title: title.trim(),
      note: note.trim(),
      date,
    });
  }

  const saveBtnColor = isDeduction ? 'var(--red)' : sessionBtnColor(sessionType);
  const defaultSaveLabel = isDeduction
    ? `Remove ${pluralStars(stars)}`
    : `Save — ${pluralStars(stars)}`;

  const inner = (
    <div className="stack stack-lg">
      {/* Session type (only for earned entries) */}
      {!isDeduction && (
        <div className="form-field">
          <label className="form-label">Session Type</label>
          <div className="session-type-toggle">
            <button
              type="button"
              className={`session-type-btn${sessionType === 'reading' ? ' active-reading' : ''}`}
              onClick={() => setSessionType('reading')}
            >
              📖 Reading
            </button>
            <button
              type="button"
              className={`session-type-btn${sessionType === 'maths' ? ' active-maths' : ''}`}
              onClick={() => setSessionType('maths')}
            >
              🔢 Maths
            </button>
            <button
              type="button"
              className={`session-type-btn${sessionType === 'chores' ? ' active-chores' : ''}`}
              onClick={() => setSessionType('chores')}
            >
              🧹 Chores
            </button>
          </div>
        </div>
      )}

      {/* Stars picker */}
      <div className="form-field">
        <label className="form-label">
          {isDeduction ? 'Stars to Remove' : 'Stars Earned'}
        </label>
        <div className="star-picker">
          <button
            type="button"
            className="star-picker-btn"
            onClick={() =>
              setStars(clamp(stars - 1, 1, isDeduction ? 20 : 50))
            }
          >
            −
          </button>
          <div className="star-picker-val">
            <span>{isDeduction ? '⬇️' : '⭐'}</span>
            <span>{stars}</span>
          </div>
          <button
            type="button"
            className="star-picker-btn"
            onClick={() =>
              setStars(clamp(stars + 1, 1, isDeduction ? 20 : 50))
            }
          >
            +
          </button>
        </div>
      </div>

      {/* Title / reason */}
      <div className="form-field">
        <label className="form-label" htmlFor="ef-title">
          {isDeduction ? 'Reason (required)' : titleLabel(sessionType)}
        </label>
        <input
          id="ef-title"
          type="text"
          className="form-input"
          placeholder={
            isDeduction
              ? "e.g. Didn't tidy bedroom"
              : titlePlaceholder(sessionType)
          }
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      {/* Note (only for earned entries) */}
      {!isDeduction && (
        <div className="form-field">
          <label className="form-label" htmlFor="ef-note">
            Note (optional)
          </label>
          <textarea
            id="ef-note"
            className="form-input form-textarea"
            placeholder={notePlaceholder(sessionType)}
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>
      )}

      {/* Date */}
      <div className="form-field">
        <label className="form-label" htmlFor="ef-date">
          Date
        </label>
        <input
          id="ef-date"
          type="date"
          className="form-input"
          value={date}
          max={todayStr()}
          onChange={e => setDate(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        {onCancel && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ flex: 1 }}
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          className="btn btn-full"
          style={{
            background: saveBtnColor,
            color: '#fff',
            flex: onCancel ? 2 : 1,
          }}
          disabled={!canSave}
          onClick={handleSave}
        >
          {saveLabel ?? defaultSaveLabel}
        </button>
      </div>
    </div>
  );

  if (inline) return inner;

  return (
    <div
      className="card"
      style={{ padding: '16px 14px', boxShadow: 'var(--shadow-sm)' }}
    >
      {inner}
    </div>
  );
}
