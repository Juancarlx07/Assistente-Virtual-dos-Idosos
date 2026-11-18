import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gestos de Carinho',
  description:
    'Mantenha gestos de carinho constantes no dia a dia, sem perder o toque pessoal.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
