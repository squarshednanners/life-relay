/**
 * Runbook steps — the recommended sequence of actions for an executor or family
 * member to take after a death. Steps are organized by timeframe, with optional
 * references to specific sections of the vault.
 *
 * Each step's `references` array maps to section paths. The view will surface
 * the user's actual data (executor name, attorney contact, etc.) where relevant.
 */

export interface RunbookStep {
  title: string
  description: string
  references?: Array<{ label: string; path: string }>
}

export interface RunbookPhase {
  id: string
  title: string
  subtitle: string
  steps: RunbookStep[]
}

export const runbookPhases: RunbookPhase[] = [
  {
    id: 'immediate',
    title: 'Immediate (First 24-48 Hours)',
    subtitle: 'Take care of the most urgent things first. Everything else can wait.',
    steps: [
      {
        title: 'Pronounce the death officially',
        description: 'If the death happened at home, call 911 or hospice (if enrolled). The medical professional will issue a death pronouncement, which is required to obtain a death certificate later.',
      },
      {
        title: 'Notify immediate family and close friends',
        description: 'You don\'t need to call everyone — just the people who need to know first. Ask them to help spread the word.',
        references: [
          { label: 'Family members', path: '/people' },
          { label: 'Important contacts', path: '/important-contacts' },
        ],
      },
      {
        title: 'Contact the funeral home and honor final wishes',
        description: 'Choose a funeral home if pre-arrangements weren\'t made. Share the deceased\'s preferences for burial, cremation, services, and any pre-paid arrangements.',
        references: [
          { label: 'Final wishes', path: '/final-wishes' },
          { label: 'Letter of instruction', path: '/letter-of-instruction' },
        ],
      },
      {
        title: 'Care for pets',
        description: 'Make sure pets are fed, watered, and have a temporary caregiver. Reference detailed feeding, medication, and behavior info.',
        references: [{ label: 'Pet care', path: '/pet-care' }],
      },
      {
        title: 'Secure the property',
        description: 'Lock up the home, secure valuables, and bring in mail/packages. If the deceased lived alone, consider putting timers on lights and asking a trusted neighbor to keep an eye on things.',
        references: [{ label: 'Property', path: '/property' }],
      },
      {
        title: 'Notify the executor and attorney',
        description: 'The named executor should know they have responsibilities. The estate attorney can guide the legal process from here.',
        references: [{ label: 'Important contacts', path: '/important-contacts' }],
      },
    ],
  },
  {
    id: 'first-week',
    title: 'First Week',
    subtitle: 'Begin the formal processes that everything else depends on.',
    steps: [
      {
        title: 'Order certified death certificates',
        description: 'Order at least 10-20 certified copies. Many institutions (banks, insurers, government) require an original. Order through the funeral home or directly from the state vital records office.',
      },
      {
        title: 'Locate the will and trust documents',
        description: 'Find the original will, trust documents, and any letter of instruction. The estate attorney will need these.',
        references: [
          { label: 'Legal documents', path: '/legal-documents' },
          { label: 'Trusts', path: '/trusts' },
          { label: 'Physical storage locations', path: '/physical-storage' },
        ],
      },
      {
        title: 'Notify the employer',
        description: 'Contact HR for final paycheck, accrued PTO, group life insurance through work, retirement plan, and any other benefits. Some benefits have short claim windows.',
        references: [{ label: 'Employment benefits', path: '/employment-benefits' }],
      },
      {
        title: 'Notify Social Security',
        description: 'Call (800) 772-1213 or visit a local office. Funeral homes often handle this notification, but confirm. Social Security overpayments must be returned.',
      },
      {
        title: 'Forward mail',
        description: 'File a Change of Address with USPS to forward mail to the executor. This catches important bills, account statements, and time-sensitive notices.',
      },
    ],
  },
  {
    id: 'first-month',
    title: 'First 2-4 Weeks',
    subtitle: 'File claims, notify institutions, and prevent fees from accumulating.',
    steps: [
      {
        title: 'File life insurance claims',
        description: 'Contact each life insurance company or agent. You\'ll need the policy number, death certificate, and beneficiary identification. Most claims pay out in 30-60 days.',
        references: [{ label: 'Life insurance', path: '/life-insurance' }],
      },
      {
        title: 'Notify banks and submit beneficiary claims',
        description: 'Banks will freeze sole-owner accounts pending probate. Joint accounts with rights of survivorship transfer immediately. POD/TOD accounts pass to beneficiaries directly with a death certificate.',
        references: [
          { label: 'Financial accounts', path: '/financial-accounts' },
          { label: 'Retirement & investment accounts', path: '/retirement-accounts' },
        ],
      },
      {
        title: 'Notify credit card companies',
        description: 'Cancel cards (or convert authorized-user accounts). Disputes need to be filed quickly. Don\'t pay credit card debt out of pocket — it comes from the estate.',
        references: [{ label: 'Credit cards', path: '/credit-cards' }],
      },
      {
        title: 'Cancel subscriptions and recurring charges',
        description: 'Streaming services, gym memberships, software subscriptions, magazines, etc. Check the autopay sources documented in Credit Cards and Financial Accounts.',
        references: [
          { label: 'Utilities & subscriptions', path: '/utilities' },
          { label: 'Loyalty programs', path: '/loyalty-programs' },
        ],
      },
      {
        title: 'Notify utility companies',
        description: 'Transfer or cancel utility accounts at the deceased\'s residence. If the property will be sold or held vacant, keep utilities active enough to prevent damage (heat in winter, etc.).',
        references: [
          { label: 'Utilities & subscriptions', path: '/utilities' },
          { label: 'Property', path: '/property' },
        ],
      },
      {
        title: 'Locate and secure crypto assets',
        description: 'Crypto requires immediate attention — exchange accounts can lock heirs out, and self-custodied wallets need their seed phrases handled per the recovery instructions. Read the heir instructions for each asset before doing anything.',
        references: [{ label: 'Crypto assets', path: '/crypto-assets' }],
      },
    ],
  },
  {
    id: 'first-quarter',
    title: 'First 2-3 Months',
    subtitle: 'Begin probate, transfer titles, and handle the larger transitions.',
    steps: [
      {
        title: 'Begin probate (if needed)',
        description: 'The attorney will determine if probate is needed. Assets in trusts, joint ownership, or with beneficiary designations typically skip probate. The will is filed with the probate court and the executor is officially appointed.',
        references: [{ label: 'Legal documents', path: '/legal-documents' }],
      },
      {
        title: 'File final tax returns',
        description: 'A final personal tax return covers income up to the date of death. The estate may also need its own tax return (Form 1041) if it has income during administration. Work with the deceased\'s CPA.',
        references: [{ label: 'Tax info', path: '/tax-info' }],
      },
      {
        title: 'Transfer property titles',
        description: 'Real estate held in trust transfers without probate. Real estate held individually requires probate or transfer-on-death deed processing. Update homeowner\'s insurance to reflect new ownership.',
        references: [
          { label: 'Property', path: '/property' },
          { label: 'Asset documents', path: '/asset-documents' },
        ],
      },
      {
        title: 'Transfer vehicle titles',
        description: 'Each state has a process for transferring vehicle titles after death — usually through the DMV with a death certificate, the will or letters testamentary, and the existing title. Pay off any liens or notify the lender.',
        references: [{ label: 'Vehicles', path: '/vehicles' }],
      },
      {
        title: 'Memorialize or close digital accounts',
        description: 'Use Apple Legacy Contact, Google Inactive Account Manager, Facebook Memorialization, etc. to access or close online accounts. Download data you want to preserve before closing.',
        references: [{ label: 'Digital assets', path: '/digital-assets' }],
      },
      {
        title: 'Wind down the business (if applicable)',
        description: 'Follow the documented succession plan. Notify clients, complete in-progress work, file final tax returns, dissolve the entity with the state.',
        references: [{ label: 'Business ownership', path: '/business-ownership' }],
      },
    ],
  },
  {
    id: 'long-term',
    title: 'Ongoing / Long-Term',
    subtitle: 'Don\'t rush. Major decisions can wait until the dust settles.',
    steps: [
      {
        title: 'Distribute personal property per the will',
        description: 'Once probate clears (or per trust terms), distribute personal items as documented. Keep records of what went to whom.',
      },
      {
        title: 'Update your own estate plan',
        description: 'Inheriting assets often changes the optimal beneficiary structure on your own accounts. Schedule a review with your own attorney.',
      },
      {
        title: 'Take care of yourself',
        description: 'Grief is exhausting. Don\'t make major financial decisions in the first 6-12 months. Lean on family, friends, and professionals.',
      },
    ],
  },
]

export const runbookDonts: string[] = [
  'Don\'t make major financial decisions in the first 6-12 months — including selling the house, buying a new home, or making large investments.',
  'Don\'t access a deceased person\'s accounts without legal authority. This includes using their debit card, transferring funds, or logging into accounts. It can constitute fraud even with good intentions.',
  'Don\'t pay creditors out of pocket. Estate debts are paid from the estate, in a specific legal order. Your attorney will guide this.',
  'Don\'t cancel anything irreversibly until you\'ve exported data you might want — photos, emails, business records, etc.',
  'Don\'t throw away anything that looks like a financial document for at least a year. Even tax forms and statements you don\'t recognize might be needed.',
  'Don\'t feel rushed by anyone — including funeral homes, lawyers, or financial advisors. Take the time to make good decisions.',
]
