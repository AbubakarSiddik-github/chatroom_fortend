import { useState, useRef, useEffect } from 'react';
import UploadService from '../services/uploadService';
import '../styles/MessageInput.css';

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

const AttachIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

export default function MessageInput({ onSend, onTyping, disabled }) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const typingRef = useRef(false);
  const debounceRef = useRef(null);
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const attachMenuRef = useRef(null);

  // Close attach menu on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (uploading) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    
    // Send standard text message
    onSend(trimmed, 'TEXT');
    setText('');
    
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    if (typingRef.current) {
      typingRef.current = false;
      onTyping?.(false);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }

    if (val.trim().length > 0) {
      if (!typingRef.current) { typingRef.current = true; onTyping?.(true); }
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => { typingRef.current = false; onTyping?.(false); }, 2000);
    } else {
      if (typingRef.current) { typingRef.current = false; onTyping?.(false); clearTimeout(debounceRef.current); }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // ── Upload Handlers ─────────────────────────────────────
  const handleUpload = async (file, type) => {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    setShowAttachMenu(false);
    
    try {
      const res = type === 'IMAGE' 
        ? await UploadService.uploadImage(file)
        : await UploadService.uploadFile(file);
      
      const { url, publicId, originalFilename, contentType, size } = res.data;
      
      onSend(url, type, {
        fileName: originalFilename,
        fileSize: size,
        fileType: contentType,
        publicId: publicId
      });
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed');
      setTimeout(() => setUploadError(''), 4000);
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  return (
    <div style={{ position: 'relative', width: '100%', flexShrink: 0 }}>
      {uploadError && (
        <div style={{ position: 'absolute', top: '-30px', left: '1rem', color: 'var(--danger)', fontSize: '.8rem', background: 'var(--danger-bg)', padding: '4px 8px', borderRadius: '4px' }}>
          {uploadError}
        </div>
      )}
      
      {/* Attach Menu */}
      {showAttachMenu && (
        <div ref={attachMenuRef} className="attach-menu">
          <button type="button" onClick={() => imageInputRef.current?.click()}>📷 Image</button>
          <button type="button" onClick={() => fileInputRef.current?.click()}>📄 Document</button>
        </div>
      )}
      
      {/* Hidden inputs */}
      <input 
        type="file" 
        ref={imageInputRef} 
        style={{ display: 'none' }} 
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={(e) => handleUpload(e.target.files[0], 'IMAGE')}
      />
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept=".pdf,.doc,.docx,.txt,.zip"
        onChange={(e) => handleUpload(e.target.files[0], 'FILE')}
      />

      <form id="message-input-form" onSubmit={handleSubmit}>
        <button
          type="button"
          id="attach-btn"
          className="icon-btn"
          disabled={disabled || uploading}
          onClick={() => setShowAttachMenu(!showAttachMenu)}
          aria-label="Attach file"
        >
          <AttachIcon />
        </button>

        <textarea
          ref={textareaRef}
          id="message-input"
          rows={1}
          placeholder={disabled ? 'Select a chat to start messaging…' : (uploading ? 'Uploading...' : 'Type a message…')}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || uploading}
        />
        
        <button
          id="send-btn"
          type="submit"
          disabled={disabled || uploading || !text.trim()}
          aria-label="Send message"
        >
          {uploading ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> : <SendIcon />}
        </button>
      </form>
    </div>
  );
}
