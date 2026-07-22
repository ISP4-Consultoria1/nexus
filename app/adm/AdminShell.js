'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSessionAction, logoutAction } from '../actions.js';

const menuItems = [
  {
    href: '/adm/grr',
    label: 'GRR',
    description: 'Resultados e rotinas',
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
  },
  {
    href: '/adm/diagnostics',
    label: 'Diagnósticos',
    description: 'Geral e operações',
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 13h3l2-7 4 14 2-7h5M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>
  }
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;
    localStorage.removeItem('nexus_user');
    localStorage.removeItem('nexus_admin');
    getSessionAction()
      .then(user => {
        if (!active) return;
        if (!user) {
          router.replace('/');
        } else if (user.access !== 1) {
          router.replace('/grr');
        } else {
          setAdmin(user);
          setCheckingSession(false);
        }
      })
      .catch(() => router.replace('/'));

    return () => { active = false; };
  }, [router]);

  const handleLogout = async () => {
    await logoutAction();
    router.push('/');
  };

  if (checkingSession) {
    return (
      <div className="transition-screen">
        <div className="login-logo" style={{ animation: 'pulse 1.5s infinite' }}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
        </div>
        <p>Carregando painel admin...</p>
      </div>
    );
  }

  const currentItem = menuItems.find(item => pathname.startsWith(item.href)) || menuItems[0];

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/adm/grr" aria-label="Nexus Admin">
          <span className="admin-brand-mark">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          </span>
          <span className="admin-brand-copy"><strong>Nexus</strong><small>Admin</small></span>
        </Link>

        <nav className="admin-nav" aria-label="Menu administrativo">
          <span className="admin-nav-label">Menu</span>
          {menuItems.map(item => {
            const isActive = pathname === '/adm' ? item.href === '/adm/grr' : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`admin-nav-item${isActive ? ' active' : ''}`} aria-current={isActive ? 'page' : undefined} title={item.label}>
                <span className="admin-nav-icon">{item.icon}</span>
                <span className="admin-nav-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-user">
          <span className="admin-user-avatar">{admin?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
          <span className="admin-sidebar-user-copy"><strong>{admin?.name || 'Administrador'}</strong><small>Administrador</small></span>
          <button className="admin-logout-btn" onClick={handleLogout} title="Sair do painel" aria-label="Sair do painel">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div><span className="admin-topbar-eyebrow">Painel administrativo</span><h1>{currentItem.label}</h1></div>
          <span className="admin-header-badge">Admin</span>
        </header>
        <div className="admin-page-content">{children}</div>
      </div>
    </div>
  );
}
