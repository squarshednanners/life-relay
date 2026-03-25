export interface EstatePrepCategory {
  id: string
  title: string
  description: string
  sections: { path: string; label: string }[]
  priority: 'essential' | 'recommended' | 'optional'
}

// Legacy alias
export type WillPrepCategory = EstatePrepCategory

export const estatePrepCategories: EstatePrepCategory[] = [
  {
    id: 'identity-family',
    title: 'Your Identity & Family',
    description:
      'Your attorney needs to know who you are, your family structure, and any dependents. ' +
      'This determines guardianship provisions, spousal rights, and how your estate is divided.',
    sections: [{ path: '/people', label: 'People & Personal Info' }],
    priority: 'essential',
  },
  {
    id: 'beneficiaries',
    title: 'Who Gets What',
    description:
      'Beneficiary designations tell your attorney how you want your assets distributed. ' +
      "Without clear beneficiaries, your state's intestacy laws decide — which may not match your wishes.",
    sections: [{ path: '/beneficiaries', label: 'Beneficiaries' }],
    priority: 'essential',
  },
  {
    id: 'executor-contacts',
    title: 'Your Executor, Trustee & Key Contacts',
    description:
      'Your executor carries out your will\'s instructions. If you establish a trust, your trustee manages ' +
      'it on behalf of beneficiaries — potentially for years or decades. Choose people you trust who are ' +
      'organized and responsible. Your attorney also needs to know your other key advisors.',
    sections: [{ path: '/important-contacts', label: 'Important Contacts' }],
    priority: 'essential',
  },
  {
    id: 'assets',
    title: 'Your Assets',
    description:
      'An attorney needs a complete picture of what you own — bank accounts, property, vehicles, ' +
      'investments, and digital assets including cryptocurrency. For trust planning, this also determines ' +
      'which assets should be funded (retitled) into the trust.',
    sections: [
      { path: '/financial-accounts', label: 'Financial Accounts' },
      { path: '/property', label: 'Property & Real Estate' },
      { path: '/vehicles', label: 'Vehicles' },
      { path: '/retirement-accounts', label: 'Retirement & Investment' },
      { path: '/crypto-assets', label: 'Crypto Assets' },
      { path: '/digital-assets', label: 'Digital Assets' },
      { path: '/business-ownership', label: 'Business Ownership' },
    ],
    priority: 'essential',
  },
  {
    id: 'liabilities',
    title: 'Your Debts & Obligations',
    description:
      "Debts don't disappear when you die — they're paid from your estate before beneficiaries " +
      'receive anything. Your attorney needs the full picture to plan effectively and determine ' +
      'whether a trust can help protect assets from creditors.',
    sections: [
      { path: '/debts', label: 'Debts & Loans' },
      { path: '/credit-cards', label: 'Credit Cards' },
    ],
    priority: 'recommended',
  },
  {
    id: 'insurance',
    title: 'Life Insurance',
    description:
      'Life insurance proceeds pass directly to named beneficiaries, bypassing your will and probate. ' +
      'Your attorney needs to know about policies to coordinate with the overall estate plan. ' +
      'An irrevocable life insurance trust (ILIT) can exclude proceeds from your taxable estate.',
    sections: [{ path: '/life-insurance', label: 'Life Insurance' }],
    priority: 'recommended',
  },
  {
    id: 'trusts-legal',
    title: 'Existing Legal Documents & Trusts',
    description:
      'If you already have a will, trust, power of attorney, or advance directive, your attorney ' +
      'needs to review them. Bring originals or copies to your meeting. Existing trusts may need ' +
      'to be amended, restated, or replaced depending on your current goals.',
    sections: [
      { path: '/legal-documents', label: 'Legal Documents' },
      { path: '/trusts', label: 'Trusts' },
      { path: '/physical-storage', label: 'Physical Storage Locations' },
    ],
    priority: 'recommended',
  },
  {
    id: 'trust-planning',
    title: 'Trust Planning Considerations',
    description:
      'Trusts can avoid probate, protect assets from creditors, provide for minor children or ' +
      'special needs beneficiaries, and reduce estate taxes. Common types include revocable living ' +
      'trusts, irrevocable trusts, special needs trusts, and charitable trusts. Your attorney will ' +
      'recommend a structure based on your assets, family situation, and state laws. Key decisions ' +
      'include which assets to fund into the trust, who serves as successor trustee, and how ' +
      'distributions are structured (outright vs. staggered vs. discretionary).',
    sections: [
      { path: '/beneficiaries', label: 'Beneficiaries' },
      { path: '/important-contacts', label: 'Important Contacts (Trustees)' },
      { path: '/trusts', label: 'Existing Trusts' },
      { path: '/property', label: 'Property (Trust Funding)' },
      { path: '/financial-accounts', label: 'Accounts (Trust Funding)' },
    ],
    priority: 'recommended',
  },
  {
    id: 'final-wishes',
    title: 'Final Wishes & Instructions',
    description:
      'While not legally binding in most states, your letter of instruction and final wishes help ' +
      'your executor, trustee, and family understand your preferences for funeral arrangements, ' +
      'pet care, and personal messages.',
    sections: [
      { path: '/letter-of-instruction', label: 'Letter of Instruction' },
      { path: '/final-wishes', label: 'Final Wishes & Services' },
      { path: '/pet-care', label: 'Pet Care' },
    ],
    priority: 'optional',
  },
]

// Legacy alias
export const willPrepCategories = estatePrepCategories

export const attorneyMeetingChecklist = [
  { category: 'Documents to Bring', items: [
    'Government-issued photo ID',
    'This Attorney Preparation Summary (generated below)',
    'Any existing will, trust, or power of attorney documents',
    'Recent tax returns (last 1-2 years)',
    'Property deeds and vehicle titles',
    'Life insurance policy documents',
    'Retirement account statements',
    'Business formation documents (if applicable)',
  ]},
  { category: 'Information to Know', items: [
    'Full legal names and dates of birth of all beneficiaries',
    'Who you want as executor (and a backup)',
    'Who you want as trustee and successor trustee (if considering a trust)',
    'Who you want as guardian for minor children (if applicable)',
    'Any specific bequests (heirlooms, charitable gifts)',
    'Whether you want assets distributed outright or in trust',
    'Your approximate net worth (for estate tax planning)',
    'Your state of residence (trust and estate laws vary by state)',
  ]},
  { category: 'Questions to Ask Your Attorney', items: [
    'Do I need a simple will, or should I consider a trust?',
    'What type of trust is right for my situation?',
    'Which assets should be funded into the trust?',
    'How should I handle digital assets and cryptocurrency?',
    'What happens to my debts after I pass?',
    'Should I set up a power of attorney and advance directive?',
    'Do I need a separate life insurance trust (ILIT)?',
    'How often should I update my estate plan?',
    'What are the estate tax implications in my state?',
  ]},
]
