import { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

// Minimal wrapper since SidebarLayout now handles the layout
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <>{children}</>;
}
