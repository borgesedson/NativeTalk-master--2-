import { create } from 'zustand';
import {
    generateECDHKeyPair, exportPublicKey, unwrapPrivateKey, wrapPrivateKey,
    deriveAESKey, encryptAESGCM, decryptAESGCM, importPublicKey
} from '../lib/crypto';
import { getPublicKey } from '../lib/api';

// --- IndexedDB Helper ---
const DB_NAME = 'nativetalk_e2e';
const STORE_NAME = 'keys';

const getDB = () => new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
});

export const savePrivateKeyLocally = async (userId, cryptoKey) => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const req = tx.objectStore(STORE_NAME).put(cryptoKey, `privateKey_${userId}`);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
};

export const getPrivateKeyLocally = async (userId) => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(`privateKey_${userId}`);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
            // It's normal if it doesn't exist yet
            resolve(null);
        };
    });
};

// --- Zustand Store ---

const useE2EStore = create((set, get) => ({
    privateKey: null,
    isInitialized: false,
    publicKeyCache: {}, // { [userId]: CryptoKey }

    setPrivateKey: (key) => set({ privateKey: key, isInitialized: !!key }),

    cachePublicKey: (userId, key) => set((state) => ({
        publicKeyCache: { ...state.publicKeyCache, [userId]: key }
    }))
}));

// --- React Hook ---

export function useE2E() {
    const { privateKey, isInitialized, publicKeyCache, setPrivateKey, cachePublicKey } = useE2EStore();

    /**
     * Generates a new key pair on signup, saves the private key locally
     * and returns the wrapped private key payload & public key string to send to backend.
     */
    const initializeE2EFromSignup = async (userId, masterPassword) => {
        try {
            const { publicKey, privateKey } = await generateECDHKeyPair();

            // Save locally (plain CryptoKey)
            await savePrivateKeyLocally(userId, privateKey);
            setPrivateKey(privateKey);

            // Export and Wrap for backend
            const pubKeyBase64 = await exportPublicKey(publicKey);
            const wrappedPayload = await wrapPrivateKey(privateKey, masterPassword);

            return {
                publicKey: pubKeyBase64,
                encryptedPrivateKey: JSON.stringify(wrappedPayload)
            };
        } catch (error) {
            console.error("Failed to initialize E2E on signup", error);
            throw error;
        }
    };

    /**
     * Upon login, checks local storage. If not found, uses the payload from backend
     * to unwrapped it using the master password and save it locally.
     */
    const initializeE2EFromLogin = async (userId, masterPassword, encryptedPrivateKeyString) => {
        try {
            // Try local first
            const localKey = await getPrivateKeyLocally(userId);
            if (localKey) {
                setPrivateKey(localKey);
                return true;
            }

            // Not found locally. Use backend payload
            if (!encryptedPrivateKeyString) return false;

            const payload = JSON.parse(encryptedPrivateKeyString);
            const unwrappedKey = await unwrapPrivateKey(payload, masterPassword);

            await savePrivateKeyLocally(userId, unwrappedKey);
            setPrivateKey(unwrappedKey);
            return true;
        } catch (error) {
            console.error("Failed to initialize E2E on login", error);
            return false; // Wrong password or corrupted data
        }
    };

    /**
     * Cleans up keys locally if user explicitly logs out completely / flushes data.
     */
    const clearE2E = () => setPrivateKey(null);

    /**
     * Helper to ensure we have a partner's public key
     */
    const getPartnerPublicKey = async (partnerId) => {
        if (publicKeyCache[partnerId]) return publicKeyCache[partnerId];

        try {
            // Fetch from your user endpoint
            const publicKeyStr = await getPublicKey(partnerId);
            if (publicKeyStr) {
                const key = await importPublicKey(publicKeyStr);
                cachePublicKey(partnerId, key);
                return key;
            }
            return null;
        } catch (error) {
            console.error("Failed to fetch public key for", partnerId, error);
            return null;
        }
    };

    /**
     * Encrypts a message using our private key and their public key.
     */
    const encryptMessageForUser = async (recipientId, text) => {
        if (!privateKey) throw new Error("E2E not initialized locally");
        const pubKey = await getPartnerPublicKey(recipientId);
        if (!pubKey) throw new Error("Recipient public key not found");

        const aesKey = await deriveAESKey(privateKey, pubKey);
        const { iv, ciphertext } = await encryptAESGCM(aesKey, text);

        // Custom container to parse later
        return JSON.stringify({ e2e: true, iv, ciphertext });
    };

    /**
     * Decrypts a message using our private key and the sender's public key.
     */
    const decryptIncomingMessage = async (senderId, encryptedPayload) => {
        if (!privateKey) return null; // Can't decrypt yet

        try {
            const payload = JSON.parse(encryptedPayload);
            if (!payload.e2e) return encryptedPayload; // Not E2E encrypted

            const pubKey = await getPartnerPublicKey(senderId);
            if (!pubKey) return "(Encrypted)";

            const aesKey = await deriveAESKey(privateKey, pubKey);
            const plaintext = await decryptAESGCM(aesKey, payload.iv, payload.ciphertext);

            return plaintext || "(Decryption Failed)";
        } catch (error) {
            // Either invalid format or not meant to be decrypted
            return encryptedPayload;
        }
    };

    return {
        isInitialized,
        initializeE2EFromSignup,
        initializeE2EFromLogin,
        clearE2E,
        encryptMessageForUser,
        decryptIncomingMessage
    };
}
