


// FIX: Use relative paths for local modules
import { EncryptedData } from '../types';

const ITERATIONS = 150000;
const ALGO_KEY = 'PBKDF2';
const ALGO_ENCRYPT = 'AES-GCM';
const HASH = 'SHA-256';

// Helper to convert ArrayBuffer to Base64
const bufferToBase64 = (buffer: ArrayBuffer): string => {
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer))));
};

// Helper to convert Base64 to ArrayBuffer
const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Derives a key from a password and salt using PBKDF2
const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const masterKey = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: ALGO_KEY },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: ALGO_KEY,
      salt: salt,
      iterations: ITERATIONS,
      hash: HASH,
    },
    masterKey,
    { name: ALGO_ENCRYPT, length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

// Encrypts text content
export const encrypt = async (content: string, password: string): Promise<string> => {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const key = await deriveKey(password, salt);
  
  const encodedContent = new TextEncoder().encode(content);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: ALGO_ENCRYPT,
      iv: iv,
    },
    key,
    encodedContent
  );

  const encryptedData: EncryptedData = {
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
    ciphertext: bufferToBase64(ciphertext),
  };
  
  return JSON.stringify(encryptedData);
};


// Decrypts an encrypted package
export const decrypt = async (encryptedPackage: string, password: string): Promise<string> => {
  try {
    const { iv: ivB64, salt: saltB64, ciphertext: ciphertextB64 }: EncryptedData = JSON.parse(encryptedPackage);
    
    const salt = base64ToBuffer(saltB64);
    const iv = base64ToBuffer(ivB64);
    const ciphertext = base64ToBuffer(ciphertextB64);

    const key = await deriveKey(password, new Uint8Array(salt));

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: ALGO_ENCRYPT,
        iv: new Uint8Array(iv),
      },
      key,
      ciphertext
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Decryption failed. Invalid password or corrupted data.");
  }
};