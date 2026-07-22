import Link from 'next/link';
import DiagnosticForm from './DiagnosticForm.js';
import DiagnosticTypeLinks from './DiagnosticTypeLinks.js';

export const metadata = {
  title: 'Diagnóstico Estratégico | Nexus',
  description: 'Formulário público do diagnóstico estratégico Nexus'
};

export default function PublicDiagnosticFormPage() {
  return (
    <main className="public-form-page">
      <div className="public-form-shell">
        <header className="public-form-header">
          <Link className="public-form-brand" href="/" aria-label="Nexus">
            <span className="public-form-brand-mark">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span>
              <strong>Nexus</strong>
              <small>Diagnósticos</small>
            </span>
          </Link>
          <span className="public-form-access-badge">Acesso público</span>
        </header>

        <section className="public-form-intro">
          <span className="public-form-kicker">Formulário de diagnóstico</span>
          <h1>Questionário inicial</h1>
          <p>
            Responda às perspectivas Comercial, Marketing, Gestão de Pessoas e Estratégia conforme o modelo oficial de diagnóstico.
          </p>
        </section>

        <DiagnosticTypeLinks active="general" />

        <DiagnosticForm />

        <footer className="public-form-footer">
          <span>Seus dados serão tratados com confidencialidade.</span>
          <span>© {new Date().getFullYear()} Nexus</span>
        </footer>
      </div>
    </main>
  );
}
