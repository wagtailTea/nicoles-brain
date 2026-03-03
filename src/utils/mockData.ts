import type { RoadmapItem } from '../types';
import { assignColors } from './colors';

const raw: Omit<RoadmapItem, 'id' | 'color' | 'originalIndex' | 'deadline' | 'deadlineNotes' | 'startDate' | 'dependsOn'>[] = [
  { title: 'User Authentication Overhaul', issueKey: 'ROAD-101', labels: ['security', 'core'], description: 'Migrate to OAuth 2.0 + MFA across all services.', group: 'Now', estimate: 4, estimateTotal: 6, type: 'Standard' },
  { title: 'Payment Gateway v3 Integration', issueKey: 'ROAD-102', labels: ['payments', 'integration'], description: 'Integrate Stripe v3 API with webhook support.', group: 'Now', estimate: 2, estimateTotal: 4, type: 'Integration' },
  { title: 'Dashboard Performance', issueKey: 'ROAD-103', labels: ['performance'], description: 'Reduce dashboard load time to under 2s.', group: 'Now', estimate: 3, estimateTotal: 3, type: 'Standard' },
  { title: 'Mobile Push Notifications', issueKey: 'ROAD-104', labels: ['mobile', 'engagement'], description: 'Implement push notification service for iOS/Android.', group: 'Now', estimate: 5, estimateTotal: 5, type: 'Standard' },
  { title: 'CRM Sync', issueKey: 'ROAD-105', labels: ['integration', 'crm'], description: 'Bi-directional sync with Salesforce.', group: 'Now', estimate: 1, estimateTotal: 4, type: 'Integration' },
  { title: 'Reporting Module v2', issueKey: 'ROAD-106', labels: ['reporting'], description: 'Rebuild reporting with custom date ranges and exports.', group: 'Now', estimate: 5, estimateTotal: 5, type: 'Standard' },
  { title: 'API Rate Limiting', issueKey: 'ROAD-107', labels: ['api', 'security'], description: 'Implement tiered rate limiting per API key.', group: 'Now', estimate: 2, estimateTotal: 2, type: 'Standard' },
  { title: 'Slack Integration', issueKey: 'ROAD-108', labels: ['integration', 'notifications'], description: 'Post status updates and alerts to Slack channels.', group: 'Now', estimate: 1, estimateTotal: 3, type: 'Integration' },
  { title: 'Legacy API Migration', issueKey: 'ROAD-109', labels: ['migration'], description: 'Migrate legacy API consumers to new gateway.', group: 'WIP-migration', estimate: 6, estimateTotal: 8, type: 'Standard' },
  { title: 'Search Improvements', issueKey: 'ROAD-201', labels: ['search', 'ux'], description: 'Implement fuzzy search and filters.', group: 'Next', estimate: null, estimateTotal: null, type: 'Standard' },
  { title: 'Dark Mode', issueKey: 'ROAD-202', labels: ['ux', 'design'], description: 'System-wide dark mode with user preference persistence.', group: 'Next', estimate: null, estimateTotal: null, type: 'Standard' },
  { title: 'Data Export API', issueKey: 'ROAD-203', labels: ['api'], description: 'REST and GraphQL endpoints for bulk data export.', group: 'Next', estimate: null, estimateTotal: null, type: 'Integration' },
  { title: 'Tech Debt Triage', issueKey: 'ROAD-204', labels: ['tech-debt'], description: 'Ongoing triage and small fixes.', group: 'Next', estimate: null, estimateTotal: null, type: 'Slow Burners' },
  { title: 'Documentation Updates', issueKey: 'ROAD-401', labels: ['docs'], description: 'Keep internal docs and runbooks up to date.', group: 'Ongoing', estimate: null, estimateTotal: null, type: 'Ongoing' },
  { title: 'AI Insights Module', issueKey: 'ROAD-301', labels: ['ai', 'experimental'], description: 'ML-powered insights on user behaviour.', group: 'Later', estimate: null, estimateTotal: null, type: 'Standard' },
  { title: 'Multi-tenancy Support', issueKey: 'ROAD-302', labels: ['architecture'], description: 'Enable multi-tenant data isolation.', group: 'Later', estimate: null, estimateTotal: null, type: 'Standard' },
  { title: 'Analytics Pipeline v2', issueKey: 'ROAD-110', labels: ['analytics', 'scenario'], description: 'Rebuild analytics pipeline with real-time streaming.', group: 'Scenario 1', estimate: 4, estimateTotal: 4, type: 'Standard' },
  { title: 'Partner API Gateway', issueKey: 'ROAD-111', labels: ['api', 'partners', 'scenario'], description: 'Dedicated API gateway for partner integrations.', group: 'Scenario 1', estimate: 3, estimateTotal: 3, type: 'Integration' },
  { title: 'White-label Theming', issueKey: 'ROAD-112', labels: ['design', 'scenario'], description: 'Configurable theming engine for white-label clients.', group: 'Scenario 2', estimate: 5, estimateTotal: 5, type: 'Standard' },
  { title: 'SSO Provider Support', issueKey: 'ROAD-113', labels: ['security', 'scenario'], description: 'Support SAML and OIDC SSO providers.', group: 'Scenario 2', estimate: 3, estimateTotal: 3, type: 'Integration' },
];

export function getMockData(): RoadmapItem[] {
  const items: RoadmapItem[] = raw.map((r, i) => ({
    ...r,
    id: `mock-${i}`,
    originalIndex: i,
    color: '',
    deadline: null,
    deadlineNotes: null,
    startDate: null,
    dependsOn: [],
  }));
  const colorMap = assignColors(items);
  items.forEach(item => { item.color = colorMap[item.id]; });
  return items;
}
