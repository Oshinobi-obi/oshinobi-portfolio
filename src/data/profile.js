export const profile = {
  name: 'Oshinobi',
  role: 'Software Developer · BSIT Graduate',
  tagline: 'Building software that serves communities',
  location: 'Quezon City, PH',

  githubUser: 'Oshinobi-obi',
  githubUrl: 'https://github.com/Oshinobi-obi',

  photo: '',

  about: [
    "I'm a BSIT graduate of Quezon City University (QCU) who builds apps, web tools, and community-focused technology.",
    "I'm currently a DOLE GIP intern at the DepEd NCR Regional Office - where I also did my OJT - building internal systems that real offices rely on every day.",
    'I like software that quietly makes someone\'s day easier: a supply request that takes seconds instead of paperwork, a safety alert that reaches a barangay in real time.',
  ],

  facts: [
    { label: 'Education', value: 'BSIT - Quezon City University' },
    { label: 'Internship', value: 'DOLE GIP - DepEd NCR Regional Office' },
    { label: 'Previously', value: 'OJT - DepEd NCR Regional Office' },
    { label: 'Location', value: 'Quezon City, PH' },
  ],

  tools: [
    'C#',
    'Blazor',
    'ASP.NET Core MVC',
    'Flutter / Dart',
    'PHP',
    'MySQL',
    'Firebase (FCM)',
    'ESP32 / BLE',
    'HTML / CSS / JS',
    'Visual Studio',
    'MySQL Workbench',
  ],

  projects: [
    {
      title: 'Asset Shop',
      kicker: 'DepEd NCR · Asset Management Section',
      description:
        'Shopee-inspired supply requisition & inventory portal for DepEd NCR\'s Asset Management Section, used by 22 office/unit accounts.',
      stack: ['Blazor', 'C#', 'MySQL'],
      repo: 'Oshinobi-obi/AMS_Shopee',
      highlight: '22 office accounts',
      gallery: 'ams-shopee',
    },
    {
      title: 'SafeChain',
      kicker: 'Barangay Gulod · Community Safety',
      description:
        'Flutter community safety & IoT tracking app. ESP32 wearable over BLE (Nordic UART), real-time GPS with geofencing, FCM push notifications, PHP/MySQL backend.',
      stack: ['Flutter', 'ESP32 / BLE', 'FCM', 'PHP', 'MySQL'],
      repo: 'Oshinobi-obi/safechain_mobile',
      highlight: 'IoT + real-time GPS',
    },
    {
      title: 'Dat2DTR',
      kicker: 'Offline Windows Desktop Tool',
      description:
        'Converts biometrics .dat exports into Daily Time Records with automatic Late/Undertime detection, leave computation, and export to .xlsx / .pdf.',
      stack: ['C#', 'Windows', 'XLSX / PDF'],
      repo: 'Oshinobi-obi/Dat2DTR',
      highlight: 'Fully offline',
      gallery: 'dat2dtr',
    },
    {
      title: 'STEM Education Training Hub',
      kicker: 'Undergraduate Thesis',
      description:
        'Web-based system for online registration, qualification, events, certificates, and chat support.',
      stack: ['ASP.NET Core MVC', 'C#', 'MySQL'],
      repo: 'Oshinobi-obi/StemHub',
      highlight: 'Thesis project',
      gallery: 'stemhub',
    },
    {
      title: 'QCU GWA Calculator',
      kicker: 'For QCU BSIT Students',
      description:
        'Single-file web app that computes General Weighted Average with Latin honors evaluation and semester locking.',
      stack: ['HTML', 'CSS', 'JavaScript'],
      repo: '',
      highlight: 'Single file',
    },
  ],

  gallery: [
    {
      folder: 'ams-shopee',
      title: 'Asset Shop',
      subtitle: 'Requisition portal · office side',
      repo: 'Oshinobi-obi/AMS_Shopee',
      captions: {},
      categories: [
        { folder: '01-login-and-browse', label: 'Log in & browse catalog' },
        { folder: '02-request-supplies', label: 'Request supplies' },
        { folder: '03-track-and-print-ris', label: 'Track & print RIS' },
        { folder: '04-issued-and-signed-copy', label: 'Issued & signed RIS' },
        { folder: '05-my-app-cse', label: 'My APP-CSE' },
        { folder: '06-suggest-a-supply', label: 'Suggest a supply' },
        { folder: '07-announcements', label: 'Announcements' },
        { folder: '08-help-whats-new-and-account', label: "Help, what's new & account" },
        { folder: '09-on-a-phone', label: 'On a phone' },
      ],
    },
    {
      folder: 'ams-admin',
      title: 'AMS Admin',
      subtitle: 'Storage & report system · admin side',
      repo: 'Oshinobi-obi/AMS_Storage_and_Report_System',
      captions: {},
      categories: [
        { folder: '01-login-and-dashboard', label: 'Login & dashboard' },
        { folder: '02-review-and-approve', label: 'Review & approve', role: 'Requisitions' },
        { folder: '03-reject-requisition', label: 'Reject a requisition', role: 'Requisitions' },
        { folder: '04-release-items', label: 'Release items', role: 'Requisitions' },
        { folder: '05-supply-suggestions', label: 'Supply suggestions', role: 'Supplies' },
        { folder: '06-catalog-add-item', label: 'Catalog · add item', role: 'Supplies' },
        { folder: '07-inventory-and-stock-card', label: 'Inventory & stock card', role: 'Supplies' },
        { folder: '08-app-cse', label: 'APP-CSE allocation', role: 'Supplies' },
        { folder: '09-reports-and-rsmi', label: 'Reports & RSMI', role: 'Reports' },
        { folder: '10-splv-sphv-deliveries', label: 'SPLV / SPHV deliveries', role: 'Property' },
        { folder: '11-property-register', label: 'Property register', role: 'Property' },
        { folder: '12-property-documents', label: 'Property documents', role: 'Property' },
        { folder: '13-employees', label: 'Employees', role: 'Admin' },
        { folder: '14-announcements', label: 'Announcements', role: 'Admin' },
        { folder: '15-accounts-and-activity', label: 'Accounts & activity log', role: 'Admin' },
        { folder: '16-settings-and-profile', label: 'Settings & profile', role: 'Admin' },
      ],
    },
    {
      folder: 'dat2dtr',
      title: 'Dat2DTR',
      subtitle: 'Biometrics .dat → Daily Time Record',
      repo: 'Oshinobi-obi/Dat2DTR',
      captions: {
        'gifs/2-edit-dtr-fix-missing-scan.gif': 'Edit a DTR and fix a missing scan',
        'gifs/3-file-leave-and-computation.gif': 'File a leave and see the computation',
        'DAT2DTR/04-edit-dtr-late-undertime.png': 'Edit DTR — late & undertime',
        'DAT2DTR/10-ticked-employees-suspended-from-3pm.png': 'Ticked employees suspended from 3 PM',
        'DAT2DTR/14-saved-pdf-dtr.png': 'Saved PDF — DTR',
        'DAT2DTR/15-saved-pdf-computation-of-leaves.png': 'Saved PDF — computation of leaves',
        'DAT2DTR/16-saved-excel-dtr-sheet.png': 'Saved Excel DTR sheet',
      },
      categories: [{ folder: 'DAT2DTR', label: 'All screens' }],
    },
    {
      folder: 'stemhub',
      title: 'STEM Education Training Hub',
      subtitle: 'Admin & trainer side · events, certificates, support',
      repo: 'Oshinobi-obi/StemHub',
      captions: {},
      categories: [
        { folder: 'admin-verify-nsef-team', label: 'Verify NSEF Teams', role: 'Admin' },
        { folder: 'admin-event-to-certificate', label: 'Events → Certificates', role: 'Admin' },
        { folder: 'trainer-view', label: 'Trainer View', role: 'Trainer' },
        { folder: 'chat-support', label: 'Chat Support', role: 'Support' },
      ],
    },
    {
      folder: 'stemhub-trainee',
      title: 'STEM Hub Trainee Portal',
      subtitle: 'Participant side · accounts & NSEF registration',
      repo: 'Oshinobi-obi/StemHubTrainee',
      captions: {},
      categories: [
        { folder: 'participant-account-and-registration', label: 'Account & Registration', role: 'Participant' },
        { folder: 'participant-nsef-registration', label: 'NSEF Registration', role: 'Participant' },
      ],
    },
  ],

  hiddenRepos: ['Oshinobi-obi'],

  contact: [
    { label: 'Email', value: 'Intertas, Mico D.', href: 'mailto:intertas.mico.dichoso@gmail.com'},
      { label: 'LinkedIn', value: 'Mico Intertas', href: 'https://www.linkedin.com/in/intertasmicodichoso'},
      { label: 'Facebook', value: 'Intertas Mico', href: 'https://www.facebook.com/IntertasMico'},
    { label: 'GitHub', value: 'Oshinobi-obi', href: 'https://github.com/Oshinobi-obi' },
  ],

  copyright: '© 2026 Oshinobi',
};
