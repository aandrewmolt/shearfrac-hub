import { Contact } from '../types';

export function getUniqueTitles(contacts: Contact[]): string[] {
  const titles = new Set<string>();
  
  contacts.forEach(contact => {
    if ('title' in contact && contact.title) {
      titles.add(contact.title);
    }
  });
  
  return titles ? Array.from(titles).sort() : [];
}

export function getUniqueCompanies(contacts: Contact[]): string[] {
  const companies = new Set<string>();
  
  contacts.forEach(contact => {
    if (contact.company) {
      companies.add(contact.company);
    }
  });
  
  return companies ? Array.from(companies).sort() : [];
}

export function getUniqueCrews(contacts: Contact[]): string[] {
  const crews = new Set<string>();
  
  contacts.forEach(contact => {
    if ('crew' in contact && contact.crew) {
      crews.add(contact.crew);
    }
  });
  
  return crews ? Array.from(crews).sort() : [];
}

export function getUniqueJobs(contacts: Contact[]): string[] {
  const jobs = new Set<string>();
  
  contacts.forEach(contact => {
    if (contact.job) {
      jobs.add(contact.job);
    }
  });
  
  return jobs ? Array.from(jobs) : [];
}

export function getJobsByCompany(contacts: Contact[], company: string): string[] {
  const jobs = new Set<string>();
  
  contacts
    .filter(contact => contact.company === company)
    .forEach(contact => {
      if (contact.job) {
        jobs.add(contact.job);
      }
    });
  
  return jobs ? Array.from(jobs) : [];
}