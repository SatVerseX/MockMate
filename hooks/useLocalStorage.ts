import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for persisting state in localStorage
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
    // Get from local storage or use initial value
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Persist to localStorage whenever value changes
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    // Set value function
    const setValue = useCallback((value: T | ((prev: T) => T)) => {
        setStoredValue(prev => {
            const valueToStore = value instanceof Function ? value(prev) : value;
            return valueToStore;
        });
    }, []);

    // Remove from storage
    const removeValue = useCallback(() => {
        try {
            window.localStorage.removeItem(key);
            setStoredValue(initialValue);
        } catch (error) {
            console.warn(`Error removing localStorage key "${key}":`, error);
        }
    }, [key, initialValue]);

    return [storedValue, setValue, removeValue];
}

/**
 * Hook to sync multiple tabs with localStorage changes
 */
export function useLocalStorageSync<T>(
    key: string,
    initialValue: T
): [T, (value: T) => void] {
    const [value, setValue] = useLocalStorage(key, initialValue);

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue) {
                try {
                    setValue(JSON.parse(e.newValue));
                } catch (error) {
                    console.warn('Error parsing storage event:', error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key, setValue]);

    return [value, setValue];
}
