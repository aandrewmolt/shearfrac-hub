import { Contact } from '../types';

export interface ContactNode {
  id: string;
  name: string;
  company: string;
  job: string;
  type: string;
  title?: string;
  crew?: string;
  email?: string;
  phone?: string;
  connectionCount: number;
  centralityScore: number;
}

export interface ContactRelationship {
  id: string;
  source: string;
  target: string;
  strength: number;
  type: RelationshipType;
  details: string[];
  sharedAttributes: string[];
}

export type RelationshipType = 
  | 'same-company-job' 
  | 'same-company' 
  | 'same-crew' 
  | 'same-job-different-company'
  | 'same-title'
  | 'potential-collaboration';

export interface NetworkData {
  nodes: ContactNode[];
  relationships: ContactRelationship[];
  clusters: ContactCluster[];
  metrics: NetworkMetrics;
}

export interface ContactCluster {
  id: string;
  name: string;
  type: 'company' | 'job' | 'crew' | 'project-team';
  contacts: string[];
  color: string;
  strength: number;
}

export interface NetworkMetrics {
  totalContacts: number;
  totalRelationships: number;
  averageConnections: number;
  networkDensity: number;
  largestCluster: number;
  isolatedContacts: number;
  companyClusters: number;
  jobClusters: number;
}

export function analyzeContactRelationships(contacts: Contact[]): NetworkData {
  const nodes = createContactNodes(contacts);
  const relationships = findRelationships(contacts);
  const clusters = identifyClusters(contacts, relationships);
  const metrics = calculateNetworkMetrics(nodes, relationships, clusters);

  return {
    nodes,
    relationships,
    clusters,
    metrics
  };
}

function createContactNodes(contacts: Contact[]): ContactNode[] {
  return contacts.map(contact => ({
    id: contact.id,
    name: contact.name,
    company: contact.company,
    job: contact.job,
    type: contact.type,
    title: 'title' in contact ? contact.title : undefined,
    crew: 'crew' in contact ? contact.crew : undefined,
    email: contact.email,
    phone: contact.phone,
    connectionCount: 0, // Will be calculated later
    centralityScore: 0, // Will be calculated later
  }));
}

function findRelationships(contacts: Contact[]): ContactRelationship[] {
  const relationships: ContactRelationship[] = [];
  const relationshipMap = new Map<string, ContactRelationship>();

  for (let i = 0; i < contacts.length; i++) {
    for (let j = i + 1; j < contacts.length; j++) {
      const contact1 = contacts[i];
      const contact2 = contacts[j];
      
      const relationship = analyzeRelationshipBetween(contact1, contact2);
      if (relationship && relationship.strength > 0) {
        const relationshipId = `${contact1.id}-${contact2.id}`;
        relationshipMap.set(relationshipId, relationship);
      }
    }
  }

  return relationshipMap ? Array.from(relationshipMap.values()) : [];
}

function analyzeRelationshipBetween(contact1: Contact, contact2: Contact): ContactRelationship | null {
  const details: string[] = [];
  const sharedAttributes: string[] = [];
  let strength = 0;
  let relationshipType: RelationshipType = 'potential-collaboration';

  // Same company and job (strongest relationship)
  if (contact1.company === contact2.company && contact1.job === contact2.job) {
    strength += 5;
    relationshipType = 'same-company-job';
    details.push(`Both work at ${contact1.company} on ${contact1.job}`);
    sharedAttributes.push('company', 'job');
  }
  // Same company, different job
  else if (contact1.company === contact2.company) {
    strength += 3;
    relationshipType = 'same-company';
    details.push(`Both work at ${contact1.company}`);
    sharedAttributes.push('company');
  }
  // Same job, different company
  else if (contact1.job === contact2.job) {
    strength += 2;
    relationshipType = 'same-job-different-company';
    details.push(`Both work on ${contact1.job} project`);
    sharedAttributes.push('job');
  }

  // Same crew (for frac and custom contacts)
  if ('crew' in contact1 && 'crew' in contact2 && 
      contact1.crew && contact2.crew && contact1.crew === contact2.crew) {
    strength += 4;
    relationshipType = 'same-crew';
    details.push(`Both in ${contact1.crew} crew`);
    sharedAttributes.push('crew');
  }

  // Same title
  if ('title' in contact1 && 'title' in contact2 && 
      contact1.title && contact2.title && contact1.title === contact2.title) {
    strength += 1;
    details.push(`Both have ${contact1.title} role`);
    sharedAttributes.push('title');
  }

  // Same shift
  if (contact1.shift && contact2.shift && contact1.shift === contact2.shift) {
    strength += 1;
    details.push(`Both work ${contact1.shift} shift`);
    sharedAttributes.push('shift');
  }

  // Contact type similarity
  const type1 = contact1.type === 'custom' ? contact1.customType : contact1.type;
  const type2 = contact2.type === 'custom' ? contact2.customType : contact2.type;
  if (type1 === type2) {
    strength += 0.5;
    details.push(`Both are ${type1} contacts`);
    sharedAttributes.push('type');
  }

  if (strength === 0) return null;

  return {
    id: `${contact1.id}-${contact2.id}`,
    source: contact1.id,
    target: contact2.id,
    strength: Math.min(strength, 10), // Cap at 10
    type: relationshipType,
    details,
    sharedAttributes,
  };
}

function identifyClusters(contacts: Contact[], relationships: ContactRelationship[]): ContactCluster[] {
  const clusters: ContactCluster[] = [];
  
  // Company clusters
  const companyGroups = new Map<string, Contact[]>();
  contacts.forEach(contact => {
    if (!companyGroups.has(contact.company)) {
      companyGroups.set(contact.company, []);
    }
    companyGroups.get(contact.company)!.push(contact);
  });

  companyGroups.forEach((groupContacts, company) => {
    if (groupContacts.length > 1) {
      clusters.push({
        id: `company-${company}`,
        name: company,
        type: 'company',
        contacts: groupContacts.map(c => c.id),
        color: getCompanyColor(company),
        strength: groupContacts.length,
      });
    }
  });

  // Job clusters (cross-company)
  const jobGroups = new Map<string, Contact[]>();
  contacts.forEach(contact => {
    if (!jobGroups.has(contact.job)) {
      jobGroups.set(contact.job, []);
    }
    jobGroups.get(contact.job)!.push(contact);
  });

  jobGroups.forEach((groupContacts, job) => {
    if (groupContacts.length > 1) {
      const companies = [...new Set(groupContacts.map(c => c.company))];
      if (companies.length > 1) { // Cross-company job
        clusters.push({
          id: `job-${job}`,
          name: `${job} Project Team`,
          type: 'job',
          contacts: groupContacts.map(c => c.id),
          color: getJobColor(job),
          strength: groupContacts.length,
        });
      }
    }
  });

  // Crew clusters
  const crewGroups = new Map<string, Contact[]>();
  contacts.forEach(contact => {
    if ('crew' in contact && contact.crew) {
      const crewKey = `${contact.company}-${contact.crew}`;
      if (!crewGroups.has(crewKey)) {
        crewGroups.set(crewKey, []);
      }
      crewGroups.get(crewKey)!.push(contact);
    }
  });

  crewGroups.forEach((groupContacts, crewKey) => {
    if (groupContacts.length > 1) {
      const [company, crew] = crewKey.split('-');
      clusters.push({
        id: `crew-${crewKey}`,
        name: `${company} - ${crew} Crew`,
        type: 'crew',
        contacts: groupContacts.map(c => c.id),
        color: getCrewColor(crew),
        strength: groupContacts.length,
      });
    }
  });

  return clusters;
}

function calculateNetworkMetrics(
  nodes: ContactNode[], 
  relationships: ContactRelationship[], 
  clusters: ContactCluster[]
): NetworkMetrics {
  // Calculate connection counts for each node
  const connectionCounts = new Map<string, number>();
  nodes.forEach(node => connectionCounts.set(node.id, 0));

  relationships.forEach(rel => {
    connectionCounts.set(rel.source, (connectionCounts.get(rel.source) || 0) + 1);
    connectionCounts.set(rel.target, (connectionCounts.get(rel.target) || 0) + 1);
  });

  // Update nodes with connection counts and centrality scores
  nodes.forEach(node => {
    node.connectionCount = connectionCounts.get(node.id) || 0;
    // Simple centrality score based on connections and relationship strengths
    const nodeRelationships = relationships.filter(r => r.source === node.id || r.target === node.id);
    node.centralityScore = nodeRelationships.reduce((sum, rel) => sum + rel.strength, 0);
  });

  const totalConnections = connectionCounts ? Array.from(connectionCounts.values()).reduce((sum, count) => sum + count, 0) : 0;
  const maxPossibleConnections = nodes.length * (nodes.length - 1);
  const isolatedContacts = nodes.filter(node => node.connectionCount === 0).length;

  return {
    totalContacts: nodes.length,
    totalRelationships: relationships.length,
    averageConnections: nodes.length > 0 ? totalConnections / (2 * nodes.length) : 0,
    networkDensity: maxPossibleConnections > 0 ? (2 * relationships.length) / maxPossibleConnections : 0,
    largestCluster: Math.max(...clusters.map(c => c.contacts.length), 0),
    isolatedContacts,
    companyClusters: clusters.filter(c => c.type === 'company').length,
    jobClusters: clusters.filter(c => c.type === 'job').length,
  };
}

function getCompanyColor(company: string): string {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];
  const hash = company.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function getJobColor(job: string): string {
  const colors = [
    '#1F2937', '#374151', '#4B5563', '#6B7280', '#9CA3AF',
    '#D1D5DB', '#E5E7EB', '#F3F4F6', '#F9FAFB', '#FFFFFF'
  ];
  const hash = job.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function getCrewColor(crew: string): string {
  const colors = [
    '#FEE2E2', '#FECACA', '#FCA5A5', '#F87171', '#EF4444',
    '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D', '#6B1D1D'
  ];
  const hash = crew.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function findContactPath(
  fromContactId: string, 
  toContactId: string, 
  relationships: ContactRelationship[]
): ContactRelationship[] {
  // Simple breadth-first search to find the shortest path between two contacts
  const visited = new Set<string>();
  const queue: { contactId: string; path: ContactRelationship[] }[] = [
    { contactId: fromContactId, path: [] }
  ];

  while (queue.length > 0) {
    const { contactId, path } = queue.shift()!;

    if (contactId === toContactId) {
      return path;
    }

    if (visited.has(contactId)) continue;
    visited.add(contactId);

    const connectedRelationships = relationships.filter(
      rel => rel.source === contactId || rel.target === contactId
    );

    for (const rel of connectedRelationships) {
      const nextContactId = rel.source === contactId ? rel.target : rel.source;
      if (!visited.has(nextContactId)) {
        queue.push({
          contactId: nextContactId,
          path: [...path, rel]
        });
      }
    }
  }

  return []; // No path found
}

export function getContactInfluencers(
  contactId: string,
  nodes: ContactNode[],
  relationships: ContactRelationship[]
): ContactNode[] {
  // Find contacts who have strong relationships with the given contact
  const contactRelationships = relationships.filter(
    rel => (rel.source === contactId || rel.target === contactId) && rel.strength >= 3
  );

  const influencerIds = contactRelationships.map(rel => 
    rel.source === contactId ? rel.target : rel.source
  );

  return nodes
    .filter(node => influencerIds.includes(node.id))
    .sort((a, b) => b.centralityScore - a.centralityScore);
}