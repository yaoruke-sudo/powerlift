/**
 * 本地数据库服务 —— 使用 IndexedDB 替代后端存储
 */
import { WorkoutSession, UserPhoto, UserStats, UserProfile } from '../types';


const DB_NAME = 'PowerLiftDB';
const DB_VERSION = 1;

// Store Names
const STORES = {
    USERS: 'users',
    WORKOUTS: 'workouts',
    PHOTOS: 'photos',
};

// Singleton Promise to ensure DB is open
let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Users Store
                if (!db.objectStoreNames.contains(STORES.USERS)) {
                    db.createObjectStore(STORES.USERS, { keyPath: 'id' });
                }

                // Workouts Store
                if (!db.objectStoreNames.contains(STORES.WORKOUTS)) {
                    const store = db.createObjectStore(STORES.WORKOUTS, { keyPath: 'id' });
                    store.createIndex('date', 'date', { unique: false });
                    store.createIndex('user_id', 'user_id', { unique: false }); // Although we only have one user mostly
                }

                // Photos Store
                if (!db.objectStoreNames.contains(STORES.PHOTOS)) {
                    const store = db.createObjectStore(STORES.PHOTOS, { keyPath: 'id' });
                    store.createIndex('user_id', 'user_id', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                resolve((event.target as IDBOpenDBRequest).result);
            };

            request.onerror = (event) => {
                reject((event.target as IDBOpenDBRequest).error);
            };
        });
    }
    return dbPromise;
}

// Helper for transaction
async function withStore(
    storeName: string,
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest | void
): Promise<any> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);

        let request: IDBRequest | void;
        try {
            request = callback(store);
        } catch (e) {
            reject(e);
            return;
        }

        if (request) {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        } else {
            transaction.oncomplete = () => resolve(undefined);
            transaction.onerror = () => reject(transaction.error);
        }
    });
}

// Generates a simple UUID
export function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ===== User Services =====

export async function dbGetUser(userId: string): Promise<UserProfile | undefined> {
    return withStore(STORES.USERS, 'readonly', store => store.get(userId));
}

export async function dbSaveUser(user: UserProfile): Promise<UserProfile> {
    await withStore(STORES.USERS, 'readwrite', store => store.put(user));
    return user;
}

// ===== Workout Services =====

export async function dbGetWorkouts(userId: string): Promise<WorkoutSession[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.WORKOUTS, 'readonly');
        const store = transaction.objectStore(STORES.WORKOUTS);
        const index = store.index('user_id');
        const request = index.getAll(IDBKeyRange.only(userId));

        request.onsuccess = () => {
            // Sort by date desc (newest first)
            const workouts = request.result as WorkoutSession[];
            workouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            resolve(workouts);
        };
        request.onerror = () => reject(request.error);
    });
}

export async function dbGetWorkout(id: string): Promise<WorkoutSession | undefined> {
    return withStore(STORES.WORKOUTS, 'readonly', store => store.get(id));
}

export async function dbSaveWorkout(workout: WorkoutSession & { user_id: string }): Promise<WorkoutSession> {
    await withStore(STORES.WORKOUTS, 'readwrite', store => store.put(workout));
    // Remove user_id from return to match WorkoutSession type if needed, but it's okay to keep it
    return workout;
}

export async function dbDeleteWorkout(id: string): Promise<void> {
    return withStore(STORES.WORKOUTS, 'readwrite', store => store.delete(id));
}

// Special case: Update a set inside a workout
export async function dbUpdateSet(setId: string, data: { weight?: number; reps?: number; is_pr?: boolean }): Promise<void> {
    // We need to find which workout contains this set
    // This is inefficient but functional for local "personal" data scale
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.WORKOUTS, 'readwrite');
        const store = transaction.objectStore(STORES.WORKOUTS);
        const request = store.openCursor();

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
            if (cursor) {
                const workout = cursor.value as WorkoutSession;
                let setFound = false;

                for (const exercise of workout.exercises) {
                    const setIndex = exercise.sets.findIndex(s => s.id === setId);
                    if (setIndex !== -1) {
                        // Found it
                        const s = exercise.sets[setIndex];
                        exercise.sets[setIndex] = {
                            ...s,
                            weight: data.weight !== undefined ? data.weight : s.weight,
                            reps: data.reps !== undefined ? data.reps : s.reps,
                            isPR: data.is_pr !== undefined ? data.is_pr : s.isPR
                        };
                        setFound = true;
                        break;
                    }
                }

                if (setFound) {
                    cursor.update(workout);
                    resolve(); // Done
                } else {
                    cursor.continue();
                }
            } else {
                // End of cursor, not found
                resolve(); // Or reject if strict
            }
        };
        request.onerror = () => reject(request.error);
    });
}

// Delete a single set inside a workout (and cleanup empty exercises/sessions)
export async function dbDeleteSet(setId: string): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.WORKOUTS, 'readwrite');
        const store = transaction.objectStore(STORES.WORKOUTS);
        const request = store.openCursor();

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
            if (cursor) {
                const workout = cursor.value as WorkoutSession;
                let changed = false;

                // 先在每个动作里尝试删除这条 set
                for (const exercise of workout.exercises) {
                    const index = exercise.sets.findIndex(s => s.id === setId);
                    if (index !== -1) {
                        exercise.sets.splice(index, 1);
                        changed = true;
                    }
                }

                if (changed) {
                    // 清理没有任何组的动作
                    workout.exercises = workout.exercises.filter(ex => ex.sets.length > 0);

                    if (workout.exercises.length === 0) {
                        // 如果整个训练没有任何动作了，直接删除整个 workout
                        cursor.delete();
                    } else {
                        cursor.update(workout);
                    }
                    resolve();
                } else {
                    cursor.continue();
                }
            } else {
                // 未找到，直接结束
                resolve();
            }
        };
        request.onerror = () => reject(request.error);
    });
}

// ===== Photo Services =====

export async function dbGetPhotos(userId: string): Promise<UserPhoto[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.PHOTOS, 'readonly');
        const store = transaction.objectStore(STORES.PHOTOS);
        const index = store.index('user_id');
        const request = index.getAll(IDBKeyRange.only(userId));

        request.onsuccess = () => {
            // Sort by date desc
            const photos = request.result as UserPhoto[];
            photos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            resolve(photos);
        };
        request.onerror = () => reject(request.error);
    });
}

export async function dbSavePhoto(photo: UserPhoto & { user_id: string }): Promise<UserPhoto> {
    await withStore(STORES.PHOTOS, 'readwrite', store => store.put(photo));
    return photo;
}

export async function dbDeletePhoto(id: string): Promise<void> {
    return withStore(STORES.PHOTOS, 'readwrite', store => store.delete(id));
}
