# SPYCO PO Client

React frontend for the SPYCO Purchase Order system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Features

- **Authentication**: Email/password login
- **Purchase Orders**: Create, view, edit, submit, approve, reject
- **Combo Boxes**: Searchable dropdowns with "Create New" functionality
- **Admin Panel**: Manage departments, users, vendors, units, and approvers
- **Approval Workflow**: Department-based approver routing

## Project Structure

```
src/
├── components/
│   ├── core/           # Reusable components (AppLayout, ComboBox)
│   └── pages/          # Page components
│       ├── admin/      # Admin panel pages
│       ├── CreatePO/   # PO creation form
│       ├── HomePage    # Dashboard
│       ├── LoginPage   # Authentication
│       └── PODetailPage # PO details & approval
├── contexts/           # React context providers
├── hooks/              # Custom hooks
├── styles/             # SCSS stylesheets
├── types/              # TypeScript type definitions
└── utils/              # Utility functions (API client)
```

## Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.
