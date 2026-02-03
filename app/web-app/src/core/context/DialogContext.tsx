import React, { createContext, useContext, useMemo, useState } from 'react';

type AlertOptions = {
    title?: string;
    message: string;
    okText?: string;
};

type ConfirmOptions = {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'danger';
    note?: {
        label?: string;
        placeholder?: string;
    };
};

type DialogContextValue = {
    alert: (options: AlertOptions) => Promise<void>;
    confirm: (options: ConfirmOptions) => Promise<{ confirmed: boolean; note?: string }>;
};

type InternalDialogState =
    | null
    | {
        kind: 'alert';
        options: AlertOptions;
        resolve: () => void;
    }
    | {
        kind: 'confirm';
        options: ConfirmOptions;
        resolve: (result: { confirmed: boolean; note?: string }) => void;
    };

const DialogContext = createContext<DialogContextValue | null>(null);

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<InternalDialogState>(null);
    const [note, setNote] = useState('');

    const value = useMemo<DialogContextValue>(() => ({
        alert: (options: AlertOptions) => {
            return new Promise<void>((resolve) => {
                setNote('');
                setState({ kind: 'alert', options, resolve });
            });
        },
        confirm: (options: ConfirmOptions) => {
            return new Promise<{ confirmed: boolean; note?: string }>((resolve) => {
                setNote('');
                setState({ kind: 'confirm', options, resolve });
            });
        }
    }), []);

    const close = () => {
        setState(null);
        setNote('');
    };

    const renderModal = () => {
        if (!state) return null;

        const baseBackdrop: React.CSSProperties = {
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5000
        };

        const baseCard: React.CSSProperties = {
            width: 520,
            maxWidth: '96%',
            background: 'var(--bg-card)',
            borderRadius: 12,
            padding: 20,
            border: '1px solid var(--border)'
        };

        if (state.kind === 'alert') {
            const { title = 'Notice', message, okText = 'OK' } = state.options;
            return (
                <div style={baseBackdrop} onClick={() => { state.resolve(); close(); }}>
                    <div style={baseCard} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)' }}>{title}</h3>
                        <p style={{ margin: '10px 0 0 0', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem' }}>{message}</p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                            <button
                                onClick={() => { state.resolve(); close(); }}
                                style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-active)', border: 'none', color: 'white', fontWeight: 900, cursor: 'pointer' }}
                            >
                                {okText}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        const { title = 'Confirm', message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'default' } = state.options;

        return (
            <div style={baseBackdrop} onClick={() => { state.resolve({ confirmed: false }); close(); }}>
                <div style={baseCard} onClick={(e) => e.stopPropagation()}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)' }}>{title}</h3>
                    <p style={{ margin: '10px 0 0 0', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem' }}>{message}</p>

                    {state.options.note && (
                        <div style={{ marginTop: 12 }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 800, display: 'block', marginBottom: 6, color: 'var(--text-main)' }}>
                                {state.options.note.label || 'Note (optional)'}
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={3}
                                placeholder={state.options.note.placeholder || 'Optional note for audit log / requester.'}
                                style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                        <button
                            onClick={() => { state.resolve({ confirmed: false }); close(); }}
                            style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', fontWeight: 800, cursor: 'pointer' }}
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => { state.resolve({ confirmed: true, note: state.options.note ? note.trim() : undefined }); close(); }}
                            style={{
                                padding: '10px 14px',
                                borderRadius: 8,
                                background: variant === 'danger' ? '#EF4444' : 'var(--bg-active)',
                                border: 'none',
                                color: 'white',
                                fontWeight: 900,
                                cursor: 'pointer'
                            }}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <DialogContext.Provider value={value}>
            {children}
            {renderModal()}
        </DialogContext.Provider>
    );
};

export const useDialog = () => {
    const ctx = useContext(DialogContext);
    if (!ctx) {
        throw new Error('useDialog must be used within DialogProvider');
    }
    return ctx;
};
