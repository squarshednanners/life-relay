import Dexie, { type Table } from 'dexie'
import type { DeathboxData } from '@/models/DeathboxData'
import type { IDataStore } from './IDataStore'
import { encrypt, decrypt, isEncrypted } from '@/utils/encryption'

interface StoredData {
  id: string
  data: DeathboxData
}

class LifeRelayDatabase extends Dexie {
  data!: Table<StoredData, string>

  constructor() {
    // Keep DB name for backward compatibility with existing user data
    super('LegacyVaultDB')
    this.version(1).stores({
      data: 'id',
    })
  }
}

const db = new LifeRelayDatabase()
const DATA_KEY = 'main'

export class LocalDataStore implements IDataStore {
  private readonly STORAGE_KEY = 'legacyVaultData'

  async load(): Promise<DeathboxData | null> {
    try {
      const stored = await db.data.get(DATA_KEY)
      if (stored?.data) {
        // Ensure we return a plain object (not reactive)
        return JSON.parse(JSON.stringify(stored.data))
      }
      return null
    } catch (error) {
      console.error('Error loading data from IndexedDB:', error)
      // Fallback to localStorage
      try {
        const localData = localStorage.getItem(this.STORAGE_KEY)
        return localData ? JSON.parse(localData) : null
      } catch (e) {
        console.error('Error loading from localStorage:', e)
        return null
      }
    }
  }

  async save(data: DeathboxData): Promise<void> {
    try {
      // Serialize the data to remove Vue reactive proxies and ensure it's a plain object
      const serialized = JSON.parse(JSON.stringify(data))
      const dataToSave = {
        ...serialized,
        updatedAt: new Date().toISOString(),
      }

      // Save to IndexedDB
      await db.data.put({
        id: DATA_KEY,
        data: dataToSave,
      })

      // Also save to localStorage as backup
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave))
    } catch (error) {
      console.error('Error saving data:', error)
      throw error
    }
  }

  async delete(): Promise<void> {
    try {
      await db.data.delete(DATA_KEY)
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('Error deleting data:', error)
      throw error
    }
  }

  async exportToJSON(password?: string): Promise<string> {
    const data = await this.load()
    const jsonString = JSON.stringify(data, null, 2)
    
    if (password) {
      // Encrypt the JSON before returning
      return await encrypt(jsonString, password)
    }
    
    return jsonString
  }

  async importFromJSON(jsonString: string, password?: string): Promise<void> {
    try {
      let decryptedString = jsonString
      
      // Check if data is encrypted and decrypt if needed
      if (password) {
        if (isEncrypted(jsonString)) {
          decryptedString = await decrypt(jsonString, password)
        }
      } else {
        // Check if it's encrypted but no password provided
        if (isEncrypted(jsonString)) {
          throw new Error('This file is encrypted. Please provide a password to decrypt it.')
        }
      }
      
      const data = JSON.parse(decryptedString) as DeathboxData
      await this.save(data)
    } catch (error) {
      console.error('Error importing JSON:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Invalid JSON format or incorrect password')
    }
  }
}

