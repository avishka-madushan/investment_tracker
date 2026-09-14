import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import BackgroundOrbs from '@/components/BackgroundOrbs';

export const metadata = {
  title: 'Investment Tracker',
  description: 'Manage and track your stock investments, transactions, and portfolio analytics.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0f] text-[#e0e0e0] min-h-screen relative antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <AuthProvider>
          <BackgroundOrbs />
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-up">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
