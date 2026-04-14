<template>
  <div class="col-span-1 md:col-span-2">
    <button
      type="button"
      @click="populateInstructions"
      class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm"
    >
      {{ label || 'Generate Recommended Recovery Instructions' }}
    </button>
    <p v-if="helpText" class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ helpText }}</p>
  </div>
</template>

<script setup lang="ts">

const props = defineProps<{
  modelValue?: string
  label?: string
  helpText?: string
  storageType?: string
  keyType?: string
  walletType?: string
  parentData?: any // The parent form item data
  onUpdate?: (fieldName: string, value: string) => void // Callback to update parent field (from FieldRenderer)
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// ---------------------------------------------------------------------------
// Helpers to read new structured fields with fallbacks to legacy free-text
// ---------------------------------------------------------------------------

function resolveWalletApp(): string {
  // Prefer the new structured walletApp select, fall back to key vendor
  const app = props.parentData?.walletApp
  if (app && app !== 'Other') return app
  if (app === 'Other' && props.parentData?.walletAppOther) return props.parentData.walletAppOther
  // Legacy: derive from first key vendor
  return props.parentData?.singleKey?.[0]?.vendor
    || props.parentData?.multiSigConfig?.keys?.[0]?.vendor
    || ''
}

function resolveBlockchain(): string {
  const chain = props.parentData?.blockchain
  if (chain && chain !== 'Other') return chain
  if (chain === 'Other' && props.parentData?.blockchainOther) return props.parentData.blockchainOther
  return ''
}

function resolveHardwareModel(): string {
  const key = props.parentData?.singleKey?.[0] || props.parentData?.multiSigConfig?.keys?.[0]
  return key?.hardwareModel || ''
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

function getRecommendedInstructions(): string {
  const instructions: string[] = []

  const storageType = props.storageType || props.parentData?.storageType
  const keyType = props.keyType || props.parentData?.singleKey?.[0]?.keyType || props.parentData?.multiSigConfig?.keys?.[0]?.keyType
  const walletApp = resolveWalletApp()
  const walletAppLower = walletApp.toLowerCase()
  const blockchain = resolveBlockchain()
  const hardwareModel = resolveHardwareModel()

  // Check if any keys are provider type (for both single-sig and multi-sig)
  const hasProviderKeysSingleSig = storageType === 'single-sig' && keyType === 'Provider'
  const hasProviderKeysMultiSig = storageType === 'multi-sig' &&
    props.parentData?.multiSigConfig?.keys?.some((key: any) => key?.keyType === 'Provider')
  const hasProviderKeys = hasProviderKeysSingleSig || hasProviderKeysMultiSig
  const providerKeys = hasProviderKeysMultiSig ?
    props.parentData?.multiSigConfig?.keys?.filter((key: any) => key?.keyType === 'Provider') :
    (hasProviderKeysSingleSig ? [props.parentData?.singleKey?.[0]] : [])

  // -----------------------------------------------------------------------
  // HEIR INSTRUCTIONS NOTICE
  // -----------------------------------------------------------------------
  if (props.parentData?.heirInstructions) {
    instructions.push('NOTE: The owner of this wallet wrote custom step-by-step instructions in the')
    instructions.push('"Instructions for Your Heir" section above. Read those FIRST — they are')
    instructions.push('personalized and may be simpler to follow than the general guidance below.')
    instructions.push('')
  }

  // -----------------------------------------------------------------------
  // EXCHANGE RECOVERY
  // -----------------------------------------------------------------------
  if (storageType === 'exchange') {
    const exchangeName = props.parentData?.exchange || 'the exchange'
    const exchangeEmail = props.parentData?.exchangeEmail || ''
    const twoFaMethod = props.parentData?.exchange2faMethod || ''
    const twoFaRecovery = props.parentData?.exchange2faRecovery || ''
    const beneficiary = props.parentData?.exchangeBeneficiary || ''
    const deathClaim = props.parentData?.exchangeDeathClaimProcess || ''

    instructions.push('EXCHANGE ACCOUNT RECOVERY')
    instructions.push('')
    instructions.push(`This cryptocurrency is held on ${exchangeName}. Unlike self-custody wallets,`)
    instructions.push('exchange-held assets are managed by the exchange company. Recovery requires')
    instructions.push('contacting the exchange and completing their account access or inheritance process.')
    instructions.push('')
    instructions.push('IMPORTANT WARNINGS')
    instructions.push('')
    instructions.push('- Never share account credentials with anyone who contacts you first.')
    instructions.push('- Only use the official exchange website — verify the URL carefully.')
    instructions.push('- Beware of phishing emails that impersonate the exchange.')
    instructions.push('- If unsure, stop and consult a trusted professional.')
    instructions.push('')

    instructions.push('OPTION 1: LOG INTO THE ACCOUNT DIRECTLY')
    instructions.push('')
    instructions.push(`1. Visit the official ${exchangeName} website.`)
    if (exchangeEmail) {
      instructions.push(`2. Log in using the account email: ${exchangeEmail}`)
    } else {
      instructions.push('2. Log in using the account email and password from this document.')
    }
    instructions.push('3. You will likely need to complete two-factor authentication (2FA).')
    if (twoFaMethod === 'authenticator') {
      instructions.push('   - 2FA method: Authenticator App (e.g., Google Authenticator, Authy)')
      instructions.push('   - You will need access to the authenticator app on the account holder\'s phone.')
      if (twoFaRecovery) {
        instructions.push(`   - Recovery info: ${twoFaRecovery}`)
      }
    } else if (twoFaMethod === 'sms') {
      instructions.push('   - 2FA method: SMS text message')
      instructions.push('   - You will need access to the phone number linked to the account.')
      if (twoFaRecovery) {
        instructions.push(`   - Recovery info: ${twoFaRecovery}`)
      }
    } else if (twoFaMethod === 'hardware-key') {
      instructions.push('   - 2FA method: Hardware security key (e.g., YubiKey)')
      instructions.push('   - You will need the physical security key device.')
      if (twoFaRecovery) {
        instructions.push(`   - Recovery info: ${twoFaRecovery}`)
      }
    } else if (twoFaMethod === 'email') {
      instructions.push('   - 2FA method: Email verification')
      instructions.push('   - You will need access to the account holder\'s email.')
      if (twoFaRecovery) {
        instructions.push(`   - Recovery info: ${twoFaRecovery}`)
      }
    } else if (twoFaRecovery) {
      instructions.push(`   - 2FA recovery info: ${twoFaRecovery}`)
    }
    instructions.push('4. Once logged in, navigate to the account dashboard to view balances.')
    instructions.push('5. To withdraw funds, follow the exchange\'s withdrawal process.')
    instructions.push('   - You will need a destination wallet address to send funds to.')
    instructions.push('   - Start with a small test withdrawal to confirm it works.')
    instructions.push('')

    instructions.push('OPTION 2: INHERITANCE / DEATH CLAIM PROCESS')
    instructions.push('')
    instructions.push('If you cannot log in, most major exchanges have an inheritance or')
    instructions.push('estate claim process for deceased account holders.')
    instructions.push('')
    if (deathClaim) {
      instructions.push(`Specific notes from the account holder: ${deathClaim}`)
      instructions.push('')
    }
    instructions.push(`1. Visit the ${exchangeName} support or help center website.`)
    instructions.push('2. Search for "deceased account holder", "inheritance", or "estate claim".')
    instructions.push('3. You will typically need to provide:')
    instructions.push('   - Death certificate')
    instructions.push('   - Proof of your identity')
    instructions.push('   - Proof of authority (executor/administrator letter, will, court order)')
    instructions.push('   - Account information (email, username, or account ID)')
    instructions.push('4. The exchange will verify documents and process the claim.')
    instructions.push('   - This process can take several weeks to months.')
    instructions.push('   - The exchange may require additional documentation.')
    instructions.push('5. Once approved, the exchange will either:')
    instructions.push('   - Transfer the assets to a wallet address you provide, or')
    instructions.push('   - Liquidate the assets and send a check/wire transfer.')
    instructions.push('')
    if (beneficiary === 'yes') {
      instructions.push('BENEFICIARY DESIGNATION: The account holder designated a beneficiary on this')
      instructions.push('exchange account. This may simplify the claims process — mention the')
      instructions.push('beneficiary designation when contacting the exchange.')
      instructions.push('')
    } else if (beneficiary === 'no') {
      instructions.push('Note: No beneficiary was designated on this exchange account. The estate')
      instructions.push('claim process will require executor/administrator documentation.')
      instructions.push('')
    }

    instructions.push('GENERAL TIPS')
    instructions.push('')
    instructions.push('- Keep records of all communication with the exchange.')
    instructions.push('- Be patient — exchange estate processes take time.')
    instructions.push('- If the exchange is unresponsive, consult an attorney experienced in digital assets.')
    instructions.push('- Some exchanges may freeze the account during the claims process — this is normal.')
    instructions.push('')

    return instructions.join('\n')
  }

  // -----------------------------------------------------------------------
  // BEFORE YOU BEGIN (self-custody: single-sig and multi-sig)
  // -----------------------------------------------------------------------
  instructions.push('BEFORE YOU BEGIN')
  instructions.push('')
  instructions.push('Please gather any of the following items that you have:')
  instructions.push('')
  if (hardwareModel) {
    instructions.push(`- Hardware wallet device: ${hardwareModel}`)
  } else {
    instructions.push('- Hardware wallet device(s) (Ledger, Trezor, Coldcard, BitBox, etc.)')
  }
  instructions.push('- PIN or password for the device')
  instructions.push('- Recovery seed phrase(s) (12, 18, or 24 words)')
  instructions.push('- Any passphrase or additional security info')
  if (storageType === 'multi-sig') {
    instructions.push('- Wallet backup files (e.g., Sparrow .7z files)')
    instructions.push('- Extended public key (xpub) files')
    if (hasProviderKeys) {
      instructions.push('- Provider account information and contact details (for provider-managed keys)')
    }
  }
  instructions.push('')
  if (storageType === 'multi-sig') {
    const m = props.parentData?.multiSigConfig?.requiredSignatures
    const n = props.parentData?.multiSigConfig?.totalKeys
    instructions.push('Use a private computer and secure Wi-Fi. Take your time.')
    instructions.push('')
    if (m && n) {
      instructions.push(`This is a ${m}-of-${n} multi-sig wallet, meaning you need ${m} out of ${n} keys to move funds.`)
    } else {
      instructions.push('Multi-sig wallets consist of multiple keys to access the wallet. The most common setup is 2 of 3 keys, meaning you need 2 keys to move funds out of the 3 provided keys.')
    }
    instructions.push('To restore a wallet you need one of the following:')
    instructions.push('   1. All wallet keys (not just the minimum signature keys)')
    instructions.push('   2. Minimum signature keys AND a wallet backup file')
    instructions.push('   3. Minimum signature keys AND an extended public key xpub file')
  } else {
    instructions.push('Use a private computer and Wi-Fi connection. Take your time.')
  }
  instructions.push('')
  instructions.push('IMPORTANT WARNINGS')
  instructions.push('')
  instructions.push('- Never type the seed phrase into any website.')
  instructions.push('- Never share seed phrase, PIN, or passwords with anyone.')
  instructions.push('- Only download official software from the manufacturer or verified wallet providers.')
  instructions.push('- Only enter sensitive information into trusted, verified wallet software.')
  instructions.push('- If unsure, stop and consult a trusted professional.')
  instructions.push('- The seed phrase is the master key: anyone who has it can access all funds.')
  instructions.push('- Be aware that recovery may take time - do not rush the process.')
  if (storageType === 'multi-sig') {
    instructions.push('- Losing too many keys may prevent spending — you must have at least the minimum required number of keys.')
  }
  instructions.push('')

  // -----------------------------------------------------------------------
  // PROVIDER-MANAGED KEY RECOVERY
  // -----------------------------------------------------------------------
  if (hasProviderKeys) {
    instructions.push('PROVIDER-MANAGED KEY RECOVERY (START HERE)')
    instructions.push('')
    instructions.push('If your wallet uses provider-managed keys (Casa, Unchained Capital, etc.), the provider\'s website and software will guide you through the recovery process.')
    instructions.push('')
    instructions.push('Option 1: Log into Provider Website/Portal')
    instructions.push('')
    instructions.push('1. Visit the provider\'s official website using the URL provided in this document.')
    if (providerKeys.length > 0 && providerKeys[0]?.providerUrl) {
      instructions.push(`   - Website: ${providerKeys[0].providerUrl}`)
    }
    instructions.push('   - Always verify you are on the official provider website to avoid phishing.')
    instructions.push('2. Look for a "Login", "Sign In", or "Access Account" option on the website.')
    instructions.push('3. Use your account credentials to log in.')
    instructions.push('   - You may need account username, email, or account ID.')
    instructions.push('   - If you don\'t remember your login credentials, use the "Forgot Password" or account recovery option.')
    instructions.push('4. Once logged in, navigate to your wallet or account dashboard.')
    instructions.push('5. The provider\'s interface will typically have a recovery or access option that guides you through the process.')
    instructions.push('6. Follow the on-screen instructions provided by the provider.')
    instructions.push('   - The provider\'s software is designed to walk you through recovery step-by-step.')
    instructions.push('   - They may require identity verification as part of their security process.')
    instructions.push('7. Complete any required verification steps (ID verification, security questions, etc.).')
    instructions.push('8. The provider will help you access your wallet or coordinate with other key holders if it\'s a multi-sig setup.')
    instructions.push('')
    instructions.push('Option 2: Contact Provider Support')
    instructions.push('')
    instructions.push('If you cannot log in or need assistance:')
    instructions.push('')
    instructions.push('1. Contact the provider using the contact information provided in this document.')
    if (providerKeys.length > 0) {
      providerKeys.forEach((key: any, index: number) => {
        if (key?.provider) {
          instructions.push('')
          instructions.push(`Provider ${index + 1}: ${key.provider}`)
          if (key.providerUrl) {
            instructions.push(`Website: ${key.providerUrl}`)
          }
          if (key.providerContact) {
            instructions.push(`Contact: ${key.providerContact}`)
          }
        }
      })
      instructions.push('')
    }
    instructions.push('2. Explain that you need to recover access to your wallet.')
    instructions.push('3. Be prepared to provide:')
    instructions.push('   - Account information (username, email, account ID)')
    instructions.push('   - Identity verification documents (as required by the provider)')
    instructions.push('   - Any account details or information you have')
    instructions.push('4. Follow the provider\'s specific recovery procedures.')
    instructions.push('   - Each provider has their own security and verification process.')
    instructions.push('   - Recovery time may vary depending on the provider\'s procedures.')
    instructions.push('5. The provider will guide you through their recovery process.')
    instructions.push('   - For multi-sig wallets, they will coordinate with other key holders.')
    instructions.push('   - They will help you access your funds or set up new access methods.')
    instructions.push('')
    instructions.push('Important Notes:')
    instructions.push('- Provider-managed keys require going through the provider\'s own recovery system.')
    instructions.push('- The provider\'s website and software are designed to guide you through recovery.')
    instructions.push('- Recovery may take longer due to identity verification and security procedures.')
    instructions.push('- The provider may charge fees for recovery services - check their fee structure.')
    instructions.push('- For multi-sig wallets, the provider will coordinate signing with other cosigners.')
    instructions.push('- Never share your seed phrases or private keys with the provider unless they specifically request it as part of their verified recovery process.')
    instructions.push('')
    instructions.push('If you have both provider-managed keys AND hardware/software keys, you may need to:')
    instructions.push('- First recover access through the provider (for provider keys)')
    instructions.push('- Then coordinate with hardware/software key holders (for other keys)')
    instructions.push('- Use a multi-sig coordinator (like Sparrow Wallet) to combine all keys')
    instructions.push('')
  }

  // -----------------------------------------------------------------------
  // SINGLE-SIG SCENARIOS
  // -----------------------------------------------------------------------
  if (storageType === 'single-sig') {
    if (!hasProviderKeysSingleSig) {
      instructions.push('SCENARIO 1: YOU HAVE THE HARDWARE WALLET + PIN/PASSWORD')
      instructions.push('')
      instructions.push('Use the official software from the manufacturer. This is safest.')
      instructions.push('')

      // Detect wallet app from structured field or legacy vendor
      const isLedger = walletAppLower.includes('ledger')
      const isTrezor = walletAppLower.includes('trezor')
      const isColdcard = walletAppLower.includes('coldcard') || walletAppLower.includes('sparrow')
      const isBitbox = walletAppLower.includes('bitbox')
      const isMetaMask = walletAppLower.includes('metamask')
      const isPhantom = walletAppLower.includes('phantom')
      const isElectrum = walletAppLower.includes('electrum')
      const isExodus = walletAppLower.includes('exodus')
      const isBlueWallet = walletAppLower.includes('bluewallet') || walletAppLower.includes('blue wallet')

      if (isLedger) {
        if (hardwareModel) {
          instructions.push(`Ledger Device: ${hardwareModel}`)
        } else {
          instructions.push('Ledger Devices (Nano S, S Plus, X, Stax, Flex)')
        }
        instructions.push('')
        instructions.push('Software: Ledger Live')
        instructions.push('')
        instructions.push('Steps:')
        instructions.push('1. Install Ledger Live from the official Ledger website.')
        instructions.push('2. Open Ledger Live.')
        instructions.push('3. Plug in the Ledger device via USB' + (hardwareModel && hardwareModel.toLowerCase().includes('nano x') ? ' (or connect via Bluetooth).' : '.'))
        instructions.push('4. Enter the PIN on the device.')
        instructions.push('5. In Ledger Live, go to: Accounts → Add Account → Bitcoin (or other coins).')
        instructions.push('6. Ledger Live will sync and show balances.')
        instructions.push('')
      } else if (isTrezor) {
        if (hardwareModel) {
          instructions.push(`Trezor Device: ${hardwareModel}`)
        } else {
          instructions.push('Trezor Devices (Model One, Model T, Safe 3, Safe 5)')
        }
        instructions.push('')
        instructions.push('Software: Trezor Suite')
        instructions.push('')
        instructions.push('Steps:')
        instructions.push('1. Install Trezor Suite from the official Trezor website.')
        instructions.push('2. Plug in the Trezor device.')
        instructions.push('3. Enter the PIN on the device.')
        instructions.push('4. Enter a passphrase if one was used.')
        instructions.push('5. Trezor Suite will load and sync, displaying balances for each coin.')
        instructions.push('')
      } else if (isColdcard) {
        if (hardwareModel) {
          instructions.push(`Coldcard Device: ${hardwareModel}`)
        } else {
          instructions.push('Coldcard')
        }
        instructions.push('')
        instructions.push('Software: Sparrow Wallet (hardware-connected mode only)')
        instructions.push('')
        instructions.push('Steps:')
        instructions.push('1. Install Sparrow Wallet.')
        instructions.push('2. Plug in the Coldcard device or insert its MicroSD export.')
        instructions.push('3. In Sparrow: File → New Wallet → Connected Hardware Wallet.')
        instructions.push('4. Approve connection on the Coldcard.')
        instructions.push('5. Sparrow loads and syncs balances.')
        instructions.push('')
      } else if (isBitbox) {
        if (hardwareModel) {
          instructions.push(`BitBox Device: ${hardwareModel}`)
        } else {
          instructions.push('BitBox02')
        }
        instructions.push('')
        instructions.push('Software: BitBoxApp')
        instructions.push('')
        instructions.push('Steps:')
        instructions.push('1. Install BitBoxApp.')
        instructions.push('2. Plug in the BitBox02.')
        instructions.push('3. Enter the device password.')
        instructions.push('4. The app will load and display balances for all supported coins.')
        instructions.push('')
      } else if (isMetaMask) {
        instructions.push('MetaMask (Browser Extension / Mobile App)')
        instructions.push('')
        instructions.push('Steps:')
        instructions.push('1. Install MetaMask browser extension from metamask.io or the mobile app from your device\'s app store.')
        instructions.push('2. Open MetaMask and select "Import Wallet" or "Import using Secret Recovery Phrase".')
        instructions.push('3. Enter the 12-word seed phrase exactly as written.')
        instructions.push('4. Set a new password for the MetaMask wallet on this device.')
        instructions.push('5. MetaMask will restore and show Ethereum and token balances.')
        if (blockchain && blockchain !== 'Ethereum') {
          instructions.push(`6. You may need to add the ${blockchain} network: Settings → Networks → Add Network.`)
        }
        instructions.push('')
      } else if (isPhantom) {
        instructions.push('Phantom Wallet (Browser Extension / Mobile App)')
        instructions.push('')
        instructions.push('Steps:')
        instructions.push('1. Install Phantom from phantom.app or your device\'s app store.')
        instructions.push('2. Open Phantom and select "I already have a wallet".')
        instructions.push('3. Select "Import Secret Recovery Phrase".')
        instructions.push('4. Enter the 12- or 24-word seed phrase exactly as written.')
        instructions.push('5. Set a new password for Phantom on this device.')
        instructions.push('6. Phantom will restore and show Solana and token balances.')
        instructions.push('')
      } else if (isElectrum) {
        instructions.push('Electrum Wallet (Desktop)')
        instructions.push('')
        instructions.push('Steps:')
        instructions.push('1. Download Electrum from the official website: electrum.org')
        instructions.push('2. Open Electrum and select "Restore" when creating a new wallet.')
        instructions.push('3. Select "I have a seed".')
        instructions.push('4. Enter the 12-word seed phrase exactly as written.')
        instructions.push('5. If a passphrase or custom derivation path was used, click "Options" to enter them.')
        instructions.push('6. Electrum will restore and show Bitcoin balances after syncing.')
        instructions.push('')
      } else if (isExodus) {
        instructions.push('Exodus Wallet (Desktop / Mobile)')
        instructions.push('')
        instructions.push('Steps:')
        instructions.push('1. Download Exodus from the official website: exodus.com')
        instructions.push('2. Open Exodus and go to Settings → Restore from Backup.')
        instructions.push('3. Enter the 12-word seed phrase exactly as written.')
        instructions.push('4. Exodus will restore and show balances for all supported coins.')
        instructions.push('')
      } else if (isBlueWallet) {
        instructions.push('BlueWallet (Mobile)')
        instructions.push('')
        instructions.push('Steps:')
        instructions.push('1. Download BlueWallet from your device\'s app store.')
        instructions.push('2. Open BlueWallet and tap "Add Wallet" → "Import Wallet".')
        instructions.push('3. Enter the 12- or 24-word seed phrase exactly as written.')
        instructions.push('4. BlueWallet will restore and show Bitcoin balances.')
        instructions.push('')
      } else if (!keyType || keyType === 'Hardware') {
        if (hardwareModel) {
          instructions.push(`Hardware Wallet: ${hardwareModel}`)
          instructions.push('')
          instructions.push('Steps:')
          instructions.push(`1. Identify the manufacturer of your ${hardwareModel} device.`)
        } else {
          instructions.push('Hardware Wallet Recovery:')
          instructions.push('')
          instructions.push('Steps:')
          instructions.push('1. Identify the manufacturer and model of your hardware wallet device (e.g., Ledger, Trezor, Coldcard, BitBox, KeepKey, etc.).')
        }
        instructions.push('2. Visit the official manufacturer website and download their official wallet software.')
        instructions.push('   - Never download wallet software from third-party sites or links in emails.')
        instructions.push('   - Always verify you are on the official manufacturer website.')
        instructions.push('3. Install the software on a secure, private computer with a clean operating system.')
        instructions.push('4. Connect your hardware wallet device to the computer using the appropriate USB cable.')
        instructions.push('5. Open the wallet software and follow the on-screen instructions.')
        instructions.push('6. Enter the PIN or password when prompted on the device.')
        instructions.push('   - The PIN is typically entered directly on the hardware device screen.')
        instructions.push('   - If you enter the PIN incorrectly multiple times, the device may reset (check manufacturer documentation).')
        instructions.push('7. If a passphrase (also called BIP39 passphrase or "25th word") was used, enter it when prompted.')
        instructions.push('   - A passphrase is an additional word or phrase that adds an extra layer of security.')
        instructions.push('   - It is different from your seed phrase and is optional but recommended for advanced users.')
        instructions.push('   - If a passphrase was set, you MUST enter it exactly as it was created, or you will access a different wallet.')
        instructions.push('   - Passphrases are case-sensitive and can include spaces and special characters.')
        instructions.push('8. The wallet software will sync with the blockchain and display your balances.')
        instructions.push('   - Initial synchronization may take several minutes to hours depending on the blockchain size.')
        instructions.push('')
        instructions.push('If you do not have the hardware device or wallet file:')
        instructions.push('- Use the recovery seed phrase to restore the wallet in compatible software.')
        instructions.push('- The seed phrase (and optional passphrase) are the most important pieces of information - it can restore your wallet on any compatible software.')
        instructions.push('- See SCENARIO 2 below for detailed seed phrase recovery instructions.')
        instructions.push('')
      }
      if (!keyType || keyType === 'Software') {
        // Only show generic software instructions if no specific wallet was detected above
        if (!isMetaMask && !isPhantom && !isElectrum && !isExodus && !isBlueWallet) {
          instructions.push('Software Wallet Recovery:')
          instructions.push('')
          if (walletApp) {
            instructions.push(`Wallet application: ${walletApp}`)
            instructions.push('')
            instructions.push(`1. Download ${walletApp} from its official website.`)
          } else {
            instructions.push('1. Identify the wallet software that was used (e.g., Electrum, Exodus, Atomic Wallet, MetaMask, Sparrow, etc.).')
            instructions.push('   - Check if you have any wallet files, backup files, or documentation that indicates the software.')
            instructions.push('2. Download the official wallet software from the official website only.')
          }
          instructions.push('   - Verify the website URL carefully to avoid phishing sites.')
          instructions.push('   - Check for the latest version, but older versions may be needed for compatibility.')
          instructions.push(`${walletApp ? '2' : '3'}. Install the software on a secure, private computer.`)
          instructions.push(`${walletApp ? '3' : '4'}. Open the wallet software and look for "Restore", "Import", "Recover", or "Open Wallet" options.`)
          instructions.push(`${walletApp ? '4' : '5'}. Select the option to restore from seed phrase, mnemonic words, or recovery phrase.`)
          instructions.push(`${walletApp ? '5' : '6'}. Enter your recovery seed phrase (12, 18, or 24 words) exactly as written.`)
          instructions.push('   - The seed phrase is a list of words that acts as the master key to your wallet.')
          instructions.push('   - Enter the words in the exact order they were given, separated by spaces.')
          instructions.push('   - Double-check spelling and order - even one wrong word will fail.')
          instructions.push('   - Some wallets may ask you to verify by selecting words from a list.')
          instructions.push(`${walletApp ? '6' : '7'}. If a passphrase (also called BIP39 passphrase or "25th word") was used, enter it when prompted.`)
          instructions.push('   - A passphrase is an additional word or phrase that adds an extra layer of security beyond the seed phrase.')
          instructions.push('   - It is optional but recommended for advanced users who want additional protection.')
          instructions.push('   - If a passphrase was set, you MUST enter it exactly as it was created (case-sensitive).')
          instructions.push('   - Without the correct passphrase, you will access a different wallet (which may be empty).')
          instructions.push('   - Passphrases can be a single word, multiple words, or include spaces and special characters.')
          instructions.push(`${walletApp ? '7' : '8'}. If the wallet file is encrypted, enter the password when prompted.`)
          instructions.push('   - This is different from the passphrase - it is the password used to encrypt the wallet file on your computer.')
          instructions.push('   - If you do not have this password, you may need to restore from the seed phrase instead.')
          instructions.push(`${walletApp ? '8' : '9'}. Wait for the wallet to synchronize with the blockchain.`)
          instructions.push('   - This process downloads transaction history and current balances.')
          instructions.push('   - Initial sync may take time depending on the blockchain and number of transactions.')
          instructions.push(`${walletApp ? '9' : '10'}. Your balances and transaction history should appear once synchronization is complete.`)
          instructions.push('')
        }
      }

      // ---------------------------------------------------------------
      // SCENARIO 2: Seed phrase recovery — chain-specific
      // ---------------------------------------------------------------
      instructions.push('SCENARIO 2: DEVICE IS MISSING, DAMAGED, OR PIN IS UNKNOWN')
      instructions.push('')
      instructions.push('Use the recovery seed phrase.')
      instructions.push('')

      const blockchainLower = blockchain.toLowerCase()

      if (!blockchain || blockchainLower === 'bitcoin') {
        instructions.push('Bitcoin Recovery (Recommended tool: Sparrow Wallet)')
        instructions.push('')
        instructions.push('1. Download and install Sparrow Wallet from the official website.')
        instructions.push('2. Open Sparrow → click File → New Wallet.')
        instructions.push('3. Name the wallet anything you like.')
        instructions.push('4. Select "Mnemonic Words (Seed Phrase)".')
        instructions.push('5. Enter the 12- or 24-word seed phrase exactly as written.')
        instructions.push('6. Enter a passphrase if one was used.')
        instructions.push('7. Sparrow will restore the wallet automatically.')
        instructions.push('8. Wait for synchronization.')
        instructions.push('9. Bitcoin balance and transaction history will appear.')
        instructions.push('')
      }

      if (!blockchain || blockchainLower === 'ethereum' || blockchainLower === 'polygon' || blockchainLower === 'arbitrum' || blockchainLower === 'base' || blockchainLower === 'optimism' || blockchainLower === 'bnb chain' || blockchainLower === 'avalanche') {
        const networkName = blockchain || 'Ethereum'
        const isEthMainnet = !blockchain || blockchainLower === 'ethereum'
        instructions.push(`${networkName} Recovery (Recommended tool: MetaMask)`)
        instructions.push('')
        instructions.push('1. Install MetaMask browser extension from the official website: metamask.io')
        instructions.push('2. Open MetaMask and select "Import Wallet" or "Import using Secret Recovery Phrase".')
        instructions.push('3. Enter the 12-word seed phrase exactly as written.')
        instructions.push('4. Set a new password for MetaMask on this device.')
        if (!isEthMainnet) {
          instructions.push(`5. Add the ${networkName} network: Click the network dropdown at top → "Add Network" → search for "${networkName}".`)
          instructions.push('6. Switch to that network to see your balances.')
        } else {
          instructions.push('5. MetaMask defaults to Ethereum mainnet — your balances should appear.')
        }
        instructions.push('6. Check for ERC-20 tokens: some tokens may need to be manually added via "Import Tokens".')
        instructions.push('')
      }

      if (!blockchain || blockchainLower === 'solana') {
        instructions.push('Solana Recovery (Recommended tool: Phantom)')
        instructions.push('')
        instructions.push('1. Install Phantom wallet from the official website: phantom.app')
        instructions.push('2. Open Phantom and select "I already have a wallet".')
        instructions.push('3. Select "Import Secret Recovery Phrase".')
        instructions.push('4. Enter the 12- or 24-word seed phrase exactly as written.')
        instructions.push('5. Set a new password for Phantom on this device.')
        instructions.push('6. Phantom will restore and show Solana and SPL token balances.')
        instructions.push('')
      }

      if (!blockchain || blockchainLower === 'cardano') {
        instructions.push('Cardano Recovery (Recommended tools: Yoroi or Eternl)')
        instructions.push('')
        instructions.push('1. Install Yoroi browser extension or Eternl wallet from their official websites.')
        instructions.push('2. Select "Restore Wallet" or "Import Wallet".')
        instructions.push('3. Enter the 15- or 24-word seed phrase exactly as written.')
        instructions.push('4. The wallet will restore and show ADA and native token balances.')
        instructions.push('')
      }

      // If a specific chain was set but not one of the above, show generic advice
      if (blockchain && !['bitcoin', 'ethereum', 'solana', 'cardano', 'polygon', 'arbitrum', 'base', 'optimism', 'bnb chain', 'avalanche'].includes(blockchainLower)) {
        instructions.push(`${blockchain} Recovery`)
        instructions.push('')
        instructions.push(`1. Search for the official ${blockchain} wallet application.`)
        instructions.push(`2. Download the wallet software from the official ${blockchain} project website only.`)
        instructions.push('   - Verify the URL carefully to avoid phishing sites.')
        instructions.push('3. Open the wallet and look for "Restore" or "Import" options.')
        instructions.push('4. Enter your recovery seed phrase exactly as written.')
        instructions.push('5. Enter a passphrase if one was used.')
        instructions.push('6. Wait for synchronization; balances should appear.')
        instructions.push('')
      }

      // Generic fallback when no blockchain specified
      if (!blockchain) {
        instructions.push('Other Cryptocurrencies')
        instructions.push('')
        instructions.push('- Many coins require coin-specific software for recovery.')
        instructions.push('- Search: "<Coin Name> official wallet restore from seed phrase".')
        instructions.push('- Download software from the official site only.')
        instructions.push('- Restore the wallet using the same 12-/24-word seed phrase.')
        instructions.push('- Enter passphrase if one was used.')
        instructions.push('- Wait for balances to appear.')
        instructions.push('')
      }
    }
  } else if (storageType === 'multi-sig') {
    // -----------------------------------------------------------------
    // MULTI-SIG SCENARIOS
    // -----------------------------------------------------------------
    instructions.push('SCENARIO 1: ALL HARDWARE WALLETS + PINs ARE AVAILABLE')
    instructions.push('')
    instructions.push('Use Sparrow Wallet in hardware-connected mode.')
    instructions.push('')
    instructions.push('Steps:')
    instructions.push('1. Install Sparrow Wallet from the official site.')
    instructions.push('2. Open Sparrow → File → New Wallet → Multi-Signature Wallet.')
    instructions.push('3. Enter wallet name.')
    instructions.push('4. Select number of cosigners and required signatures.')
    instructions.push('5. Add each cosigner by connecting the hardware wallet.')
    if (hasProviderKeys) {
      instructions.push('5a. For provider-managed keys, use the provider recovery section above to access those keys first.')
    }
    instructions.push('6. Enter PIN/password and passphrase on each device as prompted.')
    instructions.push('7. Wallet will sync and show balances.')
    instructions.push('8. Funds can now be spent after enough cosigners approve transactions.')
    if (hasProviderKeys) {
      instructions.push('8a. Note: Provider-managed keys require coordination with the provider for each transaction.')
    }
    instructions.push('')
    instructions.push('SCENARIO 2: ONE OR MORE DEVICES MISSING / DAMAGED')
    instructions.push('')
    instructions.push('Recover using seed phrases or backup files.')
    if (hasProviderKeys) {
      instructions.push('')
      instructions.push('Note: If provider-managed keys are involved, use the provider recovery section above to access those keys first.')
    }
    instructions.push('')
    instructions.push('Option A: Seed Phrase')
    instructions.push('')
    instructions.push('1. Open Sparrow → File → New Wallet → Multi-Signature Wallet.')
    instructions.push('2. Enter wallet name.')
    instructions.push('3. Select number of cosigners and required signatures.')
    instructions.push('4. Add cosigners: connect available devices and enter seed phrases for missing devices.')
    instructions.push('5. Enter passphrases if required.')
    instructions.push('6. Wait for wallet to sync; confirm balances.')
    instructions.push('')
    instructions.push('Option B: Sparrow Backup File (.7z)')
    instructions.push('')
    instructions.push('1. Ensure you have the .7z backup file.')
    instructions.push('2. Open Sparrow → File → Restore Wallet from Backup.')
    instructions.push('3. Enter backup password if prompted.')
    instructions.push('4. Wallet restores all cosigners and balances.')
    instructions.push('5. Verify required number of cosigners and synchronization.')
    instructions.push('')
    instructions.push('SCENARIO 3: USING EXTENDED PUBLIC KEY (XPUB) FILES')
    instructions.push('')
    instructions.push('If you have extended public key (xpub) files for the cosigners:')
    instructions.push('')
    instructions.push('1. Open Sparrow → File → New Wallet → Multi-Signature Wallet.')
    instructions.push('2. Enter wallet name.')
    instructions.push('3. Select number of cosigners and required signatures.')
    instructions.push('4. Add each cosigner by importing the extended public key (xpub) file.')
    instructions.push('5. Confirm multi-sig configuration (number of cosigners, required signatures).')
    instructions.push('6. Wait for wallet synchronization.')
    instructions.push('')
    instructions.push('Note: Extended public keys allow you to view balances and receive funds, but you cannot spend funds without the private keys or seed phrases for the required number of cosigners.')
    instructions.push('')

  }

  // -----------------------------------------------------------------------
  // GENERAL RECOVERY TIPS
  // -----------------------------------------------------------------------
  instructions.push('GENERAL RECOVERY TIPS')
  instructions.push('')
  instructions.push('- Always verify you are using the official wallet software from the manufacturer.')
  instructions.push('- Be cautious of phishing attempts - never enter your seed phrase on a website.')
  instructions.push('- After accessing funds, only send a small amount first to confirm sending ability and delivery.')
  instructions.push('- Keep multiple secure backups of seed phrases and passwords.')
  instructions.push('- Consider consulting with a reputable cryptocurrency expert or company if you are unsure about the process. Seek guided step by step help, but do not share seed phrases with them.')
  instructions.push('')

  return instructions.join('\n')
}

function populateInstructions() {
  const instructions = getRecommendedInstructions()
  // Update the recoveryInstructions field in the parent form
  if (props.onUpdate) {
    props.onUpdate('recoveryInstructions', instructions)
  } else {
    // Fallback: emit update:modelValue (though this won't work for the button field)
    emit('update:modelValue', instructions)
  }
}
</script>
