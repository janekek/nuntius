// --- Base64 Hilfsfunktionen ---
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!); // TODO !
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// --- hybride encryption ---
export async function encryptHybrid(
  messageText: string,
  participantKeys: { username: string; public_key: string }[],
) {
  // Generiere einmaligen AES-GCM Key (Session Key)
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // muss exportierbar sein
    ["encrypt", "decrypt"],
  );

  // Verschlüsselung der eigentlichen Nachricht mit AES
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // iv... Initialization Vector
  const encryptedContentBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    encoder.encode(messageText),
  );

  // Exportieren des AES Key
  const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

  // Verschlüsselung den AES Key für jeden Teilnehmer mit dessen RSA Public Key
  const keysPayload = await Promise.all(
    participantKeys.map(async (participant) => {
      const publicKeyJwk = JSON.parse(participant.public_key);
      const rsaPubKey = await window.crypto.subtle.importKey(
        "jwk",
        publicKeyJwk,
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["encrypt"],
      );

      // Den exportierten AES Key mit dem RSA Key verschlüsseln
      const encryptedSymKeyBuffer = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        rsaPubKey,
        exportedAesKey,
      );

      return {
        username: participant.username,
        encryptedKey: arrayBufferToBase64(encryptedSymKeyBuffer),
      };
    }),
  );

  return {
    encryptedContent: arrayBufferToBase64(encryptedContentBuffer),
    iv: arrayBufferToBase64(iv.buffer),
    keys: keysPayload,
  };
}

// --- hybride entschlüsselung (Empfangen) ---
export async function decryptHybrid(
  encryptedContentBase64: string,
  ivBase64: string,
  encryptedSymKeyBase64: string,
  privateKeyJwk: any,
) {
  const privateKey = await window.crypto.subtle.importKey(
    "jwk",
    privateKeyJwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"],
  );

  const encryptedSymKeyBuffer = base64ToArrayBuffer(encryptedSymKeyBase64);
  const rawAesKey = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedSymKeyBuffer,
  );

  const aesKey = await window.crypto.subtle.importKey(
    "raw",
    rawAesKey,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );

  const encryptedContentBuffer = base64ToArrayBuffer(encryptedContentBase64);
  const ivBuffer = base64ToArrayBuffer(ivBase64);
  const decryptedContentBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(ivBuffer) },
    aesKey,
    encryptedContentBuffer,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedContentBuffer);
}

export async function generateKeyPairFromPassword(
  password: string,
  salt: string,
) {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // exportierbar
    ["encrypt", "decrypt"],
  );

  const publicKeyJwk = await window.crypto.subtle.exportKey(
    "jwk",
    keyPair.publicKey,
  );
  const privateKeyJwk = await window.crypto.subtle.exportKey(
    "jwk",
    keyPair.privateKey,
  );

  return { publicKey: publicKeyJwk, privateKey: privateKeyJwk };
}

export async function deriveKeyFromPassword(password: string, salt: string) {
  const encoder = new TextEncoder();

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  );

  // Mit PBKDF2 (100.000 Iterationen) einen starken AES-Key ableiten
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt), // salt mit username
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function reWrapSessionKeysForNewUser(
  messages: any[],
  myUsername: string,
  myPrivateKeyJwk: any,
  newUserPublicKeyString: string,
) {
  const newUserKeyJwk = JSON.parse(newUserPublicKeyString);
  const newUserRsaPubKey = await window.crypto.subtle.importKey(
    "jwk",
    newUserKeyJwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );
  const myPrivateKey = await window.crypto.subtle.importKey(
    "jwk",
    myPrivateKeyJwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"],
  );

  const newKeysPayload = [];

  for (const msg of messages) {
    const myKeyObj = msg.keys?.find((k: any) => k.username === myUsername);
    if (!myKeyObj) continue;

    try {
      const encryptedSymKeyBuffer = base64ToArrayBuffer(myKeyObj.encryptedKey);
      const rawAesKey = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        myPrivateKey,
        encryptedSymKeyBuffer,
      );

      const newlyEncryptedSymKeyBuffer = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        newUserRsaPubKey,
        rawAesKey,
      );

      newKeysPayload.push({
        message_id: msg.id,
        encrypted_sym_key: arrayBufferToBase64(newlyEncryptedSymKeyBuffer),
      });
    } catch (e) {
      console.error("Fehler beim Umverpacken von Nachricht", msg.id, e);
    }
  }
  return newKeysPayload;
}
