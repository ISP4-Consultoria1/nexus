import Link from 'next/link';
import DiagnosticTypeLinks from '../DiagnosticTypeLinks.js';
import OperationsDiagnosticForm from './OperationsDiagnosticForm.js';

export const metadata = {
  title: 'Diagnóstico por Área | Nexus',
  description: 'Formulário público do diagnóstico por área ISP4'
};

export default function PublicOperationsDiagnosticPage() {
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
            <span><strong>Nexus</strong><small>Diagnósticos</small></span>
          </Link>
          <span className="public-form-access-badge">Acesso público</span>
        </header>

        <section className="public-form-intro">
          <span className="public-form-kicker">Metodologia ISP4</span>
          <h1>Diagnóstico por área</h1>
          <p>Mapeie práticas, processos e oportunidades nas seis áreas operacionais do provedor.</p>
        </section>

        <DiagnosticTypeLinks active="operations" />
        <OperationsDiagnosticForm />

        <footer className="public-form-footer">
          <span>Seus dados serão tratados com confidencialidade.</span>
          <span>© {new Date().getFullYear()} Nexus</span>
        </footer>
      </div>
    </main>
  );
}
