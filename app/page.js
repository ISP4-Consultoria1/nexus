'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from './actions.js';

export default function CentralizedLogin() {
  const router = useRouter();
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Verificar se o usuário ou admin já está autenticado e redirecionar
  useEffect(() => {
    const savedAdmin = localStorage.getItem('nexus_admin');
    const savedUser = localStorage.getItem('nexus_user');

    if (savedAdmin) {
      router.push('/adm');
    } else if (savedUser) {
      router.push('/user');
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    setLoading(true);
    setError('');
    try {
      const loggedUser = await loginAction(keyInput.trim());

      if (loggedUser.access === 1) {
        // Salvar sessão administrativa e redirecionar
        localStorage.setItem('nexus_admin', JSON.stringify(loggedUser));
        router.push('/adm');
      } else {
        // Salvar sessão do usuário comum e redirecionar
        localStorage.setItem('nexus_user', JSON.stringify(loggedUser));
        router.push('/user');
      }
    } catch (err) {
      setError(err.message || 'Erro de conexão. Verifique sua chave.');
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
