import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateShort } from '../utils/helpers';
import type { Tab, SessionType } from '../types';

interface DashboardProps {
  showToast: (msg: string) => void;
  onNavigate: (tab: Tab) => void;
}

interface ActivityItem {
  id: string;
  type: 'entry' | 'redemption';
  sessionType?: SessionType;
  title: string;
  meta: string;
  stars: number;
  createdAt: string;
}

export default function Dashboard({ showToast, onNavigate }: DashboardProps) {
  const { availableStars, totalEarned, totalRedeemed, todayStars, entries, redemptions, quickAddStar } = useApp();

  const recentActivity = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = [
      ...entries.map(e => ({
        id: e.id,
        type: 'entry' as const,
        sessionType: e.sessionType,
        title: e.bookTitle ?? (e.sessionType === 'maths' ? 'Maths session' : 'Reading session'),
        meta: formatDateShort(e.date),
        stars: e.stars,
        createdAt: e.createdAt,
      })),
      ...redemptions.map(r => ({
        id: r.id,
        type: 'redemption' as const,
        title: r.rewardName,
        meta: formatDateShort(r.date),
        stars: -r.starCost,
        createdAt: r.createdAt,
      })),
    ];
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return items.slice(0, 6);
  }, [entries, redemptions]);

  const handleQuickAdd = () => {
    quickAddStar();
    showToast('⭐ 1 star added!');
  };

  return (
    <div>
      {/* Star hero */}
      <div className="star-hero">
        <p className="star-hero-label">Available Stars</p>
        <div className="star-hero-count">
          <span>⭐</span>
          <span>{availableStars}</span>
          <span className="star-hero-suffix">{availableStars === 1 ? 'star' : 'stars'}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{totalEarned}</div>
          <div className="stat-label">Total Earned</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalRedeemed}</div>
          <div className="stat-label">Redeemed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{todayStars}</div>
          <div className="stat-label">Today</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="quick-actions">
        <button className="quick-add-btn quick-add-primary" onClick={handleQuickAdd}>
          ⭐ +1 Star
        </button>
        <button className="quick-add-btn quick-add-secondary" onClick={() => onNavigate('log')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Session
        </button>
      </div>

      {/* Recent activity */}
      <div className="section-heading">
        <h2 className="section-title">Recent Activity</h2>
        {(entries.length > 0 || redemptions.length > 0) && (
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('history')}>
            See all
          </button>
        )}
      </div>

      {recentActivity.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <p className="empty-state-title">No activity yet</p>
          <p className="empty-state-text">
            Tap <strong>+1 Star</strong> to log your first reading session!
          </p>
        </div>
      ) : (
        <div className="activity-list">
          {recentActivity.map(item => (
            <div key={item.id} className="activity-item">
              <div className={`activity-icon ${item.type === 'entry' ? 'activity-icon-star' : 'activity-icon-redeem'}`}>
                {item.type === 'redemption' ? '🎁' : item.sessionType === 'maths' ? '🔢' : '📖'}
              </div>
              <div className="activity-body">
                <p className="activity-title">{item.title}</p>
                <p className="activity-meta">{item.meta}</p>
              </div>
              <span className={`activity-stars${item.stars < 0 ? ' activity-stars-neg' : ''}`}>
                {item.stars > 0 ? `+${item.stars}` : item.stars} ⭐
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
