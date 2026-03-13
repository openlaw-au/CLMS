export const heroContent = {
  barrister: {
    titleLines: ['Find it. Cite it.', 'Track it.'],
    summary:
      'connects your books and JADE case law in one search. Build authority lists as you research and export court-ready citations in AGLC format.',
    cta: 'Get Started',
    secondaryCta: 'Watch How It Works',
    secondaryIcon: 'solar:play-circle-linear',
  },
  clerk: {
    titleLines: ['Scan it. Organise it.', 'Control it.'],
    summary:
      'gives you real-time inventory across every location, automated overdue reminders, and ISBN scan to catalogue in seconds, not hours.',
    cta: 'Get Started',
    secondaryCta: 'Book a Walkthrough',
    secondaryIcon: 'solar:calendar-linear',
  },
};

export const logoCloud = [
  { src: '/assets/Jade.png', alt: 'JADE', height: 24 },
  { src: '/assets/OpenLaw.png', alt: 'Open Law', height: 24 },
  { src: '/assets/VR.png', alt: 'Victorian Reports', height: 20 },
  { src: '/assets/PPP.png', alt: 'Pinpoint Press', height: 20 },
];

export const featureSets = {
  barrister: {
    label: 'For Barristers',
    icon: 'solar:square-academic-cap-linear',
    cards: [
      {
        id: 'one-search',
        icon: 'solar:magnifer-linear',
        title: 'One Search, Every Resource',
        description:
          'Finding a book means checking three locations and sending a message hoping someone replies. CLMS connects your physical catalogue with JADE in one place.',
        checks: [
          'Books, case law, and legislation in one place',
          'Filter by location and practice area',
          'JADE integration',
        ],
      },
      {
        id: 'citations',
        icon: 'solar:document-text-linear',
        title: 'Court-Ready Citations',
        description:
          'Every court submission needs an authority list, but compiling one the night before is still the norm. Build yours as you research, not after.',
        checks: ['Authority lists with drag reorder', 'AGLC format export', 'One-click PDF'],
      },
      {
        id: 'mobile',
        icon: 'solar:smartphone-linear',
        title: 'Library in Your Pocket',
        description:
          "You're in court and need to check if a book is available before heading back to chambers. CLMS works from your phone. Search, borrow, and return, even offline.",
        checks: ['Barcode scanning', 'Mobile check-in/out', 'Mobile-friendly interface'],
      },
    ],
  },
  clerk: {
    label: 'For Clerks & Librarians',
    icon: 'solar:clipboard-list-linear',
    cards: [
      {
        id: 'lending',
        icon: 'solar:checklist-minimalistic-linear',
        title: 'Every Book Accounted For',
        description:
          'Chambers lending runs on the honour system. Someone takes a book and it vanishes for weeks. CLMS adds the tracking that the honour system is missing.',
        checks: ['Request and approval workflow', 'Automated overdue reminders', '"Who has this book?" One click'],
      },
      {
        id: 'isbn',
        icon: 'solar:scanner-linear',
        title: 'Add Books in Seconds',
        description:
          "A retiring barrister donates fifty books. Without CLMS, that's an afternoon of manual entry. With it, scan the ISBN and everything auto-fills.",
        checks: ['ISBN auto-cataloguing', 'Multi-location assignment', 'Practice area categorisation'],
      },
      {
        id: 'permissions',
        icon: 'solar:shield-user-linear',
        title: 'Built for Chambers',
        description:
          'Not every member should have the same access. Barristers search and borrow. Clerks manage inventory. CLMS enforces this by role.',
        checks: ['Role-based permissions', 'Share Authority Lists with colleagues', 'Multi-location structure'],
      },
    ],
  },
};

export const trustCards = [
  {
    id: 'locations',
    icon: 'solar:buildings-linear',
    title: 'Multi-Location Management',
    description:
      "One catalogue across every location. Know what's where before walking across the building or ordering a duplicate.",
    metricIcon: 'solar:map-point-linear',
    metric: '8',
    metricLabel: 'Locations',
  },
  {
    id: 'collaboration',
    icon: 'solar:users-group-rounded-linear',
    title: 'Cross-Chambers Collaboration',
    description:
      'Barristers move between chambers. Books follow them. CLMS tracks inter-chamber loans so nothing falls through the cracks when resources cross boundaries.',
    metricIcon: 'solar:book-2-linear',
    metric: '2,847',
    metricLabel: 'Books Cataloged',
  },
  {
    id: 'compliance',
    icon: 'solar:shield-check-linear',
    title: 'Legal Compliance',
    description:
      'Full audit trail on every loan, return, and catalogue change. Citation tracking meets professional standards. When compliance asks, you have the answer.',
    metricIcon: 'solar:transfer-horizontal-linear',
    metric: '23',
    metricLabel: 'Active Loans Tracked',
  },
];

export const reviewCards = {
  barrister: [
    {
      name: 'James Chen',
      chamber: 'Barrister, Owen Dixon West',
      quote: 'One search found the textbook and the JADE authority. Used to take me half a day.',
      initials: 'JC',
      tone: 'brand',
    },
    {
      name: 'Sarah Park',
      chamber: 'Barrister, Owen Dixon East',
      quote: 'Exported my AGLC authority list in two clicks. Night-before panic is officially over.',
      initials: 'SP',
      tone: 'blue',
    },
  ],
  clerk: [
    {
      name: 'Margaret Thompson',
      chamber: 'Senior Clerk, Owen Dixon Chambers',
      quote: "Scanned 50 donated books in under an hour. The old way would've taken me a full week.",
      initials: 'MT',
      tone: 'green',
    },
    {
      name: 'David Liu',
      chamber: 'Librarian, Commercial Bar',
      quote: 'Overdue reminders go out automatically. I stopped chasing people.',
      initials: 'DL',
      tone: 'violet',
    },
  ],
};
