# Olabs Student Portal

A modern, standalone student portal built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 🔐 **Secure Authentication**: Custom JWT-based authentication system
- 📚 **Subject Management**: View enrolled subjects with performance analytics
- 📝 **Assignment Tracking**: Track upcoming and overdue assignments
- 📊 **Exam Results**: Historical transcript of academic performance
- 💰 **Fee Management**: Real-time fee balance and transaction history
- 📱 **Responsive Design**: Optimized for mobile, tablet, and desktop

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Configuration

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
student-portal/
├── app/
│   ├── login/          # Student login page
│   ├── onboard/        # Account activation flow
│   ├── subjects/       # Subject portfolio
│   ├── assignments/    # Assignment tracker
│   ├── results/        # Exam results & transcript
│   ├── fees/           # Fee ledger
│   ├── layout.tsx      # Root layout with sidebar
│   └── page.tsx        # Dashboard
├── public/             # Static assets
└── package.json
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion

## License

MIT
