import { KnowledgeItem, ProjectItem, DecisionRecord, ExpertItem, FeedbackTicket, FeedbackHistoryItem, TelemetryLogEvent } from '../types';

export const AVATARS = {
  alex: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdf1qlL-7cJrP9QOOPxpGHA5baA2Tpjh7vJ3TJOWvUvbAAx-DGmuV6nIUUWpJTLj1Xh-qskRc4MZsiz-qY7G0c152iO22zsTVp70PXQ9_CIwn6uAewVflSslVWjKr7sYu0EBLArwDZuGIvDMIkqqrtKmesOZ_2kabhQaIx6ljBfci8VxzhIDet0NTq1dsoC0HDZDsH2fCU1CVUMmXGEL4LcXALGc-BnpZeB97uJSeyCCYnG5xlNPZI',
  alexAlt: 'https://lh3.googleusercontent.com/aida/AEtjO1WW7wmjntpGyC0oKA8fsTOYNZE-6oTx9TUO_jz4ajAoyT0SZZZgNl5g7r6wwdo4Zqrn5tw6nqlfhxFzX6FeHsnxH3R25lmDxM732NzXXt-MCukbUld6u3_DemLKxOwHftNiYNo_TmKP-9AGvzX5HnAAaW-KbfkegX0bN_g7lzQkxz6-2kuiKvw9yONDTtmxfLndIhEme6I03QfzH1Mef0hb2-NYVREnVBNzGqsle8bcJ_wjwy741UBnVWk',
  marcus: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAev-T4obeVR_Xaf0eBRH0Holj-vxiQ19MJbYIgM_bThS8dk7eTsSvIOz6hUAziNfosaIzUDz6jnweGq0imCNrn_M_kp18Tri0O1iXUG0PjVsV28Jq-qprgIWbIBq4-wGSKPVg4pt9nljAlrCng-KoWVXzv5z4grtyEBPf9qfDn8F0QNulGoasxZpvh64jn5eR47bX9Rjd_uPuaaYjFmhPYso-AxvJJmug9AgUv8nML2LOjemAn5TVF',
  sarah: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCs0A3tlvH4LyFgkcWDRAtiazk45DzbzA1ITzkgjhs0wNuiHMVppo3EAUiPswZr6DertLWT-12YUG-TLaGzzNedxJEYTJybobkZwkU6j-aQjshbrwANhEH9LPjFF5vQ8VgGJBcsePDip8xin-NU0Fl1E8GoBGdaM1QJ3e60BQk58iJGvSv33yzyJZGlFaiiAT542MTmMwg12kPno6QbDoS0k8iHdMS_viYppbq5kbDoJdcz-OS9T1MM',
  david: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCha2sznDjI70_HZ5Z6J9I_r4eTKKhKHXOeVMpt49yhWCvT5Cquf65RSZtLuw3NzWtyZfVH6keJcYDawCwG33YtWRv77NHokW4BUc7AgvekvFUev5go9WT7UyEYVpFmi-XS0lBSqoL6jqVgpnwmevFN1R1og5BMuNZ7Ig3Di19I59F-u4D45yw062WCK1zc_fd79Y2Ekr9RTMM43u5x2EVNt06uUh-tev39fmG1FwiOvcqh06jYHiNl',
  jessica: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZachtHvxGlVDyo9hDYqevhCGP4nVj8K7alTMeDLqfng_TxOQRWB_MHQgESybmJTeUoamdePBgG8I0_x0Am67oiwkBVwAyVSKm-Scpe9Bvk9sQX4-hJSGS2Aj2bicnnTgh_mqqmE6E-J53LbcTo2Y_CRGi8_V1mZ-iK-0wP39L2j6woUNp0O3fbK1ne6itOtSI4_bkspFJlXzLkk4w494N3veXVZwiZx_p5wgRJMCIn7YD7XxbH1HJ',
  elena: 'https://lh3.googleusercontent.com/aida-public/AB6AXuClsWI_EbGH0C603VFWlDXNOwUzk0x5BekqB3gYrvO3PtQ-be0N41UKAFfYhHU6f6HOQAqxsAmOSqieBNu2hS_MDTCHRCoE4ZWucqtsaUOXOOo0jC1XIPy6KjJvjLM2mRSTd9izCGkY1wOwDsYqhalVjK1dycdo94ny7ZwTYj1ke-i1N9ZvDQ0MHsXJtGK748PLBZ01EJuLRkB2kuC5KI_3tUXDOc6L_iyMVdWngITeZI_AOSwdUTsx'
};

export const LOGO_URL = 'https://lh3.googleusercontent.com/aida/AEtjO1VceMuvT-vLx5K6F8E55C5FMwS0YltgCnoKB5tNYV_4sc44vBdXrwc5YWIM62bNVZbDKpZpDx2T5iaS0GSI9gLjNiYq0l4u41PqIR6rVlSRD4rUwllyvjHfi8-VWN0v8pD4RgEyVwHqLxpMMK9RwoQQDUAmv68-voo2bqLxTl4C0XGgn4o2JKwsc0RvdsqTcty0TnhMHg5rp7kwyuc0uaTmBHnlBWc7lgQZdOZaHqKKyR4oV4Tvr1ta5A';

export const INITIAL_KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  {
    id: 'k-1',
    type: 'Decision',
    title: 'Database Architecture Decision',
    description: 'Selection of PostgreSQL as primary relational store for transactional ledger and payment consistency.',
    project: 'Project Phoenix',
    authority: 'Arch Review Board',
    author: {
      name: 'Alex Morgan',
      role: 'Tech Lead',
      avatar: AVATARS.alex
    },
    updatedAt: 'Updated 2 days ago',
    tag: 'v2.4 ADR',
    verified: true,
    bookmarked: true
  },
  {
    id: 'k-2',
    type: 'Process & SOP',
    title: 'Engineering Deployment SOP & Pipeline',
    description: 'Step-by-step deployment guidelines for Kubernetes microservices and canary rollout criteria.',
    project: 'Platform Core',
    authority: 'DevOps Lead',
    author: {
      name: 'Marcus Vance',
      role: 'SecOps Dir',
      avatar: AVATARS.marcus
    },
    updatedAt: 'Updated 4 days ago',
    tag: '14 Verification Nodes',
    verified: true,
    stats: { nodes: 14 }
  },
  {
    id: 'k-3',
    type: 'Technical Spec',
    title: 'Project Phoenix Architecture Specification v3',
    description: 'Complete component architecture, RAG ingestion pipelines, and event-driven messaging topology.',
    project: 'Project Phoenix',
    authority: 'Arch Review Board',
    author: {
      name: 'Sarah Chen',
      role: 'Staff Eng',
      avatar: AVATARS.sarah
    },
    updatedAt: 'Updated 1 week ago',
    tag: '32 Diagrams',
    verified: true,
    stats: { diagrams: 32 }
  },
  {
    id: 'k-4',
    type: 'Policy',
    title: 'Data Retention & Encryption Policy',
    description: 'Standards for customer PII encryption at rest and automated 90-day ledger archival rules.',
    project: 'Enterprise Compliance',
    authority: 'Security Council',
    author: {
      name: 'David Kim',
      role: 'Lead SRE',
      avatar: AVATARS.david
    },
    updatedAt: 'Updated 2 weeks ago',
    tag: 'SOC2 Tier 1',
    verified: true,
    stats: { compliance: 'SOC2 Tier 1' }
  },
  {
    id: 'k-5',
    type: 'Lessons Learned',
    title: 'Project Atlas Q1 Retrospective & Lessons Learned',
    description: 'Key findings from distributed cache rollout and load testing under 50k concurrent requests.',
    project: 'Project Atlas',
    authority: 'Agile PMO',
    author: {
      name: 'Jessica Taylor',
      role: 'Program Manager',
      avatar: AVATARS.jessica
    },
    updatedAt: 'Updated 3 weeks ago',
    tag: 'Key Bottlenecks Solved',
    verified: true
  },
  {
    id: 'k-6',
    type: 'Decision',
    title: 'Asymmetric Token Strategy for Microservices',
    description: 'Evaluating asymmetric EdDSA vs ephemeral JWT for intra-cluster service authentication without shared database secrets.',
    project: 'Platform Core',
    authority: 'Security Council',
    author: {
      name: 'Alex Morgan',
      role: 'Tech Lead',
      avatar: AVATARS.alex
    },
    updatedAt: 'Updated 3 days ago',
    tag: 'ADR-049',
    verified: true
  },
  {
    id: 'k-7',
    type: 'Technical Spec',
    title: 'Kafka Streaming Cluster Topology & Partitioning',
    description: 'Data streaming architecture for real-time payment reconciliation with zero-loss consumer groups.',
    project: 'Project Phoenix',
    authority: 'Arch Review Board',
    author: {
      name: 'Sarah Chen',
      role: 'Staff Eng',
      avatar: AVATARS.sarah
    },
    updatedAt: 'Updated 5 days ago',
    tag: 'RFC-108',
    verified: true
  }
];

export const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'prj-1',
    code: 'PRJ-PHX',
    name: 'Project Phoenix',
    description: 'Core Payments & Ledger Modernization with zero-drift reconciliation',
    lead: 'Alex Morgan',
    leadAvatar: AVATARS.alex,
    status: 'Active · M3',
    department: 'Payments & Platform Engineering',
    tier: 'Tier-1 Core',
    documentsCount: 42,
    decisionsCount: 14,
    lastUpdated: '2 hours ago'
  },
  {
    id: 'prj-2',
    code: 'PRJ-ATL',
    name: 'Project Atlas',
    description: 'Distributed Cache & Global Edge Multi-Region Latency Optimization',
    lead: 'Jessica Taylor',
    leadAvatar: AVATARS.jessica,
    status: 'Active · Beta',
    department: 'Core Infrastructure',
    tier: 'Tier-1 Core',
    documentsCount: 31,
    decisionsCount: 9,
    lastUpdated: '1 day ago'
  },
  {
    id: 'prj-3',
    code: 'PRJ-IDM',
    name: 'Identity & Access Mesh',
    description: 'Zero-trust mTLS intra-cluster gateway & token exchange service',
    lead: 'David Kim',
    leadAvatar: AVATARS.david,
    status: 'Active · M3',
    department: 'SecOps & GRC',
    tier: 'Tier-1 Core',
    documentsCount: 28,
    decisionsCount: 11,
    lastUpdated: '3 days ago'
  },
  {
    id: 'prj-4',
    code: 'PRJ-FIN',
    name: 'FinOps Telemetry Engine',
    description: 'Automated cloud infrastructure attribution and cluster spot optimization',
    lead: 'Marcus Vance',
    leadAvatar: AVATARS.marcus,
    status: 'Active · Beta',
    department: 'DevOps & SRE',
    tier: 'Tier-2 Critical',
    documentsCount: 19,
    decisionsCount: 6,
    lastUpdated: '4 days ago'
  },
  {
    id: 'prj-5',
    code: 'PRJ-KFK',
    name: 'Streaming Data Backbone',
    description: 'High-throughput Kafka cluster with automated partition rebalancing',
    lead: 'Sarah Chen',
    leadAvatar: AVATARS.sarah,
    status: 'In Review',
    department: 'Data Platform',
    tier: 'Tier-2 Critical',
    documentsCount: 24,
    decisionsCount: 8,
    lastUpdated: '1 week ago'
  }
];

export const INITIAL_DECISIONS: DecisionRecord[] = [
  {
    id: 'dec-1',
    adrNumber: 'ADR-042',
    title: 'Database Architecture (PostgreSQL)',
    status: 'Approved',
    summary: 'Standardized on PostgreSQL 15 over distributed NoSQL for strong transactional consistency and JSONB audit logs.',
    fullRationale: 'Section 4.2: Distributed transactional integrity across ledger nodes requires strict ACID semantics provided natively by PostgreSQL 15. Evaluated alternatives (MongoDB, DynamoDB) lacked multi-statement atomic isolation necessary to guarantee zero-drift double entry accounting.',
    project: 'Project Phoenix',
    date: 'March 12, 2024',
    ratifiedBy: 'Architecture Review Board (5 signatures)',
    author: 'Alex Morgan',
    commentsCount: 12
  },
  {
    id: 'dec-2',
    adrNumber: 'ADR-049',
    title: 'Authentication & Token Strategy',
    status: 'In Review',
    summary: 'Evaluating asymmetric EdDSA vs ephemeral JWT for intra-cluster service authentication.',
    fullRationale: 'Internal microservice communication requires stateless cryptographic verification with sub-millisecond handshake overhead without central auth database bottlenecks.',
    project: 'Platform Core',
    date: 'April 02, 2024',
    ratifiedBy: 'Security Council Arbiter Panel',
    author: 'David Kim',
    commentsCount: 4
  },
  {
    id: 'dec-3',
    adrNumber: 'ADR-104',
    title: 'Database Cluster Failover Strategy',
    status: 'Approved',
    summary: 'Approved PostgreSQL over NoSQL cluster with Patroni synchronous replication.',
    fullRationale: 'Guarantees sub-30 second RTO and zero RPO across primary and secondary availability zones.',
    project: 'Project Phoenix',
    date: 'May 18, 2024',
    ratifiedBy: 'Platform & Infra Committee',
    author: 'Alex Morgan',
    commentsCount: 8
  },
  {
    id: 'dec-4',
    adrNumber: 'ADR-031',
    title: 'Kafka Consumer Group Rebalance Protocol',
    status: 'Approved',
    summary: 'Adopt Cooperative Sticky assignor protocol to prevent stop-the-world consumer stalls.',
    fullRationale: 'Eliminates 98% of consumer group pauses during rolling deployment of payment processing pods.',
    project: 'Streaming Data Backbone',
    date: 'February 10, 2024',
    ratifiedBy: 'Data Platform SRE Guild',
    author: 'Sarah Chen',
    commentsCount: 6
  }
];

export const INITIAL_EXPERTS: ExpertItem[] = [
  {
    id: 'exp-1',
    name: 'Alex Morgan',
    role: 'Tech Lead',
    department: 'Payments & Platform Engineering',
    avatar: AVATARS.alex,
    contributions: 34,
    accuracy: '99.2%',
    isPrimary: true,
    specialty: ['PostgreSQL', 'Transactional Ledgers', 'System Architecture', 'ADR Ratification']
  },
  {
    id: 'exp-2',
    name: 'Dr. Elena Rostova',
    role: 'Lead Data Architect',
    department: 'Data Platform',
    avatar: AVATARS.elena,
    contributions: 29,
    accuracy: '98.9%',
    isDomainLead: true,
    specialty: ['pgvector', 'Query Optimization', 'Schema Migration', 'Distributed Storage']
  },
  {
    id: 'exp-3',
    name: 'Sarah Chen',
    role: 'Staff Enterprise Architect',
    department: 'Payments Architecture',
    avatar: AVATARS.sarah,
    contributions: 28,
    accuracy: '98.5%',
    specialty: ['Event-Driven Mesh', 'Kafka Topology', 'Microservices', 'Stripe Integrations']
  },
  {
    id: 'exp-4',
    name: 'Marcus Vance',
    role: 'SecOps Director',
    department: 'Platform & Site Reliability',
    avatar: AVATARS.marcus,
    contributions: 21,
    accuracy: '97.8%',
    specialty: ['Kubernetes', 'HashiCorp Vault', 'CI/CD Pipelines', 'Canary Deployments']
  },
  {
    id: 'exp-5',
    name: 'David Kim',
    role: 'Lead SRE & Compliance',
    department: 'SecOps & GRC',
    avatar: AVATARS.david,
    contributions: 19,
    accuracy: '99.9%',
    specialty: ['SOC2 Compliance', 'PII Encryption', 'mTLS Gateway', 'Zero-Trust Architecture']
  },
  {
    id: 'exp-6',
    name: 'Jessica Taylor',
    role: 'Technical Program Director',
    department: 'Core Infrastructure',
    avatar: AVATARS.jessica,
    contributions: 16,
    accuracy: '98.1%',
    specialty: ['Project Atlas', 'Load Testing', 'Retrospectives', 'SLA Tracking']
  }
];

export const INITIAL_TICKET: FeedbackTicket = {
  id: 't-4921',
  ticketNumber: 'KB-4921',
  timeAgo: '26m ago',
  prompt: 'Who approved the Phoenix database architecture?',
  aiOutput: '“The Engineering Team approved the decision during the initial kickoff meeting.”',
  aiStatus: 'Vague / Incomplete Evidence',
  aiSource: 'Retrieved via baseline chat transcript',
  proposedCorrection: '“The Architecture Review Board officially approved the PostgreSQL decision on March 12, 2024, following ADR-042 review.”',
  verifiedBy: 'Verified by ADR-042',
  canonicalSource: 'Canonical source recorded in Confluence & GitHub',
  expert: {
    name: 'Alex Morgan',
    role: 'Tech Lead',
    avatar: AVATARS.alex
  },
  citations: [
    {
      title: 'ADR-042: Database Architecture Decision Record',
      page: 'Pg. 2, Sign-off section'
    },
    {
      title: 'Engineering Meeting Minutes',
      page: 'March 12, 2024'
    }
  ],
  embeddingsCount: 4,
  engineersImpacted: 18,
  status: 'pending'
};

export const INITIAL_HISTORY: FeedbackHistoryItem[] = [
  {
    id: 'hist-1',
    question: 'What is the retry policy for Payment Webhooks?',
    ticketRef: 'API-Core #319',
    aiAnswerBefore: '“3 retries at 5s intervals”',
    expertName: 'Sarah Chen',
    expertRole: 'Staff Eng',
    expertInitials: 'SC',
    validatedCorrection: '“Exponential backoff up to 5 attempts (Max 60s)”',
    sourceSyncNote: 'Synced with Stripe webhook handler v2.4',
    status: 'Approved',
    date: 'Today, 10:14 AM',
    category: 'API'
  },
  {
    id: 'hist-2',
    question: 'Which team handles Kafka partition rebalancing?',
    ticketRef: 'INFRA #804',
    aiAnswerBefore: '“Infrastructure team”',
    expertName: 'David Kim',
    expertRole: 'Lead SRE',
    expertInitials: 'DK',
    validatedCorrection: '“Data Platform SRE Guild”',
    sourceSyncNote: 'Team charter updated in Notion',
    status: 'Approved',
    date: 'Yesterday, 4:32 PM',
    category: 'SecOps'
  },
  {
    id: 'hist-3',
    question: 'Where is the staging DB credentials stored?',
    ticketRef: 'SEC #112',
    aiAnswerBefore: '“In Doppler staging”',
    expertName: 'Marcus Vance',
    expertRole: 'SecOps Dir',
    expertInitials: 'MV',
    validatedCorrection: '“In HashiCorp Vault under secret/phoenix/staging”',
    sourceSyncNote: 'Vault secret audit certified',
    status: 'Approved',
    date: '3 days ago',
    category: 'SecOps'
  },
  {
    id: 'hist-4',
    question: 'What is the maximum token context window for Hindsight RAG?',
    ticketRef: 'RAG-Core #052',
    aiAnswerBefore: '“2048 tokens standard”',
    expertName: 'Dr. Elena Rostova',
    expertRole: 'Lead Data Architect',
    expertInitials: 'ER',
    validatedCorrection: '“512 tokens with 64 token overlap stride for dense embeddings”',
    sourceSyncNote: 'Updated in hindsight_rag.py configuration',
    status: 'Approved',
    date: '5 days ago',
    category: 'Architecture'
  }
];

export const INITIAL_TELEMETRY: TelemetryLogEvent[] = [
  {
    id: 'tel-1',
    timestamp: '14:32:08.412',
    method: 'POST',
    endpoint: '/api/chat',
    sourcePipeline: 'chat.py → hindsight_rag.py',
    latencyMs: 312,
    latencyBreakdown: 'RAG: 82ms · Groq: 230ms',
    statusCode: 200,
    statusText: '200 OK',
    signal: '0.96 sim · 542 tokens',
    detailPayload: {
      query: 'Why did Project Phoenix choose PostgreSQL?',
      sources: ['ADR-042', 'ENG-STD-12', 'PRD-REV-09'],
      model: 'llama-3.3-70b-versatile',
      cosineGrounding: 0.964
    }
  },
  {
    id: 'tel-2',
    timestamp: '14:32:05.118',
    method: 'POST',
    endpoint: '/api/documents/upload',
    sourcePipeline: 'documents.py → pgvector',
    latencyMs: 184,
    latencyBreakdown: 'Chunking: 24ms · Embed: 160ms',
    statusCode: 201,
    statusText: '201 Created',
    signal: '14 chunks · 1,536 dim',
    detailPayload: {
      filename: 'Phoenix_Database_Migration_Plan_v2.pdf',
      filesize: '6.4 MB',
      chunksCreated: 14,
      vectorDim: 768
    }
  },
  {
    id: 'tel-3',
    timestamp: '14:32:00.004',
    method: 'GET',
    endpoint: '/api/health',
    sourcePipeline: 'health.py → Kubernetes Probe',
    latencyMs: 3.2,
    latencyBreakdown: 'Heartbeat ping',
    statusCode: 200,
    statusText: '200 OK',
    signal: 'All 4 Subsystems Healthy',
    detailPayload: {
      fastapi: 'Healthy (Uvicorn 0.30)',
      hindsightRag: 'Healthy (0.94 avg)',
      groqLLM: 'Healthy (142 tok/s)',
      pgvector: 'Healthy (38,419 vectors)'
    }
  },
  {
    id: 'tel-4',
    timestamp: '14:31:54.890',
    method: 'POST',
    endpoint: '/api/feedback',
    sourcePipeline: 'feedback.py → Reinforcement Store',
    latencyMs: 14,
    latencyBreakdown: 'Vector weight re-ranked',
    statusCode: 200,
    statusText: '200 OK',
    signal: 'Rating: +1 (Verified Grounded)',
    detailPayload: {
      ticketId: 'KB-4921',
      verdict: 'Approved',
      author: 'Alex Morgan'
    }
  },
  {
    id: 'tel-5',
    timestamp: '14:31:49.201',
    method: 'POST',
    endpoint: '/api/chat',
    sourcePipeline: 'chat.py → hindsight_rag.py',
    latencyMs: 278,
    latencyBreakdown: 'RAG: 79ms · Groq: 199ms',
    statusCode: 200,
    statusText: '200 OK',
    signal: '0.93 sim · 412 tokens',
    detailPayload: {
      query: 'What is the current status of Project Phoenix?',
      sources: ['PRJ-PHX-M3', 'ENG-ROADMAP-2024'],
      model: 'llama-3.3-70b-versatile',
      cosineGrounding: 0.931
    }
  }
];
