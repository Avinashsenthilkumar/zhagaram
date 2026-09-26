export interface SiteConfig {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  locale: string;
  url: string;
}

export interface ContactPlaceholder {
  label: string;
  value: string;
  note: string;
}

export interface CompanyCopy {
  intro: string;
  sourcingLead: string;
  sourcing: string[];
  prioritiesLead: string;
  priorities: string[];
  aim: string;
  vision: string;
  mission: string;
}
