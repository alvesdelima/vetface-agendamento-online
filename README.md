# 🦷 VET.FACE | Microsistema de Agendamento & Gestão de Consultas

Microsistema web responsivo e automatizado para agendamento, consulta e reagendamento de consultas veterinárias especializadas (Odontologia Pet), integrado em tempo real com **Google Calendar**, banco de dados relacional **Supabase** e orquestração de workflows via **n8n**.

---

## 🚀 Funcionalidades Principais

- **🗓️ Novo Agendamento:**
  - Consulta dinâmica de slots e horários livres direto da agenda da clínica.
  - Coleta padronizada de dados do tutor (Nome, WhatsApp, E-mail) e do pet (Nome, Espécie).
  - Bloqueio automático do horário no **Google Calendar**.
  - Gravação do registro com status `confirmed` no **Supabase**.

- **🔍 Consulta por WhatsApp:**
  - Localização instantânea de agendamentos futuros usando apenas o telefone/WhatsApp do tutor.
  - Exibição de card limpo com nome do pet, tutor e data/horário formatado no fuso oficial (GMT-3 / Brasília).

- **🔄 Reagendamento Inteligente:**
  - Permite ao tutor escolher uma nova data e horário disponível sem intervenção manual da recepção.
  - Atualização do evento original no **Google Calendar** via API oficial (HTTP Request PATCH).
  - Atualização em tempo real do status e novo horário no **Supabase** (`status: reagendado`).

- **🔒 Segurança & Boas Práticas:**
  - Configurações e endpoints sensíveis centralizados em `config.js` e protegidos via `.gitignore`.
  - Exemplo público fornecido através de `config.example.js`.
  - Controle de cabeçalhos CORS (`Access-Control-Allow-Origin: *`) configurados nos nós de retorno.

---

## 🛠️ Stack Tecnológica

| Camada                  | Tecnologia                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------- |
| **Frontend**            | HTML5, CSS3 Moderno (Custom Properties, Flexbox, CSS Grid), JavaScript Vanilla (ES6+) |
| **Automação & Backend** | n8n (Self-Hosted via Docker/Queue Mode)                                               |
| **Banco de Dados**      | Supabase (PostgreSQL / PostgREST)                                                     |
| **Agenda & Calendário** | Google Calendar API v3                                                                |
| **Versionamento**       | Git & GitHub                                                                          |

---

## 📁 Estrutura de Pastas

```text
vetface-agendamento/
├── .gitignore               # Proteção de credenciais e arquivos locais
├── config.example.js        # Modelo de configuração para novos ambientes
├── config.js                # URLs dos Webhooks do n8n (Ignorado no Git)
├── index.html               # Estrutura e telas da aplicação SPA
├── style.css                # Identidade visual, tipografia e design system
├── script.js                # Lógica de interface, máscaras e requisições assíncronas
├── logo-com-icone-...svg    # Ativos de identidade visual
└── workflows/               # Backups dos fluxos do n8n exportados em JSON
    └── vetface_automacoes.json

⚙️ Configuração e Execução Local

1. Clonar o Repositório

git clone [https://github.com/alvesdelima/vetface-agendamento-online.git](https://github.com/alvesdelima/vetface-agendamento-online.git)
cd vetface-agendamento

2. Configurar Variáveis de Ambiente
Duplique o arquivo config.example.js e renomeie para config.js:

cp config.example.js config.js

Preencha as URLs dos seus Webhooks ativos no n8n:

const CONFIG = {
  N8N_URL_SLOTS: '[https://seu-n8n.online/webhook/agenda-livre](https://seu-n8n.online/webhook/agenda-livre)',
  N8N_URL_AGENDAR: '[https://seu-n8n.online/webhook/agendamento-google](https://seu-n8n.online/webhook/agendamento-google)',
  N8N_URL_CONSULTAR: '[https://seu-n8n.online/webhook/consultar-por-telefone](https://seu-n8n.online/webhook/consultar-por-telefone)',
  N8N_URL_REAGENDAR: '[https://seu-n8n.online/webhook/reagendar-google](https://seu-n8n.online/webhook/reagendar-google)'
};

3. Rodar Localmente
Abra o projeto com a extensão Live Server do VS Code ou utilize o servidor embutido do Python:

python3 -m http.server 5500

Acesse http://127.0.0.1:5500 no navegador.

🗄️ Estrutura da Tabela Supabase (agendamentos)

create table agendamentos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  nome_tutor text not null,
  telefone text not null,
  email text not null,
  nome_pet text not null,
  tipo_pet text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  google_event_id text not null,
  status text default 'confirmed' not null
);

👨‍💻 Autoria & Desenvolvimento
Desenvolvido com foco em alta conversão, agilidade no atendimento e arquitetura escalável de automação.
```
