
export type SecurityLevel = 'L1' | 'L2' | 'L3' | 'L4';

export interface OrgNode {
  id: string;
  name: string;
  type: 'Tech Park' | 'Block' | 'Building' | 'Company' | 'Gate';
  children?: OrgNode[];
  admin?: string;
  tier?: SecurityLevel;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  nodeName: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  status: 'success' | 'denied' | 'flagged';
  location: string;
}

export interface PlanTier {
  id: SecurityLevel;
  name: string;
  description: string;
  maxGuards: number;
  maxVisitorPasses: number;
  features: string[];
}
