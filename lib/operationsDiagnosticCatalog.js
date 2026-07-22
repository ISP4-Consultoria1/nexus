// Source: Diagnósticos ISP4 - MODELO (Comercial, Churn, Atend....).xlsx.
// sourceRow is the one-based row number in each section's sourceSheet.

export const OPERATIONS_DIAGNOSTIC_TEMPLATE = {
  code: 'diagnostico-operacoes',
  name: 'Diagnóstico das Operações',
  version: 1,
  formulaCode: 'diagnostico_operacoes_fixo_v1'
};

export const OPERATIONS_EVALUATION_OPTIONS = [
  { code: 'sim', label: 'SIM', score: 10 },
  { code: 'revisar', label: 'REVISAR', score: 5 },
  { code: 'nao', label: 'NÃO', score: 0 }
];

export const OPERATIONS_NOTE_MAX_LENGTH = 1200;

function namedItem(sourceRow, text, guidance = '') {
  return { sourceRow, item: text, text, guidance };
}

function numberedQuestion(sourceRow, item, text, guidance = '') {
  return { sourceRow, item, text, guidance };
}

function defineSection({ code, name, shortName, sourceSheet, implementationMode, description = '', groups }) {
  let questionNumber = 0;

  return {
    code,
    name,
    shortName,
    sourceSheet,
    implementationMode,
    description,
    groups: groups.map(group => ({
      ...group,
      code: code + '.' + group.code,
      questions: group.questions.map(question => ({
        code: code + '.' + String(++questionNumber).padStart(3, '0'),
        item: question.item,
        text: question.text,
        guidance: question.guidance,
        sourceRow: question.sourceRow
      }))
    }))
  };
}

export const OPERATIONS_DIAGNOSTIC_SECTIONS = [
  defineSection({
    code: "comercial",
    name: "Comercial",
    shortName: "Comercial",
    sourceSheet: "COMERCIAL",
    implementationMode: "none",
    description: "",
    groups: [
      {
        code: "estrutura_e_planejamento",
        name: "Estrutura e Planejamento",
        description: "Conjunto de políticas, documentos, descrições e estruturas que organizam a gestão de pessoas na empresa.\nImportância: Dá clareza sobre regras, responsabilidades e valores, garantindo que todos saibam “como as coisas funcionam” e o que é esperado deles.\nResultados: Organização, previsibilidade, segurança jurídica e alinhamento entre equipe e liderança.",
        questions: [
          namedItem(3, "Quantos vendedores ativos há hoje?"),
          namedItem(4, "Existe um planejamento comercial, anual e mensal?"),
          namedItem(5, "Como são definidas as metas mensais e anual?"),
          namedItem(6, "Existe meta de vendas por produto ou plano?"),
          namedItem(7, "Existe um responsável do timer comercial?"),
          namedItem(8, "Ele realiza reuniões toda semana para alinhamento com o time comercia?"),
          namedItem(9, "Existe política clara de comissionamento?")
        ]
      },
      {
        code: "processos_e_operacao",
        name: "Processos e Operação",
        description: "Processos que acompanham o colaborador desde a entrada (onboarding) até a saída (offboarding), passando por avaliações, reuniões e planos de desenvolvimento.\nImportância: Garante que cada etapa da jornada do colaborador seja bem gerida, maximizando engajamento e performance.\nResultados: Menor rotatividade, maior produtividade e alinhamento constante com metas e estratégias.",
        questions: [
          namedItem(11, "Há um CRM de vendas documentado?"),
          namedItem(12, "como os leads são gerados e distribuidos?"),
          namedItem(13, "Qual o tempo médio entre o primeiro contato e fechamento?"),
          namedItem(14, "Existe SLA para resposta de leads?"),
          namedItem(15, "Há integração entre marketing e vendas?"),
          namedItem(16, "O processo de pós-vendas está definido?"),
          namedItem(17, "Existe abordagem estruturada para reverter canelamentos?"),
          namedItem(18, "Como é feito o acompanhamento de propostas que ficaram em aberto?"),
          namedItem(19, "O processo é o mesmo em todas as regiões atendidas?")
        ]
      },
      {
        code: "indicadores_e_ferramentas",
        name: "Indicadores e Ferramentas",
        description: "",
        questions: [
          namedItem(21, "Quais métricas o provedor acompanha regularmente?"),
          namedItem(22, "O CAC (custo de Aquisição de Cliente) é calculado?"),
          namedItem(23, "Há dados de ticket médio e LTV?"),
          namedItem(24, "Qual é o percentual de churn e motivos principais?"),
          namedItem(25, "O CRM é atualizado corretamente e diariamente pelo time?"),
          namedItem(26, "Há relatorios automaticos sobre desempenho?"),
          namedItem(27, "A gestão tem visão em tem real do CRM dos vendedores?")
        ]
      },
      {
        code: "pessoas_e_desenvolvimento",
        name: "Pessoas e Desenvolvimento",
        description: "",
        questions: [
          namedItem(31, "Como é o processo de onboarding de novos vendedores?"),
          namedItem(32, "Há treinamentos frequentes sobre produto e técnicas de vendas?"),
          namedItem(33, "O time recebe feedback estruturado (1:1, reuniões)?"),
          namedItem(34, "Existe plano de carreira ou só remuneração variável?"),
          namedItem(35, "Como é avaliado o desempenho individual?"),
          namedItem(36, "A lideraça acompanha os vendedores em campo?"),
          namedItem(37, "Há campanhas de incentivo e reconhecimento?"),
          namedItem(38, "Qual é o nivel de engajamento com metas?"),
          namedItem(39, "Há subistituição rapida em caso de baixa performace?"),
          namedItem(40, "O clima entre equipe e gestores é positivo?")
        ]
      },
      {
        code: "cliente_e_mercado",
        name: "Cliente e Mercado",
        description: "",
        questions: [
          namedItem(42, "O cliente recebe informações claras sobre preços e prazos?"),
          namedItem(43, "Existe follow-up pós instalação para medir satisfação?"),
          namedItem(44, "Há um processo par tratar reclamações e evitar cancelamentos?"),
          namedItem(45, "O time entende bem os diferenciais do provedor frente a concorrência?"),
          namedItem(46, "Existe monitoramento de preços e promoções de concorrentes?"),
          namedItem(47, "O time mapeia oportunidades por bairro/região?"),
          namedItem(48, "O processo de upgrade/downgrade é simples para o cliente?"),
          namedItem(49, "Há politica para indicações e parcerias locais?"),
          namedItem(50, "Existe pesquisa de satisfação ou NPS?"),
          namedItem(51, "A experiencia do cliente é revisada periodicamente?")
        ]
      },
      {
        code: "canais_de_vendas",
        name: "Canais de vendas",
        description: "Mapeamento e análise dos canais que geram novos contratos, identificando origem dos leads, taxas de conversão e oportunidades de otimização em marketing e vendas.\nImportância: Traz clareza sobre os canais mais eficazes, alinhando marketing e comercial e otimizando ações para reduzir custos e aumentar eficiência.\nResultados:Mais previsibilidade, menor custo por contrato, maior ROI e melhor conversão de leads.",
        questions: [
          namedItem(54, "PAP", "Meta por canal. Reduzir com otimização de criativos e segmentação por bairro."),
          namedItem(55, "Loja", "Acompanhar do lead ao contrato. Melhorar roteiro do time e velocidade de resposta."),
          namedItem(56, "Condomínio", "Receita gerada / investimento. Pausar o que não retorna, reforçar os vencedores."),
          namedItem(57, "Indicações base", "Pergunta 0–10 sobre clareza e simpatia na comunicação. Coletar mensalmente."),
          namedItem(58, "Indicações time", "Monitorar alcance, salvamentos e comentários. Focar em conteúdos que viram leads."),
          namedItem(59, "Receptivo", "Otimizar tempo de resposta e scripts de atendimento. Registrar origem das ligações e conversões."),
          namedItem(60, "Eventos", "Coletar contatos e transformar em leads qualificados. Realizar follow-up em até 48h após cada ação."),
          namedItem(61, "Digital / Online (Mídia Paga e Orgânica)", "Google Ads, Meta Ads, campanhas de WhatsApp Business, landing pages e chatbots.\nGera leads qualificados com baixo custo por aquisição quando bem configurado."),
          namedItem(62, "Parcerias Comerciais Locais", "Acordos com imobiliárias, construtoras, lojistas, síndicos e escolas.\nPode funcionar com comissão ou permuta."),
          namedItem(63, "Afiliados / Microinfluenciadores", "Pessoas físicas ou perfis locais que indicam clientes em troca de comissão ou bônus.\nExcelente em cidades pequenas, reforça a reputação e o “boca a boca”."),
          namedItem(64, "Telemarketing Ativo (Interno ou Terceirizado)", "Central própria para ativar leads frios, listas de prospects ou campanhas específicas.\nAlta capacidade de escala se bem roteirizado."),
          namedItem(65, "Campanhas Internas de Upgrade e Retenção (Base ativa)", "Cross e up-sell via CRM, WhatsApp, ou abordagem proativa.\nTrabalha o aumento de ticket e a fidelização."),
          namedItem(66, "Canais Públicos / Licitações", "Contratos com prefeituras, câmaras, órgãos públicos, escolas municipais.\nRequer estrutura jurídica e fiscal adequada."),
          namedItem(67, "Marketplace / Plataformas de Parceria", "Integração com sites que comparam provedores (“Melhor Plano”, “Minha Conexão”, etc.).\nAumenta visibilidade online e captação passiva."),
          namedItem(68, "Times de Porta a Porta Externos Terceirizados (Franquias de Vendas)", "Times especializados por bairro ou cidade, remunerados por comissionamento.\nIdeal para expansão rápida.")
        ]
      },
      {
        code: "cultura_de_vendas",
        name: "Cultura de Vendas",
        description: "",
        questions: [
          namedItem(70, "Campanhas diárias, semanais e mensais (pix)"),
          namedItem(71, "Comissão para o time geral (mínimo 3 sorteio pix)"),
          namedItem(72, "Campanha para o time geral"),
          namedItem(73, "Ranking diário, semanal e mensal"),
          namedItem(74, "Acompanhamento parcial 3x ao dia vendas")
        ]
      }
    ]
  }),
  defineSection({
    code: "churn",
    name: "Churn, Cobrança e Retenção",
    shortName: "Churn",
    sourceSheet: "Churn, Cobrança, Retenção",
    implementationMode: "date",
    description: "Importante: Faça um levantamento detalhado de cancelamentos dos últimos 3 meses e envie para consultoria.",
    groups: [
      {
        code: "monitoramento_e_analise_de_cancelamentos",
        name: "Monitoramento e Análise de Cancelamentos",
        description: "",
        questions: [
          numberedQuestion(3, "1", "A empresa realiza análises da região com maior índice de cancelamento?", "Identifique os bairros ou regiões com mais cancelamentos para entender os motivos e agir preventivamente."),
          numberedQuestion(4, "2", "A empresa faz análises dos planos com maior índice de cancelamento?", "Descubra quais planos têm mais cancelamentos e avalie se precisam de ajustes (preço, benefícios, qualidade)."),
          numberedQuestion(5, "3", "Há um levantamento sobre o perfil da região onde as vendas estão sendo realizadas?", "Analise se o público-alvo das vendas condiz com o serviço oferecido, evitando clientes propensos a cancelar."),
          numberedQuestion(6, "4", "Existe um monitoramento de concorrentes, verificando se há novos players na área?", "Fique atento a novos concorrentes e suas ofertas para adaptar suas estratégias de retenção."),
          numberedQuestion(7, "5", "A empresa realiza análises periódicas das ofertas e planos dos concorrentes?", "Compare preços, benefícios e diferenciais dos concorrentes para manter uma oferta competitiva.")
        ]
      },
      {
        code: "estrategias_de_cobranca_e_prevencao_da_inadimplencia",
        name: "Estratégias de Cobrança e Prevenção da Inadimplência",
        description: "",
        questions: [
          numberedQuestion(9, "6", "O monitoramento de clientes inadimplentes e ações preventivas está sendo feito regularmente?", "Acompanhe clientes com risco de inadimplência e atue antes do vencimento para evitar atrasos."),
          numberedQuestion(10, "7", "Há envio de lembretes de pagamento antes do vencimento (já com o boleto) para evitar inadimplência?", "Envie mensagens automáticas lembrando o cliente do vencimento, incluindo o boleto para facilitar o pagamento."),
          numberedQuestion(11, "8", "A empresa utiliza múltiplos canais de comunicação (WhatsApp, SMS, e-mail, ligação) para cobrança?", "Use diferentes canais para garantir que o cliente receba as notificações de cobrança."),
          numberedQuestion(12, "9", "Existe um critério claro para definir quando a primeira ligação de cobrança deve ser feita após o vencimento?", "Estabeleça um prazo fixo para o primeiro contato de cobrança (ex: 3 dias após o vencimento)."),
          numberedQuestion(13, "10", "Há oferta de parcelamento ou negociação para clientes inadimplentes antes do corte do serviço?", "Antes de cancelar, ofereça condições especiais para regularização, como parcelamento da dívida."),
          numberedQuestion(14, "11", "Os clientes inadimplentes recorrentes são acompanhados de forma diferenciada?", "Identifique clientes que sempre atrasam pagamentos e crie estratégias específicas, como envio antecipado de lembretes, opções de parcelamento e abordagens mais personalizadas para evitar a inadimplência contínua."),
          numberedQuestion(15, "12", "Existe um cronograma estruturado de cobrança?", "Defina um fluxo claro para os contatos de cobrança, incluindo lembretes antes do vencimento, mensagens logo após o atraso e ligações escalonadas (ex: 3, 7 e 15 dias após o vencimento)."),
          numberedQuestion(16, "13", "Existe uma equipe de cobrança dedicada?", "Ter uma equipe especializada em cobrança melhora a taxa de recuperação de valores e reduz a inadimplência, garantindo abordagens mais eficazes e humanizadas."),
          numberedQuestion(17, "14", "Existe um processo de cobrança estruturado?", "A cobrança deve seguir um padrão definido, com regras claras sobre prazos, mensagens enviadas, métodos de pagamento disponíveis e ações antes do corte do serviço.")
        ]
      },
      {
        code: "estrategias_de_retencao_e_fidelizacao",
        name: "Estratégias de Retenção e Fidelização",
        description: "",
        questions: [
          numberedQuestion(19, "15", "A empresa mantém uma comunicação ativa para reforçar os benefícios da fidelidade do cliente (atendimento ágil, estabilidade da rede, vantagens exclusivas)?", "Mantenha contato com os clientes reforçando os diferenciais do serviço para fortalecer a fidelização."),
          numberedQuestion(20, "16", "Os clientes que pagam em dia recebem algum tipo de benefício ou desconto?", "Ofereça vantagens para clientes pontuais, como descontos ou bônus na velocidade da internet."),
          numberedQuestion(21, "17", "Há algum programa de fidelização para clientes antigos, como aumento de velocidade gratuito ou descontos?", "Clientes fiéis devem receber benefícios exclusivos para incentivá-los a continuar na base."),
          numberedQuestion(22, "18", "A empresa realiza pesquisas de satisfação para identificar riscos de cancelamento?", "Faça pesquisas periódicas para identificar clientes insatisfeitos e agir antes que cancelem."),
          numberedQuestion(23, "19", "Existe uma estratégia de comunicação específica para renovação de contratos de 6 meses e 1 ano?", "Antes do vencimento do contrato, entre em contato com o cliente e ofereça benefícios para renovação, como descontos ou melhorias no plano, destacando as vantagens de permanecer na operadora."),
          numberedQuestion(24, "20", "Existe um processo de comunicação com o cliente em datas comemorativas (Aniversário, tempo de contrato, pagamento antecipado...)?", "Estabeleça um calendário de comunicação para enviar mensagens personalizadas em momentos importantes, como aniversário do cliente, tempo de contrato e pagamento antecipado. Essas ações fortalecem o relacionamento, demonstram valorização e podem incluir benefícios como descontos, brindes ou bônus temporários na velocidade da internet."),
          numberedQuestion(25, "21", "Existe um cronograma estruturado de contatos de retenção?", "Mantenha uma comunicação contínua com os clientes, reforçando os benefícios de permanecer na operadora. Envie mensagens periódicas destacando vantagens como atendimento ágil, estabilidade da rede, suporte técnico eficiente, programas de fidelização e condições especiais para clientes antigos. Isso cria um vínculo mais forte e reduz o risco de cancelamento.")
        ]
      },
      {
        code: "retencao_e_acompanhamento_de_clientes_em_risco",
        name: "Retenção e Acompanhamento de Clientes em Risco",
        description: "",
        questions: [
          numberedQuestion(27, "22", "Os chamados técnicos são acompanhados para garantir a satisfação do cliente antes que ele pense em cancelar?", "Sempre verifique se o cliente ficou satisfeito após uma visita técnica, evitando insatisfação."),
          numberedQuestion(28, "23", "O perfil dos clientes é analisado antes de oferecer retenção ou refidelização (Tempo de contrato, Plano, Histórico de inadimplência)?", "Antes de fazer uma oferta de retenção, avalie o histórico do cliente para personalizar a abordagem."),
          numberedQuestion(29, "24", "Existe uma estratégia personalizada de retenção de acordo com o perfil do cliente?", "Antes que o cliente mude, ofereça condições melhores, como um desconto temporário ou upgrade."),
          numberedQuestion(30, "25", "A empresa oferece benefícios ou condições especiais para clientes que desejam trocar de operadora?", "Antes que o cliente migre para a concorrência, apresente ofertas exclusivas, como upgrade de velocidade, descontos temporários ou condições especiais de pagamento."),
          numberedQuestion(31, "26", "As ofertas de retenção são personalizadas de acordo com o comportamento e necessidades do cliente?", "Avalie o histórico de uso e perfil do cliente para oferecer benefícios relevantes, como maior velocidade para quem usa streaming ou melhores condições financeiras para clientes inadimplentes."),
          numberedQuestion(32, "27", "A empresa possui um diferencial competitivo claramente destacado para evitar trocas de operadora?", "Sempre reforce os diferenciais da empresa (suporte técnico ágil, estabilidade da rede, benefícios exclusivos, atendimento local) para justificar a permanência do cliente."),
          numberedQuestion(33, "28", "Existe um acompanhamento específico para clientes que não atendem ligações de cobrança?", "Clientes que não atendem chamadas podem ser abordados por outros meios, como WhatsApp, SMS ou e-mail. Se necessário, altere os horários de contato para aumentar a chance de resposta.")
        ]
      },
      {
        code: "retencao_no_momento_da_retirada_do_equipamento",
        name: "Retenção no Momento da Retirada do Equipamento",
        description: "",
        questions: [
          numberedQuestion(35, "29", "Os técnicos possuem um processo estruturado para reter clientes no momento da retirada do equipamento?", "No momento da retirada, o técnico deve oferecer uma opção para o cliente permanecer, como um acordo de pagamento."),
          numberedQuestion(36, "30", "Os técnicos estão preparados para receber pagamentos no momento da retirada para evitar cancelamentos?", "O técnico deve estar treinado e equipado para receber pagamentos e impedir o cancelamento imediato.")
        ]
      },
      {
        code: "monitoria_de_instalacao",
        name: "Monitoria de Instalação",
        description: "",
        questions: [
          numberedQuestion(38, "31", "Existe um processo de monitoria de risco na instalação? (Analisando se existem muitos drops na casa, muitos modens, sinais de trocas recorrentes de provedores?)", "Durante a instalação, a equipe técnica deve avaliar indicadores de risco, como excesso de cabos e divisões de sinal (drops), número elevado de modens instalados anteriormente e histórico de trocas de provedores. Se identificado um risco alto de cancelamento futuro, o cliente pode receber um atendimento consultivo, explicando os diferenciais da operadora, ajustes técnicos para melhor desempenho e recomendações personalizadas para garantir uma melhor experiência e reduzir o churn.")
        ]
      }
    ]
  }),
  defineSection({
    code: "marketing",
    name: "Marketing",
    shortName: "Marketing",
    sourceSheet: "Mkt",
    implementationMode: "date",
    description: "",
    groups: [
      {
        code: "canais_de_vendas",
        name: "Canais de vendas",
        description: "Mapeamento e análise dos canais que geram novos contratos, identificando origem dos leads, taxas de conversão e oportunidades de otimização em marketing e vendas.\nImportância: Traz clareza sobre os canais mais eficazes, alinhando marketing e comercial e otimizando ações para reduzir custos e aumentar eficiência.\nResultados:Mais previsibilidade, menor custo por contrato, maior ROI e melhor conversão de leads.",
        questions: [
          namedItem(3, "PAP", "Meta por canal. Reduzir com otimização de criativos e segmentação por bairro."),
          namedItem(4, "Loja", "Acompanhar do lead ao contrato. Melhorar roteiro do time e velocidade de resposta."),
          namedItem(5, "Condomínio", "Receita gerada / investimento. Pausar o que não retorna, reforçar os vencedores."),
          namedItem(6, "Indicações base", "Pergunta 0–10 sobre clareza e simpatia na comunicação. Coletar mensalmente."),
          namedItem(7, "Indicações time", "Monitorar alcance, salvamentos e comentários. Focar em conteúdos que viram leads."),
          namedItem(8, "Receptivo", "Otimizar tempo de resposta e scripts de atendimento. Registrar origem das ligações e conversões."),
          namedItem(9, "Eventos", "Coletar contatos e transformar em leads qualificados. Realizar follow-up em até 48h após cada ação."),
          namedItem(10, "Digital / Online (Mídia Paga e Orgânica)", "Google Ads, Meta Ads, campanhas de WhatsApp Business, landing pages e chatbots.\nGera leads qualificados com baixo custo por aquisição quando bem configurado."),
          namedItem(11, "Parcerias Comerciais Locais", "Acordos com imobiliárias, construtoras, lojistas, síndicos e escolas.\nPode funcionar com comissão ou permuta."),
          namedItem(12, "Afiliados / Microinfluenciadores", "Pessoas físicas ou perfis locais que indicam clientes em troca de comissão ou bônus.\nExcelente em cidades pequenas, reforça a reputação e o “boca a boca”."),
          namedItem(13, "Telemarketing Ativo (Interno ou Terceirizado)", "Central própria para ativar leads frios, listas de prospects ou campanhas específicas.\nAlta capacidade de escala se bem roteirizado."),
          namedItem(14, "Campanhas Internas de Upgrade e Retenção (Base ativa)", "Cross e up-sell via CRM, WhatsApp, ou abordagem proativa.\nTrabalha o aumento de ticket e a fidelização."),
          namedItem(15, "Canais Públicos / Licitações", "Contratos com prefeituras, câmaras, órgãos públicos, escolas municipais.\nRequer estrutura jurídica e fiscal adequada."),
          namedItem(16, "Marketplace / Plataformas de Parceria", "Integração com sites que comparam provedores (“Melhor Plano”, “Minha Conexão”, etc.).\nAumenta visibilidade online e captação passiva."),
          namedItem(17, "Times de Porta a Porta Externos Terceirizados (Franquias de Vendas)", "Times especializados por bairro ou cidade, remunerados por comissionamento.\nIdeal para expansão rápida.")
        ]
      },
      {
        code: "estrutura_de_marca_e_posicionamento",
        name: "Estrutura de Marca e Posicionamento",
        description: "O que é Identidade, proposta de valor, diferenciais e tom de voz aplicados de forma padronizada em site, redes, veículos e uniforme.\nImportância: Deixa a comunicação clara e consistente, diferencia no mercado local e alinha marketing, vendas e operação.\nResultados: Mais reconhecimento, mais conversão e indicações, CPL menor, NPS melhor e menos churn por expectativa bem definida.",
        questions: [
          namedItem(19, "Identidade Visual Ativa", "Padronize logo, cores e tipografia. Aplique em site, redes, carros e uniformes. Crie um manual simples (PDF) com exemplos corretos/errados."),
          namedItem(20, "Manual de Comunicação Local", "Defina tom de voz local (sotaques, termos regionais). Crie respostas padrão para WhatsApp, Direct e avaliações do Google."),
          namedItem(21, "Pilares de Comunicação", "Estabeleça 3 pilares: Conexão estável, Velocidade real, Suporte humano. Use-os como guias de conteúdo e anúncios."),
          namedItem(22, "Diferenciais Claros", "Liste 3–5 diferenciais mensuráveis (ex: instalação em 24h, suporte 24/7, Wi‑Fi 6). Publique no site e materiais."),
          namedItem(23, "Avaliações e Depoimentos", "Coleta via pós-instalação (link do Google). Transforme em print/post com autorização do cliente e publique mensalmente."),
          namedItem(24, "Estrutura de Marca e Posicionamento", "Posts de bastidores, equipe técnica, histórias de atendimento e impacto social. 1x por semana mínimo.")
        ]
      },
      {
        code: "marketing_digital_online",
        name: "Marketing Digital (Online)",
        description: "Conjunto de ações na web para gerar e converter demanda: site com CTA, SEO, Google Meu Negócio, Meta/Google Ads, landing pages, WhatsApp/CRM, conteúdo e remarketing.\nImportância: Acelera aquisição qualificada no território, mede tudo em tempo real e permite otimizar orçamento por bairro e canal.\nResultados: Mais leads e contratos com CPL menor, aumento de tráfego e conversão no site/WhatsApp, crescimento contínuo e ROI comprovável.",
        questions: [
          namedItem(26, "Presença em todas as redes sociais (Instagram, tiktok, linkedin)", "Garanta perfis ativos e atualizados em todas as plataformas, com identidade visual unificada e conteúdo adaptado a cada público. Aumenta alcance, credibilidade e oportunidades de conexão."),
          namedItem(27, "Site com CTA", "Botão 'Assine agora', formulário integrado ao CRM/Zap‑ISP e WhatsApp. Medir cliques e envios."),
          namedItem(28, "Página de Cobertura", "Mapa de bairros atendidos + 'Cadastre seu interesse'. Atualize sempre que abrir novo bairro."),
          namedItem(29, "Google Meu Negócio Otimizado", "Atualize fotos, horários, categorias e responda avaliações em até 24h. Publique 1 post por semana com CTA."),
          namedItem(30, "Captação de Leads", "Use LP simples com nome, bairro e WhatsApp. Alternativa: botão direto para WhatsApp com mensagem pronta."),
          namedItem(31, "Anúncios de Upgrade", "Segmento: base ativa (lista do CRM). Criativos com ganho real (ex: +200 Mbps por R$ X). CTA para WhatsApp/CRM."),
          namedItem(32, "Remarketing", "Públicos: visitantes do site, engajados no Instagram, clique sem contrato. Frequência 2–5/semana, oferta clara."),
          namedItem(33, "Conteúdo de Autoridade", "Reels semanais: como testar velocidade, roteador ideal, diferença 100 vs 500 Mbps. Inclua CTA de assinatura no final."),
          namedItem(34, "Campanhas de Indicação", "Crie código/cupom do cliente. Recompensa: 1 mensalidade com desconto. Comunicar via e‑mail/WhatsApp e posts."),
          namedItem(35, "Foto de perfil padronizada no WhatsApp", "Utilize imagem com logo oficial da empresa, fundo neutro e boa resolução. Mantém identidade visual consistente e transmite profissionalismo no atendimento.")
        ]
      },
      {
        code: "relacionamento_e_experiencia_do_cliente",
        name: "Relacionamento e Experiência do Cliente",
        description: "Rotina de comunicação e cuidado pós-venda: boas-vindas, pós-instalação com feedback, NPS, avisos de manutenção, canais oficiais rápidos e conteúdo educativo.\nImportância:Aumenta confiança, resolve atritos antes de virarem cancelamento e transforma clientes em promotores.\nResultados: NPS mais alto, menos chamados e churn, mais upgrades e indicações, reputação forte no Google e nas redes.",
        questions: [
          namedItem(37, "Pós‑instalação com Feedback", "Mensagem automática 24–48h após instalação com link do Google e checklist de uso. Registro do NPS por cliente."),
          namedItem(38, "Envio de Boas‑vindas", "Arte com nome do cliente e plano. Instruções de Wi‑Fi, app, suporte e canais oficiais."),
          namedItem(39, "Comunicações em Massa", "Lista de transmissão por cidade/bairro. Enviar novidades, upgrades e manutenção programada com antecedência."),
          namedItem(40, "Campanhas de Retenção", "Antes do cancelamento: oferta personalizada (upgrade/benefício). Criar régua de contato em D‑3, D‑1 e D+3.")
        ]
      },
      {
        code: "marketing_local_offline",
        name: "Marketing Local (Offline)",
        description: "Ações presenciais no território: blitz de rua, porta a porta, parcerias com comércios, eventos comunitários, materiais impressos e branding em veículos e uniformes.\nImportância: Gera proximidade e confiança onde a decisão acontece, ativa bairros com baixa penetração e sustenta as campanhas online.\nResultados: Mais leads locais qualificados, aumento de contratos por bairro, reforço de marca e indicações orgânicas.",
        questions: [
          namedItem(42, "Anúncios Locais Segmentados", "Meta Ads: segmentação por raio/bairro; Google Ads: campanhas de pesquisa 'internet fibra + cidade'. Diária fixa e teste A/B de criativos."),
          namedItem(43, "Ações Porta a Porta", "Equipe uniformizada, panfleto com oferta do bairro e QR. Roteiro por ruas/quadras e registro diário de visitas."),
          namedItem(44, "Parcerias Locais", "Feche com padarias, mercados, academias: cupom de indicação impresso e QR de assinatura. Troca de divulgação."),
          namedItem(45, "Blitz de Rua", "Tenda com Wi‑Fi grátis, teste de velocidade e QR code para assinatura. Planilha de leads coletados por bairro."),
          namedItem(46, "Campanhas de Retenção Local", "Brindes e agradecimentos a clientes antigos em bairros maduros. Ação trimestral com post de reconhecimento."),
          namedItem(47, "Comemoração de Bairros Conectados", "Campanha 'Bairro 100% Fibra': sorteio local, fotos com moradores, placa simbólica e post com hashtag do bairro."),
          namedItem(48, "Presença em Eventos Comunitários", "Feiras, escolas e esportes. Stand simples, Wi‑Fi aberto e captação de leads com QR. Parceria com influenciadores locais."),
          namedItem(49, "Ações pontuais com prêmio para quem divulga o provedor", "Divulgação atraves de adesivo nos carros (por exemplo 50,00 para quem colocar o adesivo nos carros e mais 50,00 para quem conseguir trazer um cliente que contrate a internet)")
        ]
      },
      {
        code: "reunioes_e_gestao_de_marketing",
        name: "Reuniões e Gestão de Marketing",
        description: "Rotina de planejamento, alinhamento e acompanhamento entre marketing e comercial com calendário, metas, orçamento e relatório visual de resultados.\nImportância: Garante foco, priorização por bairro e canal, decisões rápidas baseadas em dados e integração com vendas e operação.\nResultados: Campanhas mais eficientes, CPL e CPCo menores, previsibilidade de contratos, correções rápidas de rota e ROI crescente.",
        questions: [
          namedItem(51, "Reunião de Marketing e Comercial", "1x/mês: revisar CPL, conversão por campanha e bairros. Ajustar orçamento e ofertas."),
          namedItem(52, "Planejamento Mensal e Trimestral", "Definir calendário do mês seguinte: temas, verba por canal, bairros prioritários e metas de leads/contratos."),
          namedItem(53, "Relatório Visual (BI ISP4)", "Painel com CPL, CPCo, ROI, leads por canal, contratos por bairro. Comparar vs meta e mês anterior.")
        ]
      },
      {
        code: "indicadores_de_marketing",
        name: "Indicadores de Marketing",
        description: "Conjunto de métricas para medir desempenho por canal e bairro como CPL, conversão, CPCo, ROI, NPS e engajamento.\nImportância: Mostra o que funciona, orienta orçamento e prioriza campanhas e regiões com maior retorno.\nResultados: Decisões rápidas e precisas, queda de CPL e CPCo, aumento de contratos e ROI previsível.",
        questions: [
          namedItem(55, "CPL (Custo por Lead)", "Meta por canal. Reduzir com otimização de criativos e segmentação por bairro."),
          namedItem(56, "Conversão de Leads", "Acompanhar do lead ao contrato. Melhorar roteiro do time e velocidade de resposta."),
          namedItem(57, "Custo por Contrato (CPCo)", "Cálculo: investimento / novos contratos. Avaliar rentabilidade por campanha."),
          namedItem(58, "ROI de Campanhas", "Receita gerada / investimento. Pausar o que não retorna, reforçar os vencedores."),
          namedItem(59, "NPS de Comunicação", "Pergunta 0–10 sobre clareza e simpatia na comunicação. Coletar mensalmente."),
          namedItem(60, "Engajamento nas Redes", "Monitorar alcance, salvamentos e comentários. Focar em conteúdos que viram leads.")
        ]
      }
    ]
  }),
  defineSection({
    code: "customer_success",
    name: "Customer Success",
    shortName: "CS",
    sourceSheet: "CS",
    implementationMode: "boolean",
    description: "",
    groups: [
      {
        code: "ativacao_e_adocao_os_primeiros_30_dias",
        name: "Ativação e Adoção (Os Primeiros 30 Dias)",
        description: "",
        questions: [
          numberedQuestion(3, "1", "Hoje existe uma régua de contato estruturada para os 30 primeiros dias do cliente no provedor?", "Criar contatos de boas-vindas (ex: D+1, D+7, D+30) para garantir que a instalação foi bem-sucedida, ensinar a usar o app/central do assinante e tirar dúvidas iniciais."),
          numberedQuestion(4, "2", "O cliente recebe materiais educativos sobre como otimizar o uso do Wi-Fi na sua residência?", "Enviar cartilhas digitais ou vídeos curtos explicando sobre alcance do roteador, barreiras físicas (paredes, espelhos) e boas práticas de uso."),
          numberedQuestion(5, "3", "O primeiro boleto/fatura é acompanhado de uma explicação clara sobre a cobrança (proporcionalidade/pró-rata)?", "Muitos cancelamentos precoces ocorrem por dúvida na primeira fatura. Enviar um vídeo ou infográfico simples explicando como o valor foi calculado.")
        ]
      },
      {
        code: "monitoramento_e_saude_do_cliente_health_score",
        name: "Monitoramento e Saúde do Cliente (Health Score)",
        description: "",
        questions: [
          numberedQuestion(7, "4", "Monitoramos o sinal e entramos em contato proativamente antes do cliente reclamar?", "Implementar alertas no sistema (ex: Zabbix/PRTG) para quedas recorrentes na conexão do cliente e acionar o suporte preventivo para corrigir antes que ele ligue."),
          numberedQuestion(8, "6", "Utilizamos dados cruzados de suporte e rede para resolver problemas crônicos?", "Realizar comitês semanais entre CS e Redes para mapear áreas/OLTs com maior instabilidade e atuar na raiz do problema, e não apenas apagando incêndios."),
          numberedQuestion(9, "", "Fazemos pesquisas para todas a O.S de suporte técnico?"),
          numberedQuestion(10, "7", "Hoje enviamos NPS (Net Promoter Score) relacional para a base entendendo tendências de cancelamento?", "Disparar pesquisa de NPS a cada 3 ou 6 meses, de forma automatizada, para medir a lealdade geral com a marca (e não apenas o NPS do último atendimento)."),
          numberedQuestion(11, "8", "O time faz a tratativa e resolve com os clientes detratores do NPS?", "Ligar em até 48h para todos os clientes que deram nota de 0 a 6 para entender o motivo, pedir desculpas e apresentar um plano prático de solução."),
          numberedQuestion(12, "9", "As sugestões deixadas pelos clientes nas pesquisas geram planos de melhoria reais na empresa?", "Categorizar os feedbacks abertos (ex: 'fatura confusa', 'internet cai à noite') e levar para a diretoria priorizar as melhorias nos processos.")
        ]
      },
      {
        code: "engajamento_e_relacionamento_contato_preditivo",
        name: "Engajamento e Relacionamento (Contato Preditivo)",
        description: "",
        questions: [
          numberedQuestion(14, "10", "Existe uma régua de relacionamento contínuo (aniversário de contrato e aniversário do cliente)", "Automatizar mensagens parabenizando por 1 ano de provedor (oferecendo um pequeno mimo/desconto) ou no aniversário do titular, fortalecendo o vínculo emocional."),
          numberedQuestion(15, "11", "Clientes com baixo consumo de banda (ociosos) são contatados para entender se há insatisfação ou não uso?", "Monitorar clientes que quase não trafegam dados (risco de cancelamento oculto ou mudança de endereço sem aviso) e fazer contato de relacionamento."),
          numberedQuestion(16, "12", "O provedor realiza ações de comunidade ou comunicação em datas comemorativas na região de atuação?", "Criar proximidade regional (ex: mensagens em feriados locais, patrocínio de pequenos eventos no bairro), mostrando que a empresa faz parte da comunidade.")
        ]
      },
      {
        code: "expansao_upsell_e_defensoria_promotores",
        name: "Expansão (Upsell) e Defensoria (Promotores)",
        description: "",
        questions: [
          numberedQuestion(18, "13", "Usamos clientes promotores para proativamente fazer marketing de indicações (Member Get Member)?", "Criar um programa 'Indique e Ganhe'. Ao receber nota 9 ou 10 no NPS, enviar automaticamente um link para o cliente indicar vizinhos e ganhar descontos na fatura."),
          numberedQuestion(19, "14", "Existem campanhas de Upsell (upgrade de plano) focadas no comportamento do cliente?", "Identificar clientes que atingem frequentemente o limite de banda do seu plano ou têm muitos dispositivos conectados e oferecer um upgrade com condições especiais."),
          numberedQuestion(20, "15", "O time de CS oferece SVAs (Serviços de Valor Adicionado) para aumentar a retenção (streamings)", "Ofertamos coisas diferentes para o cliente não sair da base?")
        ]
      }
    ]
  }),
  defineSection({
    code: "atendimento",
    name: "Atendimento",
    shortName: "Atendimento",
    sourceSheet: "Atendimento",
    implementationMode: "boolean",
    description: "",
    groups: [
      {
        code: "gestao_de_dados",
        name: "Gestão de Dados",
        description: "",
        questions: [
          numberedQuestion(3, "1", "O gestor analisa todas as notas detratoras e neutras da equipe?", "Criar uma rotina diária ou semanal para ouvir chamadas ou ler chats de notas baixas, identificando se a falha foi de processo, sistema ou comportamento."),
          numberedQuestion(4, "2", "O gestor analisa os cancelamentos que passaram pela equipe?", "Mapear se houve algum sinal de insatisfação ignorado pelo assistente antes de o cliente pedir o cancelamento definitivo."),
          numberedQuestion(5, "3", "O gestor monitoriza o atendimento com base em critérios de Empatia, SLA, Clareza, Processo?", "Ter um formulário de monitorização de qualidade padrão (QA) para avaliar as interações de forma justa e objetiva."),
          numberedQuestion(6, "4", "É gerado um relatório apontando as principais causas de cancelamento e notas detratoras com as análises?", "Transformar dados num plano de ação. O relatório deve ser partilhado com outros setores (Ex: se a nota baixa é por quebra de sinal, o setor de Redes precisa de ser notificado)."),
          numberedQuestion(7, "5", "Existe uma cultura de feedback e reuniões One-on-One (1:1) com a equipe?", "Realizar feedbacks quinzenais ou mensais documentados, focando no desenvolvimento contínuo e não apenas na cobrança de resultados.")
        ]
      },
      {
        code: "processos_e_ferramentas",
        name: "Processos e Ferramentas",
        description: "",
        questions: [
          numberedQuestion(9, "6", "A equipa possui uma Base de Conhecimento atualizada para consulta de processos?", "Manter um portal ou documento onde o assistente possa procurar soluções padronizadas para problemas técnicos ou de faturação, evitando depender sempre do supervisor."),
          numberedQuestion(10, "7", "O sistema de atendimento (CRM/ERP) centraliza todo o histórico do cliente de forma acessível?", "Garantir que o assistente não precise de abrir vários sistemas diferentes. O histórico de conversas anteriores deve estar visível para evitar que o cliente \"repita a história\"."),
          numberedQuestion(11, "8", "Existem regras claras de escalonamento (N1 para N2, Retenção, Suporte Avançado)?", "Definir exatamente quando um assistente de primeiro nível deve transferir o ticket. Evita reencaminhamentos desnecessários e diminui o tempo de espera do cliente."),
          numberedQuestion(12, "9", "A equipa tem autonomia (alçadas) para resolver problemas simples sem aprovação do gestor?", "Conceder autonomia controlada (ex: isentar juros até X euros, dar desconto de X dias sem ligação) para agilizar o FCR (First Contact Resolution).")
        ]
      },
      {
        code: "qualidade_e_capacitacao",
        name: "Qualidade e Capacitação",
        description: "",
        questions: [
          numberedQuestion(14, "10", "Existe uma trilha de formação estruturada(treinamento) para os novos atendentes?", "Criar um cronograma de integração que mescle teoria (sistemas e produtos) com prática (ouvir chamadas, simulações) antes de ir para a operação real."),
          numberedQuestion(15, "11", "A equipa passa por reciclagens periódicas sobre procedimentos e regras de negócio?", "Sempre que houver o lançamento de uma campanha ou mudança de sistema, realizar uma formação rápida e documentar a assinatura/ciência da equipa."),
          numberedQuestion(16, "12", "A linguagem utilizada pela equipa é acessível e humanizada (sem jargões técnicos excessivos)?", "Evitar que o assistente use termos muito técnicos sem explicar de forma simples para o cliente o que está a acontecer.")
        ]
      },
      {
        code: "agilidade_e_slas_tempo",
        name: "Agilidade e SLAs (Tempo)",
        description: "",
        questions: [
          numberedQuestion(18, "13", "A empresa monitoriza o TME (Tempo Médio de Espera) e atua de imediato quando há filas/constrangimentos?", "Ter painéis à vista (Dashboards) que mostrem a fila de espera no WhatsApp e Telefone, permitindo reafetar a equipa em horários de pico."),
          numberedQuestion(19, "14", "Há analise sobre RECHAMADA?", "A meta não deve ser apenas atender rápido (TMA), mas resolver o problema na primeira interação para evitar novas chamadas."),
          numberedQuestion(20, "15", "O cliente recebe prazos reais e o retorno (Follow-up) prometido é cumprido?", "Se o assistente promete devolver a chamada numa hora ou após a avaliação de outro setor, deve haver um alerta ou processo que garanta esse retorno.")
        ]
      },
      {
        code: "experiencia_do_cliente_jornada",
        name: "Experiência do Cliente (Jornada)",
        description: "",
        questions: [
          numberedQuestion(22, "16", "Existe uma pesquisa de satisfação (CSAT, NPS ou CES) enviada automaticamente no final do atendimento?", "Configurar a ferramenta para enviar a pesquisa assim que o ticket for fechado, capturando o sentimento do cliente \"a quente\"."),
          numberedQuestion(23, "17", "O atendimento é verdadeiramente Omnichannel(Ferramenta)?", "O cliente deve poder iniciar a conversa no WhatsApp e, se ligar, o assistente deve saber do que se trata a conversa do chat, mantendo a continuidade.")
        ]
      }
    ]
  }),
  defineSection({
    code: "rh_cultura",
    name: "RH e Cultura",
    shortName: "RH e Cultura",
    sourceSheet: "RH e Cultura",
    implementationMode: "date",
    description: "",
    groups: [
      {
        code: "estrutura_e_governanca_de_pessoas",
        name: "Estrutura e Governança de Pessoas",
        description: "Conjunto de políticas, documentos, descrições e estruturas que organizam a gestão de pessoas na empresa.\nImportância: Dá clareza sobre regras, responsabilidades e valores, garantindo que todos saibam “como as coisas funcionam” e o que é esperado deles.\nResultados: Organização, previsibilidade, segurança jurídica e alinhamento entre equipe e liderança.",
        questions: [
          namedItem(3, "Política de Incentivo/Bonificação - Politca de Comissionamento", "Critérios claros para premiações financeiras ou não-financeiras por desempenho, produtividade ou metas."),
          namedItem(4, "Regulamento Interno", "Documento que estabelece normas e procedimentos obrigatórios para todos os colaboradores."),
          namedItem(5, "Código de Conduta", "Normas de comportamento e ética interna, incluindo  LGPD."),
          namedItem(6, "Código de Cultura", "Documento formalizando missão, visão, valores e comportamentos esperados no dia a dia."),
          namedItem(7, "Organograma Atualizado", "Representação visual das hierarquias e responsabilidades dentro da empresa."),
          namedItem(8, "Descritivo de Cargos e Competências", "Definição de funções, responsabilidades e habilidades necessárias para cada cargo."),
          namedItem(9, "Plano de Carreira e Sucessão", "Estratégia para crescimento profissional e substituição de cargos de liderança."),
          namedItem(10, "POPs e Fluxogramas de Todas as Áreas", "Padronização e visualização dos processos de trabalho por área."),
          namedItem(11, "Política de Diversidade e Inclusão", "Compromisso formal com diversidade, equidade e inclusão.")
        ]
      },
      {
        code: "ciclo_de_gestao_de_pessoas",
        name: "Ciclo de Gestão de Pessoas",
        description: "Processos que acompanham o colaborador desde a entrada (onboarding) até a saída (offboarding), passando por avaliações, reuniões e planos de desenvolvimento.\nImportância: Garante que cada etapa da jornada do colaborador seja bem gerida, maximizando engajamento e performance.\nResultados: Menor rotatividade, maior produtividade e alinhamento constante com metas e estratégias.",
        questions: [
          namedItem(13, "Processo Estruturado de Onboarding", "Integração formal de novos colaboradores com acompanhamento dos primeiros 90 dias."),
          namedItem(14, "ISC Onboarding", "Medição da satisfação dos novos colaboradores na integração."),
          namedItem(15, "Offboarding Humanizado", "Processo de desligamento com feedback, registro e preservação de relacionamento."),
          namedItem(16, "Uniforme para todos colaboradores", "Padrão alinhado à identidade visual, uso obrigatório e confortável. Gera credibilidade, padroniza imagem e reforça cultura."),
          namedItem(17, "Crachás de identificação para todos colaboradores", "Com foto, nome, cargo e logo. Uso obrigatório para segurança, confiança e fácil identificação."),
          namedItem(18, "Numeros de contatos corporativos", "Separar linhas por setor, divulgar canais oficiais e configurar respostas automáticas. Organiza atendimento e evita uso de contatos pessoais."),
          namedItem(19, "Fotos de Perfil padronizadas com a ID Visual", "Fundo e enquadramento iguais para todos, usadas em crachás, WhatsApp e site. Passa profissionalismo e fortalece marca."),
          namedItem(20, "Pesquisa de Clima Organizacional / E-NPS", "Avaliação periódica do engajamento e satisfação dos colaboradores."),
          namedItem(21, "Ações Pós E-NPS", "Implementação de ações de Melhorias com base na Pesquisa de Clima e E-NPS"),
          namedItem(22, "Avaliação de Desempenho Estruturada", "Avaliação formal do desempenho individual e coletivo."),
          namedItem(23, "Revisões de Metas e OKRs", "Reuniões para avaliar e ajustar metas de desempenho e resultados."),
          namedItem(24, "Reuniões de Líderes com Diretoria", "Encontros estratégicos para análise de indicadores e decisões."),
          namedItem(25, "Reuniões de Líderes com Liderados", "Acompanhamento próximo das entregas e desenvolvimento de equipe."),
          namedItem(26, "Reuniões Gerais da Empresa", "Alinhamento institucional e apresentação de resultados para todos."),
          namedItem(27, "Banco de Talentos Interno", "Cadastro de colaboradores com potencial para novas funções.")
        ]
      },
      {
        code: "cultura_organizacional_viva",
        name: "Cultura Organizacional Viva",
        description: "Práticas e ações que mantêm a missão, visão e valores presentes no dia a dia da empresa.\nImportância: Uma cultura forte orienta comportamentos e decisões, aumentando o senso de pertencimento.\nResultados: Colaboradores mais engajados, decisões mais alinhadas e maior atratividade da empresa para talentos e clientes.",
        questions: [
          namedItem(29, "Liderança como Guardiã da Cultura", "Líderes que exemplificam e reforçam a cultura em todas as interações."),
          namedItem(30, "Ações Contínuas de Disseminação da Cultura", "Atividades frequentes para reforçar missão, visão e valores."),
          namedItem(31, "Frases, Murais e Mensagens de Cultura", "Comunicação visual para reforçar valores no ambiente."),
          namedItem(32, "Histórias e Casos de Sucesso Internos", "Compartilhamento de exemplos reais de vivência da cultura."),
          namedItem(33, "Rituais de Reconhecimento", "Premiações e homenagens regulares para colaboradores."),
          namedItem(34, "Projetos com Impacto Social", "Iniciativas sociais alinhadas ao propósito da empresa."),
          namedItem(35, "Gamificação de Metas", "Desafios e recompensas lúdicas para estimular resultados.")
        ]
      },
      {
        code: "engajamento_e_qualidade_de_vida",
        name: "Engajamento e Qualidade de Vida",
        description: "Ações que promovem integração, reconhecimento, bem-estar físico e mental, e conexão entre as pessoas.\nImportância: Pessoas felizes e saudáveis trabalham melhor e permanecem mais tempo na empresa.\nResultados: Melhoria no clima organizacional, aumento do comprometimento e redução do absenteísmo.",
        questions: [
          namedItem(37, "Calendário Anual de Eventos Internos", "Planejamento anual de ações de integração e cultura."),
          namedItem(38, "Comemorações de Resultados e Conquistas", "Celebração de metas e vitórias da equipe."),
          namedItem(39, "Happy Hours e Momentos de Descompressão", "Encontros informais para socializar e relaxar."),
          namedItem(40, "Espaços de Convivência Atraentes", "Ambientes para descanso e interação social."),
          namedItem(41, "Ações de Bem-Estar", "Atividades como ginástica laboral, pausas ativas, yoga."),
          namedItem(42, "Programas de Saúde Mental", "Apoio psicológico e campanhas de cuidado emocional."),
          namedItem(43, "Clubes de Interesse", "Times esportivos, grupos de leitura, voluntariado."),
          namedItem(44, "Caixa de Ideias e Melhoria Contínua", "Canal oficial para sugestões e inovações.")
        ]
      },
      {
        code: "desenvolvimento_continuo",
        name: "Desenvolvimento Contínuo",
        description: "Capacitações, programas e oportunidades de aprendizado constantes para todos os níveis da empresa.\nImportância: Garante que colaboradores se mantenham atualizados e preparados para novos desafios.\nResultados: Equipes mais qualificadas, inovação interna e melhor adaptação às mudanças do mercado.",
        questions: [
          namedItem(46, "Trilhas de Aprendizagem por Cargo - Acesso a Cursos e Certificações Externas", "Conteúdo contínuo e personalizado para funções específicas."),
          namedItem(47, "Academia Interna de Líderes", "Formação estruturada de liderança."),
          namedItem(48, "Mentoria Interna", "Troca de conhecimento e experiências entre áreas."),
          namedItem(49, "Treinamentos Técnicos e Reciclagens", "Capacitações programadas ao longo do ano."),
          namedItem(50, "Biblioteca Corporativa", "Acervo físico ou digital com conteúdos relevantes."),
          namedItem(51, "Turnover e Retenção", "Monitoramento da taxa de saída e permanência."),
          namedItem(52, "Absenteísmo", "Controle de faltas e atrasos para reduzir perdas."),
          namedItem(53, "Participação em Eventos Internos", "Acompanhamento do engajamento nas ações."),
          namedItem(54, "Índice de Aproveitamento em Treinamentos", "Avaliação do aprendizado após cursos e capacitações.")
        ]
      }
    ]
  })
];

export const ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS = OPERATIONS_DIAGNOSTIC_SECTIONS.flatMap(section =>
  section.groups.flatMap(group =>
    group.questions.map(question => ({
      ...question,
      sectionCode: section.code,
      sectionName: section.name,
      implementationMode: section.implementationMode,
      groupCode: group.code,
      groupName: group.name
    }))
  )
);

function findOperationsEvaluation(evaluationCode) {
  const normalizedCode = String(evaluationCode ?? '').trim().toLowerCase();
  return OPERATIONS_EVALUATION_OPTIONS.find(option => option.code === normalizedCode);
}

export function scoreFromOperationsEvaluation(evaluationCode) {
  return findOperationsEvaluation(evaluationCode)?.score ?? 0;
}

export function calculateOperationsDiagnosticResults(answers = []) {
  const safeAnswers = Array.isArray(answers) ? answers : [];
  const byQuestion = new Map(
    safeAnswers.map(answer => [answer.question_code || answer.questionCode, answer])
  );

  const sections = OPERATIONS_DIAGNOSTIC_SECTIONS.map(section => {
    const groups = section.groups.map(group => {
      const questionResults = group.questions.map(question => {
        const answer = byQuestion.get(question.code) || {};
        const evaluation = findOperationsEvaluation(
          answer.evaluation_code ?? answer.evaluationCode
        );
        const answered = Boolean(evaluation);

        return {
          ...question,
          evaluationCode: evaluation?.code ?? null,
          score: evaluation?.score ?? 0,
          maximumScore: 10,
          answered,
          implementationDate: answer.implementation_date ?? answer.implementationDate ?? null,
          willImplement: answer.will_implement ?? answer.willImplement ?? null,
          notes: answer.notes ?? ''
        };
      });

      const scoreTotal = questionResults.reduce((total, question) => total + question.score, 0);
      const maximumTotal = questionResults.length * 10;
      const answeredCount = questionResults.filter(question => question.answered).length;

      return {
        ...group,
        questionResults,
        scoreTotal,
        maximumTotal,
        percentage: maximumTotal > 0 ? scoreTotal / maximumTotal : 0,
        answeredCount,
        totalQuestions: questionResults.length
      };
    });

    const questionResults = groups.flatMap(group => group.questionResults);
    const scoreTotal = questionResults.reduce((total, question) => total + question.score, 0);
    const maximumTotal = questionResults.length * 10;
    const answeredCount = questionResults.filter(question => question.answered).length;

    return {
      ...section,
      groups,
      questionResults,
      scoreTotal,
      maximumTotal,
      percentage: maximumTotal > 0 ? scoreTotal / maximumTotal : 0,
      answeredCount,
      totalQuestions: questionResults.length
    };
  });

  const itemScoreTotal = sections.reduce((total, section) => total + section.scoreTotal, 0);
  const itemMaximumTotal = sections.reduce((total, section) => total + section.maximumTotal, 0);
  const answeredCount = sections.reduce((total, section) => total + section.answeredCount, 0);
  const totalQuestions = ALL_OPERATIONS_DIAGNOSTIC_QUESTIONS.length;
  // Mantém o padrão do diagnóstico geral: cada área tem o mesmo peso no consolidado.
  const overallPercentage = sections.length > 0
    ? sections.reduce((total, section) => total + section.percentage, 0) / sections.length
    : 0;
  const maximumTotal = sections.length * 10;
  const scoreTotal = overallPercentage * maximumTotal;

  return {
    sections,
    scoreTotal,
    maximumTotal,
    itemScoreTotal,
    itemMaximumTotal,
    overallPercentage,
    answeredCount,
    totalQuestions,
    progress: totalQuestions > 0 ? answeredCount / totalQuestions : 0
  };
}

export function formatOperationsPercentage(value) {
  return (Number(value || 0) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';
}

export function getOperationsExcellenceLevel(value) {
  const percentage = Number(value || 0);
  if (percentage < 0.5) return { code: 'baixo', label: 'Abaixo de 50%', tone: 'danger' };
  if (percentage < 0.85) return { code: 'intermediario', label: 'Entre 50% e 84,9999%', tone: 'warning' };
  if (percentage > 0.85) return { code: 'excelencia', label: 'Acima de 85%', tone: 'success' };
  return { code: 'limite', label: 'Exatamente 85% · faixa neutra do método', tone: 'neutral' };
}
