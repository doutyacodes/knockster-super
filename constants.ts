
import { OrgNode, Admin, AuditLog, PlanTier } from './types';

export const ORG_TREE: OrgNode = {
  id: '1',
  name: 'Global Tech Heights',
  type: 'Tech Park',
  children: [
    {
      id: '2',
      name: 'Block A',
      type: 'Block',
      children: [
        {
          id: '3',
          name: 'North Building',
          type: 'Building',
          children: [
            {
              id: '4',
              name: 'Innova Solutions',
              type: 'Company',
              admin: 'John Doe',
              tier: 'L3',
              children: [
                { id: '5', name: 'Main Gate', type: 'Gate' },
                { id: '6', name: 'Service Entry', type: 'Gate' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: '7',
      name: 'Block B',
      type: 'Block',
      children: [
        {
          id: '8',
          name: 'South Building',
          type: 'Building',
          children: [
            { id: '9', name: 'CloudPeak Systems', type: 'Company', admin: 'Jane Smith', tier: 'L4' }
          ]
        }
      ]
    }
  ]
};

export const ADMINS: Admin[] = [
  { id: '1', name: 'Alex Johnson', email: 'alex@knockster.io', nodeName: 'Innova Solutions', status: 'active', lastLogin: '2023-11-20 10:45' },
  { id: '2', name: 'Sarah Miller', email: 'sarah@knockster.io', nodeName: 'CloudPeak Systems', status: 'active', lastLogin: '2023-11-20 09:15' },
  { id: '3', name: 'Robert Chen', email: 'robert@knockster.io', nodeName: 'Block B', status: 'inactive', lastLogin: '2023-11-18 16:30' },
  { id: '4', name: 'Elena Rodriguez', email: 'elena@knockster.io', nodeName: 'North Building', status: 'active', lastLogin: '2023-11-20 11:20' },
];

export const AUDIT_LOGS: AuditLog[] = [
  { id: '1', timestamp: '2023-11-20 12:45:01', user: 'Guest_9921', action: 'QR Scan Attempt', status: 'success', location: 'Innova Main Gate' },
  { id: '2', timestamp: '2023-11-20 12:40:55', user: 'Admin_Sarah', action: 'Update Security Tier', status: 'success', location: 'System Console' },
  { id: '3', timestamp: '2023-11-20 12:35:12', user: 'Unknown', action: 'Access Refused - Invalid QR', status: 'denied', location: 'South Building Gate' },
  { id: '4', timestamp: '2023-11-20 12:30:44', user: 'Guard_302', action: 'Manual Override', status: 'flagged', location: 'Service Entry A' },
  { id: '5', timestamp: '2023-11-20 12:25:30', user: 'Guest_8820', action: 'OTP Verification', status: 'success', location: 'CloudPeak Reception' },
];

export const PLAN_TIERS: PlanTier[] = [
  { id: 'L1', name: 'Basic', description: 'Simple QR entry for low-security areas', maxGuards: 5, maxVisitorPasses: 1000, features: ['QR Access', 'Basic Logs'] },
  { id: 'L2', name: 'Verified', description: 'Adds OTP verification for guests', maxGuards: 15, maxVisitorPasses: 5000, features: ['QR Access', 'OTP Verification', 'Extended History'] },
  { id: 'L3', name: 'Secure', description: 'App-based scan + live guard verification', maxGuards: 50, maxVisitorPasses: 20000, features: ['App-based Scan', 'Live Guard Sync', 'Role Management'] },
  { id: 'L4', name: 'Elite', description: 'Multi-factor authentication (App + OTP)', maxGuards: 999, maxVisitorPasses: 1000000, features: ['MFA Verification', 'Full Audit Trail', 'SSO Integration', 'API Access'] },
];
