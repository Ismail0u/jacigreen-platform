import * as SQLite from 'expo-sqlite'

import type { Mission, StoredPhoto } from '../types'

const dbPromise = SQLite.openDatabaseAsync('jacigreen.db')

async function getDb() {
  return dbPromise
}

export async function initDatabase(): Promise<void> {
  const db = await getDb()

  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      mission_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      synced_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mission_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      uri TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      altitude_m REAL,
      created_at TEXT NOT NULL,
      synced_at TEXT,
      FOREIGN KEY (mission_id) REFERENCES missions(id)
    );
  `)
}

export async function saveMissions(missions: Mission[]): Promise<void> {
  const db = await getDb()
  const syncedAt = new Date().toISOString()

  for (const mission of missions) {
    await db.runAsync(
      `INSERT OR REPLACE INTO missions
      (
        id,
        name,
        description,
        status,
        mission_date,
        notes,
        created_at,
        completed_at,
        synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mission.id,
        mission.name,
        mission.description ?? null,
        mission.status,
        mission.mission_date ?? null,
        mission.notes ?? null,
        mission.created_at,
        mission.completed_at ?? null,
        syncedAt,
      ]
    )
  }
}

export async function getMissions(): Promise<Mission[]> {
  const db = await getDb()

  return await db.getAllAsync<Mission>(
    `SELECT *
     FROM missions
     ORDER BY mission_date DESC, created_at DESC`
  )
}

export async function savePhoto(
  photo: Omit<StoredPhoto, 'id' | 'created_at'>
): Promise<void> {
  const db = await getDb()

  await db.runAsync(
    `INSERT INTO photos
    (
      mission_id,
      filename,
      uri,
      latitude,
      longitude,
      altitude_m,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      photo.mission_id,
      photo.filename,
      photo.uri,
      photo.latitude,
      photo.longitude,
      photo.altitude_m ?? null,
      new Date().toISOString(),
    ]
  )
}

export async function getUnsyncedPhotos(
  missionId?: string
): Promise<StoredPhoto[]> {
  const db = await getDb()

  if (missionId) {
    return await db.getAllAsync<StoredPhoto>(
      `SELECT *
       FROM photos
       WHERE synced_at IS NULL
       AND mission_id = ?
       ORDER BY created_at ASC`,
      [missionId]
    )
  }

  return await db.getAllAsync<StoredPhoto>(
    `SELECT *
     FROM photos
     WHERE synced_at IS NULL
     ORDER BY created_at ASC`
  )
}

export async function markPhotoSynced(photoId: number): Promise<void> {
  const db = await getDb()

  await db.runAsync(
    `UPDATE photos
     SET synced_at = ?
     WHERE id = ?`,
    [new Date().toISOString(), photoId]
  )
}