import { useState } from 'react';
import { useApp } from '../context/AppContext';
import FlashcardPlayer from './FlashcardPlayer';
import { flashcardDecks, getDeck, getAvailableModes } from '../data/flashcardsData';
import { todayStr } from '../utils/helpers';
import type { FlashcardSubject, FlashcardLevel, FlashcardMode, FlashcardDeck } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlashcardsProps {
  showToast: (msg: string) => void;
}

type FlashcardsScreen =
  | { step: 'subject' }
  | { step: 'level'; subject: FlashcardSubject }
  | { step: 'mode'; subject: FlashcardSubject; level: FlashcardLevel }
  | { step: 'playing'; deck: FlashcardDeck };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<FlashcardLevel, string> = {
  reception: 'Reception',
  year1: 'Year 1',
  year2: 'Year 2',
  year3: 'Year 3',
  year4: 'Year 4',
  year5: 'Year 5',
  year6: 'Year 6',
};

const ALL_LEVELS: FlashcardLevel[] = [
  'reception', 'year1', 'year2', 'year3', 'year4', 'year5', 'year6',
];

/** Return levels that have at least one deck for this subject */
function availableLevels(subject: FlashcardSubject): FlashcardLevel[] {
  const set = new Set(flashcardDecks.filter(d => d.subject === subject).map(d => d.level));
  return ALL_LEVELS.filter(l => set.has(l));
}

// ─── Subject card ─────────────────────────────────────────────────────────────

interface SubjectCardProps {
  label: string;
  icon: string;
  description: string;
  color: string;
  lightColor: string;
  onClick: () => void;
}

function SubjectCard({ label, icon, description, color, lightColor, onClick }: SubjectCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        background: lightColor,
        border: `2px solid ${color}`,
        borderRadius: 'var(--radius)',
        padding: '24px 20px',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: '100%',
        transition: 'transform 0.1s, box-shadow 0.1s',
      }}
      onPointerDown={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)';
      }}
      onPointerUp={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = '';
      }}
      onPointerLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = '';
      }}
    >
      <span style={{ fontSize: 40, lineHeight: 1 }}>{icon}</span>
      <span
        style={{
          fontSize: 20,
          fontWeight: 700,
          color,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>
        {description}
      </span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Flashcards({ showToast }: FlashcardsProps) {
  const { currentChild, addFlashcardSession } = useApp();
  const [screen, setScreen] = useState<FlashcardsScreen>({ step: 'subject' });

  function handleComplete(result: { correct: number; incorrect: number; total: number }) {
    if (screen.step !== 'playing') return;
    const { deck } = screen;

    // Save session
    addFlashcardSession({
      childId: currentChild?.id ?? 'unknown',
      subject: deck.subject,
      level: deck.level,
      mode: deck.mode,
      correct: result.correct,
      incorrect: result.incorrect,
      total: result.total,
      date: todayStr(),
    });

    const pct = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
    showToast(
      `🃏 ${deck.modeLabel} done! ${result.correct}/${result.total} correct (${pct}%)`,
    );

    // Return to mode selection
    setScreen({ step: 'mode', subject: deck.subject, level: deck.level });
  }

  // ── Subject selection ────────────────────────────────────────────────────

  if (screen.step === 'subject') {
    return (
      <div>
        <div className="screen-header">
          <h1 className="screen-title">Flashcards 🃏</h1>
          <p className="screen-subtitle">Pick a subject to practise</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SubjectCard
            icon="🔢"
            label="Maths"
            description="Numbers, bonds, times tables, addition, subtraction and division"
            color="var(--teal)"
            lightColor="var(--teal-light)"
            onClick={() => setScreen({ step: 'level', subject: 'maths' })}
          />
          <SubjectCard
            icon="📖"
            label="Reading"
            description="Letters, phonics, sight words, vocabulary and spelling patterns"
            color="var(--primary)"
            lightColor="var(--primary-light)"
            onClick={() => setScreen({ step: 'level', subject: 'reading' })}
          />
        </div>
      </div>
    );
  }

  // ── Level selection ──────────────────────────────────────────────────────

  if (screen.step === 'level') {
    const { subject } = screen;
    const levels = availableLevels(subject);
    const subjectColor = subject === 'maths' ? 'var(--teal)' : 'var(--primary)';
    const subjectLabel = subject === 'maths' ? '🔢 Maths' : '📖 Reading';

    return (
      <div>
        <div className="screen-header">
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: 4, alignSelf: 'flex-start' }}
            onClick={() => setScreen({ step: 'subject' })}
          >
            ← Back
          </button>
          <h1 className="screen-title">{subjectLabel}</h1>
          <p className="screen-subtitle">Choose your year group</p>
        </div>

        <div className="window-pills" style={{ flexWrap: 'wrap', gap: 8 }}>
          {levels.map(level => (
            <button
              key={level}
              className="window-pill"
              style={{
                fontSize: 15,
                padding: '10px 20px',
                borderColor: subjectColor,
                color: subjectColor,
              }}
              onClick={() => setScreen({ step: 'mode', subject, level })}
            >
              {LEVEL_LABELS[level]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Mode selection ───────────────────────────────────────────────────────

  if (screen.step === 'mode') {
    const { subject, level } = screen;
    const modes = getAvailableModes(subject, level);
    const subjectLabel = subject === 'maths' ? '🔢 Maths' : '📖 Reading';
    const subjectColor = subject === 'maths' ? 'var(--teal)' : 'var(--primary)';
    const subjectLightColor = subject === 'maths' ? 'var(--teal-light)' : 'var(--primary-light)';

    return (
      <div>
        <div className="screen-header">
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: 4 }}
            onClick={() => setScreen({ step: 'level', subject })}
          >
            ← Back
          </button>
          <h1 className="screen-title">{subjectLabel}</h1>
          <p className="screen-subtitle">{LEVEL_LABELS[level]} — choose a topic</p>
        </div>

        {modes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚧</div>
            <p className="empty-state-title">No decks yet</p>
            <p className="empty-state-text">
              No flashcard decks available for {LEVEL_LABELS[level]} {subjectLabel} yet.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {modes.map(m => {
              const deck = getDeck(subject, level, m.mode as FlashcardMode);
              return (
                <button
                  key={m.mode}
                  onClick={() => {
                    if (deck) setScreen({ step: 'playing', deck });
                  }}
                  style={{
                    background: 'var(--surface)',
                    border: `1px solid var(--border)`,
                    borderRadius: 'var(--radius)',
                    padding: '16px 14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'border-color 0.15s',
                  }}
                  onPointerEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = subjectColor;
                  }}
                  onPointerLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--radius)',
                      background: subjectLightColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      flexShrink: 0,
                    }}
                  >
                    🃏
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        margin: '0 0 2px',
                        fontWeight: 600,
                        fontSize: 15,
                        color: 'var(--text)',
                      }}
                    >
                      {m.label}
                    </p>
                    {m.description && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          lineHeight: 1.4,
                        }}
                      >
                        {m.description}
                      </p>
                    )}
                    {deck && (
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: 11,
                          color: 'var(--text-faint)',
                          fontWeight: 500,
                        }}
                      >
                        {deck.cards.length} cards
                      </p>
                    )}
                  </div>
                  <span style={{ color: 'var(--text-faint)', fontSize: 18 }}>›</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Playing ──────────────────────────────────────────────────────────────

  if (screen.step === 'playing') {
    return (
      <FlashcardPlayer
        deck={screen.deck}
        onComplete={handleComplete}
        onBack={() =>
          setScreen({
            step: 'mode',
            subject: screen.deck.subject,
            level: screen.deck.level,
          })
        }
      />
    );
  }

  return null;
}
