'use client';

import { usePathname } from 'next/navigation';
import { TabBar } from './ui/tab-bar';

export function NavigationWrapper() {
  const pathname = usePathname();
  
  // Lista de rotas onde a TabBar NÃO deve aparecer (ex: login, landing page)
  const hideOnPaths = ['/', '/login', '/api/auth/confirm'];
  
  const shouldHide = hideOnPaths.includes(pathname);

  if (shouldHide) return null;

  return <TabBar />;
}
