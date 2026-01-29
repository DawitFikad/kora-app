import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'danger';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog = ({
    open,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    onConfirm,
    onCancel
}: ConfirmDialogProps) => {
    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.55)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 9998
                        }}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 240 }}
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '100%',
                            maxWidth: '420px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '20px',
                            padding: '24px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
                            zIndex: 9999
                        }}
                    >
                        <button
                            onClick={onCancel}
                            style={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={18} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: variant === 'danger' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                color: variant === 'danger' ? '#EF4444' : '#F59E0B'
                            }}>
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{title}</h3>
                                {description && (
                                    <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        {description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button
                                onClick={onCancel}
                                style={{
                                    padding: '10px 16px',
                                    background: 'transparent',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-main)',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                className="btn-blue"
                                style={{
                                    padding: '10px 18px',
                                    background: variant === 'danger' ? '#EF4444' : 'var(--bg-active)',
                                    border: 'none',
                                    color: 'white',
                                    borderRadius: '10px',
                                    fontWeight: 800,
                                    cursor: 'pointer'
                                }}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
