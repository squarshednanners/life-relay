import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DeathboxData } from '@/models/DeathboxData'
import { LocalDataStore } from '@/services/LocalDataStore'
import {
  LoadRequiresManualImportError,
  MigrationFailedError,
} from '@/services/errors'
import { useMigrationStatus } from '@/composables/useMigrationStatus'

export const useLegacyStore = defineStore('legacy', () => {
  const data = ref<DeathboxData | null>(null)
  const isLoading = ref(false)
  const dataStore = new LocalDataStore()

  const hasData = computed(() => data.value !== null)

  async function loadData() {
    isLoading.value = true
    try {
      data.value = await dataStore.load()
      // Successful load — if we were stuck in 'requires-manual-import'
      // from a prior failed boot, clear it so the full-screen surface
      // dismounts (P20). Typical recovery path: user does a manual
      // import via the surface → store.importJSON() → loadData() →
      // here. The state was set before the import; clear it now.
      useMigrationStatus().clearRequiresManualImport()
    } catch (error) {
      // Story 1.13 — migration failure routing.
      if (error instanceof LoadRequiresManualImportError) {
        // Hard refuse — show full-screen surface, leave data null.
        useMigrationStatus().markRequiresManualImport(error.message)
        data.value = null
      } else if (error instanceof MigrationFailedError) {
        // Soft failure — the rollback ran, the prior data is back in
        // IndexedDB. Re-read it so the store reflects the restored state.
        useMigrationStatus().markRolledBack(error.message)
        try {
          data.value = await dataStore.load()
        } catch (reloadErr) {
          // The reload failed too — escalate to hard refuse.
          console.error('Post-rollback reload failed:', reloadErr)
          useMigrationStatus().markRequiresManualImport(String(reloadErr))
          data.value = null
        }
      } else {
        console.error('Error loading data:', error)
      }
    } finally {
      isLoading.value = false
    }
  }

  async function saveData() {
    if (!data.value) {
      // Initialize empty data if it doesn't exist
      data.value = {
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
      } as DeathboxData
    }
    isLoading.value = true
    try {
      await dataStore.save(data.value)
    } catch (error) {
      console.error('Error saving data:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function updateData(updates: Partial<DeathboxData>) {
    // Initialize data.value if it doesn't exist
    if (!data.value) {
      data.value = {
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
      } as DeathboxData
    }
    
    // Deep merge the updates into existing data
    data.value = {
      ...data.value,
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    
    await saveData()
  }

  async function deleteData() {
    isLoading.value = true
    try {
      await dataStore.delete()
      data.value = null
    } catch (error) {
      console.error('Error deleting data:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function exportJSON(password?: string): Promise<string> {
    return await dataStore.exportToJSON(password)
  }

  async function importJSON(jsonString: string, password?: string) {
    await dataStore.importFromJSON(jsonString, password)
    await loadData()
  }

  return {
    data,
    isLoading,
    hasData,
    loadData,
    saveData,
    updateData,
    deleteData,
    exportJSON,
    importJSON,
  }
})

