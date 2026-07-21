export const DIAGNOSTIC_TEMPLATE = {
  code: 'diagnostico-empresarial',
  name: 'Diagnóstico Empresarial',
  version: 1,
  source: 'diagnóstico geral.xlsx'
};

export const EVALUATION_OPTIONS = [
  { code: 'nao_existe', label: 'NÃO EXISTE', score: 0 },
  { code: 'informal', label: 'EXISTE (MAS INFORMALMENTE)', score: 3 },
  { code: 'padronizada', label: 'EXISTE DE FORMA PADRONIZADA (MAS PODE SER MELHORADO)', score: 7 },
  { code: 'perfeita', label: 'EXISTE E FUNCIONA PERFEITAMENTE', score: 10 }
];

export const DIAGNOSTIC_SECTIONS = [
  {
    code: 'societario',
    name: 'Societário',
    isVisible: false,
    isPillar: false,
    spreadsheetRow: 10,
    questions: [
      { code: '1.1', item: 'Formalização da sociedade', text: 'A sociedade está devidamente formalizada em contrato social?', spreadsheetRow: 15 },
      { code: '1.2', item: 'Quotas da sociedade', text: 'Todos os sócios possuem ciências das quotas de cada sócio dentro do negócio?', spreadsheetRow: 16 },
      { code: '1.3', item: 'Governança', text: 'São realizadas reuniões mensais com os sócios para análise dos resultados?', spreadsheetRow: 17 },
      { code: '1.4', item: 'Separação das Finanças', text: 'Há separação clara dos gastos da pessoa física dos gastos da pessoa jurídica (empresa)?', spreadsheetRow: 18 },
      { code: '1.5', item: 'Pró-Labore', text: 'Existe definição do pró-labore mensal dos sócios através de um critério profissional?', spreadsheetRow: 19 },
      { code: '1.6', item: 'Distribuição de Lucros', text: 'Existe uma política estabelecida com relação a periodicidade e critério de % na distribuição de lucros?', spreadsheetRow: 20 }
    ],
    recommendations: [
      'Recomendar a formalização dos sócios que não constam em contrato social',
      'Definir quotas sociais e os percentuais entre os sócios',
      'Realizar reunião mensal com os sócios e diretores para acompanhamento dos resultados alcançados em todas as esferas',
      'Definir critérios e valores de pró-labores para os sócios que possuem função executiva no negócio',
      'Definir critérios, valores e periodicidade para a distribuição de lucros (quando houver)'
    ]
  },
  {
    code: 'tecnologia',
    name: 'Tecnologia',
    isVisible: false,
    isPillar: false,
    spreadsheetRow: 22,
    questions: [
      { code: '2.1', item: 'Sistemas', text: 'A empresa possui sistema para dar suporte à gestão empresarial (ERP), buscando simplificar e automatizar tarefas e ações operacionais?', spreadsheetRow: 27 },
      { code: '2.2', item: 'Suporte', text: 'Há treinamento e suporte contínuo quanto ao uso do sistema de gestão (ERP) e outras tecnologias dentro do negócio?', spreadsheetRow: 28 },
      { code: '2.3', item: 'Segurança e Backup', text: 'Existe rotina periódica de backup onde os dados da empresa estão armazenados?', spreadsheetRow: 29 },
      { code: '2.4', item: 'Infraestrutura', text: 'A empresa possui equipamentos suficientes que suportem ao bom funcionamento da gestão empresarial?', spreadsheetRow: 30 },
      { code: '2.5', item: 'Automação', text: 'Existe integração entre a atividade fim do negócio e as atividades financeiras (vendas, compras, estoque, faturamento, contas a receber, cobrança, contas a pagar, relatórios)?', spreadsheetRow: 31 }
    ],
    recommendations: [
      'Recomendar implantação de um software de gestão financeira capaz de realizar o controle das movimentações de entradas e saídas',
      'Sugerir programa de treinamento contínuo para os colaboradores',
      'Recomendar manter os dados em ambiente protegido (preferencial em nuvem)',
      'Recomendar integração e automação das atividades financeiras do negócio'
    ]
  },
  {
    code: 'comercial',
    name: 'Comercial',
    isVisible: true,
    isPillar: true,
    spreadsheetRow: 33,
    questions: [
      { code: '3.1', item: 'Meta de Vendas', text: 'A empresa possui clareza sobre a meta de faturamento necessária para atingir os objetivos desejados pelos sócios?', spreadsheetRow: 38 },
      { code: '3.2', item: 'CRM', text: 'A empresa possui sistema de relacionamento com o cliente que ajude no atingimento da meta de vendas?', spreadsheetRow: 39 },
      { code: '3.3', item: 'Precificação dos Serviços', text: 'Existe metodologia para precificar os produtos/serviços prestados?', spreadsheetRow: 40 },
      { code: '3.4', item: 'Relatórios', text: 'Existem relatórios que dão suporte ao acompanhamento diário, semanal e/ou mensal das vendas?', spreadsheetRow: 41 },
      { code: '3.5', item: 'Governança', text: 'Há reuniões mensais com equipe comercial para apresentação e avaliação dos resultados?', spreadsheetRow: 42 },
      { code: '3.6', item: 'Indicadores', text: 'Existem indicadores de vendas (como número de propostas, taxa de conversão, ticket médio e outros indicadores comerciais)?', spreadsheetRow: 43 }
    ],
    recommendations: [
      'Registrar nesta perspectiva o faturamento atual do cliente para medir o crescimento',
      'Recomendar o uso de um CRM para apoio no atingimento das metas comerciais que garantirão o resultado financeiro',
      'Elaborar método de precificação para cada tipo de produto/serviço',
      'Recomendar relatórios de vendas para a equipe comercial/sócios possam acompanhar as meta comerciais',
      'Recomendar reuniões de acompanhamento para a equipe de de vendas/comercial',
      'Recomendar implantação de indicadores comerciais'
    ]
  },
  {
    code: 'marketing',
    name: 'Marketing',
    isVisible: true,
    isPillar: true,
    spreadsheetRow: 45,
    questions: [
      { code: '4.1', item: 'Planejamento', text: 'Há um plano de comunicação aos potenciais clientes que esteja vinculado aos objetivos comerciais?', spreadsheetRow: 50 },
      { code: '4.2', item: 'Assessoria de Marketing', text: 'Há um time interno/terceirizado dedicado a pensar as ações de marketing? ', spreadsheetRow: 51 },
      { code: '4.3', item: 'Endomarketing', text: 'A equipe conhece as principais metas e ações de marketing da empresa?', spreadsheetRow: 52 }
    ],
    recommendations: [
      'Elaborar objetivos e metas de Retorno Sobre Investimento em Markting para os próximos 12 meses',
      'Contratar assessoria de marketing (colaborador exclusivo ou empresa terceirizada)',
      'Divulgar o planejamento das ações para os colaboradores através de uma agenda fixa (semanal, mensal, anual)'
    ]
  },
  {
    code: 'financeiro',
    name: 'Financeiro',
    isVisible: false,
    isPillar: false,
    spreadsheetRow: 54,
    questions: [
      { code: '5.1', item: 'Plano de Contas', text: 'Existe um plano de contas gerencial, separando os grupos de receitas dos grupos de gastos?', spreadsheetRow: 59 },
      { code: '5.2', item: 'Contas a Pagar', text: 'Todas as movimentações relativas às obrigações com fornecedores, colaboradores, governo estão devidamente registrados e controladas no sistema de gestão financeira?', spreadsheetRow: 60 },
      { code: '5.3', item: 'Contas a Receber', text: 'Todas as movimentações relativas aos direitos de recebimento das vendas estão devidamente registradas e controlados no sistema de gestão financeira?', spreadsheetRow: 61 },
      { code: '5.4', item: 'Conciliação Bancária', text: 'A conciliação bancária está em dia? Os saldos dos bancos, caixinha e fundo fixo são devidamente atualizados no sistema diariamente?', spreadsheetRow: 62 },
      { code: '5.5', item: 'Fluxo de Caixa', text: 'A empresa possui um demonstrativo mensal dos recebimentos x pagamentos que permite a análise e a projeção, auxiliando na tomada de decisões baseadas em informação real e confiável?', spreadsheetRow: 63 },
      { code: '5.6', item: 'Crédito e Cobrança', text: 'Há uma política clara de fornecimento de crédito, forma de recebimentos e acompanhamento da cobrança aos clientes?', spreadsheetRow: 64 },
      { code: '5.7', item: 'Relatórios', text: 'Existem relatórios que dão suporte ao acompanhamento das movimentações financeiras periodicamente (diário, semanal e mensal)?', spreadsheetRow: 65 }
    ],
    recommendations: [
      'Estruturar um plano de contas gerencial para o negócio',
      'Definir rotinas e processos do contas a pagar',
      'Definir rotinas e processos do contas a receber',
      'Estruturar processo de conferência e conciliação bancária diária',
      'Implantar o fluxo de caixa (diário, semanal, quinzenal, mensal, anual)',
      'Elaborar políticas de crédito especificando formas de pagamento e limites para determinados perfis de clientes',
      'Recomendar relatórios financeiros através do software de gestão que possam auxiliar no atingimento das metas de resultado'
    ]
  },
  {
    code: 'controladoria',
    name: 'Controladoria',
    isVisible: false,
    isPillar: false,
    spreadsheetRow: 67,
    questions: [
      { code: '6.1', item: 'Capital de Giro', text: 'A empresa possui capital de giro suficiente para cobrir pelo menos 4 meses da sua operação?', spreadsheetRow: 72 },
      { code: '6.2', item: 'Meta Financeira', text: 'A empresa possui clareza sobre a meta financeira necessária para atingir os objetivos empresariais e desejados pelos sócios?', spreadsheetRow: 73 },
      { code: '6.3', item: 'Orçamento', text: 'Existe planejamento orçamentário para projeção dos resultados (DRE) a serem alcançados?', spreadsheetRow: 74 },
      { code: '6.4', item: 'Ponto de Equilíbrio', text: 'A empresa sabe qual é o ponto de equilíbrio do negócio (receita mínima necessária para não ter prejuízo)?', spreadsheetRow: 75 },
      { code: '6.5', item: 'Gestão Orçamentária', text: 'Existe acompanhamento do planejamento orçamentário com os resultados previstos sendo confrontados com os resultados realizados?', spreadsheetRow: 76 },
      { code: '6.6', item: 'Gestão de Custos e Despesas', text: 'Existe método para realizar uma gestão e controle efetivo de custos fixos e váriaveis mensais?', spreadsheetRow: 77 },
      { code: '6.7', item: 'Análise Vertical / Horizontal', text: 'Existe análise dos grupos de contas (receitas e gastos) relativos ao mês anterior?', spreadsheetRow: 78 },
      { code: '6.8', item: 'Indicadores', text: 'Existem indicadores econômicos e financeiros (como margem de contribuição, margem líquida, geração de caixa, outro)?', spreadsheetRow: 79 },
      { code: '6.9', item: 'Relatórios', text: 'Existem relatórios que dão suporte ao acompanhamento dos resultados mensais?', spreadsheetRow: 80 }
    ],
    recommendations: [
      'Definir em valor (R$) quanto a empresa precisa ter em caixa para suportar no mínimo 4 meses sem vendas (reserva de emergência)',
      'Definir a meta de resultado - DRE (mensal, semestral e anual)',
      'Acompanhar o orçamento mensalmente (DRE e Caixa)',
      'Definir Ponto de Equilíbrio Econômico',
      'Realizar acompanhamento de orçado vs realizado',
      'Realizar análises verticais e horizontais dos grupos de contas e análise das variações',
      'Recomendar implantação de indicadores financeiros (Margem de Contribuição, EBITDA, Lucratividade, SG&A)'
    ]
  },
  {
    code: 'fiscal',
    name: 'Fiscal',
    isVisible: false,
    isPillar: false,
    spreadsheetRow: 82,
    questions: [
      { code: '7.1', item: 'Planejamento Tributário', text: 'A tributação da empresa está enquadrada no melhor regime tributário para a sua atividade econômica?', spreadsheetRow: 87 },
      { code: '7.2', item: 'Recolhimento de Tributos', text: 'Os impostos e taxas são pagos rigorosamente em dia?', spreadsheetRow: 88 },
      { code: '7.3', item: 'Apuração Fiscal', text: 'A empresa realiza apuração de 100% das suas vendas?', spreadsheetRow: 89 },
      { code: '7.4', item: 'Automação', text: 'Existe integração fiscal (faturamento) com as atividades financeiras (faturamento, contas a receber, cobrança e contas a pagar)?', spreadsheetRow: 90 }
    ],
    recommendations: [
      'Acionar contabilidade para validação do melhor regime de tribuitação (Planejamento Tributário)',
      'Realizar o recolhimento dos tributos mensalmente ou a medida que houver o fato gerador',
      'Realizar a apuração fiscal de 100% das vendas',
      'Recomendar automação entre o módulo de vendas (faturamento) e o financeiro'
    ]
  },
  {
    code: 'contabil',
    name: 'Contábil',
    isVisible: false,
    isPillar: false,
    spreadsheetRow: 92,
    questions: [
      { code: '8.1', item: 'Balancete e DRE', text: 'A empresa recebe mensalmente o balancete e DRE da contabilidade (até o dia 15 de cada mês, pelo menos)?', spreadsheetRow: 97 },
      { code: '8.2', item: 'Automação', text: 'Existe integração contábil (movimentações de débitos e créditos) com as atividades financeiras (faturamento, contas a receber, cobrança e contas a pagar)?', spreadsheetRow: 98 },
      { code: '8.3', item: 'Documentação', text: 'Os documentos das movimentações de entradas e saídas (notas fiscais, cupons fiscais, recibos, comprovantes de pagamentos, contratos) estão devidamente organizados?', spreadsheetRow: 99 },
      { code: '8.4', item: 'Planejamento', text: 'É realizada reunião periódica com a contabilidade para obtenção de oportunidades ou identificação de pontos de melhorias?', spreadsheetRow: 100 }
    ],
    recommendations: [
      'Solicitar balancete e DRE contábil da contabilidade mensalmente',
      'Realizar análise entre DRE do financeiro/controladoria e da contabilidade',
      'Enviar mensalmente os extratos bancários e documentos comprobatórios (notas fiscais, contratos, cupons fiscais) para a contabilidade',
      'Realizar reunião mensal com a contabilidade para cumprimento das obrigações acessórias'
    ]
  },
  {
    code: 'gestao_pessoas',
    name: 'Gestão de Pessoas',
    isVisible: true,
    isPillar: true,
    spreadsheetRow: 102,
    questions: [
      { code: '9.1', item: 'Plano de Cargos e Salários', text: 'Existe um plano de cargos e salários escrito e documentado, que é praticado e conhecido por todos os colaboradores nos seus respectivos níveis dentro da organização?', spreadsheetRow: 107 },
      { code: '9.2', item: 'Benefícios', text: 'Existe algum plano de benefícios na empresa (plano de saúde, odontológico, reembolso de academia, outro)?', spreadsheetRow: 108 },
      { code: '9.3', item: 'Obrigações Trabalhistas', text: 'A apuração e o recolhimento dos encargos sociais são pagos rigorosamente em dia?', spreadsheetRow: 109 },
      { code: '9.4', item: 'PLR', text: 'Existe alguma iniciativa para premiação através de Participação nos Lucros e Resultados? E existe um Modelo de Remuneração Estratégica ou Participação nos Resultados?', spreadsheetRow: 110 }
    ],
    recommendations: [
      'Sugerir premiações aos colaboradores mediante atingimento de resultados anuais',
      'Sugerir benefícios como reembolso de academia, plano de saúde, plano odontológico, seguro de vida aos colaboradores',
      'Realizar o recolhimento de todas as obrigações e encargos trabalhistas (a fim de evitar qualquer ação futura contra a empresa)'
    ]
  },
  {
    code: 'estrategia',
    name: 'Estratégia',
    isVisible: true,
    isPillar: true,
    spreadsheetRow: 112,
    questions: [
      { code: '10.1', item: 'Inovação', text: 'Existe planejamento de criação de novos produtos/serviços ou novas linhas de receitas?', spreadsheetRow: 117 },
      { code: '10.2', item: 'Crescimento e Expansão', text: 'Existe um planejamento de médio e longo prazo para crescimento e expansão do negócio, que está registrado num plano de ação que é acompanhado consistentemente?', spreadsheetRow: 118 },
      { code: '10.3', item: 'Estratégia', text: 'As estratégia de curto, médio e longo prazo são anualmente revisadas e construídas de forma estruturada através de um processo organizado de forma coletiva e aprovada pelos sócios da organização? Elas são compartilhadas e desdobradas corretamente para todos os níveis da organização?', spreadsheetRow: 119 }
    ],
    recommendations: [
      'Elaborar planos para novos serviços ou de expansão para novas praças',
      'Analisar Forças, Fraquezas, Ameaças e Oportunidades do setor (SWOT/FOFA)',
      'Desenhar o Plano de Negócios (Canvas)',
      'Elaborar a viabilidade econômico-financeiro de uma nova unidade/filial da empresa cliente',
      'Definir as metas para atingir os objetivos da empresa e dos sócios'
    ]
  }
];

export const ALL_DIAGNOSTIC_QUESTIONS = DIAGNOSTIC_SECTIONS.flatMap(section =>
  section.questions.map(question => ({ ...question, sectionCode: section.code, sectionName: section.name }))
);

export const LEVERAGE_SECTION_CODES = ['comercial', 'marketing', 'gestao_pessoas', 'estrategia'];
export const PUBLIC_DIAGNOSTIC_SECTION_CODES = ['comercial', 'marketing', 'gestao_pessoas', 'estrategia'];

export function scoreFromEvaluation(evaluationCode) {
  return EVALUATION_OPTIONS.find(option => option.code === evaluationCode)?.score ?? 0;
}

export function calculateDiagnosticResults(answers = []) {
  const byQuestion = new Map(answers.map(answer => [answer.question_code || answer.questionCode, answer]));

  const sections = DIAGNOSTIC_SECTIONS.map(section => {
    const questionResults = section.questions.map(question => {
      const answer = byQuestion.get(question.code) || {};
      const applicable = answer.applicable === true || answer.applicable === 'SIM';
      const selfScore = Number(answer.self_score ?? answer.selfScore ?? 0) || 0;
      const consultantScore = answer.consultant_score != null
        ? Number(answer.consultant_score)
        : scoreFromEvaluation(answer.evaluation_code || answer.evaluationCode);

      return {
        ...question,
        applicable,
        selfScore,
        consultantScore: applicable ? consultantScore : 0,
        maximumScore: applicable ? 10 : 0
      };
    });

    const selfAssessment = questionResults.reduce((total, question) => total + question.selfScore, 0);
    const consultantTotal = questionResults.reduce((total, question) => total + question.consultantScore, 0);
    const maximumTotal = questionResults.reduce((total, question) => total + question.maximumScore, 0);
    const percentage = maximumTotal > 0 ? consultantTotal / maximumTotal : 0;

    return { ...section, questionResults, selfAssessment, consultantTotal, maximumTotal, percentage };
  });

  const overallPercentage = sections.reduce((total, section) => total + section.percentage, 0) / sections.length;
  const leverageSections = sections.filter(section => LEVERAGE_SECTION_CODES.includes(section.code));
  const leveragePercentage = leverageSections.reduce((total, section) => total + section.percentage, 0) / leverageSections.length;

  return { sections, overallPercentage, leveragePercentage };
}

export function formatDiagnosticPercentage(value) {
  return `${(Number(value || 0) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

export function getExcellenceLevel(value) {
  const percentage = Number(value || 0);
  if (percentage < 0.5) return { code: 'baixo', label: 'Abaixo de 50%', tone: 'danger' };
  if (percentage < 0.85) return { code: 'intermediario', label: 'Entre 50% e 84,9999%', tone: 'warning' };
  if (percentage > 0.85) return { code: 'excelencia', label: 'Acima de 85%', tone: 'success' };
  return { code: 'limite', label: 'Exatamente 85% · sem regra de cor na planilha', tone: 'neutral' };
}
