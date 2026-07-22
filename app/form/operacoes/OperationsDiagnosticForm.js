'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { submitOperationsDiagnosticAction } from '../../actions.js';
import {
  ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS,
  OPERATIONS_DIAGNOSTIC_TEMPLATE,
  OPERATIONS_DIAGNOSTIC_SECTIONS,
  OPERATIONS_EVALUATION_OPTIONS,
  OPERATIONS_NOTE_MAX_LENGTH
} from '../../../lib/operationsDiagnosticCatalog.js';

const OPERATIONS_DRAFT_KEY = 'nexus_operations_diagnostic_draft_v1';

const initialAnswers = Object.fromEntries(
  ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS.map(question => [question.code, {
    evaluationCode: '',
    implementationDate: '',
    willImplement: '',
    notes: ''
  }])
);

const initialSectionData = Object.fromEntries(
  OPERATIONS_DIAGNOSTIC_SECTIONS.map(section => [section.code, {
    answersResponsible: '',
    sectorResponsible: ''
  }])
);

const initialGroupIndexes = Object.fromEntries(
  OPERATIONS_DIAGNOSTIC_SECTIONS.map(section => [section.code, 0])
);

function todayAsInputDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function scrollToFormProgress() {
  requestAnimationFrame(() => {
    document.querySelector('.operations-diagnostic-form .diagnostic-form-progress')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function persistOperationsDraft(snapshot) {
  if (!snapshot) return;
  try {
    localStorage.setItem(OPERATIONS_DRAFT_KEY, JSON.stringify(snapshot));
  } catch {
    // O formulário continua funcional mesmo se o navegador bloquear armazenamento local.
  }
}

export default function OperationsDiagnosticForm() {
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState('');
  const [diagnosticDate, setDiagnosticDate] = useState(todayAsInputDate);
  const [answers, setAnswers] = useState(initialAnswers);
  const [sectionData, setSectionData] = useState(initialSectionData);
  const [groupIndexes, setGroupIndexes] = useState(initialGroupIndexes);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedId, setSubmittedId] = useState('');
  const [draftReady, setDraftReady] = useState(false);
  const draftSnapshotRef = useRef(null);

  const activeSection = step > 0 ? OPERATIONS_DIAGNOSTIC_SECTIONS[step - 1] : null;
  const activeGroupIndex = activeSection ? groupIndexes[activeSection.code] || 0 : 0;
  const activeGroup = activeSection?.groups[activeGroupIndex] || null;
  const answeredCount = useMemo(
    () => ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS.filter(question => answers[question.code].evaluationCode).length,
    [answers]
  );
  const completion = Math.round((answeredCount / ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS.length) * 100);
  const sectionSummary = useMemo(() => OPERATIONS_DIAGNOSTIC_SECTIONS.map(section => {
    const questions = section.groups.flatMap(group => group.questions);
    return {
      code: section.code,
      name: section.shortName || section.name,
      answered: questions.filter(question => answers[question.code].evaluationCode).length,
      total: questions.length
    };
  }), [answers]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(OPERATIONS_DRAFT_KEY) || 'null');
      if (stored?.templateVersion === OPERATIONS_DIAGNOSTIC_TEMPLATE.version) {
        const validEvaluations = new Set(OPERATIONS_EVALUATION_OPTIONS.map(option => option.code));
        setCompanyName(typeof stored.companyName === 'string' ? stored.companyName.slice(0, 255) : '');
        if (/^\d{4}-\d{2}-\d{2}$/.test(stored.diagnosticDate || '')) setDiagnosticDate(stored.diagnosticDate);
        setAnswers(Object.fromEntries(ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS.map(question => {
          const saved = stored.answers?.[question.code] || {};
          return [question.code, {
            evaluationCode: validEvaluations.has(saved.evaluationCode) ? saved.evaluationCode : '',
            implementationDate: /^\d{4}-\d{2}-\d{2}$/.test(saved.implementationDate || '') ? saved.implementationDate : '',
            willImplement: saved.willImplement === true || saved.willImplement === 'SIM'
              ? 'SIM'
              : saved.willImplement === false || saved.willImplement === 'NÃO' ? 'NÃO' : '',
            notes: typeof saved.notes === 'string' ? saved.notes.slice(0, OPERATIONS_NOTE_MAX_LENGTH) : ''
          }];
        })));
        setSectionData(Object.fromEntries(OPERATIONS_DIAGNOSTIC_SECTIONS.map(section => {
          const saved = stored.sectionData?.[section.code] || {};
          return [section.code, {
            answersResponsible: typeof saved.answersResponsible === 'string' ? saved.answersResponsible.slice(0, 255) : '',
            sectorResponsible: typeof saved.sectorResponsible === 'string' ? saved.sectorResponsible.slice(0, 255) : ''
          }];
        })));
        setGroupIndexes(Object.fromEntries(OPERATIONS_DIAGNOSTIC_SECTIONS.map(section => {
          const index = Number(stored.groupIndexes?.[section.code]);
          return [section.code, Number.isInteger(index) && index >= 0 && index < section.groups.length ? index : 0];
        })));
        const savedStep = Number(stored.step);
        if (Number.isInteger(savedStep) && savedStep >= 0 && savedStep <= OPERATIONS_DIAGNOSTIC_SECTIONS.length) {
          setStep(savedStep);
        }
      }
    } catch {
      // Alguns navegadores bloqueiam localStorage em modos de privacidade restritos.
    } finally {
      setDraftReady(true);
    }
  }, []);

  useEffect(() => {
    if (!draftReady || submittedId) return undefined;
    const snapshot = {
      templateVersion: OPERATIONS_DIAGNOSTIC_TEMPLATE.version,
      companyName,
      diagnosticDate,
      answers,
      sectionData,
      groupIndexes,
      step,
      savedAt: new Date().toISOString()
    };
    draftSnapshotRef.current = snapshot;
    const timeout = setTimeout(() => {
      persistOperationsDraft(snapshot);
    }, 700);
    return () => clearTimeout(timeout);
  }, [answers, companyName, diagnosticDate, draftReady, groupIndexes, sectionData, step, submittedId]);

  useEffect(() => () => persistOperationsDraft(draftSnapshotRef.current), []);

  useEffect(() => {
    if (submittedId || (!companyName.trim() && answeredCount === 0)) return undefined;
    const warnBeforeLeaving = event => {
      persistOperationsDraft(draftSnapshotRef.current);
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [answeredCount, companyName, submittedId]);

  const updateAnswer = (questionCode, field, value) => {
    setAnswers(current => ({
      ...current,
      [questionCode]: { ...current[questionCode], [field]: value }
    }));
    setError('');
  };

  const updateSection = (sectionCode, field, value) => {
    setSectionData(current => ({
      ...current,
      [sectionCode]: { ...current[sectionCode], [field]: value }
    }));
  };

  const chooseStep = nextStep => {
    if (nextStep > 0 && !companyName.trim()) {
      setError('Informe o nome da empresa antes de iniciar o diagnóstico.');
      setStep(0);
      scrollToFormProgress();
      return;
    }
    setError('');
    setStep(nextStep);
    scrollToFormProgress();
  };

  const chooseGroup = index => {
    setGroupIndexes(current => ({ ...current, [activeSection.code]: index }));
    setError('');
    scrollToFormProgress();
  };

  const goNext = () => {
    if (step === 0) {
      if (!companyName.trim()) {
        setError('Informe o nome da empresa para continuar.');
        scrollToFormProgress();
        return;
      }
      setError('');
      setStep(1);
      scrollToFormProgress();
      return;
    }

    if (activeGroupIndex < activeSection.groups.length - 1) {
      chooseGroup(activeGroupIndex + 1);
      return;
    }

    if (step < OPERATIONS_DIAGNOSTIC_SECTIONS.length) {
      setStep(current => current + 1);
      setError('');
      scrollToFormProgress();
    }
  };

  const goBack = () => {
    if (step === 0) return;
    if (activeGroupIndex > 0) {
      chooseGroup(activeGroupIndex - 1);
      return;
    }
    setStep(current => Math.max(0, current - 1));
    setError('');
    scrollToFormProgress();
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const missingQuestion = ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS.find(
      question => !answers[question.code].evaluationCode
    );

    if (missingQuestion) {
      const sectionIndex = OPERATIONS_DIAGNOSTIC_SECTIONS.findIndex(section => section.code === missingQuestion.sectionCode);
      const section = OPERATIONS_DIAGNOSTIC_SECTIONS[sectionIndex];
      const groupIndex = section.groups.findIndex(group => group.code === missingQuestion.groupCode);
      setStep(sectionIndex + 1);
      setGroupIndexes(current => ({ ...current, [section.code]: Math.max(0, groupIndex) }));
      setError(`Responda o item ${missingQuestion.code} antes de enviar o diagnóstico.`);
      scrollToFormProgress();
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const result = await submitOperationsDiagnosticAction({
        companyName: companyName.trim(),
        diagnosticDate,
        answers: Object.entries(answers).map(([questionCode, answer]) => ({ questionCode, ...answer })),
        sections: OPERATIONS_DIAGNOSTIC_SECTIONS.map(section => ({
          sectionCode: section.code,
          ...sectionData[section.code]
        }))
      });
      draftSnapshotRef.current = null;
      try {
        localStorage.removeItem(OPERATIONS_DRAFT_KEY);
      } catch {
        // A confirmação de envio não depende da disponibilidade do rascunho local.
      }
      setSubmittedId(result.publicId);
    } catch {
      setError('Não foi possível enviar o diagnóstico de operações. Tente novamente.');
      scrollToFormProgress();
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedId) {
    return (
      <section className="diagnostic-form-success" aria-live="polite">
        <span className="diagnostic-success-icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
        </span>
        <span className="diagnostic-sheet-kicker">Diagnóstico de operações</span>
        <h1>Respostas enviadas com sucesso</h1>
        <p>O diagnóstico de <strong>{companyName}</strong> foi recebido e seguirá para análise da ISP4.</p>
        <small>Protocolo: {submittedId}</small>
      </section>
    );
  }

  const isLastGroup = activeSection && activeGroupIndex === activeSection.groups.length - 1;
  const isLastSection = step === OPERATIONS_DIAGNOSTIC_SECTIONS.length;

  return (
    <form className="diagnostic-public-form operations-diagnostic-form" onSubmit={handleSubmit}>
      <section className="diagnostic-form-progress" aria-label="Progresso do formulário">
        <div className="diagnostic-progress-copy">
          <span>{step === 0 ? 'Identificação' : `${step}. ${activeSection.name} · ${activeGroup.name}`}</span>
          <strong>{completion}% preenchido · rascunho local</strong>
        </div>
        <div className="diagnostic-progress-track"><span style={{ width: `${completion}%` }} /></div>
        <div className="diagnostic-step-tabs operations-section-tabs">
          <button type="button" className={step === 0 ? 'active' : ''} onClick={() => chooseStep(0)} title="Identificação">Início</button>
          {OPERATIONS_DIAGNOSTIC_SECTIONS.map((section, index) => (
            <button
              key={section.code}
              type="button"
              className={step === index + 1 ? 'active' : ''}
              onClick={() => chooseStep(index + 1)}
              title={section.name}
            >
              {section.shortName || index + 1}
            </button>
          ))}
        </div>
        <div className="diagnostic-self-summary operations-summary">
          <strong>PROGRESSO POR ÁREA</strong>
          <div>{sectionSummary.map(section => (
            <span key={section.code}><small>{section.name}</small><b>{section.answered}/{section.total}</b></span>
          ))}</div>
        </div>
      </section>

      {error && <p className="diagnostic-form-error" role="alert">{error}</p>}

      {step === 0 ? (
        <section className="diagnostic-sheet diagnostic-identification-sheet">
          <div className="diagnostic-sheet-titlebar">
            <span className="diagnostic-sheet-brand">
              <img src="/isp4-logo.svg" alt="ISP4 Consultoria" />
              <span className="diagnostic-sheet-brand-copy"><small>Metodologia ISP4</small><strong>Diagnóstico de operações</strong></span>
            </span>
            <span className="diagnostic-sheet-meta">Etapa inicial</span>
          </div>
          <div className="diagnostic-sheet-heading">
            <span className="diagnostic-sheet-kicker">Visão operacional completa</span>
            <h1>Diagnóstico de Operações</h1>
            <p>Preencha a identificação para avaliar Comercial, Churn, Marketing, CS, Atendimento e RH.</p>
          </div>
          <div className="diagnostic-identification-grid">
            <label><span>Empresa *</span><input value={companyName} onChange={event => setCompanyName(event.target.value)} maxLength={255} autoFocus placeholder="Nome da empresa" /></label>
            <label><span>Data</span><input type="date" value={diagnosticDate} onChange={event => setDiagnosticDate(event.target.value)} /></label>
          </div>
          <div className="diagnostic-scale-legend operations-scale-legend">
            {OPERATIONS_EVALUATION_OPTIONS.map(option => <div key={option.code}><strong>{option.score}</strong><span>{option.label}</span></div>)}
            <p>Use as orientações de cada item como referência e registre os desafios encontrados.</p>
          </div>
        </section>
      ) : (
        <section className="diagnostic-sheet operations-sheet">
          <div className="diagnostic-sheet-titlebar">
            <span className="diagnostic-sheet-brand">
              <img src="/isp4-logo.svg" alt="ISP4 Consultoria" />
              <span className="diagnostic-sheet-brand-copy"><small>Diagnóstico de operações</small><strong>{activeSection.name}</strong></span>
            </span>
            <span className="diagnostic-sheet-meta">{activeGroupIndex + 1} de {activeSection.groups.length} grupos</span>
          </div>

          <div className="diagnostic-responsibles-grid">
            <label><span>Responsável pelas respostas:</span><input value={sectionData[activeSection.code].answersResponsible} onChange={event => updateSection(activeSection.code, 'answersResponsible', event.target.value)} maxLength={255} /></label>
            <label><span>Responsável do setor:</span><input value={sectionData[activeSection.code].sectorResponsible} onChange={event => updateSection(activeSection.code, 'sectorResponsible', event.target.value)} maxLength={255} /></label>
          </div>

          <nav className="operations-group-tabs" aria-label={`Grupos de ${activeSection.name}`}>
            {activeSection.groups.map((group, index) => {
              const answered = group.questions.filter(question => answers[question.code].evaluationCode).length;
              return (
                <button type="button" key={group.code} className={activeGroupIndex === index ? 'active' : ''} onClick={() => chooseGroup(index)}>
                  <span>{group.name}</span><small>{answered}/{group.questions.length}</small>
                </button>
              );
            })}
          </nav>

          <div className="operations-group-heading">
            <span className="diagnostic-sheet-kicker">{activeSection.name}</span>
            <h2>{activeGroup.name}</h2>
            {activeSection.description && <p className="operations-section-alert">{activeSection.description}</p>}
            {activeGroup.description && <p>{activeGroup.description}</p>}
          </div>

          <div className="operations-question-list">
            {activeGroup.questions.map(question => (
              <article className="operations-question-row" key={question.code}>
                <div className="operations-question-copy">
                  <span>{question.code}</span>
                  <h3>{question.text || question.item}</h3>
                  {question.item && question.item !== question.text && <small>{question.item}</small>}
                </div>
                <div className="operations-question-guidance">
                  <strong>Orientação ISP4</strong>
                  <p>{question.guidance || 'Registre o cenário atual e os próximos passos para este item.'}</p>
                </div>
                <div className={`operations-question-fields mode-${activeSection.implementationMode}`}>
                  <label><span>Avaliação *</span><select value={answers[question.code].evaluationCode} onChange={event => updateAnswer(question.code, 'evaluationCode', event.target.value)}><option value="">Selecione</option>{OPERATIONS_EVALUATION_OPTIONS.map(option => <option key={option.code} value={option.code}>{option.label}</option>)}</select></label>
                  {activeSection.implementationMode === 'date' && <label><span>Prazo de implementação</span><input type="date" value={answers[question.code].implementationDate} onChange={event => updateAnswer(question.code, 'implementationDate', event.target.value)} /></label>}
                  {activeSection.implementationMode === 'boolean' && <label><span>Vai implementar?</span><select value={answers[question.code].willImplement} onChange={event => updateAnswer(question.code, 'willImplement', event.target.value)}><option value="">Não informado</option><option value="SIM">SIM</option><option value="NÃO">NÃO</option></select></label>}
                  <label className="operations-notes-field"><span>Anotações gerais</span><textarea value={answers[question.code].notes} onChange={event => updateAnswer(question.code, 'notes', event.target.value)} maxLength={OPERATIONS_NOTE_MAX_LENGTH} placeholder="Como é feito hoje, desafios e dificuldades" /></label>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="diagnostic-form-actions">
        {step > 0 ? <button type="button" className="diagnostic-secondary-button" onClick={goBack}>Voltar</button> : <span />}
        {step === 0 || !isLastSection || !isLastGroup ? (
          <button type="button" className="diagnostic-primary-button" onClick={goNext}>
            {step === 0 ? 'Iniciar diagnóstico' : isLastGroup ? 'Próxima área' : 'Próximo grupo'}
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        ) : (
          <button type="submit" className="diagnostic-primary-button" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar diagnóstico'}
            {!submitting && <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
          </button>
        )}
      </div>
    </form>
  );
}
