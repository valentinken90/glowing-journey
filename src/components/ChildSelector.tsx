import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import type { Child } from '../types';

interface ChildSelectorProps {
  showToast: (msg: string) => void;
}

// ─── Inline child row (name edit + age) ──────────────────────────────────────

interface ChildRowProps {
  child: Child;
  isCurrent: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onSetAge: (age: number | undefined) => void;
  onDelete: () => void;
  canDelete: boolean;
}

function ChildRow({
  child,
  isCurrent,
  onSelect,
  onRename,
  onSetAge,
  onDelete,
  canDelete,
}: ChildRowProps) {
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(child.name);
  const [ageVal, setAgeVal] = useState(child.age != null ? String(child.age) : '');

  function saveEdit() {
    const trimmed = nameVal.trim();
    if (trimmed) onRename(trimmed);
    const parsed = parseInt(ageVal, 10);
    onSetAge(!isNaN(parsed) && parsed > 0 ? parsed : undefined);
    setEditing(false);
  }

  if (editing) {
    return (
      <div
        style={{
          padding: '10px 0',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type="text"
            className="form-input"
            style={{ flex: 2 }}
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            placeholder="Name"
            autoFocus
          />
          <input
            type="number"
            className="form-input"
            style={{ flex: 1, minWidth: 60 }}
            value={ageVal}
            onChange={e => setAgeVal(e.target.value)}
            placeholder="Age"
            min={1}
            max={18}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>
            Cancel
          </button>
          <button className="btn btn-primary btn-sm" onClick={saveEdit}>
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <button
        style={{
          flex: 1,
          background: 'none',
          border: 'none',
          padding: 0,
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
        onClick={onSelect}
      >
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: isCurrent ? 'var(--primary)' : 'var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
        >
          {isCurrent ? '✓' : '👤'}
        </span>
        <div>
          <p
            style={{
              margin: 0,
              fontWeight: isCurrent ? 600 : 400,
              fontSize: 15,
              color: 'var(--text)',
            }}
          >
            {child.name}
          </p>
          {child.age != null && (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
              Age {child.age}
            </p>
          )}
        </div>
      </button>

      <button
        className="btn btn-ghost btn-sm"
        style={{ flexShrink: 0 }}
        onClick={() => {
          setNameVal(child.name);
          setAgeVal(child.age != null ? String(child.age) : '');
          setEditing(true);
        }}
      >
        Edit
      </button>

      {canDelete && (
        <button
          className="btn btn-danger btn-sm"
          style={{ flexShrink: 0 }}
          onClick={onDelete}
        >
          Delete
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChildSelector({ showToast }: ChildSelectorProps) {
  const { children, currentChild, setCurrentChild, addChild, updateChild, deleteChild } =
    useApp();

  const [open, setOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addAge, setAddAge] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Child | null>(null);

  function handleAdd() {
    const trimmed = addName.trim();
    if (!trimmed) return;
    const parsed = parseInt(addAge, 10);
    addChild({
      name: trimmed,
      age: !isNaN(parsed) && parsed > 0 ? parsed : undefined,
    });
    setAddName('');
    setAddAge('');
    showToast(`👤 ${trimmed} added!`);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteChild(deleteTarget.id);
    setDeleteTarget(null);
    showToast('🗑️ Child removed');
  }

  const displayName = currentChild?.name ?? (children.length > 0 ? children[0].name : 'Select child');

  return (
    <>
      {/* Compact header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => setOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-full)',
            padding: '5px 12px',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text)',
          }}
        >
          <span>👤</span>
          <span>{displayName}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>▼</span>
        </button>

        <button
          onClick={() => setOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: 'var(--radius-sm)',
            lineHeight: 1,
          }}
          aria-label="Manage children"
        >
          ⚙️
        </button>
      </div>

      {/* Switcher modal */}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Switch Child">
        <div style={{ padding: '0 16px 16px' }}>
          {/* Children list */}
          {children.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '12px 0' }}>
              No children yet. Add one below.
            </p>
          ) : (
            <div style={{ marginBottom: 20 }}>
              {children.map(child => (
                <ChildRow
                  key={child.id}
                  child={child}
                  isCurrent={currentChild?.id === child.id}
                  canDelete={children.length > 1}
                  onSelect={() => {
                    setCurrentChild(child.id);
                    setOpen(false);
                    showToast(`Switched to ${child.name}`);
                  }}
                  onRename={name => {
                    updateChild({ ...child, name });
                    showToast('✏️ Name updated');
                  }}
                  onSetAge={age => {
                    updateChild({ ...child, age });
                  }}
                  onDelete={() => setDeleteTarget(child)}
                />
              ))}
            </div>
          )}

          {/* Add child form */}
          <div
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '12px 14px',
            }}
          >
            <p
              style={{
                margin: '0 0 10px',
                fontWeight: 600,
                fontSize: 14,
                color: 'var(--text)',
              }}
            >
              Add a child
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 2 }}
                placeholder="Name"
                value={addName}
                onChange={e => setAddName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAdd();
                }}
              />
              <input
                type="number"
                className="form-input"
                style={{ flex: 1, minWidth: 60 }}
                placeholder="Age"
                value={addAge}
                min={1}
                max={18}
                onChange={e => setAddAge(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary btn-full"
              disabled={!addName.trim()}
              onClick={handleAdd}
            >
              + Add Child
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Remove Child?"
        message={`Remove ${deleteTarget?.name ?? 'this child'}? Their entries and data will remain but the child profile will be deleted.`}
        confirmLabel="Remove"
        confirmDanger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
