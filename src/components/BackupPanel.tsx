import { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import Modal from './Modal';
import { storage } from '../utils/storage';
import type { Child, StarEntry, Reward, Redemption, FlashcardSession } from '../types';

interface BackupPanelProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

// ─── Backup data shape ────────────────────────────────────────────────────────

interface BackupV2 {
  version: 2;
  exportedAt: string;
  children: Child[];
  entries: StarEntry[];
  rewards: Reward[];
  redemptions: Redemption[];
  flashcardSessions: FlashcardSession[];
}

// A relaxed type for v1 backup (no children field)
interface BackupV1 {
  version?: 1;
  exportedAt?: string;
  entries: StarEntry[];
  rewards: Reward[];
  redemptions: Redemption[];
}

type AnyBackup = BackupV1 | BackupV2;

function isV2(b: AnyBackup): b is BackupV2 {
  return (b as BackupV2).version === 2 && Array.isArray((b as BackupV2).children);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BackupPanel({ isOpen, onClose, showToast }: BackupPanelProps) {
  const { entries, rewards, redemptions, children, flashcardSessions } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  // ── Export ────────────────────────────────────────────────────────────────

  function handleExport() {
    const today = new Date().toISOString().slice(0, 10);
    const backup: BackupV2 = {
      version: 2,
      exportedAt: new Date().toISOString(),
      children,
      entries,
      rewards,
      redemptions,
      flashcardSessions,
    };
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reading-stars-backup-${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📦 Backup exported!');
  }

  // ── Import ────────────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImporting(true);

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text = ev.target?.result;
        if (typeof text !== 'string') throw new Error('Could not read file');

        const parsed: unknown = JSON.parse(text);
        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error('Invalid backup file: not a JSON object');
        }

        const data = parsed as Record<string, unknown>;

        // Must have at least entries or children arrays
        if (!Array.isArray(data.entries) && !Array.isArray(data.children)) {
          throw new Error(
            'Invalid backup file: missing "entries" or "children" arrays',
          );
        }

        if (isV2(data as unknown as AnyBackup)) {
          const backup = data as unknown as BackupV2;
          storage.saveChildren(backup.children ?? []);
          storage.saveEntries(backup.entries ?? []);
          storage.saveRewards(backup.rewards ?? []);
          storage.saveRedemptions(backup.redemptions ?? []);
          storage.saveFlashcardSessions(backup.flashcardSessions ?? []);
          if (backup.children?.[0]?.id) {
            storage.saveCurrentChildId(backup.children[0].id);
          }
        } else {
          // v1 — no children
          const backup = data as unknown as BackupV1;
          storage.saveEntries(backup.entries ?? []);
          storage.saveRewards(backup.rewards ?? []);
          storage.saveRedemptions(backup.redemptions ?? []);
          // Leave children/sessions as-is
        }

        showToast('✅ Backup imported! Reloading…');
        setTimeout(() => window.location.reload(), 800);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setImportError(`Import failed: ${msg}`);
        setImporting(false);
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read the file. Please try again.');
      setImporting(false);
    };
    reader.readAsText(file);

    // Reset input so user can re-select same file
    e.target.value = '';
  }

  // ── Stats summary ─────────────────────────────────────────────────────────

  const summary = {
    children: children.length,
    entries: entries.length,
    rewards: rewards.length,
    redemptions: redemptions.length,
    flashcardSessions: flashcardSessions.length,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Backup & Restore">
      <div style={{ padding: '0 16px 24px' }}>
        {/* Current data summary */}
        <div
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '12px 14px',
            marginBottom: 20,
          }}
        >
          <p
            style={{
              margin: '0 0 8px',
              fontWeight: 600,
              fontSize: 13,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Current data
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4px 16px',
              fontSize: 13,
              color: 'var(--text)',
            }}
          >
            <span>👤 {summary.children} {summary.children === 1 ? 'child' : 'children'}</span>
            <span>⭐ {summary.entries} entries</span>
            <span>🎁 {summary.rewards} rewards</span>
            <span>🎟️ {summary.redemptions} redemptions</span>
            <span>🃏 {summary.flashcardSessions} flashcard sessions</span>
          </div>
        </div>

        {/* Export */}
        <div style={{ marginBottom: 24 }}>
          <p
            style={{
              margin: '0 0 6px',
              fontWeight: 600,
              fontSize: 15,
              color: 'var(--text)',
            }}
          >
            Export Backup
          </p>
          <p
            style={{
              margin: '0 0 12px',
              fontSize: 13,
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}
          >
            Download all your data as a JSON file. Keep it somewhere safe so
            you can restore it later.
          </p>
          <button className="btn btn-primary btn-full" onClick={handleExport}>
            📦 Export backup (.json)
          </button>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: 'var(--border)',
            margin: '0 0 24px',
          }}
        />

        {/* Import */}
        <div>
          <p
            style={{
              margin: '0 0 6px',
              fontWeight: 600,
              fontSize: 15,
              color: 'var(--text)',
            }}
          >
            Restore from Backup
          </p>
          <p
            style={{
              margin: '0 0 12px',
              fontSize: 13,
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}
          >
            Select a previously exported .json backup file. This will replace
            all current data and reload the app.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <button
            className="btn btn-full"
            style={{
              background: importing ? 'var(--border)' : 'var(--surface)',
              border: '2px dashed var(--border)',
              color: 'var(--text)',
              cursor: importing ? 'not-allowed' : 'pointer',
            }}
            disabled={importing}
            onClick={() => {
              setImportError(null);
              fileInputRef.current?.click();
            }}
          >
            {importing ? '⏳ Importing…' : '📂 Choose backup file'}
          </button>

          {importError && (
            <div
              style={{
                marginTop: 12,
                padding: '10px 12px',
                background: 'var(--red-light)',
                border: '1px solid var(--red)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                color: 'var(--red)',
              }}
            >
              ⚠️ {importError}
            </div>
          )}

          <p
            style={{
              marginTop: 12,
              fontSize: 12,
              color: 'var(--text-faint)',
              lineHeight: 1.5,
            }}
          >
            Supports both v1 (legacy) and v2 backup formats.
          </p>
        </div>
      </div>
    </Modal>
  );
}
