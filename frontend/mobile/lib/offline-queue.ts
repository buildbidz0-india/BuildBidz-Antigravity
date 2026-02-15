
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QueuedAction {
    id: string;
    type: 'TRANSCRIBE' | 'EXTRACT' | 'API_CALL';
    payload: any;
    timestamp: number;
    status: 'PENDING' | 'SYNCING' | 'FAILED';
    retryCount: number;
}

const QUEUE_KEY = 'offline_action_queue';

export const offlineQueue = {
    async enqueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'status' | 'retryCount'>) {
        const queue = await this.getQueue();
        const newAction: QueuedAction = {
            ...action,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            status: 'PENDING',
            retryCount: 0,
        };
        queue.push(newAction);
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        return newAction;
    },

    async getQueue(): Promise<QueuedAction[]> {
        const json = await AsyncStorage.getItem(QUEUE_KEY);
        return json ? JSON.parse(json) : [];
    },

    async updateStatus(id: string, status: QueuedAction['status']) {
        const queue = await this.getQueue();
        const updated = queue.map(item =>
            item.id === id ? { ...item, status } : item
        );
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
    },

    async remove(id: string) {
        const queue = await this.getQueue();
        const updated = queue.filter(item => item.id !== id);
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
    },

    async clear() {
        await AsyncStorage.removeItem(QUEUE_KEY);
    }
};
