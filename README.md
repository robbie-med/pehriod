# Pehriod - Period Pain Manager

A smart, multilingual medication tracker for period pain management with built-in safety validation.

🌐 **Live App**: https://robbie-med.github.io/pehriod/

## Features

### 🛡️ Medication Safety Engine
- **24-hour dose tracking** - Rolling window calculations for all active ingredients
- **Safety limits enforced**:
  - Acetaminophen: Max 3000mg/day
  - Ibuprofen: Max 1200mg/day
  - Aspirin: Max 4000mg/day
  - Caffeine: Max 400mg/day (warning)
- **Conflict prevention** - Blocks mixing Pamprin Max and Midol in same 24-hour period
- **Minimum dose spacing** - 4-hour gap required between same medication

### 📅 Smart Medication Schedule
Fixed 6-dose schedule:
- **01:00** - Pamprin Multi-Symptom
- **05:00** - Ibuprofen 200mg
- **09:00** - Pamprin Max Pain + Energy OR Midol (choose one)
- **13:00** - Ibuprofen 200mg
- **17:00** - Acetaminophen 500mg
- **21:00** - Ibuprofen 200mg

### 📊 Real-time Tracking
- **Pain level slider** (0-10 scale)
- **24-hour dose summary** with visual progress bars
- **Intake history** (past 48 hours)
- **Color-coded alerts** (yellow warnings, red errors)

### 🌍 Multilingual Support
Available in 9 languages:
- English
- 한국어 (Korean)
- မြန်မာစာ (Burmese)
- Hakha Chin
- ไทย (Thai)
- বাংলা (Bengali)
- فارسی (Farsi)
- العربية (Arabic)
- 中文 (Chinese)

### 📱 Progressive Web App (PWA)
- **Installable** on mobile and desktop
- **Works offline** (localStorage persistence)
- **No backend required** - all data stays on your device

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **LocalStorage** - Client-side data persistence
- **GitHub Pages** - Static site hosting

## Architecture

```
src/
├── lib/                      # Business logic
│   ├── types.ts              # TypeScript interfaces
│   ├── medications.ts        # Medication database
│   ├── doseLimits.ts         # Safety limits
│   ├── schedule.ts           # Fixed schedule
│   ├── doseCalculator.ts     # 24hr rolling calculations
│   ├── safetyChecker.ts      # Validation engine
│   ├── recommendationEngine.ts
│   └── storage.ts
│
├── hooks/                    # State management
│   ├── useLocalStorage.ts
│   ├── useDoseTotals.ts
│   ├── useMedicationData.ts
│   └── useRecommendation.ts
│
├── components/               # UI components
│   ├── ui/                   # Header, Nav, Icons
│   ├── tracker/              # Timeline, Modals, Alerts
│   ├── history/              # Intake history
│   ├── medications/          # Med info cards
│   ├── education/            # Education content
│   └── settings/             # Language selector
│
└── app/
    ├── page.tsx              # Main app
    ├── layout.tsx            # Root layout
    └── globals.css           # Global styles
```

## Development

### Prerequisites
- Node.js 20+
- npm or yarn

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

Open http://localhost:3000

### Build for Production
```bash
npm run build
```

Output in `./out/` directory (static export)

## Deployment

The app automatically deploys to GitHub Pages via GitHub Actions when you push to `main`.

### Manual Setup (if needed)
1. Go to repository Settings → Pages
2. Source: GitHub Actions
3. Push to main branch triggers deployment

## How It Works

### Medication Tracking
1. User selects a scheduled medication
2. Safety checker validates:
   - Daily limits not exceeded
   - No conflicting medications in last 24hrs
   - Minimum 4hr gap since last same medication
3. If safe, intake is logged with timestamp and pain level
4. 24hr dose totals automatically recalculate

### Safety Validation
```typescript
// Example: Taking Pamprin Multi-Symptom (500mg acetaminophen)
Current 24hr total: 2600mg acetaminophen
After this dose: 3100mg
Limit: 3000mg
Result: ❌ BLOCKED - "Daily limit exceeded"
```

### Data Persistence
- All data stored in browser localStorage
- Automatic 7-day cleanup of old history
- No server, no database, fully offline

## Contributing

We welcome contributions! Areas to expand:
- Additional language translations
- Education content (how medications work)
- Custom medication schedules
- Symptom tracking beyond pain
- Period cycle integration

## License

ISC

## Acknowledgments

Built with ❤️ to help people manage period pain safely and effectively.

Co-developed with Claude Opus 4.5
