import { createClient } from '@insforge/sdk';

const baseUrl = import.meta.env.VITE_INSFORGE_BASE_URL;
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY;

if (!baseUrl || !anonKey) {
    console.warn('InsForge configuration missing. Please check your .env file.');
}

export const insforge = createClient({
    baseUrl,
    anonKey,
});

// Helper for auth
export const auth = insforge.auth;

// Helper for database
export const db = insforge.database;

// Helper for storage
export const storage = insforge.storage;

// Helper for AI
export const ai = insforge.ai;
