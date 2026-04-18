import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { pluralStars, clamp } from '../utils/helpers';
import type { Reward, RewardsView } from '../types';

interface RewardsProps {
  showToast: (msg: string) => void;
}

interface RewardFormState {
  name: string;
  starCost: number;
  description: string;
  active: boolean;
}

const emptyRewardForm = (): RewardFormState => ({
  name: '',
  starCost: 5,
  description: '',
  active: true,
});

export default function Rewards({ showToast }: RewardsProps) {
  const { rewards, availableStars, addReward, updateReward, deleteReward, redeemReward } = useApp();
  const [view, setView] = useState<RewardsView>('wishlist');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [form, setForm] = useState<RewardFormState>(emptyRewardForm());
  const [deleteConfirm, setDeleteConfirm] = useState<Reward | null>(null);
  const [redeemConfirm, setRedeemConfirm] = useState<Reward | null>(null);

  const openAdd = useCallback(() => {
    setEditingReward(null);
    setForm(emptyRewardForm());
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((reward: Reward) => {
    setEditingReward(reward);
    setForm({
      name: reward.name,
      starCost: reward.starCost,
      description: reward.description ?? '',
      active: reward.active,
    });
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    const name = form.name.trim();
    if (!name || form.starCost < 1) return;

    const data = {
      name,
      starCost: form.starCost,
      description: form.description.trim() || undefined,
      active: form.active,
    };

    if (editingReward) {
      updateReward({ ...editingReward, ...data });
      showToast('✏️ Reward updated');
    } else {
      addReward(data);
      showToast('🎁 Reward added');
    }
    setModalOpen(false);
  }, [form, editingReward, addReward, updateReward, showToast]);

  const handleDelete = useCallback(() => {
    if (!deleteConfirm) return;
    deleteReward(deleteConfirm.id);
    setDeleteConfirm(null);
    showToast('🗑️ Reward deleted');
  }, [deleteConfirm, deleteReward, showToast]);

  const handleRedeem = useCallback(() => {
    if (!redeemConfirm) return;
    const ok = redeemReward(redeemConfirm);
    setRedeemConfirm(null);
    if (ok) {
      showToast(`🎉 Redeemed: ${redeemConfirm.name}`);
    } else {
      showToast('⚠️ Not enough stars');
    }
  }, [redeemConfirm, redeemReward, showToast]);

  const toggleActive = useCallback((reward: Reward) => {
    updateReward({ ...reward, active: !reward.active });
    showToast(reward.active ? '⏸️ Reward paused' : '▶️ Reward activated');
  }, [updateReward, showToast]);

  const activeRewards = rewards.filter(r => r.active).sort((a, b) => a.starCost - b.starCost);
  const allRewards = [...rewards].sort((a, b) => a.starCost - b.starCost);

  return (
    <div>
      <div className="screen-header">
        <h1 className="screen-title">Rewards 🎁</h1>
        <p className="screen-subtitle">What can those stars unlock?</p>
      </div>

      {/* Sub-tabs */}
      <div className="sub-tabs">
        <button
          className={`sub-tab${view === 'wishlist' ? ' active' : ''}`}
          onClick={() => setView('wishlist')}
        >
          ✨ Wishlist
        </button>
        <button
          className={`sub-tab${view === 'manage' ? ' active' : ''}`}
          onClick={() => setView('manage')}
        >
          ⚙️ Manage
        </button>
      </div>

      {/* ── Wishlist ────────────────────────────────────── */}
      {view === 'wishlist' && (
        <>
          {activeRewards.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎁</div>
              <p className="empty-state-title">No active rewards</p>
              <p className="empty-state-text">
                Switch to <strong>Manage</strong> to add some rewards.
              </p>
            </div>
          ) : (
            <div className="stack stack-lg">
              {activeRewards.map(reward => {
                const progress = Math.min(1, availableStars / reward.starCost);
                const needed = Math.max(0, reward.starCost - availableStars);
                const canRedeem = availableStars >= reward.starCost;

                return (
                  <div key={reward.id} className="reward-card">
                    <div className="reward-card-header">
                      <h3 className="reward-card-name">{reward.name}</h3>
                      <span className="reward-card-cost">⭐ {reward.starCost}</span>
                    </div>

                    {reward.description && (
                      <p className="reward-card-desc">{reward.description}</p>
                    )}

                    <div className="progress-track">
                      <div
                        className={`progress-fill${canRedeem ? ' progress-fill-complete' : ''}`}
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>

                    <div className="progress-label">
                      <span>
                        {availableStars >= reward.starCost
                          ? `${reward.starCost} / ${reward.starCost} stars`
                          : `${availableStars} / ${reward.starCost} stars`}
                      </span>
                      <span className={canRedeem ? 'progress-label-ready' : ''}>
                        {canRedeem ? '✓ Ready to redeem!' : `${needed} more ${needed === 1 ? 'star' : 'stars'} needed`}
                      </span>
                    </div>

                    <button
                      className={`btn btn-full ${canRedeem ? 'btn-primary' : 'btn-outline'}`}
                      disabled={!canRedeem}
                      onClick={() => setRedeemConfirm(reward)}
                    >
                      {canRedeem ? '🎉 Redeem Now' : 'Not Enough Stars Yet'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Manage ──────────────────────────────────────── */}
      {view === 'manage' && (
        <>
          <button className="btn btn-primary btn-full" style={{ marginBottom: 20 }} onClick={openAdd}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Reward
          </button>

          {allRewards.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎁</div>
              <p className="empty-state-title">No rewards yet</p>
              <p className="empty-state-text">Add your first reward above.</p>
            </div>
          ) : (
            <div className="stack stack-lg">
              {allRewards.map(reward => (
                <div key={reward.id} className="reward-manage-item">
                  <div className="reward-manage-header">
                    <div className="reward-manage-info">
                      <p className="reward-manage-name">{reward.name}</p>
                      <div className="reward-manage-meta">
                        <span className="reward-card-cost" style={{ fontSize: 11, padding: '2px 8px' }}>
                          ⭐ {reward.starCost}
                        </span>
                        <span
                          className="status-dot"
                          style={{ background: reward.active ? 'var(--green)' : 'var(--text-faint)' }}
                        />
                        <span style={{ fontSize: 12, color: reward.active ? 'var(--green)' : 'var(--text-faint)' }}>
                          {reward.active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {reward.description && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                      {reward.description}
                    </p>
                  )}

                  <div className="reward-manage-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(reward)}>
                      {reward.active ? 'Pause' : 'Activate'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(reward)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(reward)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add / Edit reward modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingReward ? 'Edit Reward' : 'Add Reward'}
      >
        <div className="stack stack-lg" style={{ marginBottom: 20 }}>
          <div className="form-field">
            <label className="form-label" htmlFor="reward-name">Reward Name</label>
            <input
              id="reward-name"
              type="text"
              className="form-input"
              placeholder="e.g. Choose a family film"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Star Cost</label>
            <div className="star-picker">
              <button
                className="star-picker-btn"
                onClick={() => setForm(f => ({ ...f, starCost: clamp(f.starCost - 1, 1, 100) }))}
              >
                −
              </button>
              <div className="star-picker-val">
                <span>⭐</span>
                <span>{form.starCost}</span>
              </div>
              <button
                className="star-picker-btn"
                onClick={() => setForm(f => ({ ...f, starCost: clamp(f.starCost + 1, 1, 100) }))}
              >
                +
              </button>
            </div>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="reward-desc">Description (optional)</label>
            <textarea
              id="reward-desc"
              className="form-input form-textarea"
              placeholder="e.g. Pick any film for movie night"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ minHeight: 64 }}
            />
          </div>

          <div className="form-field" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <label className="form-label" htmlFor="reward-active" style={{ margin: 0 }}>Active</label>
            <button
              id="reward-active"
              role="switch"
              aria-checked={form.active}
              onClick={() => setForm(f => ({ ...f, active: !f.active }))}
              style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                background: form.active ? 'var(--star)' : 'var(--border)',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 3,
                  left: form.active ? 23 : 3,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>
        </div>

        <button
          className="btn btn-primary btn-full"
          onClick={handleSave}
          disabled={!form.name.trim() || form.starCost < 1}
        >
          {editingReward ? 'Save Changes' : `Add — ${pluralStars(form.starCost)}`}
        </button>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Reward?"
        message={`Remove "${deleteConfirm?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmDanger
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Redeem confirm */}
      <ConfirmDialog
        isOpen={!!redeemConfirm}
        title="Redeem Reward?"
        message={`Redeem "${redeemConfirm?.name}" for ${redeemConfirm ? pluralStars(redeemConfirm.starCost) : ''}? This will be deducted from the available balance.`}
        confirmLabel="Redeem 🎉"
        onConfirm={handleRedeem}
        onCancel={() => setRedeemConfirm(null)}
      />
    </div>
  );
}
