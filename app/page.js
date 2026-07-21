'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionAction, loginAction } from './actions.js';

export default function CentralizedLogin() {
  const router = useRouter();
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    // Remove o formato antigo, que armazenava usuário e chave no navegador.
    localStorage.removeItem('nexus_admin');
    localStorage.removeItem('nexus_user');

    getSessionAction()
      .then(user => {
        if (!active) return;
        if (user) {
          router.replace(user.access === 1 ? '/adm/grr' : '/grr');
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    setLoading(true);
    setError('');
    try {
      const result = await loginAction(keyInput.trim());
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result.user.access === 1) {
        router.push('/adm/grr');
      } else {
        router.push('/grr');
      }
    } catch {
      setError('Não foi possível acessar o sistema. Tente novamente.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="transition-screen">
        <div className="login-logo" style={{ animation: 'pulse 1.5s infinite' }}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '28px', height: '28px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p>Carregando portal de acesso...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-color)', fontFamily: 'var(--font-family)', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '400px', animation: 'fadeInUp 0.5s ease-out' }}>
        
        {/* Logo e Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="login-logo" style={{ margin: '0 auto 1.25rem auto' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>
            Nexus GRR
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Gerenciador de Resultados e Rotinas
          </p>
        </div>

        {/* Formulário Central de Login */}
        <form className="login-card" onSubmit={handleSubmit}>
          <input
            type="password"
            className="login-input"
            placeholder="Chave de acesso ou admin..."
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            disabled={loading}
            autoFocus
          />
          {error && (
            <p style={{ color: 'var(--color-red)', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: 500, textAlign: 'center' }}>
              {error}
            </p>
          )}
          <button type="submit" className="login-button" disabled={loading}>
            Acessar Sistema
          </button>
        </form>



      </div>
    </div>
  );
}
