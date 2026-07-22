'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  fetchOperationsDiagnosticSubmissionAction,
  saveOperationsDiagnosticReviewAction
} from '../../../../actions.js';
import {
  calculateOperationsDiagnosticResults,
  OPERATIONS_DIAGNOSTIC_SECTIONS,
  OPERATIONS_EVALUATION_OPTIONS,
  OPERATIONS_NOTE_MAX_LENGTH,
  formatOperationsPercentage,
  getOperationsExcellenceLevel
} from '../../../../../lib/operationsDiagnosticCatalog.js';

function RadarChart({ items }) {
  const center = 210;
  const radius = 145;
  const count = items.length;
  const pointAt = (index, value) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
    const distance = radius * Math.max(0, Math.min(1, Number(value || 0)));
    return [center + Math.cos(angle) * distance, center + Math.sin(angle) * distance];
  };
  const fullPoints = items.map((_, index) => pointAt(index, 1).join(',')).join(' ');
  const scorePoints = items.map((item, index) => pointAt(index, item.percentage).join(',')).join(' ');

  return (
    <svg className="diagnostic-radar" viewBox="0 0 420 420" role="img" aria-label="Gráfico radar dos resultados operacionais">
      {[0.25, 0.5, 0.75, 1].map(level => <polygon key={level} points={items.map((_, index) => pointAt(index, level).join(',')).join(' ')} className="radar-grid" />)}
      {items.map((item, index) => {
        const edge = pointAt(index, 1);
        const label = pointAt(index, 1.16);
        const name = item.shortName || item.name;
        return (
          <g key={item.code}>
            <line x1={center} y1={center} x2={edge[0]} y2={edge[1]} className="radar-axis" />
            <text x={label[0]} y={label[1]} textAnchor={label[0] < center - 5 ? 'end' : label[0] > center + 5 ? 'start' : 'middle'} dominantBaseline="middle">
              {name.length > 18 ? `${name.slice(0, 17)}…` : name}
            </text>
          </g>
        );
      })}
      <polygon points={fullPoints} className="radar-maximum" />
      <polygon points={scorePoints} className="radar-score" />
      {items.map((item, index) => {
        const point = pointAt(index, item.percentage);
        return <circle key={item.code} cx={point[0]} cy={point[1]} r="3.5" className="radar-dot" />;
      })}
    </svg>
  );
}

function StackedBar({ value, label }) {
  const percentage = Math.max(0, Math.min(100, Number(value || 0) * 100));
  return (
    <div className="diagnostic-stacked-row">
      {label && <span title={label}>{label}</span>}
      <div className="diagnostic-stacked-bar">
        <span className="diagnostic-stacked-real" style={{ width: `${percentage}%` }} />
        <span className="diagnostic-stacked-gap" style={{ width: `${100 - percentage}%` }} />
        <strong>{percentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong>
      </div>
    </div>
  );
}

function normalizeAnswers(data) {
  const stored = new Map((data?.answers || []).map(answer => [answer.questionCode, answer]));
  return Object.fromEntries(OPERATIONS_DIAGNOSTIC_SECTIONS.flatMap(section => section.groups.flatMap(group => group.questions.map(question => {
    const answer = stored.get(question.code) || {};
    return [question.code, {
      evaluationCode: answer.evaluationCode || '',
      implementationDate: answer.implementationDate || '',
      willImplement: answer.willImplement === true || answer.willImplement === 'SIM'
        ? 'SIM'
        : answer.willImplement === false || answer.willImplement === 'NÃO' ? 'NÃO' : '',
      notes: answer.notes || ''
    }];
  }))));
}

function normalizeSections(data) {
  const stored = new Map((data?.sections || []).map(section => [section.sectionCode, section]));
  return Object.fromEntries(OPERATIONS_DIAGNOSTIC_SECTIONS.map(section => {
    const response = stored.get(section.code) || {};
    return [section.code, {
      answersResponsible: response.answersResponsible || '',
      sectorResponsible: response.sectorResponsible || ''
    }];
  }));
}

function formatDate(value) {
  if (!value) return '—';
  const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(value);
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
}

export default function OperationsDiagnosticReview() {
  const params = useParams();
  const publicId = params.id;
  const [diagnostic, setDiagnostic] = useState(null);
  const [answers, setAnswers] = useState({});
  const [sectionData, setSectionData] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeView, setActiveView] = useState('questionnaire');
  const [activeSectionCode, setActiveSectionCode] = useState(OPERATIONS_DIAGNOSTIC_SECTIONS[0].code);
  const [activeGroupCode, setActiveGroupCode] = useState(OPERATIONS_DIAGNOSTIC_SECTIONS[0].groups[0].code);

  useEffect(() => {
    fetchOperationsDiagnosticSubmissionAction(publicId)
      .then(data => {
        if (!data) throw new Error('Diagnóstico não encontrado.');
        setDiagnostic(data);
        setAnswers(normalizeAnswers(data));
        setSectionData(normalizeSections(data));
      })
      .catch(() => setLoadError('Não foi possível carregar o diagnóstico de operações.'))
      .finally(() => setLoading(false));
  }, [publicId]);

  const calculationAnswers = useMemo(() => Object.entries(answers).map(([questionCode, answer]) => ({
    questionCode,
    evaluationCode: answer.evaluationCode
  })), [answers]);
  const results = useMemo(() => calculateOperationsDiagnosticResults(calculationAnswers), [calculationAnswers]);
  const activeSection = results.sections.find(section => section.code === activeSectionCode) || results.sections[0];
  const activeGroup = activeSection.groups.find(group => group.code === activeGroupCode) || activeSection.groups[0];
  const answerByCode = useMemo(() => new Map(activeSection.questionResults.map(question => [question.code, question])), [activeSection]);
  const groupResults = useMemo(() => activeSection.groups.map(group => {
    const questionResults = group.questions.map(question => answerByCode.get(question.code));
    const scoreTotal = questionResults.reduce((sum, question) => sum + Number(question?.score || 0), 0);
    const maximumTotal = questionResults.length * 10;
    return { ...group, questionResults, scoreTotal, maximumTotal, percentage: maximumTotal ? scoreTotal / maximumTotal : 0 };
  }), [activeSection, answerByCode]);
  const submittedAnswerByCode = useMemo(() => new Map(
    (diagnostic?.submittedAnswers || diagnostic?.answers || []).map(answer => [answer.questionCode, answer])
  ), [diagnostic]);
  const excellence = getOperationsExcellenceLevel(results.overallPercentage);

  const selectSection = sectionCode => {
    const section = OPERATIONS_DIAGNOSTIC_SECTIONS.find(item => item.code === sectionCode);
    setActiveSectionCode(sectionCode);
    setActiveGroupCode(section.groups[0].code);
  };

  const updateAnswer = (questionCode, field, value) => {
    setAnswers(current => ({ ...current, [questionCode]: { ...current[questionCode], [field]: value } }));
    setSaveMessage('');
  };

  const updateSection = (sectionCode, field, value) => {
    setSectionData(current => ({ ...current, [sectionCode]: { ...current[sectionCode], [field]: value } }));
    setSaveMessage('');
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const updated = await saveOperationsDiagnosticReviewAction(
        publicId,
        Object.entries(answers).map(([questionCode, answer]) => ({ questionCode, ...answer })),
        OPERATIONS_DIAGNOSTIC_SECTIONS.map(section => ({ sectionCode: section.code, ...sectionData[section.code] }))
      );
      setDiagnostic(updated);
      setSaveMessage('Avaliação operacional salva e resultados recalculados.');
    } catch {
      setSaveMessage('Não foi possível salvar a avaliação. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-section-loading"><p>Carregando diagnóstico...</p></div>;
  if (loadError) return (
    <main className="admin-container"><div className="diagnostics-setup-state admin-card"><h2>Diagnóstico indisponível</h2><p>{loadError}</p><Link className="diagnostics-open-button" href="/adm/diagnostics/operacoes">Voltar</Link></div></main>
  );

  return (
    <main className="admin-container diagnostic-review-page no-scrollbar">
      <header className="diagnostic-review-header">
        <div>
          <Link href="/adm/diagnostics/operacoes">← Diagnósticos de operações</Link>
          <span className="diagnostics-kicker">Diagnóstico de operações</span>
          <h2>{diagnostic.company_name}</h2>
          <p>{formatDate(diagnostic.diagnostic_date)} · Modelo v1 · Fórmula {diagnostic.formula_code}</p>
        </div>
        <div className="diagnostic-review-header-actions"><img src="/isp4-logo.svg" alt="ISP4 Consultoria" /><button className="diagnostic-review-save" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar avaliação'}</button></div>
      </header>

      {saveMessage && <p className="diagnostic-review-message" role="status">{saveMessage}</p>}

      <nav className="diagnostic-review-tabs" aria-label="Visualizações do diagnóstico de operações">
        <button className={activeView === 'questionnaire' ? 'active' : ''} onClick={() => setActiveView('questionnaire')}>Diagnóstico</button>
        <button className={activeView === 'consolidated' ? 'active' : ''} onClick={() => setActiveView('consolidated')}>Resultados</button>
        <button className={activeView === 'areas' ? 'active' : ''} onClick={() => setActiveView('areas')}>Áreas</button>
      </nav>

      {activeView === 'questionnaire' && (
        <section className="diagnostic-review-questionnaire">
          <div className="diagnostic-visibility-control">
            <div><strong>Questionário operacional</strong><span>Selecione a área e o grupo para revisar avaliações, prazos e anotações.</span></div>
            <div className="operations-review-toolbar">
              <select aria-label="Área operacional" value={activeSection.code} onChange={event => selectSection(event.target.value)}>{results.sections.map(section => <option key={section.code} value={section.code}>{section.name}</option>)}</select>
              <select aria-label="Grupo da área" value={activeGroup.code} onChange={event => setActiveGroupCode(event.target.value)}>{activeSection.groups.map(group => <option key={group.code} value={group.code}>{group.name}</option>)}</select>
            </div>
          </div>

          <article className="diagnostic-review-sheet">
            <div className="diagnostic-review-section-title">
              <strong>{activeSection.name} · {activeGroup.name}</strong>
              <span>Itens: {activeGroup.questions.length}</span>
              <span>NOTA: {activeGroup.scoreTotal.toLocaleString('pt-BR')}</span>
              <span>NOTA MÁX: {activeGroup.maximumTotal.toLocaleString('pt-BR')}</span>
              <span>PONTUAÇÃO REAL: {formatOperationsPercentage(activeGroup.percentage)}</span>
            </div>
            <div className="diagnostic-review-responsibles">
              <label><span>Responsável pelas respostas:</span><input maxLength={255} value={sectionData[activeSection.code]?.answersResponsible || ''} onChange={event => updateSection(activeSection.code, 'answersResponsible', event.target.value)} /></label>
              <label><span>Responsável do setor:</span><input maxLength={255} value={sectionData[activeSection.code]?.sectorResponsible || ''} onChange={event => updateSection(activeSection.code, 'sectorResponsible', event.target.value)} /></label>
            </div>
            {(activeSection.description || activeGroup.description) && (
              <div className="operations-review-group-description">
                {activeSection.description && <strong>{activeSection.description}</strong>}
                {activeGroup.description && <p>{activeGroup.description}</p>}
              </div>
            )}
            <div className="diagnostic-review-table-wrap">
              <table className="diagnostic-review-table operations-review-table">
                <thead><tr><th>Item</th><th>Prática / Pergunta</th><th>Resposta enviada</th><th>Avaliação atual</th><th>{activeSection.implementationMode === 'date' ? 'Prazo de implementação' : activeSection.implementationMode === 'boolean' ? 'Vai implementar?' : 'Implementação'}</th><th>Anotações atuais</th><th>Orientações e processos</th></tr></thead>
                <tbody>
                  {activeGroup.questions.map(question => {
                    const answer = answers[question.code];
                    const submittedAnswer = submittedAnswerByCode.get(question.code) || {};
                    const submittedEvaluation = OPERATIONS_EVALUATION_OPTIONS.find(option => option.code === submittedAnswer.evaluationCode);
                    return (
                      <tr key={question.code}>
                        <td><small>Linha {question.sourceRow}</small><strong>{question.code}</strong></td>
                        <td><strong>{question.text || question.item}</strong>{question.item && question.item !== question.text && <small>{question.item}</small>}</td>
                        <td className="operations-submitted-answer">
                          <strong>{submittedEvaluation?.label || '—'}</strong>
                          {activeSection.implementationMode === 'date' && submittedAnswer.implementationDate && <small>Prazo enviado: {formatDate(submittedAnswer.implementationDate)}</small>}
                          {activeSection.implementationMode === 'boolean' && submittedAnswer.willImplement != null && <small>Vai implementar: {submittedAnswer.willImplement === true || submittedAnswer.willImplement === 'SIM' ? 'SIM' : 'NÃO'}</small>}
                          {submittedAnswer.notes && <details><summary>Ver anotações</summary><p>{submittedAnswer.notes}</p></details>}
                        </td>
                        <td><select value={answer.evaluationCode} onChange={event => updateAnswer(question.code, 'evaluationCode', event.target.value)}><option value="">Selecione</option>{OPERATIONS_EVALUATION_OPTIONS.map(option => <option key={option.code} value={option.code}>{option.label}</option>)}</select></td>
                        <td>
                          {activeSection.implementationMode === 'date' && <input type="date" value={answer.implementationDate} onChange={event => updateAnswer(question.code, 'implementationDate', event.target.value)} />}
                          {activeSection.implementationMode === 'boolean' && <select value={answer.willImplement} onChange={event => updateAnswer(question.code, 'willImplement', event.target.value)}><option value="">Não informado</option><option value="SIM">SIM</option><option value="NÃO">NÃO</option></select>}
                          {activeSection.implementationMode === 'none' && <span>—</span>}
                        </td>
                        <td><textarea maxLength={OPERATIONS_NOTE_MAX_LENGTH} value={answer.notes} onChange={event => updateAnswer(question.code, 'notes', event.target.value)} /></td>
                        <td>{question.guidance || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}

      {activeView === 'consolidated' && (
        <section className="diagnostic-results-view">
          <div className="diagnostic-results-summary">
            <div className={`diagnostic-result-index result-${excellence.tone}`}><span>Índice geral das operações</span><strong>{formatOperationsPercentage(results.overallPercentage)}</strong><small>{excellence.label}</small></div>
            <div className="diagnostic-result-index result-pillars"><span>Itens avaliados</span><strong>{results.answeredCount}/{results.totalQuestions}</strong><small>{results.sections.length} áreas operacionais</small></div>
          </div>
          <div className="diagnostic-report-grid">
            <article className="diagnostic-report-card"><div className="diagnostic-report-heading"><h3>Resultado consolidado</h3><span className="diagnostic-legend"><i /> Real <i /> 100%</span></div><RadarChart items={results.sections} /></article>
            <article className="diagnostic-report-card"><div className="diagnostic-report-heading"><h3>Desempenho por área</h3><span>Real x lacuna</span></div><div className="diagnostic-bars-list">{results.sections.map(section => <StackedBar key={section.code} label={section.name} value={section.percentage} />)}</div></article>
          </div>
        </section>
      )}

      {activeView === 'areas' && (
        <section className="diagnostic-perspectives-view">
          <div className="diagnostic-perspective-selector">{results.sections.map(section => <button key={section.code} className={activeSection.code === section.code ? 'active' : ''} onClick={() => selectSection(section.code)}>{section.shortName || section.name}</button>)}</div>
          <div className="diagnostic-perspective-header"><div><span className="diagnostics-kicker">Área operacional</span><h2>{activeSection.name}</h2></div><strong>{formatOperationsPercentage(activeSection.percentage)}</strong></div>
          <StackedBar value={activeSection.percentage} />
          <div className="diagnostic-report-grid">
            <article className="diagnostic-report-card"><h3>Resultados por grupo</h3><div className="diagnostic-bars-list">{groupResults.map(group => <StackedBar key={group.code} label={group.name} value={group.percentage} />)}</div></article>
            <article className="diagnostic-report-card"><h3>Oportunidades por grupo</h3><div className="diagnostic-bars-list">{groupResults.map(group => <StackedBar key={group.code} label={group.name} value={1 - group.percentage} />)}</div></article>
          </div>
          <article className="diagnostic-recommendations-card">
            <h3>Principais oportunidades de melhoria</h3>
            <div className="operations-opportunities-list">
              {activeSection.questionResults.filter(question => answers[question.code]?.evaluationCode !== 'sim').map(question => (
                <div className="operations-opportunity" key={question.code}>
                  <strong>{question.text || question.item}</strong>
                  <span>{question.guidance || 'Descrever plano de ação para este item.'}</span>
                  <small>{
                    activeSection.implementationMode === 'date'
                      ? answers[question.code]?.implementationDate ? `Prazo: ${formatDate(answers[question.code].implementationDate)}` : 'Prazo não definido'
                      : activeSection.implementationMode === 'boolean'
                        ? answers[question.code]?.willImplement ? `Vai implementar: ${answers[question.code].willImplement}` : 'Implementação não informada'
                        : 'Sem campo de implementação'
                  }</small>
                </div>
              ))}
              {activeSection.questionResults.every(question => answers[question.code]?.evaluationCode === 'sim') && <p>Todos os itens desta área foram avaliados como atendidos.</p>}
            </div>
          </article>
        </section>
      )}
    </main>
  );
}
