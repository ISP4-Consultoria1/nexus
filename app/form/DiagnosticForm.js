'use client';

import { useMemo, useState } from 'react';
import { submitDiagnosticAction } from '../actions.js';
import {
  ALL_DIAGNOSTIC_QUESTIONS,
  DIAGNOSTIC_SECTIONS,
  PUBLIC_DIAGNOSTIC_SECTION_CODES
} from '../../lib/diagnosticCatalog.js';

const publicSections = PUBLIC_DIAGNOSTIC_SECTION_CODES.map(code =>
  DIAGNOSTIC_SECTIONS.find(section => section.code === code)
);

const initialAnswers = Object.fromEntries(
  ALL_DIAGNOSTIC_QUESTIONS.map(question => [question.code, { applicable: 'SIM', selfScore: '' }])
);

const initialSectionData = Object.fromEntries(
  DIAGNOSTIC_SECTIONS.map(section => [section.code, { answersResponsible: '', sectorResponsible: '' }])
);

function todayAsInputDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DiagnosticForm() {
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState('');
  const [diagnosticDate, setDiagnosticDate] = useState(todayAsInputDate);
  const [answers, setAnswers] = useState(initialAnswers);
  const [sectionData, setSectionData] = useState(initialSectionData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedId, setSubmittedId] = useState('');

  const activeSection = step > 0 ? publicSections[step - 1] : null;
  const totalVisibleQuestions = publicSections.reduce((total, section) => total + section.questions.length, 0);
  const answeredVisibleQuestions = useMemo(() => publicSections.reduce(
    (total, section) => total + section.questions.filter(question => answers[question.code].selfScore !== '').length,
    0
  ), [answers]);
  const completion = Math.round((answeredVisibleQuestions / totalVisibleQuestions) * 100);
  const selfAssessmentSummary = useMemo(() => publicSections.map(section => ({
    code: section.code,
    name: section.name,
    value: section.questions.reduce((total, question) => total + (Number(answers[question.code].selfScore) || 0), 0)
  })), [answers]);

  const updateAnswer = (questionCode, field, value) => {
    setAnswers(current => ({
      ...current,
      [questionCode]: { ...current[questionCode], [field]: value }
    }));
  };

  const updateSection = (sectionCode, field, value) => {
    setSectionData(current => ({
      ...current,
      [sectionCode]: { ...current[sectionCode], [field]: value }
    }));
  };

  const goNext = () => {
    setError('');
    if (step === 0 && !companyName.trim()) {
      setError('Informe o nome da empresa para continuar.');
      return;
    }
    setStep(current => Math.min(publicSections.length, current + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setError('');
    setStep(current => Math.max(0, current - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const result = await submitDiagnosticAction({
        companyName,
        diagnosticDate,
        sections: DIAGNOSTIC_SECTIONS.map(section => ({
          sectionCode: section.code,
          ...sectionData[section.code]
        })),
        answers: ALL_DIAGNOSTIC_QUESTIONS.map(question => ({
          questionCode: question.code,
          ...answers[question.code]
        }))
      });
      setSubmittedId(result.publicId);
    } catch (submissionError) {
      setError(submissionError.message || 'Não foi possível enviar o diagnóstico. Tente novamente.');
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
        <span className="diagnostic-sheet-kicker">Diagnóstico empresarial</span>
        <h1>Respostas enviadas com sucesso</h1>
        <p>O diagnóstico de <strong>{companyName}</strong> foi recebido e seguirá para avaliação do consultor CFE.</p>
        <small>Protocolo: {submittedId}</small>
      </section>
    );
  }

  return (
    <form className="diagnostic-public-form" onSubmit={handleSubmit}>
      <section className="diagnostic-form-progress" aria-label="Progresso do formulário">
        <div className="diagnostic-progress-copy">
          <span>{step === 0 ? 'Identificação' : `${step}. ${activeSection.name}`}</span>
          <strong>{completion}% preenchido</strong>
        </div>
        <div className="diagnostic-progress-track"><span style={{ width: `${completion}%` }} /></div>
        <div className="diagnostic-step-tabs">
          <button type="button" className={step === 0 ? 'active' : ''} onClick={() => setStep(0)} title="Identificação">Início</button>
          {publicSections.map((section, index) => (
            <button
              key={section.code}
              type="button"
              className={step === index + 1 ? 'active' : ''}
              onClick={() => companyName.trim() && setStep(index + 1)}
              title={section.name}
            >
              {index + 1}
            </button>
          ))}
        </div>
        <div className="diagnostic-self-summary">
          <strong>RESUMO Nota Autoavaliação ▼</strong>
          <div>{selfAssessmentSummary.map(section => <span key={section.code}><small>{section.name}</small><b>{section.value.toLocaleString('pt-BR')}</b></span>)}</div>
        </div>
      </section>

      {step === 0 ? (
        <section className="diagnostic-sheet diagnostic-identification-sheet">
          <div className="diagnostic-sheet-titlebar">
            <span className="diagnostic-sheet-brand">
              <img src="/isp4-logo.svg" alt="ISP4 Consultoria" />
              <span className="diagnostic-sheet-brand-copy">
                <small>Metodologia ISP4</small>
                <strong>Diagnóstico empresarial</strong>
              </span>
            </span>
            <span className="diagnostic-sheet-meta">Etapa inicial</span>
          </div>
          <div className="diagnostic-sheet-heading">
            <span className="diagnostic-sheet-kicker">Questionário inicial</span>
            <h1>Diagnóstico Empresarial</h1>
            <p>Preencha a identificação abaixo para iniciar a autoavaliação.</p>
          </div>
          <div className="diagnostic-identification-grid">
            <label>
              <span>Empresa *</span>
              <input value={companyName} onChange={event => setCompanyName(event.target.value)} maxLength={255} autoFocus placeholder="Nome da empresa" />
            </label>
            <label>
              <span>Data</span>
              <input type="date" value={diagnosticDate} onChange={event => setDiagnosticDate(event.target.value)} />
            </label>
          </div>
          <div className="diagnostic-scale-legend">
            <div><strong>0</strong><span>Nota mínima</span></div>
            <div><strong>10</strong><span>Nota máxima</span></div>
            <p>A autoavaliação é uma nota livre de 0 a 10 e será exibida separadamente da avaliação CFE.</p>
          </div>
        </section>
      ) : (
        <section className="diagnostic-sheet">
          <div className="diagnostic-sheet-titlebar">
            <span className="diagnostic-sheet-brand">
              <img src="/isp4-logo.svg" alt="ISP4 Consultoria" />
              <span className="diagnostic-sheet-brand-copy">
                <small>Metodologia ISP4</small>
                <strong>{activeSection.name}</strong>
              </span>
            </span>
            <span className="diagnostic-sheet-meta">Autoavaliação · 0 a 10</span>
          </div>

          <div className="diagnostic-responsibles-grid">
            <label>
              <span>Responsável pelas respostas:</span>
              <input
                value={sectionData[activeSection.code].answersResponsible}
                onChange={event => updateSection(activeSection.code, 'answersResponsible', event.target.value)}
                maxLength={255}
              />
            </label>
            <label>
              <span>Responsável do setor:</span>
              <input
                value={sectionData[activeSection.code].sectorResponsible}
                onChange={event => updateSection(activeSection.code, 'sectorResponsible', event.target.value)}
                maxLength={255}
              />
            </label>
          </div>

          <div className="diagnostic-question-table">
            <div className="diagnostic-question-head" aria-hidden="true">
              <span>Item</span>
              <span>Perguntas</span>
              <span>É aplicável?<br />SIM/NÃO</span>
              <span>Autoavaliação<br />(Nota 0 a 10)</span>
            </div>
            {activeSection.questions.map(question => (
              <div className="diagnostic-question-row" key={question.code}>
                <div className="diagnostic-question-item">
                  <span>{question.code}</span>
                  <strong>{question.item}</strong>
                </div>
                <p>{question.text}</p>
                <label className="diagnostic-mobile-field-label">
                  <span>É aplicável?</span>
                  <select value={answers[question.code].applicable} onChange={event => updateAnswer(question.code, 'applicable', event.target.value)}>
                    <option value="SIM">SIM</option>
                    <option value="NÃO">NÃO</option>
                  </select>
                </label>
                <label className="diagnostic-score-field diagnostic-mobile-field-label">
                  <span>Autoavaliação (0 a 10)</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    inputMode="decimal"
                    value={answers[question.code].selfScore}
                    onChange={event => updateAnswer(question.code, 'selfScore', event.target.value)}
                    aria-label={`Autoavaliação do item ${question.code}`}
                  />
                  <small>/ 10</small>
                </label>
              </div>
            ))}
          </div>
        </section>
      )}

      {error && <p className="diagnostic-form-error" role="alert">{error}</p>}

      <div className="diagnostic-form-actions">
        {step > 0 ? <button type="button" className="diagnostic-secondary-button" onClick={goBack}>Voltar</button> : <span />}
        {step < publicSections.length ? (
          <button type="button" className="diagnostic-primary-button" onClick={goNext}>
            {step === 0 ? 'Iniciar diagnóstico' : 'Próxima perspectiva'}
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
