import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: () => void;
    description?: string;
}

/**
 * Custom hook for handling keyboard shortcuts
 */
export function useKeyboardShortcuts(
    shortcuts: KeyboardShortcut[],
    enabled: boolean = true
) {
    const shortcutsRef = useRef(shortcuts);
    shortcutsRef.current = shortcuts;

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in inputs
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement ||
                (event.target as HTMLElement)?.isContentEditable
            ) {
                return;
            }

            for (const shortcut of shortcutsRef.current) {
                const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
                const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey;
                const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
                const altMatch = shortcut.alt ? event.altKey : !event.altKey;

                if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                    event.preventDefault();
                    shortcut.action();
                    break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enabled]);
}

/**
 * Common interview shortcuts
 */
export function useInterviewShortcuts({
    onToggleMic,
    onToggleCamera,
    onToggleTranscript,
    onEndSession,
    enabled = true,
}: {
    onToggleMic?: () => void;
    onToggleCamera?: () => void;
    onToggleTranscript?: () => void;
    onEndSession?: () => void;
    enabled?: boolean;
}) {
    const shortcuts: KeyboardShortcut[] = [];

    if (onToggleMic) {
        shortcuts.push({
            key: 'm',
            action: onToggleMic,
            description: 'Toggle microphone',
        });
    }

    if (onToggleCamera) {
        shortcuts.push({
            key: 'v',
            action: onToggleCamera,
            description: 'Toggle camera',
        });
    }

    if (onToggleTranscript) {
        shortcuts.push({
            key: 't',
            action: onToggleTranscript,
            description: 'Toggle transcript',
        });
    }

    if (onEndSession) {
        shortcuts.push({
            key: 'Escape',
            action: onEndSession,
            description: 'End session',
        });
    }

    useKeyboardShortcuts(shortcuts, enabled);
}

/**
 * Hook to detect keyboard shortcut hints
 */
export function useShortcutHint(key: string): string {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
    const modifierKey = isMac ? '⌘' : 'Ctrl';
    return `${modifierKey}+${key.toUpperCase()}`;
}
