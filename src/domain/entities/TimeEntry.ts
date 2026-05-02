export interface TimeEntry {
  project: string;
  start: Date;
  end?: Date;
  comment?: string;
}
