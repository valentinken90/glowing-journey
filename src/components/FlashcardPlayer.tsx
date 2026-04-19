import { useState } from 'react';
import type { FlashcardDeck, Flashcard, FlashcardProgress } from '../types';
import { reinsertCard } from '../utils/flashcardScheduling';
import DiceDisplay from './DiceDisplay';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlayerResult {
  correct: number;
  incorrect: number;
  total: number;
  cardResults: { cardId: string; correct: boolean }[];
}

interface FlashcardPlayerProps {
  deck: FlashcardDeck;
  initialQueue: Flashcard[];
  sessionType: 'smart' | 'free';
  progressMap?: Map<string, FlashcardProgress>;
  onComplete: (result: PlayerResult) => void;
  onBack: () => void;
}

type PlayState = 'question' | 'revealed';

// ─── Component ────────────────────────────────────────────────────────────────

export default function FlashcardPlayer({
  deck,
  initialQueue,
  sessionType,
  onComplete,
  onBack,
}: FlashcardPlayerProps) {
  const [queue, setQueue] = useState<Flashcard[]>(initialQueue);
  const [playState, setPlayState] = useState<PlayState>('question');
  const [finalAnswers, setFinalAnswers] = useState<Map<string, boolean>>(new Map());
  const [completeResult, setCompleteResult] = useState<PlayerResult | null>(null);

  const isNumRec = deck.mode === 'number-recognition';
  const current = queue[0];
  const totalCards = initialQueue.length;
  const answeredCount = finalAnswers.size;
  const sessionCorrect = [...finalAnswers.values()].filter(Boolean).length;
  const sessionIncorrect = answeredCount - sessionCorrect;

  function handleReveal() {
    setPlayState('revealed');
  }

  function handleAnswer(wasCorrect: boolean) {
    const card = current;
    const newFinalAnswers = new Map(finalAnswers);
    newFinalAnswers.set(card.id, wasCorrect);
    setFinalAnswers(newFinalAnswers);

    let nextQueue = queue.slice(1);

    // Smart mode: reinsert wrong card 3 positions ahead
    if (!wasCorrect && sessionType === 'smart' && nextQueue.length > 0) {
      nextQueue = reinsertCard(nextQueue, card);
    }

    if (nextQueue.length === 0) {
      const cardResults = [...newFinalAnswers.entries()].map(([cardId, correct]) => ({
        cardId,
        correct,
      }));
      const finalCorrect = cardResults.filter(r => r.correct).length;
      setCompleteResult({
        correct: finalCorrect,
        incorrect: totalCards - finalCorrect,
        total: totalCards,
        cardResults,
      });
    } else {
      setQueue(nextQueue);
      setPlayState('question');
    }
  }

  // ── Completion screen ─────────────────────────────────────────────────────

  if (completeResult) {
    const pct =
      completeResult.total > 0
        ? Math.round((completeResult.correct / completeResult.total) * 100)
        : 0;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 16px',
          gap: 24,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>
            {pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}
          </div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
            {pct >= 80 ? 'Brilliant!' : pct >= 50 ? 'Good work!' : 'Keep practising!'}
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
            {deck.modeLabel} · {sessionType === 'smart' ? 'Smart Review' : 'All Cards'}
          </p>
        </div>

        {/* Score card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '20px 24px',
            width: '100%',
            maxWidth: 340,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--green)' }}>
                {completeResult.correct}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>✓ Correct</div>
            </div>
            <div style={{ width: 1, background: 'var(--border)', margin: '0 16px' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--red)' }}>
                {completeResult.incorrect}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>✗ To practise</div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg)',
              borderRadius: 'var(--radius-full)',
              height: 10,
              overflow: 'hidden',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background:
                  pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--star)' : 'var(--red)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          <p
            style={{
              textAlign: 'center',
              margin: 0,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-muted)',
            }}
          >
            {pct}% correct
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 340 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onBack}>
            ← Back
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 2 }}
            onClick={() => onComplete(completeResult)}
          >
            ✓ Done
          </button>
        </div>
      </div>
    );
  }

  // ── Card display ─────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 16px 24px',
        gap: 20,
      }}
    >
      {/* Progress bar + counter */}
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ padding: '4px 8px' }}>
            ← Back
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
            {answeredCount + 1} / {totalCards}
          </span>
        </div>
        <div
          style={{
            background: 'var(--border)',
            borderRadius: 'var(--radius-full)',
            height: 6,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(answeredCount / totalCards) * 100}%`,
              background: 'var(--primary)',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.2s ease',
            }}
          />
        </div>
      </div>

      {/* Main card */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl, 20px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          padding: '32px 24px',
          width: '100%',
          maxWidth: 400,
          minHeight: 240,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          textAlign: 'center',
        }}
      >
        {isNumRec ? (
          <>
            <div
              style={{
                fontSize: 88,
                fontWeight: 800,
                lineHeight: 1,
                color: 'var(--text)',
                letterSpacing: '-2px',
              }}
            >
              {current.question}
            </div>
            <DiceDisplay value={Number(current.question)} />
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
              What number is this?
            </p>
          </>
        ) : (
          <>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: 'var(--text)',
                lineHeight: 1.4,
              }}
            >
              {current.question}
            </div>

            {playState === 'revealed' && (
              <div
                style={{
                  marginTop: 8,
                  paddingTop: 16,
                  borderTop: '2px dashed var(--border)',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: 'var(--primary)',
                    lineHeight: 1.4,
                  }}
                >
                  {current.answer}
                </div>
                {current.hint && (
                  <p
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: 'var(--text-faint)',
                      fontStyle: 'italic',
                    }}
                  >
                    💡 {current.hint}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Session score */}
      <div style={{ display: 'flex', gap: 20, fontSize: 14, fontWeight: 600 }}>
        <span style={{ color: 'var(--green)' }}>✓ {sessionCorrect}</span>
        <span style={{ color: 'var(--red)' }}>✗ {sessionIncorrect}</span>
        {sessionType === 'smart' && (
          <span style={{ color: 'var(--text-faint)', fontSize: 12, fontWeight: 500 }}>
            Smart Review
          </span>
        )}
      </div>

      {/* Controls */}
      {playState === 'question' && !isNumRec && (
        <button
          className="btn btn-primary btn-full"
          style={{ maxWidth: 400 }}
          onClick={handleReveal}
        >
          Reveal Answer
        </button>
      )}

      {(playState === 'revealed' || isNumRec) && (
        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 400 }}>
          <button
            className="btn btn-full"
            style={{
              flex: 1,
              background: 'var(--red-light)',
              color: 'var(--red)',
              border: '1px solid var(--red)',
              fontWeight: 700,
              fontSize: 16,
            }}
            onClick={() => handleAnswer(false)}
          >
            ✗ Try again
          </button>
          <button
            className="btn btn-full"
            style={{
              flex: 1,
              background: 'var(--green-light)',
              color: 'var(--green)',
              border: '1px solid var(--green)',
              fontWeight: 700,
              fontSize: 16,
            }}
            onClick={() => handleAnswer(true)}
          >
            ✓ Got it!
          </button>
        </div>
      )}
    </div>
  );
}
