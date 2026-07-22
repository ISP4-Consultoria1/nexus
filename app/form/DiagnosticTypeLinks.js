import Link from 'next/link';

export default function DiagnosticTypeLinks({ active }) {
  return (
    <nav className="public-diagnostic-type-tabs" aria-label="Escolha o diagnóstico">
      <Link href="/form" className={active === 'general' ? 'active' : ''} aria-current={active === 'general' ? 'page' : undefined}>
        Geral
      </Link>
      <Link href="/form/operacoes" className={active === 'operations' ? 'active' : ''} aria-current={active === 'operations' ? 'page' : undefined}>
        Operações
      </Link>
    </nav>
  );
}
