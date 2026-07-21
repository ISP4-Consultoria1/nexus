'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchDiagnosticSubmissionsAction } from '../../actions.js';
import { formatDiagnosticPercentage } from '../../../lib/diagnosticCatalog.js';

const statusLabels = {
  draft: 'Rascunho',
  submitted: 'Enviado',
  under_review: 'Em avaliação',
  completed: 'Concluído',
  archived: 'Arquivado'
};

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
}

export default function DiagnosticsDashboard() {
  const [diagnostics, setDiagnostics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    fetchDiagnosticSubmissionsAction()
      .then(setDiagnostics)
      .catch(() => setLoadError('As tabelas de diagnóstico ainda não estão disponíveis no banco.'))
      .finally(() => setLoading(false));
  }, []);

  const completed = diagnostics.filter(item => item.status === 'completed').length;
  const pending = diagnostics.filter(item => item.status === 'submitted' || item.status === 'under_review').length;

  return (
    <main className="admin-container no-scrollbar">
      <section className="diagnostics-hero">
        <span className="diagnostics-icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 13h3l2-7 4 14 2-7h5M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>
        </span>
        <div>
          <span className="diagnostics-kicker">Diagnóstico empresarial</span>
          <h2>Avaliações e resultados</h2>
          <p>Questionário, fórmulas, perspectivas e relatórios definidos pelo método fixo da aplicação.</p>
        </div>
        <Link className="diagnostics-public-link" href="/form" target="_blank">
          Abrir formulário público
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7v7m0-7L10 14M5 7v12h12v-5" /></svg>
        </Link>
      </section>

      <section className="admin-stats-grid diagnostics-stats-grid">
        <div className="stat-card"><span className="stat-card-title">Diagnósticos</span><span className="stat-card-value">{diagnostics.length}</span></div>
        <div className="stat-card"><span className="stat-card-title">Aguardando avaliação</span><span className="stat-card-value">{pending}</span></div>
        <div className="stat-card"><span className="stat-card-title">Concluídos</span><span className="stat-card-value">{completed}</span></div>
        <div className="stat-card"><span className="stat-card-title">Perguntas do modelo</span><span className="stat-card-value">51</span></div>
      </section>

      <section className="admin-card diagnostics-list-card">
        <div className="diagnostics-list-heading">
          <div><span className="diagnostics-kicker">Submissões</span><h2>Diagnósticos recebidos</h2></div>
          <span>Modelo v1 · 10 perspectivas</span>
        </div>

        {loading ? (
          <div className="diagnostics-list-state">Carregando diagnósticos...</div>
        ) : loadError ? (
          <div className="diagnostics-setup-state">
            <span className="empty-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 4h.01M5.07 19h13.86A2 2 0 0020.66 16L13.73 4a2 2 0 00-3.46 0L3.34 16a2 2 0 001.73 3z" /></svg></span>
            <h3>Estrutura do banco pendente</h3>
            <p>{loadError} Execute manualmente o arquivo <code>database/diagnostics.sql</code> para habilitar recebimento e avaliação.</p>
          </div>
        ) : diagnostics.length === 0 ? (
          <div className="diagnostics-setup-state">
            <span className="empty-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012-2h2a2 2 0 012 2" /></svg></span>
            <h3>Nenhum diagnóstico recebido</h3>
            <p>As respostas enviadas pela rota pública aparecerão aqui.</p>
          </div>
        ) : (
          <div className="diagnostics-table-wrap">
            <table className="adm-table diagnostics-table">
              <thead><tr><th>Empresa</th><th>Data</th><th>Progresso CFE</th><th>Índice geral</th><th>Status</th><th /></tr></thead>
              <tbody>
                {diagnostics.map(item => {
                  const progress = item.answer_count ? Math.round((item.reviewed_answer_count / item.answer_count) * 100) : 0;
                  return (
                    <tr key={item.public_id}>
                      <td><strong>{item.company_name}</strong><small className="diagnostics-row-id">{item.public_id}</small></td>
                      <td>{formatDate(item.diagnostic_date)}</td>
                      <td><div className="diagnostics-mini-progress"><span style={{ width: `${progress}%` }} /></div><small>{progress}%</small></td>
                      <td><strong>{item.overall_score_ratio == null ? '—' : formatDiagnosticPercentage(item.overall_score_ratio)}</strong></td>
                      <td><span className={`diagnostic-status status-${item.status}`}>{statusLabels[item.status] || item.status}</span></td>
                      <td><Link className="diagnostics-open-button" href={`/adm/diagnostics/${item.public_id}`}>Abrir</Link></td>
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
