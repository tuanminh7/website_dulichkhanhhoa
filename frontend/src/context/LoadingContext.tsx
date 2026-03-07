import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface LoadingContextType {
    isLoading: boolean;
    showLoading: () => void;
    hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// External trigger for non-react files (like api.ts)
let loadingCount = 0;
let externalSetLoading: ((loading: boolean) => void) | null = null;

export const triggerLoading = (show: boolean) => {
    if (show) {
        loadingCount++;
    } else {
        loadingCount = Math.max(0, loadingCount - 1);
    }

    if (externalSetLoading) {
        externalSetLoading(loadingCount > 0);
    }
};

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);

    // Register the internal setter to the external trigger
    externalSetLoading = setIsLoading;

    const showLoading = useCallback(() => triggerLoading(true), []);
    const hideLoading = useCallback(() => triggerLoading(false), []);

    return (
        <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
};
