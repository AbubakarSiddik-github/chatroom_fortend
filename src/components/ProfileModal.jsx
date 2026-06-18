import { useState, useRef } from 'react';
import UploadService from '../services/uploadService';
import '../styles/ProfileModal.css';

const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
  </svg>
);

export default function ProfileModal({ user, onClose, onSaved, showToast }) {
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const avatarInputRef = useRef(null);

  const initial = (user?.username || '?')[0].toUpperCase();

  // ── Upload avatar ─────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await UploadService.uploadAvatar(file);
      setAvatarUrl(res.data.avatarUrl);
      showToast('Profile photo updated!', 'success');
      // Refresh user data from server
      const me = await UploadService.getMe();
      onSaved?.(me.data);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to upload avatar.');
    } finally {
      setUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // ── Delete avatar ─────────────────────────────────────────
  const handleDeleteAvatar = async () => {
    if (!avatarUrl) return;
    setUploading(true);
    try {
      await UploadService.deleteAvatar();
      setAvatarUrl('');
      showToast('Profile photo removed.', 'success');
      const me = await UploadService.getMe();
      onSaved?.(me.data);
    } catch (err) {
      showToast('Failed to remove avatar.');
    } finally {
      setUploading(false);
    }
  };

  // ── Save bio ──────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await UploadService.updateProfile({ bio });
      const me = await UploadService.getMe();
      onSaved?.(me.data);
      showToast('Profile saved!', 'success');
      onClose();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="profile-modal">
        <div className="profile-modal-header">
          <h2>Edit Profile</h2>
          <button className="icon-btn sm" onClick={onClose} aria-label="Close"><CloseIcon /></button>
        </div>

        {/* Avatar section */}
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrap">
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" className="profile-avatar-img" />
              : <div className="profile-avatar-placeholder">{initial}</div>
            }
            {uploading && <div className="avatar-uploading-overlay"><div className="spinner" /></div>}
          </div>

          <div className="profile-avatar-actions">
            <button
              className="btn btn-outline"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploading}
            >
              <CameraIcon /> {avatarUrl ? 'Change Photo' : 'Upload Photo'}
            </button>
            {avatarUrl && (
              <button
                className="btn btn-danger-outline"
                onClick={handleDeleteAvatar}
                disabled={uploading}
              >
                <TrashIcon /> Remove
              </button>
            )}
          </div>
          <input
            type="file"
            ref={avatarInputRef}
            accept="image/jpeg,image/png,image/gif,image/webp"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
        </div>

        {/* User info */}
        <div className="profile-info-section">
          <div className="profile-field">
            <label>Username</label>
            <div className="profile-username">{user?.username}</div>
          </div>
          <div className="profile-field">
            <label>Email</label>
            <div className="profile-email">{user?.email}</div>
          </div>
          <div className="profile-field">
            <label htmlFor="profile-bio">Bio</label>
            <textarea
              id="profile-bio"
              className="profile-bio-input"
              placeholder="Tell everyone a little about yourself…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
            />
            <span className="profile-bio-count">{bio.length}/200</span>
          </div>
        </div>

        {/* Actions */}
        <div className="profile-modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
