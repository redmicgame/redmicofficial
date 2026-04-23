import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, deleteDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';
import type { GameState } from './types';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Error signing in with Google:", error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out:", error);
    }
};

export const getUserSaves = async (userId: string) => {
    try {
        const querySnapshot = await getDocs(collection(db, 'users', userId, 'saves'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching user saves:", error);
        return [];
    }
};

export const deleteCloudSave = async (userId: string, saveId: string) => {
    try {
        await deleteDoc(doc(db, 'users', userId, 'saves', saveId));
    } catch (error) {
        console.error("Error deleting cloud save:", error);
        throw error;
    }
};

export const saveGameToCloud = async (userId: string, saveId: string, gameState: GameState) => {
    try {
        const saveRef = doc(db, 'users', userId, 'saves', saveId);
        let artistName = "Unknown";
        if (gameState.careerMode === 'solo' && gameState.soloArtist) {
            artistName = gameState.soloArtist.name;
        } else if (gameState.careerMode === 'group' && gameState.group) {
            artistName = gameState.group.name;
        }

        // Firebase Firestore does not support 'undefined' values. 
        // We stringify and parse to seamlessly strip all 'undefined' properties.
        const cleanGameState = JSON.parse(JSON.stringify(gameState));

        await setDoc(saveRef, {
            userId,
            saveId,
            gameState: cleanGameState,
            artistName,
            year: gameState.date.year,
            week: gameState.date.week,
            updatedAt: serverTimestamp()
        });
        return saveId;
    } catch (error) {
        console.error("Error saving game to cloud:", error);
        throw error;
    }
};

// Also keep a legacy loader in case they have an old /saves/userId doc they try to load later
export const loadLegacyGameFromCloud = async (userId: string): Promise<GameState | null> => {
    try {
        const _doc = await getDoc(doc(db, 'saves', userId));
        if (_doc.exists()) {
            return _doc.data().gameState as GameState;
        }
        return null;
    } catch (error) {
        console.error("Error loading legacy game from cloud:", error);
        return null;
    }
};
