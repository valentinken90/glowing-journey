import { useState } from 'react';
import type { FlashcardProgress, FlashcardSession } from '../types';
import {
  getMasteryBreakdown,
  getDueCount,
  getWeakCards,
  getAccuracyBySubject,
  getWeeklyAccuracy,
  type WeakCard,
} from '../utils/flashcardAnalytics';
import { getDeck } from '../data/flashcardsData';
import type { FlashcardMode, FlashcardLevel, FlashcardSubject } from '../types';
import { formatDateShort } from '../utils/helpers';

interface FlashcardAnalyticsProps {
  flashcardProgress: FlashcardProgress[];
  flashcardSessions: FlashcardSession[];
}

type AnalyticsView = 'overview' | 'weak';

function AccuracyBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 13,
          marginBottom: 4,
          color: 'var(--text)',
          fontWeight: 500,
        }}
      >
        <span>{label}</span>
        <span style={{ color: 'var(--text-muted)' }}>{pct}%</span>
      </div>
      <div
        style={{
          background: 'var(--border)',
          borderRadius: 'var(--radius-full)',
          height: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}

function WeakCardItem({ card }: { card: WeakCard }) {
  const deck = getDeck(
    card.subject as FlashcardSubject,
    card.level as FlashcardLevel,
    card.mode as FlashcardMode,
  );
  const flashcard = deck?.cards.find(c => c.id === card.cardId);

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius)',
          background: 'var(--red-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        ✗
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: '0 0 2px',
            fontWeight: 600,
            fontSize: 14,
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {flashcard ? flashcard.question : card.cardId}
        </p>
        {flashcard && (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            → {flashcard.answer}
          </p>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: card.accuracy < 50 ? 'var(--red)' : 'var(--star)',
          }}
        >
          {card.accuracy}%
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
          {card.timesIncorrect} miss{card.timesIncorrect !== 1 ? 'es' : ''}
        </div>
      </div>
    </div>
  );
}

export default function FlashcardAnalytics({
  flashcardProgress,
  flashcardSessions,
}: FlashcardAnalyticsProps) {
  const [view, setView] = useState<AnalyticsView>('overview');

  const mastery = getMasteryBreakdown(flashcardProgress);
  const dueCount = getDueCount(flashcardProgress);
  const weakCards = getWeakCards(flashcardProgress);
  const accuracyBySubject = getAccuracyBySubject(flashcardProgress);
  const weeklyAccuracy = getWeeklyAccuracy(flashcardSessions);
  const recentSessions = flashcardSessions.slice(0, 8);

  const hasAnyData = flashcardProgress.length > 0 || flashcardSessions.length > 0;

  if (!hasAnyData) {
    return (
      <div className="empty-state" style={{ marginTop: 40 }}>
        <div className="empty-state-icon">🃏</div>
        <p className="empty-state-title">No data yet</p>
        <p className="empty-state-text">Complete a flashcard session to see your analytics here.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Sub-tabs */}
      <div className="sub-tabs" style={{ marginBottom: 20 }}>
        <button
          className={`sub-tab${view === 'overview' ? ' sub-tab-active' : ''}`}
          onClick={() => setView('overview')}
        >
          Overview
        </button>
        <button
          className={`sub-tab${view === 'weak' ? ' sub-tab-active' : ''}`}
          onClick={() => setView('weak')}
        >
          Weak Areas {weakCards.length > 0 && `(${weakCards.length})`}
        </button>
      </div>

      {view === 'overview' && (
        <div>
          {/* Mastery breakdown */}
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>
            MASTERY BREAKDOWN
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              marginBottom: 20,
            }}
          >
            {[
              { label: 'New', count: mastery.new, color: 'var(--text-faint)' },
              { label: 'Learning', count: mastery.learning, color: 'var(--star)' },
              { label: 'Reviewing', count: mastery.reviewing, color: 'var(--teal)' },
              { label: 'Mastered', count: mastery.mastered, color: 'var(--green)' },
            ].map(({ label, count, color }) => (
              <div
                key={label}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '10px 8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 700, color }}>{count}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Due today */}
          {dueCount > 0 && (
            <div
              style={{
                background: 'var(--primary-light)',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius)',
                padding: '12px 14px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>📅</span>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--primary)', fontSize: 14 }}>
                  {dueCount} card{dueCount !== 1 ? 's' : ''} due for review
                </p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                  Start a Smart Review session to catch up
                </p>
              </div>
            </div>
          )}

          {/* Weekly accuracy */}
          {weeklyAccuracy !== null && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>
                THIS WEEK
              </h3>
              <AccuracyBar
                label="Overall accuracy (last 7 days)"
                pct={weeklyAccuracy}
                color={weeklyAccuracy >= 80 ? 'var(--green)' : weeklyAccuracy >= 50 ? 'var(--star)' : 'var(--red)'}
              />
            </div>
          )}

          {/* Accuracy by subject */}
          {Object.keys(accuracyBySubject).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>
                BY SUBJECT
              </h3>
              {accuracyBySubject.maths !== undefined && (
                <AccuracyBar label="🔢 Maths" pct={accuracyBySubject.maths} color="var(--teal)" />
              )}
              {accuracyBySubject.reading !== undefined && (
                <AccuracyBar label="📖 Reading" pct={accuracyBySubject.reading} color="var(--primary)" />
              )}
            </div>
          )}

          {/* Recent sessions */}
          {recentSessions.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>
                RECENT SESSIONS
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentSessions.map(s => {
                  const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                  return (
                    <div
                      key={s.id}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>
                        {s.subject === 'maths' ? '🔢' : '📖'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: '0 0 2px',
                            fontWeight: 600,
                            fontSize: 13,
                            color: 'var(--text)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {s.mode.replace(/-/g, ' ')}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-faint)' }}>
                          {formatDateShort(s.date)}
                          {s.sessionType === 'smart' && ' · Smart'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--star)' : 'var(--red)',
                          }}
                        >
                          {pct}%
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                          {s.correct}/{s.total}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'weak' && (
        <div>
          {weakCards.length === 0 ? (
            <div className="empty-state" style={{ marginTop: 20 }}>
              <div className="empty-state-icon">🎉</div>
              <p className="empty-state-title">No weak areas!</p>
              <p className="empty-state-text">
                Keep practising to maintain your accuracy.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)' }}>
                Cards you've struggled with most — sorted by accuracy.
              </p>
              {weakCards.map(card => (
                <WeakCardItem key={card.cardId} card={card} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
