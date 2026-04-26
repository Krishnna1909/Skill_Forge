import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SkillForge — AI Skill Assessment & Learning',
  description: 'Conversational AI that assesses your real skill proficiency and builds a personalized learning plan',
  keywords: 'skill assessment, AI, learning plan, job readiness, resume',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
