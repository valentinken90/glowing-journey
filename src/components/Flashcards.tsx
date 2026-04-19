import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import FlashcardPlayer, { type PlayerResult } from './FlashcardPlayer';
import FlashcardAnalytics from './FlashcardAnalytics';
import { flashcardDecks, getDeck, getAvailableModes, shuffled } from '../data/flashcardsData';
import { todayStr } from '../utils/helpers';
import {
  buildSmartQueue,
  createProgress,
  applyAnswer,
  filterByNumberRange,
  getDueCount,
  getWeakCount,
  getNewCount,
  NUMBER_RANGE_PRESETS,
  isNumberRecognitionDeck,
  type NumberRange,
} from '../utils/flashcardScheduling';
import type {
  FlashcardSubject,
  FlashcardLevel,
  FlashcardMode,
  FlashcardDeck,
  Flashcard,
  FlashcardProgress,
} from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlashcardsProps {
  showToast: (msg: string) => void;
}

type FlashcardsScreen =
  | { step: 'subject' }
  | { step: 'level'; subject: FlashcardSubject }
  | { step: 'mode'; subject: FlashcardSubject; level: FlashcardLevel }
  | { step: 'start'; deck: FlashcardDeck; numberRange?: NumberRange }
  | {
      step: 'playing';
      deck: FlashcardDeck;
      queue: Flashcard[];
      sessionType: 'smart' | 'free';
      numberRange?: NumberRange;
    };

type TopTab = 'practice' | 'analytics';

// ─── Constants ────────────────────────────────────────────────────────────────

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

function availableLevels(subject: FlashcardSubject): FlashcardLevel[] {
  const set = new Set(flashcardDecks.filter(d => d.subject === subject).map(d => d.level));
  return ALL_LEVELS.filter(l => set.has(l));
}

// ─── SubjectCard ──────────────────────────────────────────────────────────────

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
        transition: 'transform 0.1s',
      }}
      onPointerDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)'; }}
      onPointerUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
      onPointerLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
    >
      <span style={{ fontSize: 40, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 20, fontWeight: 700, color }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>{description}</span>
    </button>
  );
}

// ─── NumberRangePicker ────────────────────────────────────────────────────────

interface RangePickerProps {
  value: NumberRange | undefined;
  onChange: (range: NumberRange | undefined) => void;
  totalCards: number;
}

function NumberRangePicker({ value, onChange, totalCards }: RangePickerProps) {
  const [customMin, setCustomMin] = useState('');
  const [customMax, setCustomMax] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const customMinN = parseInt(customMin, 10);
  const customMaxN = parseInt(customMax, 10);
  const customValid =
    !isNaN(customMinN) && !isNaN(customMaxN) && customMinN >= 1 && customMaxN > customMinN;

  function applyCustom() {
    if (!customValid) return;
    onChange({ min: customMinN, max: customMaxN, label: `${customMinN} – ${customMaxN}` });
    setShowCustom(false);
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
        Number Range
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        <button
          className={`window-pill${!value ? ' window-pill-active' : ''}`}
          onClick={() => { onChange(undefined); setShowCustom(false); }}
        >
          All ({totalCards})
        </button>
        {NUMBER_RANGE_PRESETS.map(preset => (
          <button
            key={preset.label}
            className={`window-pill${value?.label === preset.label ? ' window-pill-active' : ''}`}
            onClick={() => { onChange(preset); setShowCustom(false); }}
          >
            {preset.label}
          </button>
        ))}
        <button
          className={`window-pill${showCustom ? ' window-pill-active' : ''}`}
          onClick={() => setShowCustom(s => !s)}
        >
          Custom
        </button>
      </div>
      {showCustom && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Min</label>
            <input
              type="number"
              className="form-input"
              min={1}
              value={customMin}
              onChange={e => setCustomMin(e.target.value)}
              placeholder="1"
              style={{ marginTop: 4 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Max</label>
            <input
              type="number"
              className="form-input"
              min={2}
              value={customMax}
              onChange={e => setCustomMax(e.target.value)}
              placeholder="100"
              style={{ marginTop: 4 }}
            />
          </div>
          <button className="btn btn-primary" onClick={applyCustom} disabled={!customValid} style={{ flexShrink: 0 }}>
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

// ─── StartScreen ──────────────────────────────────────────────────────────────

interface StartScreenProps {
  deck: FlashcardDeck;
  initialRange: NumberRange | undefined;
  cardProgressMap: Map<string, FlashcardProgress>;
  onBack: () => void;
  onStartSmart: (queue: Flashcard[], range: NumberRange | undefined) => void;
  onStartFree: (queue: Flashcard[], range: NumberRange | undefined) => void;
}

function StartScreen({
  deck,
  initialRange,
  cardProgressMap,
  onBack,
  onStartSmart,
  onStartFree,
}: StartScreenProps) {
  const isNumRec = isNumberRecognitionDeck(deck);
  const subjectColor = deck.subject === 'maths' ? 'var(--teal)' : 'var(--primary)';

  const [numberRange, setNumberRange] = useState<NumberRange | undefined>(initialRange);

  const baseCards = useMemo(() => {
    if (isNumRec && numberRange) {
      return filterByNumberRange(deck.cards, numberRange.min, numberRange.max);
    }
    return deck.cards;
  }, [isNumRec, numberRange, deck.cards]);

  const deckProgressMap = useMemo(() => {
    const map = new Map<string, FlashcardProgress>();
    for (const card of baseCards) {
      const p = cardProgressMap.get(card.id);
      if (p) map.set(card.id, p);
    }
    return map;
  }, [baseCards, cardProgressMap]);

  const dueN = getDueCount(baseCards, deckProgressMap);
  const weakN = getWeakCount(baseCards, deckProgressMap);
  const newN = getNewCount(baseCards, deckProgressMap);
  const smartQueue = useMemo(
    () => buildSmartQueue(baseCards, deckProgressMap),
    [baseCards, deckProgressMap],
  );
  const hasSmartCards = smartQueue.length > 0;

  return (
    <div>
      <div className="screen-header">
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 4 }} onClick={onBack}>
          ← Back
        </button>
        <h1 className="screen-title">{deck.modeLabel}</h1>
        <p className="screen-subtitle">
          {LEVEL_LABELS[deck.level]} · {deck.cards.length} cards total
        </p>
      </div>

      {isNumRec && (
        <NumberRangePicker
          value={numberRange}
          onChange={setNumberRange}
          totalCards={deck.cards.length}
        />
      )}

      {baseCards.length > 0 && (dueN > 0 || weakN > 0 || newN > 0) && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {dueN > 0 && <span className="fc-stat-pill fc-stat-pill-due">📅 {dueN} due</span>}
          {weakN > 0 && <span className="fc-stat-pill fc-stat-pill-weak">⚠️ {weakN} weak</span>}
          {newN > 0 && <span className="fc-stat-pill fc-stat-pill-new">✨ {newN} new</span>}
        </div>
      )}

      {baseCards.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 20 }}>
          <div className="empty-state-icon">🔍</div>
          <p className="empty-state-title">No cards in range</p>
          <p className="empty-state-text">Adjust the number range to include some cards.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Smart Review */}
          <div
            role="button"
            tabIndex={hasSmartCards ? 0 : -1}
            onClick={hasSmartCards ? () => onStartSmart(smartQueue, numberRange) : undefined}
            onKeyDown={e => { if (e.key === 'Enter' && hasSmartCards) onStartSmart(smartQueue, numberRange); }}
            style={{
              background: hasSmartCards ? subjectColor : 'var(--surface)',
              border: `2px solid ${hasSmartCards ? subjectColor : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              padding: '20px 18px',
              cursor: hasSmartCards ? 'pointer' : 'default',
              opacity: hasSmartCards ? 1 : 0.6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 32 }}>🧠</span>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: '0 0 2px',
                    fontWeight: 700,
                    fontSize: 16,
                    color: hasSmartCards ? '#fff' : 'var(--text)',
                  }}
                >
                  Smart Review
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: hasSmartCards ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)',
                  }}
                >
                  {hasSmartCards
                    ? `${smartQueue.length} cards — due, weak & new · wrong cards repeat`
                    : 'No cards due or new — all up to date!'}
                </p>
              </div>
              {hasSmartCards && (
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 20 }}>›</span>
              )}
            </div>
          </div>

          {/* All Cards */}
          <button
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '16px 18px',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: 'var(--shadow-sm)',
            }}
            onClick={() => onStartFree(shuffled(baseCards), numberRange)}
          >
            <span style={{ fontSize: 28 }}>🃏</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
                All Cards
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                {baseCards.length} cards shuffled — free practice, no scheduling
              </p>
            </div>
            <span style={{ color: 'var(--text-faint)', fontSize: 18 }}>›</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Flashcards({ showToast }: FlashcardsProps) {
  const {
    currentChild,
    addFlashcardSession,
    flashcardProgress,
    upsertCardProgress,
    flashcardSessions,
  } = useApp();

  const [screen, setScreen] = useState<FlashcardsScreen>({ step: 'subject' });
  const [topTab, setTopTab] = useState<TopTab>('practice');

  const cardProgressMap = useMemo(() => {
    const map = new Map<string, FlashcardProgress>();
    for (const p of flashcardProgress) map.set(p.cardId, p);
    return map;
  }, [flashcardProgress]);

  function handleComplete(result: PlayerResult) {
    if (screen.step !== 'playing') return;
    const { deck, sessionType, numberRange } = screen;
    const childId = currentChild?.id ?? 'unknown';

    const progressUpdates = new Map<string, FlashcardProgress>();
    for (const { cardId, correct } of result.cardResults) {
      const progressId = `${childId}::${cardId}`;
      const existing =
        progressUpdates.get(progressId) ??
        cardProgressMap.get(cardId) ??
        createProgress(childId, cardId, deck.subject, deck.level, deck.mode);
      progressUpdates.set(progressId, applyAnswer(existing, correct));
    }
    upsertCardProgress([...progressUpdates.values()]);

    addFlashcardSession({
      childId,
      subject: deck.subject,
      level: deck.level,
      mode: deck.mode,
      correct: result.correct,
      incorrect: result.incorrect,
      total: result.total,
      date: todayStr(),
      sessionType,
      numberRange,
    });

    const pct = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
    showToast(`🃏 ${deck.modeLabel} done! ${result.correct}/${result.total} (${pct}%)`);
    setScreen({ step: 'start', deck, numberRange });
  }

  // ── Subject ──────────────────────────────────────────────────────────────

  if (screen.step === 'subject') {
    return (
      <div>
        <div className="sub-tabs" style={{ marginBottom: 20 }}>
          <button
            className={`sub-tab${topTab === 'practice' ? ' sub-tab-active' : ''}`}
            onClick={() => setTopTab('practice')}
          >
            Practice
          </button>
          <button
            className={`sub-tab${topTab === 'analytics' ? ' sub-tab-active' : ''}`}
            onClick={() => setTopTab('analytics')}
          >
            Analytics
          </button>
        </div>

        {topTab === 'analytics' ? (
          <FlashcardAnalytics
            flashcardProgress={flashcardProgress}
            flashcardSessions={flashcardSessions}
          />
        ) : (
          <>
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
          </>
        )}
      </div>
    );
  }

  // ── Level ────────────────────────────────────────────────────────────────

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
              style={{ fontSize: 15, padding: '10px 20px', borderColor: subjectColor, color: subjectColor }}
              onClick={() => setScreen({ step: 'mode', subject, level })}
            >
              {LEVEL_LABELS[level]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Mode ─────────────────────────────────────────────────────────────────

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
              if (!deck) return null;

              const deckProgressMap = new Map<string, FlashcardProgress>();
              for (const card of deck.cards) {
                const p = cardProgressMap.get(card.id);
                if (p) deckProgressMap.set(card.id, p);
              }
              const dueN = getDueCount(deck.cards, deckProgressMap);
              const weakN = getWeakCount(deck.cards, deckProgressMap);
              const newN = getNewCount(deck.cards, deckProgressMap);

              return (
                <button
                  key={m.mode}
                  onClick={() => setScreen({ step: 'start', deck })}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
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
                  onPointerEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = subjectColor; }}
                  onPointerLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
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
                    <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
                      {m.label}
                    </p>
                    {m.description && (
                      <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {m.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{deck.cards.length} cards</span>
                      {dueN > 0 && <span className="fc-badge fc-badge-due">{dueN} due</span>}
                      {weakN > 0 && <span className="fc-badge fc-badge-weak">{weakN} weak</span>}
                      {newN > 0 && <span className="fc-badge fc-badge-new">{newN} new</span>}
                    </div>
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

  // ── Start ─────────────────────────────────────────────────────────────────

  if (screen.step === 'start') {
    return (
      <StartScreen
        deck={screen.deck}
        initialRange={screen.numberRange}
        cardProgressMap={cardProgressMap}
        onBack={() => setScreen({ step: 'mode', subject: screen.deck.subject, level: screen.deck.level })}
        onStartSmart={(queue, range) =>
          setScreen({ step: 'playing', deck: screen.deck, queue, sessionType: 'smart', numberRange: range })
        }
        onStartFree={(queue, range) =>
          setScreen({ step: 'playing', deck: screen.deck, queue, sessionType: 'free', numberRange: range })
        }
      />
    );
  }

  // ── Playing ───────────────────────────────────────────────────────────────

  if (screen.step === 'playing') {
    return (
      <FlashcardPlayer
        deck={screen.deck}
        initialQueue={screen.queue}
        sessionType={screen.sessionType}
        progressMap={cardProgressMap}
        onComplete={handleComplete}
        onBack={() =>
          setScreen({ step: 'start', deck: screen.deck, numberRange: screen.numberRange })
        }
      />
    );
  }

  return null;
}
