import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
    open: boolean;
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    showNote?: boolean;
    noteLabel?: string;
    notePlaceholder?: string;
    onCancel: () => void;
    onConfirm: (note?: string) => void;
};

const ConfirmModal: React.FC<Props> = ({
    open,
    title,
    message,
    confirmLabel,
    cancelLabel,
    showNote = false,
    noteLabel,
    notePlaceholder,
    onCancel,
    onConfirm,
}) => {
    const { t } = useTranslation();
    const [note, setNote] = useState('');

    useEffect(() => {
        if (open) setNote('');
    }, [open]);

    if (!open) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 4000
            }}
            onClick={onCancel}
        >
            <div
                style={{
                    width: 520,
                    maxWidth: '96%',
                    background: 'var(--bg-card)',
                    borderRadius: 12,
                    padding: 20,
                    border: '1px solid var(--border)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)' }}>
                    {title}
                </h3>
                {message && (
                    <p style={{ margin: '10px 0 0 0', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem' }}>
                        {message}
                    </p>
                )}

                {showNote && (
                    <div style={{ marginTop: 12 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 800, display: 'block', marginBottom: 6, color: 'var(--text-main)' }}>
                            {noteLabel || t('admin.decision.reason_label', 'Note')}
                        </label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            rows={3}
                            placeholder={notePlaceholder || t('admin.decision.optional_note', 'Optional note for the audit log / organizer.')}
                            style={{
                                width: '100%',
                                padding: 10,
                                borderRadius: 8,
                                background: 'var(--bg-main)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-main)'
                            }}
                        />
                    </div>
                )}

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '10px 14px',
                            borderRadius: 8,
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-main)',
                            fontWeight: 800,
                            cursor: 'pointer'
                        }}
                    >
                        {cancelLabel || t('admin.decision.cancel', 'Cancel')}
                    </button>
                    <button
                        onClick={() => onConfirm(showNote ? note.trim() : undefined)}
                        style={{
                            padding: '10px 14px',
                            borderRadius: 8,
                            background: 'var(--bg-active)',
                            border: 'none',
                            color: 'white',
                            fontWeight: 900,
                            cursor: 'pointer'
                        }}
                    >
                        {confirmLabel || t('admin.decision.confirm', 'Confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
