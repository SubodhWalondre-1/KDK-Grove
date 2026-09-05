# Mediora Frontend Architecture

Mediora is an AI-powered longitudinal health insights and medical report simplification platform built with React 18, Vite, and a scalable feature-driven architecture.

---

## 🏗️ Project Architecture

```
frontend/
├── public/                  # Static assets & public resources
│   ├── assets/              # Category & brand images
│   ├── icons/               # SVG icons
│   └── images/              # Raster avatars & graphics
│
├── src/
│   ├── app/                 # Application Core
│   │   ├── App.jsx          # Root Component with Providers
│   │   ├── main.jsx         # App Entry Point
│   │   ├── routes.jsx       # Centralized Application Router
│   │   └── providers/       # AuthProvider, AppProviders
│   │
│   ├── assets/              # Bundled Static Assets
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   ├── components/          # Reusable Global UI Components
│   │   ├── ui/              # Button, Card, Modal, Badge, Input
│   │   ├── layout/          # Navbar, Sidebar, PageContainer, UserProfileMenu
│   │   └── common/          # Loader, ErrorMessage, EmptyState
│   │
│   ├── features/            # Domain-Specific Feature Modules
│   │   ├── auth/            # Authentication & sliding onboarding
│   │   ├── reports/         # Report upload & health dashboard
│   │   ├── health-insights/ # Parameter trends & AI precautions
│   │   ├── diet-plan/       # Clinical diet & nutrition context
│   │   ├── patients/        # Human & veterinary category selection
│   │   ├── profiles/        # Multi-profile patient management
│   │   └── shared-links/    # Secure time-limited report sharing
│   │
│   ├── services/            # API & Storage Services
│   │   ├── api/             # Centralized Axios services & interceptors
│   │   └── storage/         # Safe localStorage wrappers
│   │
│   ├── context/             # Global Application Contexts
│   ├── hooks/               # Reusable Custom Hooks (useAuth, useApi)
│   ├── utils/               # Constants, formatters, helpers, validators
│   ├── config/              # Environment & application configuration
│   ├── styles/              # Global stylesheet & design tokens
│   └── types/               # JSDoc type definitions
│
├── tests/                   # Test Suite
│   ├── unit/                # Component & utility unit tests
│   ├── integration/         # Page & user flow integration tests
│   └── e2e/                 # End-to-end specifications
│
├── index.html               # Vite Entry Point
├── package.json             # Dependencies & Scripts
├── vite.config.js           # Vite Configuration
├── vitest.config.js         # Vitest Configuration
└── tailwind.config.js       # Tailwind Configuration
```

---

## 🚀 Development & Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local Vite development server |
| `npm run build` | Compile optimized production bundle |
| `npm test` | Run Vitest unit & integration test suites |
| `npm run preview` | Locally preview production build |

---

## 🧪 Testing

The frontend utilizes Vitest and React Testing Library:

```bash
# Run tests
npm test

# Run tests with coverage
npx vitest run --coverage
```

---

## 📦 Production Build

```bash
npm run build
```
Optimized static bundles will be compiled to `frontend/dist/`.
