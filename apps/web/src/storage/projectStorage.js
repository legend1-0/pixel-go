// apps/web/src/storage/projectStorage.js
import { openDB } from 'idb';

const DB_NAME = 'pixel-art-studio';
const DB_VERSION = 1;
const STORE_AUTOSAVE = 'autosave';

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_AUTOSAVE)) {
        db.createObjectStore(STORE_AUTOSAVE);
      }
    },
  });
}

/**
 * Saves a snapshot of the current document as the single autosave slot.
 * Typed arrays (pixel data) are stored natively — IndexedDB supports them
 * directly via the structured clone algorithm, no serialization needed.
 * @param {object} document
 */
export async function saveAutosave(document) {
  const db = await getDB();
  await db.put(STORE_AUTOSAVE, document, 'current');
}

/**
 * Loads the autosave snapshot, if one exists.
 * @returns {Promise<object|undefined>}
 */
export async function loadAutosave() {
  const db = await getDB();
  return db.get(STORE_AUTOSAVE, 'current');
}

/**
 * Clears the autosave slot (e.g. after starting a deliberate new project).
 */
export async function clearAutosave() {
  const db = await getDB();
  await db.delete(STORE_AUTOSAVE, 'current');
}