'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fetchDiagnosticSubmissionAction, saveDiagnosticReviewAction } from '../../../actions.js';
import {
  calculateDiagnosticResults,
  DIAGNOSTIC_SECTIONS,
  EVALUATION_OPTIONS,
  formatDiagnosticPercentage,
  getExcellenceLevel
} from '../../../../lib/diagnosticCatalog.js';

function RadarChart({ items, valueKey = 'percentage', maximum = 1 }) {
  const center = 210;
  const radius = 145;
  const count = items.length;
  const pointAt = (index, value) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
    const distance = radius * Math.max(0, Math.min(maximum, Number(value || 0))) / maximum;
    return [center + Math.cos(angle) * distance, center + Math.sin(angle) * distance];
  };
  const fullPoints = items.map((_, index) => pointAt(index, maximum).join(',')).join(' ');
  const scorePoints = items.map((item, index) => pointAt(index, item[valueKey]).join(',')).join(' ');

  return (
    <svg className="diagnostic-radar" viewBox="0 0 420 420" role="img" aria-label="Gráfico radar dos resultados">
      {[0.25, 0.5, 0.75, 1].map(level => (
        <polygon key={level} points={items.map((_, index) => pointAt(index, maximum * level).join(',')).join(' ')} className="radar-grid" />
      ))}
      {items.map((item, index) => {
        const edge = pointAt(index, maximum);
        const label = pointAt(index, maximum * 1.16);
        return (
          <g key={item.code || item.item}>
            <line x1={center} y1={center} x2={edge[0]} y2={edge[1]} className="radar-axis" />
            <text x={label[0]} y={label[1]} textAnchor={label[0] < center - 5 ? 'end' : label[0] > center + 5 ? 'start' : 'middle'} dominantBaseline="middle">
              {(item.name || item.item).length > 18 ? `${(item.name || item.item).slice(0, 17)}…` : item.name || item.item}
            </text>
          </g>
        );
      })}
      <polygon points={fullPoints} className="radar-maximum" />
      <polygon points={scorePoints} className="radar-score" />
      {items.map((item, index) => {
        const point = pointAt(index, item[valueKey]);
        return <circle key={item.code || item.item} cx={point[0]} cy={point[1]} r="3.5" className="radar-dot" />;
      })}
    </svg>
  );
}

function StackedBar({ value, label }) {
  const percentage = Math.max(0, Math.min(100, Number(value || 0) * 100));
  return (
    <div className="diagnostic-stacked-row">
      {label && <span>{label}</span>}
      <div className="diagnostic-stacked-bar">
        <span className="diagnostic-stacked-real" style={{ width: `${percentage}%` }} />
        <span className="diagnostic-stacked-gap" style={{ width: `${100 - percentage}%` }} />
        <strong>{percentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong>
      </div>
    </div>
  );
}

function normalizeAnswers(data) {
  const stored = new Map((data?.answers || []).map(answer => [answer.question_code, answer]));
  return Object.fromEntries(DIAGNOSTIC_SECTIONS.flatMap(section => section.questions.map(question => {
    const answer = stored.get(question.code) || {};
    return [question.code, {
      applicable: answer.applicable !== false,
      selfScore: answer.self_score == null ? '' : String(answer.self_score),
      evaluationCode: answer.evaluation_code || 'nao_existe',
      consultantObservation: answer.consultant_observation || '',
      possibleImprovements: answer.possible_improvements || ''
    }];
  })));
}

function normalizeSections(data) {
  const stored = new Map((data?.sectionResponses || []).map(response => [response.section_code, response]));
  return Object.fromEntries(DIAGNOSTIC_SECTIONS.map(section => {
    const response = stored.get(section.code) || {};
    return [section.code, {
      answersResponsible: response.answers_responsible_name || '',
      sectorResponsible: response.sector_responsible_name || ''
    }];
  }));
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value));
}

export default function DiagnosticReview() {
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
  const [activeSectionCode, setActiveSectionCode] = useState('comercial');
  const [showHiddenSections, setShowHiddenSections] = useState(false);

  useEffect(() => {
    fetchDiagnosticSubmissionAction(publicId)
      .then(data => {
        if (!data) throw new Error('Diagnóstico não encontrado.');
        setDiagnostic(data);
        setAnswers(normalizeAnswers(data));
        setSectionData(normalizeSections(data));
      })
      .catch(error => setLoadError(error.message || 'Não foi possível carregar o diagnóstico.'))
      .finally(() => setLoading(false));
  }, [publicId]);

  const calculationAnswers = useMemo(() => Object.entries(answers).map(([questionCode, answer]) => ({
    questionCode,
    applicable: answer.applicable,
    selfScore: answer.selfScore,
    evaluationCode: answer.evaluationCode
  })), [answers]);
  const results = useMemo(() => calculateDiagnosticResults(calculationAnswers), [calculationAnswers]);
  const activeSection = results.sections.find(section => section.code === activeSectionCode) || results.sections[0];
  const excellence = getExcellenceLevel(results.overallPercentage);

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
      const updated = await saveDiagnosticReviewAction(publicId, Object.entries(answers).map(([questionCode, answer]) => ({
        questionCode,
        applicable: answer.applicable,
        selfScore: answer.selfScore,
        evaluationCode: answer.evaluationCode,
        consultantObservation: answer.consultantObservation,
        possibleImprovements: answer.possibleImprovements
      })), DIAGNOSTIC_SECTIONS.map(section => ({ sectionCode: section.code, ...sectionData[section.code] })));
      setDiagnostic(updated);
      setSaveMessage('Avaliação CFE salva e resultados recalculados.');
    } catch (error) {
      setSaveMessage(error.message || 'Não foi possível salvar a avaliação.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-section-loading"><p>Carregando diagnóstico...</p></div>;
  if (loadError) return (
    <main className="admin-container"><div className="diagnostics-setup-state admin-card"><h2>Diagnóstico indisponível</h2><p>{loadError}</p><Link className="diagnostics-open-button" href="/adm/diagnostics">Voltar</Link></div></main>
  );

  const visibleReviewSections = showHiddenSections ? DIAGNOSTIC_SECTIONS : DIAGNOSTIC_SECTIONS.filter(section => section.isVisible);

  return (
    <main className="admin-container diagnostic-review-page no-scrollbar">
      <header className="diagnostic-review-header">
        <div>
          <Link href="/adm/diagnostics">← Diagnósticos</Link>
          <span className="diagnostics-kicker">Diagnóstico empresarial</span>
          <h2>{diagnostic.company_name}</h2>
          <p>{formatDate(diagnostic.diagnostic_date)} · Modelo v1 · Fórmula {diagnostic.formula_code}</p>
        </div>
        <div className="diagnostic-review-header-actions"><img src="/isp4-logo.svg" alt="ISP4 Consultoria" /><button className="diagnostic-review-save" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar avaliação CFE'}</button></div>
      </header>

      {saveMessage && <p className="diagnostic-review-message" role="status">{saveMessage}</p>}

      <nav className="diagnostic-review-tabs" aria-label="Visualizações do diagnóstico">
        <button className={activeView === 'questionnaire' ? 'active' : ''} onClick={() => setActiveView('questionnaire')}>Diagnóstico</button>
        <button className={activeView === 'consolidated' ? 'active' : ''} onClick={() => setActiveView('consolidated')}>Resultados</button>
        <button className={activeView === 'perspectives' ? 'active' : ''} onClick={() => setActiveView('perspectives')}>Perspectivas</button>
        <button className={activeView === 'protocol' ? 'active' : ''} onClick={() => setActiveView('protocol')}>Protocolo</button>
      </nav>

      {activeView === 'questionnaire' && (
        <section className="diagnostic-review-questionnaire">
          <div className="diagnostic-visibility-control">
            <div><strong>Questionário inicial</strong><span>A planilha deixa 6 perspectivas ocultas e 4 visíveis.</span></div>
            <label><input type="checkbox" checked={showHiddenSections} onChange={event => setShowHiddenSections(event.target.checked)} /> Exibir as 35 perguntas ocultas da planilha</label>
          </div>

          {visibleReviewSections.map(section => {
            const sectionResult = results.sections.find(item => item.code === section.code);
            return (
              <article className="diagnostic-review-sheet" key={section.code}>
                <div className="diagnostic-review-section-title">
                  <strong>{section.name}</strong>
                  <span>Autoavaliação: {sectionResult.selfAssessment.toLocaleString('pt-BR')}</span>
                  <span>NOTA CFE: {sectionResult.consultantTotal.toLocaleString('pt-BR')}</span>
                  <span>NOTA MÁX: {sectionResult.maximumTotal.toLocaleString('pt-BR')}</span>
                  <span>PONTUAÇÃO REAL: {formatDiagnosticPercentage(sectionResult.percentage)}</span>
                </div>
                <div className="diagnostic-review-responsibles">
                  <label><span>Responsável pelas respostas:</span><input value={sectionData[section.code]?.answersResponsible || ''} onChange={event => updateSection(section.code, 'answersResponsible', event.target.value)} /></label>
                  <label><span>Responsável do setor:</span><input value={sectionData[section.code]?.sectorResponsible || ''} onChange={event => updateSection(section.code, 'sectorResponsible', event.target.value)} /></label>
                </div>
                <div className="diagnostic-review-table-wrap">
                  <table className="diagnostic-review-table">
                    <thead><tr><th>Item</th><th>Perguntas</th><th>É aplicável?<br />SIM/NÃO</th><th>Autoavaliação<br />(Nota 0 a 10)</th><th>Avaliação</th><th>Nota Avaliação</th><th>Nota Máxima</th><th>Observações do Consultor CFE</th><th>Melhorias Possíveis</th></tr></thead>
                    <tbody>
                      {section.questions.map(question => {
                        const answer = answers[question.code];
                        const evaluation = EVALUATION_OPTIONS.find(option => option.code === answer.evaluationCode);
                        return (
                          <tr key={question.code}>
                            <td><small>{question.code}</small><strong>{question.item}</strong></td>
                            <td>{question.text}</td>
                            <td><select value={answer.applicable ? 'SIM' : 'NÃO'} onChange={event => updateAnswer(question.code, 'applicable', event.target.value === 'SIM')}><option value="SIM">SIM</option><option value="NÃO">NÃO</option></select></td>
                            <td><input type="number" min="0" max="10" step="0.1" value={answer.selfScore} onChange={event => updateAnswer(question.code, 'selfScore', event.target.value)} /></td>
                            <td><select value={answer.evaluationCode} onChange={event => updateAnswer(question.code, 'evaluationCode', event.target.value)}>{EVALUATION_OPTIONS.map(option => <option key={option.code} value={option.code}>{option.label}</option>)}</select></td>
                            <td className="diagnostic-calculated-cell">{answer.applicable ? evaluation.score : 0}</td>
                            <td className="diagnostic-calculated-cell">{answer.applicable ? 10 : 0}</td>
                            <td><textarea value={answer.consultantObservation} onChange={event => updateAnswer(question.code, 'consultantObservation', event.target.value)} /></td>
                            <td><textarea value={answer.possibleImprovements} onChange={event => updateAnswer(question.code, 'possibleImprovements', event.target.value)} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {activeView === 'consolidated' && (
        <section className="diagnostic-results-view">
          <div className="diagnostic-results-summary">
            <div className={`diagnostic-result-index result-${excellence.tone}`}><span>Nível de excelência na gestão empresarial</span><strong>{formatDiagnosticPercentage(results.overallPercentage)}</strong><small>{excellence.label}</small></div>
            <div className="diagnostic-result-index result-pillars"><span>Pilares de alavancagem e crescimento</span><strong>{formatDiagnosticPercentage(results.leveragePercentage)}</strong><small>Comercial · Marketing · Pessoas · Estratégia</small></div>
          </div>
          <div className="diagnostic-report-grid">
            <article className="diagnostic-report-card"><div className="diagnostic-report-heading"><h3>Resultado consolidado</h3><span className="diagnostic-legend"><i /> Real <i /> 100%</span></div><RadarChart items={results.sections} /></article>
            <article className="diagnostic-report-card"><div className="diagnostic-report-heading"><h3>Consolidado</h3><span>Real x lacuna</span></div><div className="diagnostic-bars-list">{results.sections.map(section => <StackedBar key={section.code} label={section.name} value={section.percentage} />)}</div></article>
          </div>
        </section>
      )}

      {activeView === 'perspectives' && (
        <section className="diagnostic-perspectives-view">
          <div className="diagnostic-perspective-selector">{results.sections.map(section => <button key={section.code} className={activeSectionCode === section.code ? 'active' : ''} onClick={() => setActiveSectionCode(section.code)}>{section.name}</button>)}</div>
          <div className="diagnostic-perspective-header"><div><span className="diagnostics-kicker">Perspectiva</span><h2>{activeSection.name}</h2></div><strong>{formatDiagnosticPercentage(activeSection.percentage)}</strong></div>
          <StackedBar value={activeSection.percentage} />
          <div className="diagnostic-report-grid">
            <article className="diagnostic-report-card"><h3>Resultados por item</h3><div className="diagnostic-bars-list">{activeSection.questionResults.map(question => <StackedBar key={question.code} label={question.item} value={question.maximumScore ? question.consultantScore / question.maximumScore : 0} />)}</div></article>
            <article className="diagnostic-report-card"><h3>{activeSection.name}</h3><RadarChart items={activeSection.questionResults} valueKey="consultantScore" maximum={10} /></article>
          </div>
          <article className="diagnostic-recommendations-card"><h3>Principais Oportunidades de Melhoria</h3><ol>{activeSection.recommendations.map((recommendation, index) => <li key={recommendation}><span>{String(index + 1).padStart(2, '0')}</span>{recommendation}</li>)}</ol></article>
        </section>
      )}

      {activeView === 'protocol' && (
        <section className="diagnostic-protocol-sheet">
          <div className="diagnostic-protocol-title">DIAGNÓSTICO EMPRESARIAL</div>
          <h2>Protocolo de Entrega do Produto</h2>
          <p className="diagnostic-protocol-declaration">
            <strong>{diagnostic.company_name.toUpperCase()}</strong>, inscrita no CNPJ sob o nº XX.XXX.XXX/0001-XX, estabelecida na Rua, nº XXX, Complemento - Cidade/UF, declara ter recebido da FIRMA DE CONSULTORIA XXXXX, inscrito no CNPJ sob o nº XX.XXX.XXX/0001-XX, os seguintes produtos referentes ao contrato de Consultoria, conforme descritos abaixo:
          </p>
          <table>
            <thead><tr><th>Produto</th><th>Especificação</th></tr></thead>
            <tbody>
              <tr><td><small>1.0</small><strong>Relatório de Diagnóstico</strong></td><td>Este documento contempla: a) os resultados obtidos da EMPRESA XXX; b) sugestões de melhorias nos aspectos abordados no processo de diagnóstico.</td></tr>
              <tr><td><small>2.0</small><strong>Apresentação Final do Diagnóstico realizado para a Diretoria</strong></td><td>Este documento contempla: a) Sumário Executivo; b) Análise de Evidências Financeiras; c) Conclusões e Recomendações; e d) Proposta de Contrato de Consultoria em Gestão.</td></tr>
              <tr><td><small>3.0</small><strong>Mídia com as informações entregues</strong></td><td>Esta mídia contempla: arquivo em .pdf da Apresentação Final do Diagnóstico e Relatório de Diagnóstico</td></tr>
            </tbody>
          </table>
          <div className="diagnostic-protocol-signature"><span>Cidade/UF, XX de XXXX de 2023</span><span /><strong>NOME DO CLIENTE</strong></div>
        </section>
      )}
    </main>
  );
}
