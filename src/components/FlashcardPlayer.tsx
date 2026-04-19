import { useState, useMemo } from 'react';
import type { FlashcardDeck, Flashcard } from '../types';
import { shuffled } from '../data/flashcardsData';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlashcardPlayerProps {
  deck: FlashcardDeck;
  onComplete: (result: { correct: number; incorrect: number; total: number }) => void;
  onBack: () => void;
}

type PlayState = 'question' | 'revealed' | 'complete';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isNumberRecognition(deck: FlashcardDeck): boolean {
  return deck.mode === 'number-recognition';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FlashcardPlayer({ deck, onComplete, onBack }: FlashcardPlayerProps) {
  const cards = useMemo<Flashcard[]>(() => shuffled(deck.cards), [deck]);
  const [index, setIndex] = useState(0);
  const [playState, setPlayState] = useState<PlayState>('question');
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);

  const current = cards[index];
  const total = cards.length;
  const isNumRec = isNumberRecognition(deck);

  function handleReveal() {
    setPlayState('revealed');
  }

  function handleAnswer(gotIt: boolean) {
    if (gotIt) setCorrect(c => c + 1);
    else setIncorrect(i => i + 1);

    const nextIndex = index + 1;
    if (nextIndex >= total) {
      setPlayState('complete');
      onComplete({
        correct: gotIt ? correct + 1 : correct,
        incorrect: gotIt ? incorrect : incorrect + 1,
        total,
      });
    } else {
      setIndex(nextIndex);
      setPlayState('question');
    }
  }

  function handlePlayAgain() {
    setIndex(0);
    setPlayState('question');
    setCorrect(0);
    setIncorrect(0);
  }

  // ── Complete screen ──────────────────────────────────────────────────────

  if (playState === 'complete') {
    const finalCorrect = correct;
    const finalIncorrect = incorrect;
    const finalTotal = finalCorrect + finalIncorrect;
    const finalPct = finalTotal > 0 ? Math.round((finalCorrect / finalTotal) * 100) : 0;

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
            {finalPct >= 80 ? '🎉' : finalPct >= 50 ? '👍' : '💪'}
          </div>
          <h2
            style={{
              margin: '0 0 4px',
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text)',
            }}
          >
            {finalPct >= 80
              ? 'Brilliant!'
              : finalPct >= 50
              ? 'Good work!'
              : 'Keep practising!'}
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
            {deck.modeLabel} · {deck.level}
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              marginBottom: 20,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: 'var(--green)',
                }}
              >
                {finalCorrect}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                ✓ Correct
              </div>
            </div>
            <div
              style={{
                width: 1,
                background: 'var(--border)',
                margin: '0 16px',
              }}
            />
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: 'var(--red)',
                }}
              >
                {finalIncorrect}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                ✗ To practise
              </div>
            </div>
          </div>

          {/* Percentage bar */}
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
                width: `${finalPct}%`,
                background:
                  finalPct >= 80
                    ? 'var(--green)'
                    : finalPct >= 50
                    ? 'var(--star)'
                    : 'var(--red)',
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
            {finalPct}% correct
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 340 }}>
          <button
            className="btn btn-ghost"
            style={{ flex: 1 }}
            onClick={onBack}
          >
            ← Flashcards
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 2 }}
            onClick={handlePlayAgain}
          >
            🔄 Play again
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
          <button
            className="btn btn-ghost btn-sm"
            onClick={onBack}
            style={{ padding: '4px 8px' }}
          >
            ← Back
          </button>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-muted)',
            }}
          >
            {index + 1} / {total}
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
              width: `${((index) / total) * 100}%`,
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
        {/* Question */}
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
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
              What number is this?
            </p>
          </>
        ) : (
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
        )}

        {/* Answer (revealed) */}
        {playState === 'revealed' && (
          <div
            style={{
              marginTop: 8,
              paddingTop: 16,
              borderTop: '2px dashed var(--border)',
              width: '100%',
            }}
          >
            {isNumRec ? (
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: 'var(--primary)',
                }}
              >
                {current.answer}
              </div>
            ) : (
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
            )}
            {current.hint && playState === 'revealed' && (
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
      </div>

      {/* Session score */}
      <div
        style={{
          display: 'flex',
          gap: 20,
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        <span style={{ color: 'var(--green)' }}>✓ {correct}</span>
        <span style={{ color: 'var(--red)' }}>✗ {incorrect}</span>
      </div>

      {/* Controls */}
      {playState === 'question' && (
        <button
          className="btn btn-primary btn-full"
          style={{ maxWidth: 400 }}
          onClick={handleReveal}
        >
          Reveal Answer
        </button>
      )}

      {playState === 'revealed' && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            width: '100%',
            maxWidth: 400,
          }}
        >
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
