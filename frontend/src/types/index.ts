export type NavigationPath = 
  | 'brain'
  | 'ask'
  | 'knowledge'
  | 'projects'
  | 'decisions'
  | 'experts'
  | 'feedback'
  | 'system-health'
  | 'ingest'
  | 'architecture';

export interface KnowledgeItem {
  id: string;
  type: 'Decision' | 'Process & SOP' | 'Technical Spec' | 'Policy' | 'Lessons Learned';
  title: string;
  description: string;
  project: string;
  authority: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  updatedAt: string;
  tag: string;
  verified: boolean;
  projectId?: string | null;
  department?: string;
  source?: string;
  sourceReference?: string;
  status?: string;
  bookmarked?: boolean;
  stats?: {
    diagrams?: number;
    nodes?: number;
    compliance?: string;
  };
}

export interface ProjectItem {
  id: string;
  code: string;
  name: string;
  description: string;
  lead: string;
  leadAvatar: string;
  status: string;
  department: string;
  tier?: 'Tier-1 Core' | 'Tier-2 Critical' | 'Standard';
  documentsCount: number;
  decisionsCount: number;
  lastUpdated: string;
}

export interface DecisionRecord {
  id: string;
  adrNumber: string;
  title: string;
  status: 'Approved' | 'In Review' | 'Superseded' | 'Proposed';
  summary: string;
  fullRationale?: string;
  project: string;
  date: string;
  ratifiedBy: string;
  author: string;
  commentsCount?: number;
}

export interface ExpertItem {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  contributions: number;
  accuracy: string;
  isPrimary?: boolean;
  isDomainLead?: boolean;
  specialty: string[];
}

export interface FeedbackTicket {
  id: string;
  ticketNumber: string;
  timeAgo: string;
  prompt: string;
  aiOutput: string;
  aiStatus: string;
  aiSource: string;
  proposedCorrection: string;
  verifiedBy: string;
  canonicalSource: string;
  expert: {
    name: string;
    role: string;
    avatar: string;
  };
  citations: Array<{
    title: string;
    page: string;
    link?: string;
  }>;
  embeddingsCount: number;
  engineersImpacted: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface FeedbackHistoryItem {
  id: string;
  question: string;
  ticketRef: string;
  aiAnswerBefore: string;
  expertName: string;
  expertRole: string;
  expertInitials: string;
  validatedCorrection: string;
  sourceSyncNote: string;
  status: 'Approved' | 'Under Review';
  date: string;
  category: 'Architecture' | 'SecOps' | 'API' | 'Data';
}

export interface TelemetryLogEvent {
  id: string;
  timestamp: string;
  method: 'POST' | 'GET';
  endpoint: string;
  sourcePipeline: string;
  latencyMs: number;
  latencyBreakdown?: string;
  statusCode: number;
  statusText: string;
  signal: string;
  detailPayload?: Record<string, any>;
}
