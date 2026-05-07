export const authContent = {
  barrister: {
    login: {
      badge: 'Barrister workspace',
      heading: 'Find, organise, and cite from one workflow.',
      description:
        'Search chambers books and JADE together, build authority lists, and export court-ready citations without losing research context.',
      formDescription:
        'Sign in to continue research, check loan status, and finish authority lists already in progress.',
      highlights: [
        {
          icon: 'solar:magnifer-linear',
          title: 'One search surface',
          body: 'Books, cases, and legislation in a single flow.',
        },
        {
          icon: 'solar:list-check-linear',
          title: 'Authority workflow',
          body: 'Capture authorities, track pinpoints, and keep structure clean.',
        },
        {
          icon: 'solar:file-download-linear',
          title: 'Court-ready output',
          body: 'Move from research to AGLC export faster.',
        },
      ],
      metrics: ['Books + JADE', 'AGLC-ready', 'Live availability'],
    },
    signup: {
      badge: 'Barrister onboarding',
      heading: 'Set up your research workspace in minutes.',
      description:
        'Create your account, join chambers, and move from first search to first authority list without extra setup overhead.',
      formDescription:
        'Create a barrister account to search across books and JADE, request loans, and export for court.',
      highlights: [
        {
          icon: 'solar:widget-2-linear',
          title: 'Fast first win',
          body: 'Start researching immediately after sign-up.',
        },
        {
          icon: 'solar:book-bookmark-linear',
          title: 'Library visibility',
          body: 'See availability, request books, and track due dates.',
        },
        {
          icon: 'solar:document-text-linear',
          title: 'Structured authorities',
          body: 'Build court-ready lists with less manual cleanup.',
        },
      ],
      metrics: ['Quick onboarding', 'Search first', 'Authority export'],
    },
  },
  clerk: {
    login: {
      badge: 'Clerk workspace',
      heading: 'Keep the chambers library accurate and moving.',
      description:
        'Manage library quality, approve requests, and keep barristers working from a reliable shared library.',
      formDescription:
        'Sign in to manage library coverage, loan approvals, and member activity from one control point.',
      highlights: [
        {
          icon: 'solar:book-2-linear',
          title: 'Library control',
          body: 'Track stock, loan status, and metadata in one system.',
        },
        {
          icon: 'solar:check-square-linear',
          title: 'Request handling',
          body: 'Approve, deny, and monitor loan requests quickly.',
        },
        {
          icon: 'solar:chart-2-linear',
          title: 'Operational insight',
          body: 'See overdue pressure and library health at a glance.',
        },
      ],
      metrics: ['Loan approvals', 'Metadata health', 'Chambers visibility'],
    },
    signup: {
      badge: 'Clerk onboarding',
      heading: 'Launch the chambers library with a clean operating system.',
      description:
        'Create the chambers workspace, import books, invite members, and give barristers a library they can trust.',
      formDescription:
        'Create a clerk account to set up the library, import books, and invite barristers into chambers.',
      highlights: [
        {
          icon: 'solar:library-linear',
          title: 'Chambers setup',
          body: 'Name your library, import books, and start with a clear structure.',
        },
        {
          icon: 'solar:scanner-linear',
          title: 'Book intake',
          body: 'Import CSVs or scan ISBNs to build the library faster.',
        },
        {
          icon: 'solar:users-group-rounded-linear',
          title: 'Shared rollout',
          body: 'Invite barristers and turn setup into a working library.',
        },
      ],
      metrics: ['2 min setup', 'CSV + scan', 'Member invites'],
    },
  },
};
