'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchOperationsDiagnosticSubmissionsAction } from '../../../actions.js';
import { ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS, formatOperationsPercentage } from '../../../../lib/operationsDiagnosticCatalog.js';
import DiagnosticTypeTabs from '../DiagnosticTypeTabs.js';

const statusLabels = {
  draft: 'Rascunho',
  submitted: 'Enviado',
  under_review: 'Em avaliação',
  completed: 'Concluído',
  archived: 'Arquivado'
};

function formatDate(value) {
  if (!value) return '—';
  const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(value);
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
}

export default function OperationsDiagnosticsDashboard() {
  const [diagnostics, setDiagnostics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    fetchOperationsDiagnosticSubmissionsAction()
      .then(setDiagnostics)
      .catch(() => setLoadError('Não foi possível carregar os diagnósticos de operações.'))
      .finally(() => setLoading(false));
  }, []);

  const pending = diagnostics.filter(item => item.status === 'submitted').length;
  const underReview = diagnostics.filter(item => item.status === 'under_review').length;

  return (
    <main className="admin-container no-scrollbar">
      <DiagnosticTypeTabs active="operations" />

      <section className="diagnostics-hero operations-diagnostics-hero">
        <span className="diagnostics-icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10M7 3v6m6 0v6m6-6v6" /></svg>
        </span>
        <div>
          <span className="diagnostics-kicker">Diagnóstico de operações</span>
          <h2>Avaliações operacionais</h2>
          <p>Comercial, Churn, Marketing, Customer Success, Atendimento e RH/Cultura em uma visão única.</p>
        </div>
        <Link className="diagnostics-public-link" href="/form/operacoes" target="_blank">
          Abrir formulário público
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7v7m0-7L10 14M5 7v12h12v-5" /></svg>
        </Link>
      </section>

      <section className="admin-stats-grid diagnostics-stats-grid">
        <div className="stat-card"><span className="stat-card-title">Diagnósticos</span><span className="stat-card-value">{diagnostics.length}</span></div>
        <div className="stat-card"><span className="stat-card-title">Aguardando análise</span><span className="stat-card-value">{pending}</span></div>
        <div className="stat-card"><span className="stat-card-title">Em avaliação</span><span className="stat-card-value">{underReview}</span></div>
        <div className="stat-card"><span className="stat-card-title">Itens do modelo</span><span className="stat-card-value">{ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS.length}</span></div>
      </section>

      <section className="admin-card diagnostics-list-card">
        <div className="diagnostics-list-heading">
          <div><span className="diagnostics-kicker">Submissões</span><h2>Diagnósticos de operações recebidos</h2></div>
          <span>Modelo v1 · 6 áreas</span>
        </div>

        {loading ? (
          <div className="diagnostics-list-state">Carregando diagnósticos...</div>
        ) : loadError ? (
          <div className="diagnostics-setup-state">
            <span className="empty-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 4h.01M5.07 19h13.86A2 2 0 0020.66 16L13.73 4a2 2 0 00-3.46 0L3.34 16a2 2 0 001.73 3z" /></svg></span>
            <h3>Diagnóstico indisponível</h3><p>{loadError}</p>
          </div>
        ) : diagnostics.length === 0 ? (
          <div className="diagnostics-setup-state">
            <span className="empty-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012-2h2a2 2 0 012 2" /></svg></span>
            <h3>Nenhum diagnóstico de operações recebido</h3>
            <p>As respostas enviadas pelo formulário público aparecerão aqui.</p>
          </div>
        ) : (
          <div className="diagnostics-table-wrap">
            <table className="adm-table diagnostics-table">
              <thead><tr><th>Empresa</th><th>Data</th><th>Preenchimento</th><th>Índice operacional</th><th>Status</th><th /></tr></thead>
              <tbody>
                {diagnostics.map(item => {
                  const total = Number(item.answer_count) || ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS.length;
                  const answered = Number(item.reviewed_answer_count) || 0;
                  const progress = total ? Math.round((answered / total) * 100) : 0;
                  return (
                    <tr key={item.public_id}>
                      <td><strong>{item.company_name}</strong><small className="diagnostics-row-id">{item.public_id}</small></td>
                      <td>{formatDate(item.diagnostic_date)}</td>
                      <td><div className="diagnostics-mini-progress"><span style={{ width: `${progress}%` }} /></div><small>{progress}%</small></td>
                      <td><strong>{item.overall_score_ratio == null ? '—' : formatOperationsPercentage(item.overall_score_ratio)}</strong></td>
                      <td><span className={`diagnostic-status status-${item.status}`}>{statusLabels[item.status] || item.status}</span></td>
                      <td><Link className="diagnostics-open-button" href={`/adm/diagnostics/operacoes/${item.public_id}`}>Abrir</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
