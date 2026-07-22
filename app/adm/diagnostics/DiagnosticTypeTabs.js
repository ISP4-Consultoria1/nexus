import Link from 'next/link';

const diagnosticTypes = [
  { href: '/adm/diagnostics', label: 'Diagnóstico geral', code: 'general' },
  { href: '/adm/diagnostics/operacoes', label: 'Diagnóstico de operações', code: 'operations' }
];

export default function DiagnosticTypeTabs({ active }) {
  return (
    <nav className="diagnostic-type-tabs" aria-label="Tipos de diagnóstico">
      {diagnosticTypes.map(type => (
        <Link
          key={type.code}
          href={type.href}
          className={active === type.code ? 'active' : ''}
          aria-current={active === type.code ? 'page' : undefined}
        >
          {type.label}
        </Link>
      ))}
    </nav>
  );
}
