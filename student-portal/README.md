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




Tasks yet to be done student portal
1. submiting assignments functionality 
2. personal information section on the student dashboard
3. Announcement section on the student dashboard (it should support word formatting ie paragraphs, bold, italics, underline, tables, images, links, etc)
4. displaying of grades and performance in subjects and an option to download the transcript as a pdf
5. 



Tasks yet to be done admin portal
1. specification whether the assignment is to be submitted online or not(requires physical submission)
2. adding cbc grading system for grading the students  
3. Announcments section on the admin dashboard
4. Ability to add announcements whether subject specific class specific or for all students (it should support word formatting ie paragraphs, bold, italics, underline, tables, images, links, etc)
