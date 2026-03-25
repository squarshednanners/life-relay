import type { DeathboxData } from '@/models/DeathboxData'
import type { IDataStore } from './IDataStore'

/**
 * CloudDataStore - Placeholder for future cloud mode implementation
 * This is NOT currently used in the application.
 */
export class CloudDataStore implements IDataStore {
  async load(): Promise<DeathboxData | null> {
    throw new Error('Cloud mode not implemented yet')
  }

  async save(_data: DeathboxData): Promise<void> {
    throw new Error('Cloud mode not implemented yet')
  }

  async delete(): Promise<void> {
    throw new Error('Cloud mode not implemented yet')
  }
}

