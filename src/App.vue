<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Show sidebar and layout only when not on welcome page -->
    <div v-if="$route.path !== '/'" class="flex">
      <!-- Mobile Menu Overlay -->
      <div
        v-if="isMobileMenuOpen"
        class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        @click="isMobileMenuOpen = false"
      ></div>

      <!-- Sidebar -->
      <aside
        class="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 overflow-y-auto max-h-screen z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0"
        :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      >
        <div class="p-6">
          <div class="flex items-center justify-between mb-8">
            <router-link to="/" class="flex items-center gap-2" @click="isMobileMenuOpen = false">
              <LifeRelayLogo size="sm" />
              <h1 class="text-2xl font-bold text-primary-700 hover:text-primary-800 transition-colors">Life Relay</h1>
            </router-link>
            <!-- Close button for mobile -->
            <button
              @click="isMobileMenuOpen = false"
              class="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav class="space-y-6">
            <div v-for="group in navigationGroups" :key="group.name">
              <div class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {{ group.name }}
              </div>
              <div class="mt-1 space-y-1">
                <router-link
                  v-for="item in group.items"
                  :key="item.name"
                  :to="item.path"
                  @click="isMobileMenuOpen = false"
                  class="flex items-center justify-between px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                  :class="
                    $route.path === item.path
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  "
                >
                  <span class="flex items-center gap-2">
                    <span class="text-lg">{{ getIcon(item.name) }}</span>
                    {{ item.name }}
                  </span>
                  <svg
                    v-if="hasSectionData(item.path) && !isSectionSkipped(item.path)"
                    class="w-4 h-4 text-green-500 ml-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span
                    v-else-if="isSectionSkipped(item.path)"
                    class="text-xs text-gray-400 ml-2 flex-shrink-0"
                    title="Skipped"
                  >—</span>
                </router-link>
              </div>
            </div>
          </nav>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 lg:ml-64 w-full">
        <!-- Mobile Menu Button -->
        <div class="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            @click="isMobileMenuOpen = true"
            class="text-gray-500 hover:text-gray-700"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <router-link to="/" class="flex items-center gap-1.5 text-xl font-bold text-primary-700">
            <LifeRelayLogo size="sm" />
            Life Relay
          </router-link>
          <div class="w-6"></div> <!-- Spacer for centering -->
        </div>
        <div class="p-4 md:p-6 lg:p-8">
          <router-view />
        </div>
      </main>
    </div>

    <!-- Full page for welcome page -->
    <div v-else>
      <router-view />
    </div>

    <Toast />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useLegacyStore } from '@/store'
import { getIcon } from '@/utils/icons'
import { hasSectionData as checkSectionData } from '@/composables/useSectionProgress'
import Toast from '@/components/Toast.vue'
import LifeRelayLogo from '@/components/LifeRelayLogo.vue'

const store = useLegacyStore()
const isMobileMenuOpen = ref(false)

// Load data once when app initializes
onMounted(async () => {
  await store.loadData()
})

const skippedSections = computed(() => store.data?.skippedSections ?? [])

function hasSectionData(path: string): boolean {
  if (path === '/dashboard' || path === '/settings') return false
  return checkSectionData(store.data, path)
}

function isSectionSkipped(path: string): boolean {
  return skippedSections.value.includes(path)
}

const navigationGroups = [
  {
    name: 'Overview',
    items: [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Estate Planning', path: '/estate-planning' },
    ],
  },
  {
    name: 'People & Contacts',
    items: [
      { name: 'People & Personal Info', path: '/people' },
      { name: 'Beneficiaries', path: '/beneficiaries' },
      { name: 'Important Contacts', path: '/important-contacts' },
    ],
  },
  {
    name: 'Security & Access',
    items: [
      { name: 'Password Vaults', path: '/password-vaults' },
      { name: 'Computers/Servers', path: '/computer-servers' },
      { name: 'Phones', path: '/phones' },
      { name: 'Authenticator Apps', path: '/authenticator-apps' },
    ],
  },
  {
    name: 'Insurance, Medical & Benefits',
    items: [
      { name: 'Health Insurance', path: '/health-insurance' },
      { name: 'Life Insurance', path: '/life-insurance' },
      { name: 'Medical Info', path: '/medical-info' },
      { name: 'Employment Benefits', path: '/employment-benefits' },
      { name: 'Other Insurance', path: '/other-insurance' },
    ],
  },
  {
    name: 'Finances',
    items: [
      { name: 'Financial Accounts', path: '/financial-accounts' },
      { name: 'Credit Cards', path: '/credit-cards' },
      { name: 'Debts & Loans', path: '/debts' },
      { name: 'Income Sources', path: '/income-sources' },
      { name: 'Retirement & Investment', path: '/retirement-accounts' },
      { name: 'Loyalty & Rewards', path: '/loyalty-programs' },
      { name: 'Tax Information', path: '/tax-info' },
    ],
  },
  {
    name: 'Digital & Crypto Assets',
    items: [
      { name: 'Digital Assets', path: '/digital-assets' },
      { name: 'Crypto Assets', path: '/crypto-assets' },
    ],
  },
  {
    name: 'Property & Household',
    items: [
      { name: 'Property & Real Estate', path: '/property' },
      { name: 'Vehicles', path: '/vehicles' },
      { name: 'Business Ownership', path: '/business-ownership' },
      { name: 'Utilities & Subscriptions', path: '/utilities' },
    ],
  },
  {
    name: 'Documents & Storage',
    items: [
      { name: 'Legal Documents', path: '/legal-documents' },
      { name: 'Trusts', path: '/trusts' },
      { name: 'Physical Storage', path: '/physical-storage' },
      { name: 'Asset Documents', path: '/asset-documents' },
      { name: 'Life Relay Backup', path: '/vault-backup' },
      { name: 'Pending Legal Matters', path: '/pending-legal-matters' },
    ],
  },
  {
    name: 'Final Wishes',
    items: [
      { name: 'Letter of Instruction', path: '/letter-of-instruction' },
      { name: 'Final Wishes & Services', path: '/final-wishes' },
      { name: 'Pet Care', path: '/pet-care' },
      { name: 'Photos & Media', path: '/photos-and-media' },
      { name: 'Notes', path: '/notes' },
    ],
  },
  {
    name: 'Settings',
    items: [{ name: 'Settings', path: '/settings' }],
  },
]
</script>
