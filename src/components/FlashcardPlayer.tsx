import { useState } from 'react';
import type { FlashcardDeck, Flashcard, FlashcardProgress } from '../types';
import { reinsertCard } from '../utils/flashcardScheduling';

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

  const isNumRec = deck.mode === 'number-recognition';
  const current = queue[0];
  const totalCards = initialQueue.length;
  // How many unique cards have been answered so far
  const answeredCount = finalAnswers.size;

  function handleReveal() {
    setPlayState('revealed');
  }

  function handleAnswer(wasCorrect: boolean) {
    const card = current;

    const newFinalAnswers = new Map(finalAnswers);
    newFinalAnswers.set(card.id, wasCorrect);
    setFinalAnswers(newFinalAnswers);

    let nextQueue = queue.slice(1);

    // Smart mode: reinsert wrong card 3 positions ahead so it comes back
    if (!wasCorrect && sessionType === 'smart' && nextQueue.length > 0) {
      nextQueue = reinsertCard(nextQueue, card);
    }

    if (nextQueue.length === 0) {
      // Build result from final answers map (one entry per unique card)
      const cardResults = [...newFinalAnswers.entries()].map(([cardId, correct]) => ({
        cardId,
        correct,
      }));
      const finalCorrect = cardResults.filter(r => r.correct).length;
      onComplete({
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

  // ── Card display ─────────────────────────────────────────────────────────

  const sessionCorrect = [...finalAnswers.values()].filter(Boolean).length;
  const sessionIncorrect = answeredCount - sessionCorrect;

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
          <button
            className="btn btn-ghost btn-sm"
            onClick={onBack}
            style={{ padding: '4px 8px' }}
          >
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
          minHeight: 220,
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
                fontSize: 96,
                fontWeight: 700,
                lineHeight: 1,
                color: 'var(--text)',
                letterSpacing: '-2px',
              }}
            >
              {current.question}
            </div>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>
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
      {(playState === 'question' && !isNumRec) && (
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
