import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '../redux/store';
import { type IUser } from '../redux/userSlice';

interface UserInfoProps {
  show: boolean;
  user: IUser;
  close?: () => void;
  onUpdated?: () => void;
  onRemoved?: () => void;
}

const UserInfo: React.FC<UserInfoProps> = ({ show, user, close, onUpdated, onRemoved }) => {
  const { username: currentUser, role: currentRole, teamNumber: currentTeam } = useSelector((state: RootState) => state.user);
  const [working, setWorking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [localRole, setLocalRole] = useState(user.role || 'user');
  const [localTeam, setLocalTeam] = useState(user.teamNumber);

  // Admin-selected destination team
  const [teamToMove, setTeamToMove] = useState(
    Number.isFinite(user.teamNumber) ? user.teamNumber : 1
  );

  if (!show) return null;

  const sameTeam = user.teamNumber === currentTeam;
  const isSelf = user.username === currentUser;

  const canBaseManage =
    currentRole === 'admin' ||
    (currentRole === 'manager' && sameTeam && user.teamNumber !== -1);

  const canPromoteToManager =
    (currentRole === 'admin' && localRole !== 'manager') ||
    (currentRole === 'manager' && sameTeam && localRole === 'user');

  const canDemoteToUser =
    currentRole === 'admin' && localRole === 'manager';

  const canPromoteToAdmin =
    currentRole === 'admin' && localRole !== 'admin';

  const canDemoteAdmin =
    currentRole === 'admin' && localRole === 'admin';

  const canSoftRemove =
    canBaseManage && !isSelf && localRole !== 'admin' && localTeam !== -1;

  const canHardDelete =
    currentRole === 'admin' && !isSelf;

  // Manager can add ONLY users without a team (-1) into manager’s team.
  const canAddToTeam =
    currentRole === 'manager' && !isSelf && localRole !== 'admin' && localTeam === -1;

  // Admin can move (set) team number for non-admin users
  const canMoveToTeam =
    currentRole === 'admin' && !isSelf && localRole !== 'admin';

  async function callRoleChange(nextRole: IUser['role']) {
    setWorking(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/manage/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterUsername: currentUser,
            username: user.username,
          role: nextRole
        })
      });
      const data = await res.json();
      if (data.updated) {
        setLocalRole(nextRole);
        onUpdated && onUpdated();
      } else setErrorMsg(data.error || 'Update failed');
    } catch {
      setErrorMsg('Network error');
    } finally {
      setWorking(false);
    }
  }

  async function softRemove() {
    if (!window.confirm(`Remove ${user.username} from team?`)) return;
    setWorking(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/manage/remove-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterUsername: currentUser,
          username: user.username
        })
      });
      const data = await res.json();
      if (data.removedFromTeam) {
        setLocalTeam(-1);
        onRemoved && onRemoved();
        close && close();
      } else setErrorMsg(data.error || 'Removal failed');
    } catch {
      setErrorMsg('Network error');
    } finally {
      setWorking(false);
    }
  }

  async function hardDelete() {
    if (!window.confirm(`Permanently DELETE ${user.username} and all their tasks?`)) return;
    setWorking(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/manage/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterUsername: currentUser,
          username: user.username
        })
      });
      const data = await res.json();
      if (data.deleted) {
        onRemoved && onRemoved();
        close && close();
      } else setErrorMsg(data.error || 'Delete failed');
    } catch {
      setErrorMsg('Network error');
    } finally {
      setWorking(false);
    }
  }

  async function addToTeam() {
    setWorking(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/manage/add-to-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterUsername: currentUser,
          username: user.username
        })
      });
      const data = await res.json();
      if (data.updated) {
        setLocalTeam(data.teamNumber);
        onUpdated && onUpdated();
        close && close();
      } else setErrorMsg(data.error || 'Add to team failed');
    } catch {
      setErrorMsg('Network error');
    } finally {
      setWorking(false);
    }
  }

  async function moveToTeam() {
    const parsed = Number(teamToMove);
    if (!Number.isFinite(parsed)) {
      setErrorMsg('Please enter a valid team number');
      return;
    }

    setWorking(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/manage/set-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterUsername: currentUser,
          username: user.username,
          teamNumber: parsed
        })
      });
      const data = await res.json();
      if (data.updated) {
        setLocalTeam(data.teamNumber);
        onUpdated && onUpdated();
        close && close();
      } else setErrorMsg(data.error || 'Move to team failed');
    } catch {
      setErrorMsg('Network error');
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="user-modal-overlay">
      <div className="user-modal-card">
        <button className="user-modal-close" onClick={close} title="Close">&times;</button>
        <h2 className="user-modal-title">{user.username}</h2>

        <div className="user-modal-section">
          <strong>Role:</strong> <span className="user-modal-role">{localRole}</span>
        </div>
        <div className="user-modal-section">
          <strong>Team:</strong> <span className="user-modal-team">{localTeam ?? '-'}</span>
        </div>
        <div className="user-modal-section subtle">
          <strong>Viewed by:</strong> <span className="user-modal-viewer">{currentUser} ({currentRole})</span>
        </div>

        {errorMsg && <div className="user-modal-error">{errorMsg}</div>}
        {working && <div className="user-modal-working">Processing...</div>}

        <div className="user-modal-actions">
          {canPromoteToManager && (
            <button className="user-modal-action promote" disabled={working} onClick={() => callRoleChange('manager')}>
              Promote to manager
            </button>
          )}
          {canDemoteToUser && (
            <button className="user-modal-action promote" disabled={working} onClick={() => callRoleChange('user')}>
              Demote to user
            </button>
          )}
          {canPromoteToAdmin && (
            <button className="user-modal-action promote" disabled={working} onClick={() => callRoleChange('admin')}>
              Promote to admin
            </button>
          )}
          {canDemoteAdmin && (
            <>
              <button className="user-modal-action promote" disabled={working} onClick={() => callRoleChange('manager')}>
                Admin → manager
              </button>
              <button className="user-modal-action promote" disabled={working} onClick={() => callRoleChange('user')}>
                Admin → user
              </button>
            </>
          )}
          {canSoftRemove && (
            <button className="user-modal-action remove" disabled={working} onClick={softRemove}>
              Remove from team
            </button>
          )}
          {canHardDelete && (
            <button className="user-modal-action remove" disabled={working} onClick={hardDelete}>
              Delete user
            </button>
          )}
          {canAddToTeam && (
            <button className="user-modal-action promote" disabled={working} onClick={addToTeam}>
              Add to my team
            </button>
          )}
          {canMoveToTeam && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                value={Number(teamToMove)}
                min={-1}
                onChange={(e) => setTeamToMove(e.target.valueAsNumber)}
                disabled={working}
                style={{ width: 120 }}
                placeholder="Team #"
              />
              <button className="user-modal-action promote" disabled={working} onClick={moveToTeam}>
                Move to team
              </button>
            </div>
          )}
          <button className="user-modal-action ok" onClick={close} disabled={working}>OK</button>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
