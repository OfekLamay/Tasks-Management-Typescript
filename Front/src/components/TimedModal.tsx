import { useEffect } from 'react';

interface TimedModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  durationMs?: number;
}

const TimedModal: React.FC<TimedModalProps> = ({ open, onClose, title = 'Notice', message, durationMs = 10000 }) => {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, durationMs);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, durationMs]);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-card">
        <h3 id="modal-title" style={{ marginTop: 0 }}>{title}</h3>
        <p style={{ marginBottom: 16 }}>{message}</p>
        <div className="modal-actions">
          <button className="clickbtn" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
};

export default TimedModal;