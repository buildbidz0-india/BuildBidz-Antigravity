
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { offlineQueue, QueuedAction } from '@/lib/offline-queue';
import { transcribeApi, extractApi } from '@/lib/api';

interface SyncContextType {
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
    manualSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    // Initial load & Network Listener
    useEffect(() => {
        refreshQueueCount();

        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            const online = state.isConnected && state.isInternetReachable;
            setIsOnline(!!online);
            if (online) {
                processQueue();
            }
        });

        return () => unsubscribe();
    }, []);

    const refreshQueueCount = async () => {
        const queue = await offlineQueue.getQueue();
        setPendingCount(queue.length);
    };

    const processQueue = async () => {
        if (isSyncing) return;
        setIsSyncing(true);

        try {
            const queue = await offlineQueue.getQueue();
            if (queue.length === 0) {
                setIsSyncing(false);
                return;
            }

            console.log(`Syncing ${queue.length} items...`);

            for (const item of queue) {
                if (item.status === 'SYNCING') continue; // Skip if already processing (?)

                await offlineQueue.updateStatus(item.id, 'SYNCING');

                try {
                    // Logic to process different action types
                    if (item.type === 'EXTRACT') {
                        // Mocking re-running the extraction. In reality we might not re-run 
                        // expensive OCR if we already had the text, but here we just pass it through
                        // or maybe we upload the image again?
                        // For this roadmap demo, we assume the payload contains the OCR text ready to send
                        await extractApi.extract(item.payload.ocr_text);
                    } else if (item.type === 'TRANSCRIBE') {
                        await transcribeApi.transcribe(item.payload.audio_uri);
                    }

                    // Success
                    await offlineQueue.remove(item.id);
                } catch (error) {
                    console.error("Sync failed for item", item.id, error);
                    await offlineQueue.updateStatus(item.id, 'FAILED');
                }
            }
        } catch (err) {
            console.error("Queue processing error", err);
        } finally {
            await refreshQueueCount();
            setIsSyncing(false);
        }
    };

    return (
        <SyncContext.Provider value={{
            isOnline,
            isSyncing,
            pendingCount,
            manualSync: processQueue
        }}>
            {children}
        </SyncContext.Provider>
    );
}

export function useSync() {
    const context = useContext(SyncContext);
    if (context === undefined) {
        throw new Error('useSync must be used within a SyncProvider');
    }
    return context;
}
