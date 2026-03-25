import type { DeathboxData } from '@/models/DeathboxData'

export interface IDataStore {
  load(): Promise<DeathboxData | null>
  save(data: DeathboxData): Promise<void>
  delete(): Promise<void>
}

