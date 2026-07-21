'use client';

import { useState, useEffect } from 'react';
import { 
  fetchUsersAction, 
  fetchAllTasksWithUserAction, 
  createTaskAction, 
  deleteTaskAction 
} from '../actions.js';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  // Listas do Sistema
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);

  // Filtros de Pesquisa
  const [searchTitle, setSearchTitle] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Formulário de Criação de Tarefa
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formRecurrence, setFormRecurrence] = useState('');
  const [formUser, setFormUser] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Mapeamentos de exibição
  const statusLabels = {
    0: 'Pendente',
    1: 'Concluído',
    2: 'Não Concluído',
    3: 'Parcial',
    4: 'Não se aplica',
    5: 'Concluído Expirado'
  };

  const badgeClasses = {
    0: 'badge-notdone',
    expired: 'badge-expired',
    1: 'badge-completed',
    2: 'badge-notdone',
    3: 'badge-partial',
    4: 'badge-na',
    5: 'badge-completed'
  };

  const recurrenceLabels = {
    1: 'Diária',
    2: 'Semanal',
    3: 'Mensal',
    4: 'Trimestral',
    5: 'Semestral',
    6: 'Anual'
  };

  // Carregar dados do módulo e definir as datas iniciais do formulário
  useEffect(() => {
    loadDashboardData();
    const today = new Date().toISOString().split('T')[0];
    setFormStartDate(today);
    setFormEndDate(today);
  }, []);

  // Carregar dados gerais (usuários e tarefas)
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [fetchedUsers, fetchedTasks] = await Promise.all([
        fetchUsersAction(),
        fetchAllTasksWithUserAction()
      ]);
      setUsers(fetchedUsers);
      setTasks(fetchedTasks);
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // Criar uma nova tarefa
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formTitle.trim()) {
      setFormError('Por favor, informe o título da tarefa.');
      return;
    }
    if (!formEndDate) {
      setFormError('Por favor, defina o prazo (data final).');
      return;
    }
    if (!formUser) {
      setFormError('Por favor, selecione um usuário para atribuir.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createTaskAction({
        title: formTitle.trim(),
        description: formDesc.trim() || null,
        start_date: formStartDate,
        end_date: formEndDate,
        recurrence: formRecurrence ? parseInt(formRecurrence, 10) : null,
        id_user: parseInt(formUser, 10)
      });
      if (!result.ok) {
        setFormError(result.error);
        return;
      }

      setFormSuccess('Tarefa criada e atribuída com sucesso!');
      setFormTitle('');
      setFormDesc('');
      const today = new Date().toISOString().split('T')[0];
      setFormStartDate(today);
      setFormEndDate(today);
      setFormRecurrence('');
      setFormUser('');
      
      // Recarregar lista de tarefas
      const updatedTasks = await fetchAllTasksWithUserAction();
      setTasks(updatedTasks);
    } catch {
      setFormError('Não foi possível criar a tarefa. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Excluir uma tarefa
  const handleDeleteTask = async (taskId) => {
    if (!confirm('Deseja realmente excluir esta tarefa permanentemente?')) return;

    try {
      const result = await deleteTaskAction(taskId);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch {
      alert('Não foi possível excluir a tarefa. Tente novamente.');
    }
  };

  // Determinar se a tarefa já expirou com base no end_date (compatível com fuso horário)
  const isTaskExpired = (task) => {
    if (!task.end_date) return false;
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getDate()).padStart(2, '0');
    const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;

    let endStr = '';
    if (typeof task.end_date === 'string') {
      endStr = task.end_date.split('T')[0];
    } else {
      const end = new Date(task.end_date);
      const endYear = end.getUTCFullYear();
      const endMonth = String(end.getUTCMonth() + 1).padStart(2, '0');
      const endDay = String(end.getUTCDate()).padStart(2, '0');
      endStr = `${endYear}-${endMonth}-${endDay}`;
    }

    return todayStr > endStr;
  };

  // Formatador de data local brasileiro (DD/MM/AAAA)
  const formatLocalDate = (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  // --- Renderização condicional por estado ---

  if (loading) {
    return (
      <div className="admin-section-loading">
        <div className="login-logo" style={{ animation: 'pulse 1.5s infinite' }}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '28px', height: '28px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p>Carregando painel admin...</p>
      </div>
    );
  }

  // Métricas do Dashboard Admin
  const totalTasks = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === 1 || t.status === 5).length;
  const expiredTasksCount = tasks.filter(t => t.status === 0 && isTaskExpired(t)).length;
  const pendingTasksCount = tasks.filter(t => t.status === 0 && !isTaskExpired(t)).length;

  // Filtragem da lista geral de tarefas
  const filteredTasks = tasks.filter(task => {
    // 1. Filtro por Título
    const matchesTitle = task.title.toLowerCase().includes(searchTitle.toLowerCase());
    
    // 2. Filtro por Usuário
    const matchesUser = filterUser === '' || task.id_user === parseInt(filterUser, 10);
    
    // 3. Filtro por Status
    let matchesStatus = true;
    if (filterStatus !== '') {
      const isExpired = isTaskExpired(task);
      if (filterStatus === 'expired') {
        matchesStatus = task.status === 0 && isExpired;
      } else if (filterStatus === '0') {
        matchesStatus = task.status === 0 && !isExpired;
      } else {
        matchesStatus = task.status === parseInt(filterStatus, 10);
      }
    }

    return matchesTitle && matchesUser && matchesStatus;
  });

  return (
      <main className="admin-container no-scrollbar">
        
        {/* Painel de Métricas (Stats) */}
        <section className="admin-stats-grid">
          <div className="stat-card" style={{ borderLeft: '4px solid #cbd5e1' }}>
            <span className="stat-card-title">Total de Tarefas</span>
            <span className="stat-card-value">{totalTasks}</span>
          </div>
          <div className="stat-card" style={{ borderLeft: `4px solid var(--color-blue)` }}>
            <span className="stat-card-title">Pendentes</span>
            <span className="stat-card-value">{pendingTasksCount}</span>
          </div>
          <div className="stat-card" style={{ borderLeft: `4px solid var(--color-green)` }}>
            <span className="stat-card-title">Concluídas / Atribuídas</span>
            <span className="stat-card-value">{completedTasksCount + (tasks.length - pendingTasksCount - completedTasksCount - expiredTasksCount)}</span>
          </div>
          <div className="stat-card" style={{ borderLeft: `4px solid var(--color-red)` }}>
            <span className="stat-card-title">Não Concluídas Vencidas (Expiradas)</span>
            <span className="stat-card-value">{expiredTasksCount}</span>
          </div>
        </section>

        {/* Divisão Principal em 2 Colunas */}
        <section className="admin-split">
          
          {/* Coluna Esquerda: Formulário de Criação (30%) */}
          <div className="admin-card">
            <h2 className="admin-card-title">
              <svg style={{ width: '20px', height: '20px', color: 'var(--color-green)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Nova Tarefa
            </h2>

            <form onSubmit={handleCreateTask}>
              <label className="adm-label">Título da Tarefa *</label>
              <input
                type="text"
                className="adm-input"
                placeholder="Ex: Enviar relatório financeiro..."
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                disabled={submitting}
              />

              <label className="adm-label">Descrição (Opcional)</label>
              <textarea
                className="adm-textarea"
                placeholder="Detalhes adicionais da rotina ou tarefa..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                disabled={submitting}
              />

              <label className="adm-label">Data de Início *</label>
              <input
                type="date"
                className="adm-input"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                disabled={submitting}
              />

              <label className="adm-label">Prazo Final (Vencimento) *</label>
              <input
                type="date"
                className="adm-input"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                disabled={submitting}
              />

              <label className="adm-label">Recorrência</label>
              <select
                className="adm-select"
                value={formRecurrence}
                onChange={(e) => setFormRecurrence(e.target.value)}
                disabled={submitting}
              >
                <option value="">Nenhuma</option>
                <option value="1">Diária</option>
                <option value="2">Semanal</option>
                <option value="3">Mensal</option>
                <option value="4">Trimestral</option>
                <option value="5">Semestral</option>
                <option value="6">Anual</option>
              </select>

              <label className="adm-label">Atribuir ao Usuário *</label>
              <select
                className="adm-select"
                value={formUser}
                onChange={(e) => setFormUser(e.target.value)}
                disabled={submitting}
              >
                <option value="">Selecione o usuário...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>

              {formError && (
                <p style={{ color: 'var(--color-red)', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: 500 }}>
                  ⚠️ {formError}
                </p>
              )}

              {formSuccess && (
                <p style={{ color: 'var(--color-green)', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: 500 }}>
                  ✓ {formSuccess}
                </p>
              )}

              <button type="submit" className="adm-btn-submit" disabled={submitting}>
                {submitting ? 'Criando...' : 'Criar Tarefa'}
              </button>
            </form>
          </div>

          {/* Coluna Direita: Tabela Geral de Tarefas (70%) */}
          <div className="admin-card">
            <h2 className="admin-card-title">
              <svg style={{ width: '20px', height: '20px', color: 'var(--color-blue)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Lista de Tarefas
            </h2>

            {/* Barra de Filtros */}
            <div className="admin-filters">
              <input
                type="text"
                className="filter-input"
                placeholder="Buscar por título..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
              />

              <select
                className="filter-input"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
              >
                <option value="">Todos os usuários</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>

              <select
                className="filter-input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="0">Pendentes</option>
                <option value="expired">Expiradas</option>
                <option value="1">Concluídas</option>
                <option value="2">Não Concluídas</option>
                <option value="3">Parciais</option>
                <option value="4">Não se aplica</option>
                <option value="5">Concluídas Expiradas</option>
              </select>
            </div>

            {/* Tabela de Tarefas */}
            <div className="table-container no-scrollbar">
              {filteredTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                  Nenhuma tarefa correspondente aos filtros.
                </div>
              ) : (
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>ID</th>
                      <th>Tarefa</th>
                      <th>Atribuída a</th>
                      <th>Recorrência</th>
                      <th>Prazo</th>
                      <th>Status</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => {
                      const expired = isTaskExpired(task);
                      let displayStatus = task.status;
                      if (task.status === 0 && expired) {
                        displayStatus = 'expired';
                      }

                      const badgeText = statusLabels[displayStatus] || 'Pendente';
                      const badgeClass = badgeClasses[displayStatus] || 'badge-notdone';

                      return (
                        <tr key={task.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                            #{task.id}
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <strong style={{ color: 'var(--text-primary)' }}>{task.title}</strong>
                              {task.description && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                  {task.description}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <strong style={{ color: 'var(--text-primary)' }}>{task.user_name || `ID: ${task.id_user}`}</strong>
                          </td>
                          <td>
                            {task.recurrence ? (
                              <span className="task-recurrence-badge">
                                <svg className="recurrence-dot" viewBox="0 0 6 6" fill="currentColor">
                                  <circle cx="3" cy="3" r="3" />
                                </svg>
                                {recurrenceLabels[task.recurrence]}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Única</span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontWeight: 500 }}>
                              {formatLocalDate(task.end_date)}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${badgeClass}`}>
                              {badgeText}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteTask(task.id)}
                              title="Excluir tarefa permanentemente"
                            >
                              <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Excluir
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </main>
  );
}
