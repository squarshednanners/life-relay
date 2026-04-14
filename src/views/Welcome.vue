<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <div class="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-gray-900">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div class="absolute bottom-10 right-20 w-96 h-96 bg-primary-400 rounded-full blur-3xl"></div>
      </div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div class="text-center">
          <div class="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span class="text-sm text-white/90">100% offline &middot; Zero data collection</span>
          </div>
          <div class="flex items-center justify-center gap-4 mb-6">
            <LifeRelayLogo size="xl" variant="light" />
            <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight">
              Life Relay
            </h1>
          </div>
          <p class="text-lg sm:text-xl text-primary-100 mb-4 max-w-2xl mx-auto leading-relaxed">
            The free, privacy-first app for organizing your will, trust, finances, digital assets, and everything
            your family would need after your death — so they know exactly what exists and where to find it.
          </p>
          <p class="text-sm text-primary-200/80 mb-10 max-w-xl mx-auto">
            No servers. No accounts. No tracking. 100% free and open source.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <router-link
              to="/dashboard"
              class="px-8 py-4 bg-white text-primary-700 rounded-xl hover:bg-gray-100 transition-all text-lg font-semibold shadow-xl shadow-black/20"
            >
              Get Started
            </router-link>
            <a
              href="#features"
              class="px-8 py-4 bg-white/10 backdrop-blur-sm text-white border border-white/30 rounded-xl hover:bg-white/20 transition-all text-lg font-semibold"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Audience Section -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="text-center mb-10">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Your In-Case-of-Death Folder, Done Right</h2>
        <p class="text-gray-500 max-w-xl mx-auto">Whether you're preparing a will, documenting crypto for your heirs, or building a family emergency binder — Life Relay organizes it all in one place.</p>
      </div>
      <div class="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div class="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
          <div class="text-3xl mb-3">&#x20BF;</div>
          <h3 class="font-semibold text-gray-900 mb-1">Crypto Holders</h3>
          <p class="text-sm text-gray-500">Create a crypto recovery plan — document wallets, seed phrase locations, exchange access, and multi-sig configurations so heirs can actually recover your assets.</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
          <div class="text-3xl mb-3">&#x1F3E0;</div>
          <h3 class="font-semibold text-gray-900 mb-1">Parents & Families</h3>
          <p class="text-sm text-gray-500">Build a family emergency binder with accounts, insurance, legal documents, final wishes, guardianship, and beneficiary designations — all in one organized place.</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
          <div class="text-3xl mb-3">&#x2696;</div>
          <h3 class="font-semibold text-gray-900 mb-1">Will & Trust Preparation</h3>
          <p class="text-sm text-gray-500">Organize your information before meeting with an attorney. The Estate Planning Guide generates an Attorney Preparation Summary PDF you can bring to your first meeting.</p>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div id="features" class="bg-white py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Everything You Need, Nothing You Don't</h2>
          <p class="text-gray-500 max-w-xl mx-auto">A free, comprehensive toolkit for legacy planning, inheritance preparation, and documenting where everything is — without uploading your data to anyone's server.</p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="group rounded-xl border border-gray-200 p-6 hover:border-primary-300 hover:shadow-md transition-all">
            <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
              <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 mb-2">Privacy First</h3>
            <p class="text-sm text-gray-500 leading-relaxed">All data stored locally in your browser. No servers, no cloud, no tracking. AES-256 encrypted exports for secure backups.</p>
          </div>

          <div class="group rounded-xl border border-gray-200 p-6 hover:border-primary-300 hover:shadow-md transition-all">
            <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
              <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 mb-2">Works Offline</h3>
            <p class="text-sm text-gray-500 leading-relaxed">Installable as a Progressive Web App. No internet required after first load. Your data is always accessible.</p>
          </div>

          <div class="group rounded-xl border border-gray-200 p-6 hover:border-primary-300 hover:shadow-md transition-all">
            <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
              <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          <h3 class="font-semibold text-gray-900 mb-2">Emergency Information Card</h3>
            <p class="text-sm text-gray-500 leading-relaxed">Generate a one-page emergency sheet PDF with key contacts, medical info, and important document locations. Print and store in your family emergency binder.</p>
          </div>

          <div class="group rounded-xl border border-gray-200 p-6 hover:border-primary-300 hover:shadow-md transition-all">
            <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
              <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l3 9a5.002 5.002 0 01-6.001 0M18 7l-3 9m-5.444-8.97A13.041 13.041 0 0112 5c1.268 0 2.39.232 3.444.654M3.859 12.5h0M20.141 12.5h0" />
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 mb-2">Estate Planning Guide</h3>
            <p class="text-sm text-gray-500 leading-relaxed">Prepare for attorney meetings with a guided checklist covering wills, trusts, and estate plans. Generates an Attorney Preparation Summary PDF.</p>
          </div>

          <div class="group rounded-xl border border-gray-200 p-6 hover:border-primary-300 hover:shadow-md transition-all">
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 mb-2">Crypto Recovery Plan</h3>
            <p class="text-sm text-gray-500 leading-relaxed">Document wallets, exchanges, seed phrase locations, multi-sig setups, and hardware devices. Build a complete crypto inheritance plan with step-by-step recovery instructions for heirs.</p>
          </div>

          <div class="group rounded-xl border border-gray-200 p-6 hover:border-primary-300 hover:shadow-md transition-all">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 mb-2">Important Documents Organizer</h3>
            <p class="text-sm text-gray-500 leading-relaxed">Full vault PDF, one-page emergency sheet, and attorney preparation summary. Export as your printable in-case-of-death folder. All generated client-side.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- What's Covered Section -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="text-center mb-10">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">26 Sections Across 8 Categories</h2>
        <p class="text-gray-500 max-w-xl mx-auto">From bank accounts to burial preferences — organized logically so you can fill in what matters and skip the rest.</p>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="group in sectionHighlights" :key="group.name" class="bg-white rounded-lg border border-gray-200 p-4">
          <h4 class="font-semibold text-gray-900 mb-1.5 text-sm">{{ group.name }}</h4>
          <p class="text-xs text-gray-500 leading-relaxed">{{ group.description }}</p>
        </div>
      </div>
    </div>

    <!-- How It Works Section -->
    <div class="bg-white py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
          <p class="text-gray-500 max-w-xl mx-auto">No sign-up. No account. Just open and start.</p>
        </div>

        <div class="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          <div class="text-center">
            <div class="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
              1
            </div>
            <h3 class="font-semibold text-gray-900 mb-1">Pick a Template</h3>
            <p class="text-sm text-gray-500">Choose a quick start template that matches your situation, or start from scratch.</p>
          </div>
          <div class="text-center">
            <div class="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
              2
            </div>
            <h3 class="font-semibold text-gray-900 mb-1">Fill In Sections</h3>
            <p class="text-sm text-gray-500">Navigate through organized sections. Skip what's not relevant. Everything saves automatically.</p>
          </div>
          <div class="text-center">
            <div class="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
              3
            </div>
            <h3 class="font-semibold text-gray-900 mb-1">Export & Print</h3>
            <p class="text-sm text-gray-500">Generate PDFs — full vault, emergency sheet, or attorney prep summary. Export encrypted JSON backups.</p>
          </div>
          <div class="text-center">
            <div class="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
              4
            </div>
            <h3 class="font-semibold text-gray-900 mb-1">Review Regularly</h3>
            <p class="text-sm text-gray-500">The dashboard tracks your progress and reminds you to review every 90 days.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Privacy & Security Section -->
    <div class="bg-gray-900 text-white py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-2xl sm:text-3xl font-bold mb-3">Your Privacy is Non-Negotiable</h2>
          <p class="text-gray-400 max-w-xl mx-auto">Life Relay was designed from day one so your sensitive information never touches a server.</p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <div>
            <div class="text-2xl mb-2">&#x1F512;</div>
            <h3 class="font-semibold mb-1">Local Storage Only</h3>
            <p class="text-sm text-gray-400">IndexedDB in your browser. Nothing sent to any server, ever.</p>
          </div>
          <div>
            <div class="text-2xl mb-2">&#x1F510;</div>
            <h3 class="font-semibold mb-1">Encrypted Exports</h3>
            <p class="text-sm text-gray-400">AES-256 password encryption for JSON backups. Your data, your password.</p>
          </div>
          <div>
            <div class="text-2xl mb-2">&#x1F4F1;</div>
            <h3 class="font-semibold mb-1">No Account Required</h3>
            <p class="text-sm text-gray-400">No sign-up, no email, no personal information collected. Just open and use.</p>
          </div>
          <div>
            <div class="text-2xl mb-2">&#x1F310;</div>
            <h3 class="font-semibold mb-1">Installable PWA</h3>
            <p class="text-sm text-gray-400">Install on your device like a native app. Works fully offline after first load.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="bg-primary-600 text-white py-14">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-2xl sm:text-3xl font-bold mb-4">Don't Leave Your Family Guessing</h2>
        <p class="text-primary-100 mb-8 text-lg">
          Start organizing your will, trust, and legacy information today. It's free, private, and takes just minutes to begin.
        </p>
        <router-link
          to="/dashboard"
          class="inline-block px-8 py-4 bg-white text-primary-700 rounded-xl hover:bg-gray-100 transition-all text-lg font-semibold shadow-xl shadow-black/10"
        >
          Get Started Now
        </router-link>
      </div>
    </div>

    <!-- Donate -->
    <div id="donate" class="bg-gray-900 py-12">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row items-start md:items-center gap-8">
          <div class="flex-shrink-0">
            <h2 class="text-xl font-bold text-white mb-1">Donate</h2>
            <p class="text-sm text-gray-400">Like the project?<br/>Consider a donation.</p>
          </div>
          <div class="flex flex-col sm:flex-row flex-wrap gap-8 flex-1 justify-center">
            <!-- Lightning -->
            <div class="flex flex-col items-center gap-2">
              <div class="relative bg-white p-2 rounded-lg">
                <img
                  :src="lightningQr"
                  alt="Lightning donation QR code"
                  class="w-40 h-40"
                />
                <div class="absolute bottom-3 right-3 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" />
                  </svg>
                </div>
              </div>
              <button
                @click="copyToClipboard('squarshednanner@strike.me', 'lightning')"
                class="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                title="Click to copy"
              >
                squarshednanner@strike.me
                <svg v-if="copied !== 'lightning'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <svg v-else class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              </button>
            </div>
            <!-- Bitcoin -->
            <div class="flex flex-col items-center gap-2">
              <div class="relative bg-white p-2 rounded-lg">
                <img
                  :src="bitcoinQr"
                  alt="Bitcoin donation QR code"
                  class="w-40 h-40"
                />
                <div class="absolute bottom-3 right-3 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span class="text-white font-bold text-sm">&#x20BF;</span>
                </div>
              </div>
              <button
                @click="copyToClipboard('bc1qjxwfm42n6zmlp8tq47j8lgslxhggve2wrwaagl', 'bitcoin')"
                class="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                title="Click to copy"
              >
                bc1qjxwfm42n6z...ve2wrwaagl
                <svg v-if="copied !== 'bitcoin'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <svg v-else class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              </button>
            </div>
          </div>
          <!-- Platform donations -->
          <div class="flex flex-col gap-3 sm:ml-4">
            <a
              href="https://github.com/sponsors/squarshednanners"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 border border-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              GitHub Sponsors
            </a>
            <a
              href="https://venmo.com/squarshednanners"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#008CFF] text-white rounded-lg hover:bg-[#0070cc] transition-colors text-sm font-medium"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.885 3.398c.66 1.09.957 2.214.957 3.635 0 4.527-3.862 10.41-6.994 14.55H7.27L4.116 3.81l5.89-.561 1.76 14.12c1.627-2.652 3.636-6.825 3.636-9.674 0-1.353-.23-2.28-.627-3.033l5.11-1.264z"/></svg>
              Venmo
            </a>
            <a
              href="https://buymeacoffee.com/squarshednanners"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFDD00] text-gray-900 rounded-lg hover:bg-[#e6c800] transition-colors text-sm font-medium"
            >
              <span class="text-lg">&#9749;</span>
              Buy Me a Coffee
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-gray-800 text-gray-400 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="flex items-center justify-center gap-2 mb-1">
          <LifeRelayLogo size="sm" variant="light" />
          <p class="font-medium text-gray-300">Life Relay</p>
        </div>
        <p class="text-sm">
          Version 2.0.0 &middot; All data stored locally &middot; No tracking &middot; No servers
        </p>
        <p class="text-sm mt-2">
          <a
            href="https://github.com/squarshednanners/life-relay"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            View on GitHub
          </a>
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LifeRelayLogo from '@/components/LifeRelayLogo.vue'

// QR codes via public API (no dependency needed)
const lightningQr = 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=squarshednanner%40strike.me'
const bitcoinQr = 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=bitcoin%3Abc1qjxwfm42n6zmlp8tq47j8lgslxhggve2wrwaagl'

const copied = ref<string | null>(null)

function copyToClipboard(text: string, id: string) {
  navigator.clipboard.writeText(text)
  copied.value = id
  setTimeout(() => { copied.value = null }, 2000)
}

const sectionHighlights = [
  { name: 'People & Contacts', description: 'Personal info, beneficiaries, executors, attorneys, trustees, and key contacts.' },
  { name: 'Security & Access', description: 'Password vaults, computers, phones, and authenticator apps with backup codes.' },
  { name: 'Insurance, Medical & Benefits', description: 'Health and life insurance, medical info, and employment benefits.' },
  { name: 'Finances', description: 'Bank accounts, credit cards, debts, income sources, and retirement/investment accounts.' },
  { name: 'Digital & Crypto Assets', description: 'Online accounts, cryptocurrency wallets, exchanges, seed phrase locations, and multi-sig configs.' },
  { name: 'Property & Household', description: 'Real estate, vehicles, business ownership, utilities, and subscriptions.' },
  { name: 'Documents & Storage', description: 'Legal documents, trusts, physical storage locations, and asset documents like deeds and titles.' },
  { name: 'Final Wishes', description: 'Letter of instruction, funeral and burial preferences, pet care plans, photos, and personal notes.' },
]
</script>
