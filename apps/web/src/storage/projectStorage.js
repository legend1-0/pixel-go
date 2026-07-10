// apps/web/src/storage/projectStorage.js
import { openDB } from 'idb';

const DB_NAME = 'pixel-art-studio';
const DB_VERSION = 2;
const STORE_META = 'projects-meta'; // cheap to list: {name, updatedAt, thumbnail}
const STORE_DATA = 'projects-data'; // full Document, loaded only when opening

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
      if (!db.objectStoreNames.contains(STORE_DATA)) {
        db.createObjectStore(STORE_DATA);
      }
    },
  });
}

/**
 * Saves (or overwrites) a project's meta and full document data.
 * @param {string} id
 * @param {{name: string, updatedAt: number, thumbnail: string}} meta
 * @param {object} document
 */
export async function saveProject(id, meta, document) {
  const db = await getDB();
  await db.put(STORE_META, meta, id);
  await db.put(STORE_DATA, document, id);
}

/**
 * Lists all saved projects' lightweight metadata (no pixel data).
 * @returns {Promise<Array<{id: string, name: string, updatedAt: number, thumbnail: string}>>}
 */
export async function listProjects() {
  const db = await getDB();
  const keys = await db.getAllKeys(STORE_META);
  const metas = await db.getAll(STORE_META);
  return keys.map((id, i) => ({ id, ...metas[i] }));
}

/**
 * Loads a project's full document by id.
 */
export async function loadProjectData(id) {
  const db = await getDB();
  return db.get(STORE_DATA, id);
}

/**
 * Updates just a project's display name in the meta store, without
 * touching its full document data.
 */
export async function renameProjectMeta(id, newName) {
  const db = await getDB();
  const meta = await db.get(STORE_META, id);
  if (meta) {
    meta.name = newName;
    await db.put(STORE_META, meta, id);
  }
}

/**
 * Deletes a project entirely (both meta and data).
 */
export async function deleteProject(id) {
  const db = await getDB();
  await db.delete(STORE_META, id);
  await db.delete(STORE_DATA, id);
}