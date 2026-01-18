# ClearMind Frontend

React + TypeScript + Vite application for the ClearMind productivity assistant.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Structure

```
src/
├── components/
│   ├── auth/        # AuthModal, ProtectedRoute
│   └── layout/      # Sidebar, Layout
├── pages/           # Dashboard, Chat, MyLifeDatabase, etc.
├── services/        # API client (axios)
└── types.ts         # TypeScript interfaces
```

## Tech Stack

- **React 19** + TypeScript
- **Tailwind CSS v4** for styling  
- **React Router v7** for navigation
- **Axios** for HTTP requests
- **React Query** for data fetching
- **HeadlessUI** for accessible components
- **Lucide** for icons
