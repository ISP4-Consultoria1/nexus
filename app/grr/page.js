'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchTasksAction, updateTaskStatusAction } from '../actions.js';

const recurrenceLabels = {
  1: 'Diária',
  2: 'Semanal',
  3: 'Mensal',
  4: 'Trimestral',
  5: 'Semestral',
  6: 'Anual'
};

export default function UserDashboard() {
  const router = useRouter();
  // Estado de Autenticação e Usuário
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado das Tarefas
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' ou 'completed'

  // Estado de Instalação PWA
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Efeitos visuais e Animações
  const [successFlash, setSuccessFlash] = useState(false);

  // Referências para Drag and Drop
  const redTargetRef = useRef(null);
  const yellowTargetRef = useRef(null);
  const blueTargetRef = useRef(null);
  const draggingTaskIdRef = useRef(null);
  const activeTargetRef = useRef(null);

  // Estado do Arraste (Drag and Drop)
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeTarget, setActiveTarget] = useState(null); // 'red' | 'yellow' | 'blue' | null

  // Coordenadas iniciais do ponteiro
  const dragStart = useRef({ x: 0, y: 0 });
  // Bounding boxes dos botões (cacheados no início do arraste)
  const targetRects = useRef({ red: null, yellow: null, blue: null });

  // 1. Verificar se o usuário já está logado
  useEffect(() => {
    const savedUser = localStorage.getItem('nexus_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      loadTasks(parsed.id);
    } else {
      router.push('/');
    }
  }, [router]);

  // 2. Registro do Service Worker e PWA
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => console.log('Service Worker registrado:', reg.scope))
          .catch((err) => console.error('Erro no registro do Service Worker:', err));
      }

      const handleBeforeInstall = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsInstallable(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }
  }, []);

  // Função para carregar tarefas
  const loadTasks = async (userId) => {
    try {
      setLoading(true);
      const fetchedTasks = await fetchTasksAction(userId);
      setTasks(fetchedTasks);
    } catch (err) {
      console.error("Erro ao carregar tarefas:", err);
    } finally {
      setLoading(false);
    }
  };

  // Autenticação tratada centralizadamente na raiz

  // Função de Logout
  const handleLogout = () => {
    localStorage.removeItem('nexus_user');
    setUser(null);
    setTasks([]);
    router.push('/');
  };

  // Função para instalar o PWA
  const installPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  // Formatador de data simplificado (DD/MM) compatível com fuso horário da gravação da tarefa
  const formatDate = (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  // Determinar se a tarefa já expirou com base no end_date (resistente a fusos horários)
  const isTaskExpired = (task) => {
    if (!task.end_date) return false;

    // Data de hoje no fuso local (AAAA-MM-DD)
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getDate()).padStart(2, '0');
    const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;

    // Data de vencimento no fuso UTC
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

  // Atualizar o status da tarefa no DB e no Estado Local
  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      // Otimista: atualiza localmente para resposta instantânea
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      
      // Salva no banco de dados
      await updateTaskStatusAction(taskId, newStatus);
    } catch (err) {
      console.error("Erro ao atualizar status da tarefa:", err);
      // Recarrega do banco se falhar para sincronizar
      if (user) loadTasks(user.id);
    }
  };

  // Ação ao clicar no círculo verde de Marcar/Desmarcar como Concluído
  const handleCompleteToggle = async (task) => {
    // Qualquer status diferente de 0 é considerado atribuído/concluído
    const isAssigned = task.status !== 0;

    if (isAssigned) {
      // Se já estiver atribuída/concluída, reverte voltando para pendente (status 0)
      await handleUpdateStatus(task.id, 0);
    } else {
      // Se for pendente, marca como concluída (status 1 ou 5 se expirado)
      const expired = isTaskExpired(task);
      const targetStatus = expired ? 5 : 1;

      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 800);

      await handleUpdateStatus(task.id, targetStatus);
    }
  };

  // --- Módulos de Drag and Drop (Mouse e Touch) ---

  const handleDragStart = (e, taskId) => {
    // Ignorar se clicou diretamente no círculo verde de marcar como concluído
    if (e.target.closest('.task-complete-trigger')) {
      return;
    }

    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

    dragStart.current = { x: clientX, y: clientY };
    draggingTaskIdRef.current = taskId;
    setDraggingTaskId(taskId);
    setDragOffset({ x: 0, y: 0 });

    // Cachear os retângulos de colisão das 3 zonas inferiores
    if (redTargetRef.current) targetRects.current.red = redTargetRef.current.getBoundingClientRect();
    if (yellowTargetRef.current) targetRects.current.yellow = yellowTargetRef.current.getBoundingClientRect();
    if (blueTargetRef.current) targetRects.current.blue = blueTargetRef.current.getBoundingClientRect();

    // Adicionar ouvintes no documento para acompanhar o arraste fora do card
    if (e.type === 'touchstart') {
      document.addEventListener('touchmove', handleDragMove, { passive: false });
      document.addEventListener('touchend', handleDragEnd);
    } else {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
    }
  };

  const handleDragMove = (e) => {
    if (!dragStart.current) return;

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    // Se for touch, evitar a rolagem da página enquanto arrasta
    if (e.type === 'touchmove') {
      e.preventDefault();
    }

    const deltaX = clientX - dragStart.current.x;
    const deltaY = clientY - dragStart.current.y;

    setDragOffset({ x: deltaX, y: deltaY });

    // Verificar se o cursor/toque está sobre algum botão inferior
    const x = clientX;
    const y = clientY;

    let target = null;
    const { red, yellow, blue } = targetRects.current;

    // Margem de tolerância extra ao redor do botão
    const pad = 15;

    if (red && x >= red.left - pad && x <= red.right + pad && y >= red.top - pad && y <= red.bottom + pad) {
      target = 'red';
    } else if (yellow && x >= yellow.left - pad && x <= yellow.right + pad && y >= yellow.top - pad && y <= yellow.bottom + pad) {
      target = 'yellow';
    } else if (blue && x >= blue.left - pad && x <= blue.right + pad && y >= blue.top - pad && y <= blue.bottom + pad) {
      target = 'blue';
    }

    activeTargetRef.current = target;
    setActiveTarget(target);
  };

  const handleDragEnd = async () => {
    // Remover ouvintes
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);

    const taskId = draggingTaskIdRef.current;
    const target = activeTargetRef.current;

    if (taskId !== null) {
      if (target) {
        // Mapeamento dos botões de ação para os respectivos status
        let targetStatus = 2; // Default: Não Concluído
        if (target === 'red') targetStatus = 2; // Não Concluído
        if (target === 'yellow') targetStatus = 3; // Parcial
        if (target === 'blue') targetStatus = 4; // Não se Aplica

        await handleUpdateStatus(taskId, targetStatus);
      }
    }

    // Resetar estado de arraste
    draggingTaskIdRef.current = null;
    activeTargetRef.current = null;
    setDraggingTaskId(null);
    setDragOffset({ x: 0, y: 0 });
    setActiveTarget(null);
    dragStart.current = { x: 0, y: 0 };
    targetRects.current = { red: null, yellow: null, blue: null };
  };

  // --- Renderização condicional por estado ---

  // Tela de carregamento geral
  if (loading && !user) {
    return (
      <div className="transition-screen">
        <div className="login-logo" style={{ animation: 'pulse 1.5s infinite' }}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '28px', height: '28px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p>Carregando painel...</p>
      </div>
    );
  }

  // Tela de Login (Redirecionamento para a raiz centralizada)
  if (!user) {
    return (
      <div className="transition-screen">
        <div className="login-logo" style={{ animation: 'pulse 1.5s infinite' }}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '28px', height: '28px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p>Redirecionando para login...</p>
      </div>
    );
  }

  // Filtragem de tarefas de acordo com a aba selecionada
  // Qualquer status atribuído (1, 2, 3, 4, 5) vai para a aba de concluídas
  // Apenas tarefas sem status atribuído (status 0) permanecem na aba de pendentes
  const filteredTasks = tasks.filter(task => {
    const isAssigned = task.status !== 0;
    
    if (activeTab === 'completed') {
      return isAssigned;
    } else {
      return !isAssigned;
    }
  });

  return (
    <div className="mobile-viewport">
      {/* Brilho verde de sucesso */}
      <div className={`success-glow ${successFlash ? 'show' : ''}`} />

      {/* Cabeçalho da Aplicação */}
      <header className="app-header">
        <div className="header-title-box">
          <h1 className="header-title">Nexus GRR</h1>
          <span className="header-subtitle">Olá, {user.name}</span>
        </div>
        <div className="header-actions">
          {isInstallable && (
            <button className="header-btn" onClick={installPwa} title="Instalar Webapp">
              <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          )}
          <button className="header-btn" onClick={handleLogout} title="Sair">
            <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Banner de Instalação PWA caso disponível */}
      {isInstallable && (
        <div className="pwa-banner">
          <div className="pwa-banner-text">
            <span className="pwa-banner-title">Instalar App no celular</span>
            <span className="pwa-banner-desc">Acesse mais rápido como um aplicativo nativo.</span>
          </div>
          <button className="pwa-install-btn" onClick={installPwa}>
            Instalar
          </button>
        </div>
      )}

      {/* Abas de Filtros */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pendentes ({tasks.filter(t => t.status === 0).length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Concluídas ({tasks.filter(t => t.status !== 0).length})
        </button>
      </div>

      {/* Lista de Tarefas com rolagem */}
      <main className="task-board-content no-scrollbar">
        {loading ? (
          <div className="empty-state">
            <p>Carregando tarefas...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p style={{ fontWeight: 500 }}>Nenhuma tarefa por aqui</p>
            <p style={{ fontSize: '0.8rem' }}>Tudo limpo no seu painel!</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDragging = draggingTaskId === task.id;
            const expired = isTaskExpired(task);
            const isCompleted = task.status !== 0;
            
            // Determinar o status de exibição
            let displayStatus = task.status;
            if (task.status === 0 && expired) {
              displayStatus = 'expired';
            }

            // Textos dos status
            const statusLabels = {
              0: 'Pendente',
              expired: 'Expirado',
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

            // Estilos dinâmicos de arraste
            const dragStyle = isDragging ? {
              transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(0.98) rotate(${dragOffset.x * 0.04}deg)`,
              zIndex: 100,
              boxShadow: '0 20px 35px rgba(0, 0, 0, 0.4)',
              transition: 'none',
              cursor: 'grabbing'
            } : {
              transition: 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.25s'
            };

            return (
              <div
                key={task.id}
                className={`task-card status-${displayStatus} ${isDragging ? 'dragging' : ''}`}
                style={dragStyle}
                onMouseDown={(e) => handleDragStart(e, task.id)}
                onTouchStart={(e) => handleDragStart(e, task.id)}
              >
                {/* Botão Círculo Verde de Conclusão Rápida */}
                <button 
                  className={`task-complete-trigger ${isCompleted ? 'completed' : ''}`}
                  onClick={() => handleCompleteToggle(task)}
                  title={isCompleted ? "Desmarcar como Concluído" : "Marcar como Concluído"}
                />

                <div className="task-card-header">
                  <span className="task-title">{task.title}</span>
                </div>

                {task.description && (
                  <p className="task-desc">{task.description}</p>
                )}

                <div className="task-footer">
                  <span className="task-date">
                    Prazo: {formatDate(task.end_date)}
                  </span>
                  {task.recurrence && (
                    <span className="task-recurrence-badge">
                      <svg className="recurrence-dot" viewBox="0 0 6 6" fill="currentColor">
                        <circle cx="3" cy="3" r="3" />
                      </svg>
                      {recurrenceLabels[task.recurrence]}
                    </span>
                  )}
                  <span className={`status-badge ${badgeClasses[displayStatus] || 'badge-notdone'}`}>
                    {statusLabels[displayStatus] || 'Pendente'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Painel Inferior de Botões/Zonas de Arraste (Apenas visível na aba de pendentes) */}
      {activeTab === 'pending' && (
        <footer className="bottom-dropzone-panel">
          {/* Red X button (Não Concluído - 2) */}
          <div 
            ref={redTargetRef}
            className={`drop-target-button red ${activeTarget === 'red' ? 'active-hover' : ''}`}
            title="Solte para marcar como Não Concluído"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          {/* Yellow ! button (Parcial - 3) */}
          <div 
            ref={yellowTargetRef}
            className={`drop-target-button yellow ${activeTarget === 'yellow' ? 'active-hover' : ''}`}
            title="Solte para marcar como Parcial"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* Blue N/A button (Não se aplica - 4) */}
          <div 
            ref={blueTargetRef}
            className={`drop-target-button blue ${activeTarget === 'blue' ? 'active-hover' : ''}`}
            title="Solte para marcar como Não se Aplica"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="9" strokeWidth={2.5} />
              <path strokeLinecap="round" strokeWidth={2.5} d="M18 6L6 18" />
            </svg>
          </div>
        </footer>
      )}
    </div>
  );
}
