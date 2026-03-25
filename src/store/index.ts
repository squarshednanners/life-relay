import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DeathboxData } from '@/models/DeathboxData'
import { LocalDataStore } from '@/services/LocalDataStore'

export const useLegacyStore = defineStore('legacy', () => {
  const data = ref<DeathboxData | null>(null)
  const isLoading = ref(false)
  const dataStore = new LocalDataStore()

  const hasData = computed(() => data.value !== null)

  async function loadData() {
    isLoading.value = true
    try {
      data.value = await dataStore.load()
    } catch (error) {
      console.error('Error loading data:', error)
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

