/**
 * E2E Encryption Module using native Web Crypto API.
 * Uses ECDH (P-256) for key agreement and AES-GCM for message encryption.
 * Uses PBKDF2 + AES-GCM for wrapping the private key to store securely on the backend.
 */

// --- Base64 Helpers ---
export const bufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

export const base64ToBuffer = (base64) => {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
};

// --- Key Management ---

/**
 * Generates an ECDH P-256 key pair.
 */
export const generateECDHKeyPair = async () => {
    return await window.crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true, // Extractable so we can export/wrap it
        ['deriveKey', 'deriveBits']
    );
};

/**
 * Exports a public key to Base64 (SPKI format).
 */
export const exportPublicKey = async (publicKey) => {
    const exported = await window.crypto.subtle.exportKey('spki', publicKey);
    return bufferToBase64(exported);
};

/**
 * Imports a Base64 SPKI public key.
 */
export const importPublicKey = async (base64Key) => {
    const buffer = base64ToBuffer(base64Key);
    return await window.crypto.subtle.importKey(
        'spki',
        buffer,
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        [] // Public keys for ECDH don't have direct key usages
    );
};

/**
 * Derives an AES-GCM 256 symmetric key using our private key and their public key.
 */
export const deriveAESKey = async (privateKey, publicKey) => {
    return await window.crypto.subtle.deriveKey(
        { name: 'ECDH', public: publicKey },
        privateKey,
        { name: 'AES-GCM', length: 256 },
        false, // Non-extractable for safety
        ['encrypt', 'decrypt']
    );
};

// --- Message Encryption ---

/**
 * Encrypts a string using an AES-GCM derived key.
 * @returns { iv: string, ciphertext: string } (Base64 encoded)
 */
export const encryptAESGCM = async (aesKey, text) => {
    const enc = new TextEncoder();
    const encoded = enc.encode(text);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        encoded
    );

    return {
        iv: bufferToBase64(iv),
        ciphertext: bufferToBase64(ciphertextBuffer)
    };
};

/**
 * Decrypts a Base64 ciphertext using the AES-GCM derived key & IV.
 */
export const decryptAESGCM = async (aesKey, ivBase64, ciphertextBase64) => {
    const iv = base64ToBuffer(ivBase64);
    const ciphertextBuffer = base64ToBuffer(ciphertextBase64);

    try {
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            aesKey,
            ciphertextBuffer
        );
        const dec = new TextDecoder();
        return dec.decode(decryptedBuffer);
    } catch (error) {
        console.error("Decryption failed:", error);
        return null; // Silent fail conceptually: we fall back to displaying ciphertext if needed
    }
};

// --- Key Wrapping (PBKDF2) ---

const getPBKDF2Key = async (password) => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );
    return keyMaterial;
};

/**
 * Wraps an ECDH private key natively securely with a user's password.
 * @returns { wrapped: string, salt: string, iv: string } (Base64 encoded)
 */
export const wrapPrivateKey = async (privateKey, password) => {
    // Export private key to PKCS8
    const exportedPrivKey = await window.crypto.subtle.exportKey('pkcs8', privateKey);

    // Prepare PBKDF2 derivation
    const keyMaterial = await getPBKDF2Key(password);
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Derive AES-GCM key to wrap the private key
    const wrappingKey = await window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
    );

    // We use standard encrypt because AES-KW is limited, AES-GCM works on any buffer
    const wrappedBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        wrappingKey,
        exportedPrivKey
    );

    return {
        wrapped: bufferToBase64(wrappedBuffer),
        salt: bufferToBase64(salt),
        iv: bufferToBase64(iv)
    };
};

/**
 * Unwraps an encrypted private key using a user's password.
 */
export const unwrapPrivateKey = async (wrappedPayload, password) => {
    const { wrapped, salt, iv } = wrappedPayload;

    const keyMaterial = await getPBKDF2Key(password);
    const saltBuffer = base64ToBuffer(salt);
    const ivBuffer = base64ToBuffer(iv);
    const wrappedBuffer = base64ToBuffer(wrapped);

    const unwrappingKey = await window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: saltBuffer,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
    );

    const unwrappedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBuffer },
        unwrappingKey,
        wrappedBuffer
    );

    return await window.crypto.subtle.importKey(
        'pkcs8',
        unwrappedBuffer,
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveKey', 'deriveBits']
    );
};
