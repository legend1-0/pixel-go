// apps/web/src/storage/projectStorage.js
import { openDB } from 'idb';

const DB_NAME = 'pixel-art-studio';
const DB_VERSION = 3; // bumped: added video-sources store
const STORE_META = 'projects-meta';
const STORE_DATA = 'projects-data';
const STORE_VIDEO_SOURCES = 'video-sources';

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
      if (!db.objectStoreNames.contains(STORE_DATA)) {
        db.createObjectStore(STORE_DATA);
      }
      if (!db.objectStoreNames.contains(STORE_VIDEO_SOURCES)) {
        db.createObjectStore(STORE_VIDEO_SOURCES);
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
  await deleteVideoSourcesForProject(id);
}

/**
 * Saves a video source (the original video blob + the resolved pipeline
 * settings used to convert it) so lazy video frames can be re-decoded
 * even after the project is closed and reopened.
 * @param {string} projectId
 * @param {string} sourceMediaId
 * @param {Blob} blob
 * @param {object} pipelineSettings
 */
export async function saveVideoSource(projectId, sourceMediaId, blob, pipelineSettings) {
  const db = await getDB();
  const key = `${projectId}:${sourceMediaId}`;
  await db.put(STORE_VIDEO_SOURCES, { blob, pipelineSettings }, key);
}

/**
 * Loads a previously saved video source.
 * @returns {Promise<{blob: Blob, pipelineSettings: object} | undefined>}
 */
export async function loadVideoSource(projectId, sourceMediaId) {
  const db = await getDB();
  const key = `${projectId}:${sourceMediaId}`;
  return db.get(STORE_VIDEO_SOURCES, key);
}

/**
 * Deletes every video source associated with a project (called when the
 * project itself is deleted, to avoid orphaned video blobs).
 */
export async function deleteVideoSourcesForProject(projectId) {
  const db = await getDB();
  const keys = await db.getAllKeys(STORE_VIDEO_SOURCES);
  const matching = keys.filter((k) => k.startsWith(`${projectId}:`));
  for (const key of matching) {
    await db.delete(STORE_VIDEO_SOURCES, key);
  }
}    

