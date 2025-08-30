import { Contact } from '../types';

export interface DuplicateGroup {
  id: string;
  contacts: Contact[];
  similarity: number;
  reasons: string[];
}

export interface DuplicateMatch {
  contact1: Contact;
  contact2: Contact;
  similarity: number;
  reasons: string[];
}

// Levenshtein distance for string similarity
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const maxLength = Math.max(s1.length, s2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(s1, s2);
  return (maxLength - distance) / maxLength;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function detectDuplicates(contacts: Contact[], threshold: number = 0.8): DuplicateGroup[] {
  const duplicateGroups: DuplicateGroup[] = [];
  const processedContacts = new Set<string>();

  for (let i = 0; i < contacts.length; i++) {
    if (processedContacts.has(contacts[i].id)) continue;

    const currentContact = contacts[i];
    const potentialDuplicates: DuplicateMatch[] = [];

    for (let j = i + 1; j < contacts.length; j++) {
      if (processedContacts.has(contacts[j].id)) continue;

      const otherContact = contacts[j];
      const match = comparContacts(currentContact, otherContact);

      if (match.similarity >= threshold) {
        potentialDuplicates.push(match);
      }
    }

    if (potentialDuplicates.length > 0) {
      const groupContacts = [currentContact, ...potentialDuplicates.map(d => d.contact2)];
      const avgSimilarity = potentialDuplicates.reduce((sum, d) => sum + d.similarity, 0) / potentialDuplicates.length;
      const allReasons = [...new Set(potentialDuplicates.flatMap(d => d.reasons))];

      duplicateGroups.push({
        id: `group-${currentContact.id}`,
        contacts: groupContacts,
        similarity: avgSimilarity,
        reasons: allReasons,
      });

      // Mark all contacts in this group as processed
      groupContacts.forEach(contact => processedContacts.add(contact.id));
    }
  }

  return duplicateGroups.sort((a, b) => b.similarity - a.similarity);
}

export function comparContacts(contact1: Contact, contact2: Contact): DuplicateMatch {
  const reasons: string[] = [];
  let totalSimilarity = 0;
  let checks = 0;

  // Name similarity (high weight)
  const nameSimilarity = stringSimilarity(contact1.name, contact2.name);
  if (nameSimilarity > 0.8) {
    reasons.push(`Similar names (${Math.round(nameSimilarity * 100)}% match)`);
    totalSimilarity += nameSimilarity * 3;
    checks += 3;
  } else {
    totalSimilarity += nameSimilarity;
    checks += 1;
  }

  // Email exact match (very high weight)
  const email1 = contact1.email || '';
  const email2 = contact2.email || '';
  if (email1 && email2) {
    const emailMatch = normalizeEmail(email1) === normalizeEmail(email2);
    if (emailMatch) {
      reasons.push('Same email address');
      totalSimilarity += 5;
    }
    checks += 1;
  }

  // Phone exact match (very high weight)
  const phone1 = contact1.phone || '';
  const phone2 = contact2.phone || '';
  if (phone1 && phone2) {
    const phoneMatch = normalizePhone(phone1) === normalizePhone(phone2);
    if (phoneMatch) {
      reasons.push('Same phone number');
      totalSimilarity += 5;
    }
    checks += 1;
  }

  // Company similarity (medium weight)
  if (contact1.company && contact2.company) {
    const companySimilarity = stringSimilarity(contact1.company, contact2.company);
    if (companySimilarity > 0.9) {
      reasons.push(`Same/similar company (${Math.round(companySimilarity * 100)}% match)`);
      totalSimilarity += companySimilarity * 2;
    } else {
      totalSimilarity += companySimilarity;
    }
    checks += 1;
  }

  // Job similarity (medium weight)
  if (contact1.job && contact2.job) {
    const jobSimilarity = stringSimilarity(contact1.job, contact2.job);
    if (jobSimilarity > 0.9) {
      reasons.push(`Same/similar job (${Math.round(jobSimilarity * 100)}% match)`);
      totalSimilarity += jobSimilarity * 2;
    } else {
      totalSimilarity += jobSimilarity;
    }
    checks += 1;
  }

  // Title similarity (low weight)
  if ('title' in contact1 && 'title' in contact2 && contact1.title && contact2.title) {
    const titleSimilarity = stringSimilarity(contact1.title, contact2.title);
    if (titleSimilarity > 0.8) {
      reasons.push(`Similar titles (${Math.round(titleSimilarity * 100)}% match)`);
    }
    totalSimilarity += titleSimilarity * 0.5;
    checks += 0.5;
  }

  // Crew similarity (for frac and custom contacts)
  if ('crew' in contact1 && 'crew' in contact2 && contact1.crew && contact2.crew) {
    const crewSimilarity = stringSimilarity(contact1.crew, contact2.crew);
    if (crewSimilarity > 0.9) {
      reasons.push(`Same/similar crew (${Math.round(crewSimilarity * 100)}% match)`);
      totalSimilarity += crewSimilarity;
    } else {
      totalSimilarity += crewSimilarity * 0.5;
    }
    checks += 0.5;
  }

  const finalSimilarity = checks > 0 ? totalSimilarity / checks : 0;

  return {
    contact1,
    contact2,
    similarity: Math.min(finalSimilarity, 1),
    reasons,
  };
}

export function suggestMerge(contacts: Contact[]): Contact {
  if (contacts.length === 0) throw new Error('No contacts to merge');
  if (contacts.length === 1) return contacts[0];

  // Use the most recently updated contact as base
  const sortedContacts = [...contacts].sort((a, b) => 
    new Date(b.lastUpdatedDate).getTime() - new Date(a.lastUpdatedDate).getTime()
  );

  const baseContact = sortedContacts[0];
  const mergedContact = { ...baseContact };

  // Merge fields, preferring non-empty values
  contacts.forEach(contact => {
    Object.keys(contact).forEach(key => {
      const contactKey = key as keyof Contact;
      const value = contact[contactKey];
      if (value && !mergedContact[contactKey]) {
        mergedContact[contactKey] = value as never;
      }
    });
  });

  // Merge notes
  const allNotes = contacts
    .map(c => c.notes)
    .filter(Boolean)
    .filter((note, index, arr) => arr.indexOf(note) === index);
  
  if (allNotes.length > 1) {
    mergedContact.notes = allNotes.join('\n---\n');
  } else if (allNotes.length === 1) {
    mergedContact.notes = allNotes[0];
  }

  return mergedContact;
}