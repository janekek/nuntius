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

// --- HYBRID VERSCHLÜSSELUNG (Senden) ---
export async function encryptHybrid(
  messageText: string,
  participantKeys: { username: string; public_key: string }[],
) {
  // 1. Generiere einen einmaligen AES-GCM Key (Session Key)
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // muss exportierbar sein, damit wir ihn mit RSA verschlüsseln können
    ["encrypt", "decrypt"],
  );

  // 2. Verschlüssele die eigentliche Nachricht mit AES
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Initialization Vector
  const encryptedContentBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    encoder.encode(messageText),
  );

  // 3. Exportiere den AES Key, um ihn einpacken zu können
  const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

  // 4. Verschlüssele den AES Key für jeden Teilnehmer mit dessen RSA Public Key
  const keysPayload = await Promise.all(
    participantKeys.map(async (participant) => {
      // Den JWK-String aus der Datenbank in ein CryptoKey Objekt umwandeln
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

// --- HYBRID ENTSCHLÜSSELUNG (Empfangen) ---
export async function decryptHybrid(
  encryptedContentBase64: string,
  ivBase64: string,
  encryptedSymKeyBase64: string,
  privateKeyJwk: any, // Aus der SessionStorage
) {
  // 1. Importiere den EIGENEN Private Key
  const privateKey = await window.crypto.subtle.importKey(
    "jwk",
    privateKeyJwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"],
  );

  // 2. Entschlüssele den AES Key
  const encryptedSymKeyBuffer = base64ToArrayBuffer(encryptedSymKeyBase64);
  const rawAesKey = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedSymKeyBuffer,
  );

  // 3. Importiere den entschlüsselten AES Key als CryptoKey
  const aesKey = await window.crypto.subtle.importKey(
    "raw",
    rawAesKey,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );

  // 4. Entschlüssele den eigentlichen Text
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
    true, // muss true sein, damit wir ihn exportieren und speichern können
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

/**
 * Nimmt dein Secret Password und den Usernamen (als Salt) und
 * berechnet daraus einen extrem starken AES-GCM Schlüssel (256-bit).
 * Dieser Schlüssel wird dann genutzt, um den Private Key zu verschlüsseln (beim Signup)
 * oder wieder zu entsperren (auf der Chat-Seite).
 */
export async function deriveKeyFromPassword(password: string, salt: string) {
  const encoder = new TextEncoder();

  // 1. Passwort in ein "rohes" Schlüsselmaterial umwandeln
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  );

  // 2. Mit PBKDF2 (100.000 Iterationen) einen starken AES-Key ableiten
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt), // Macht den Key einzigartig für diesen User
      iterations: 100000, // Schützt vor Brute-Force-Angriffen
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false, // Dieser Key selbst darf den Browser nie verlassen
    ["encrypt", "decrypt"],
  );
}

export async function reWrapSessionKeysForNewUser(
  messages: any[],
  myUsername: string,
  myPrivateKeyJwk: any,
  newUserPublicKeyString: string,
) {
  // 1. Keys importieren
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

  // 2. Über alte Nachrichten iterieren
  for (const msg of messages) {
    // Finde meinen eigenen, verschlüsselten AES-Key für diese Nachricht
    const myKeyObj = msg.keys?.find((k: any) => k.username === myUsername);
    if (!myKeyObj) continue; // Überspringen, falls ich die Nachricht selbst nicht lesen kann

    try {
      // A) Entschlüsseln mit meinem Private Key
      const encryptedSymKeyBuffer = base64ToArrayBuffer(myKeyObj.encryptedKey);
      const rawAesKey = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        myPrivateKey,
        encryptedSymKeyBuffer,
      );

      // B) Wieder verschlüsseln mit dem Public Key des NEUEN Users
      const newlyEncryptedSymKeyBuffer = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        newUserRsaPubKey,
        rawAesKey,
      );

      // C) Speichern für das Backend-Payload
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
