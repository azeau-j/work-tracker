import fs from 'node:fs/promises';
import path from 'node:path';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { TimeEntryRepository } from '@app/domain/ports/outbound/TimeEntryRepository.js';
import { TimeEntry } from '@app/domain/entities/TimeEntry.js';

dayjs.extend(customParseFormat);

const DATE_FORMAT = 'YYYY-MM-DD_HH:mm';

export class FileSystemTimeEntryRepository implements TimeEntryRepository {
  private readonly logsPath: string;

  constructor(private readonly basePath: string) {
    this.logsPath = path.join(this.basePath, 'logs.txt');
  }

  private async ensureBaseDirectoryExist() {
    await fs.mkdir(this.basePath, { recursive: true });
  }

  private formatEntry(entry: TimeEntry): string {
    const startTime = dayjs(entry.start).format(DATE_FORMAT);
    const endTime = entry.end ? dayjs(entry.end).format(DATE_FORMAT) : '';

    const timeLine = `[${startTime}@${endTime}]`;
    const projectAndCommentLine = `${entry.project}: ${entry.comment ?? ''}`;

    return `${timeLine}\n${projectAndCommentLine}\n`;
  }

  async addEntry(entry: TimeEntry): Promise<void> {
    await this.ensureBaseDirectoryExist();
    await fs.appendFile(this.logsPath, this.formatEntry(entry));
  }

  private parseEntryLines(timeLine: string, projectLine: string): TimeEntry | null {
    const timeMatch = new RegExp(/\[([\d\-_:]+)@([\d\-_:]*)]/).exec(timeLine);
    if (timeMatch == null) {
      return null;
    }

    const [, startStr, endStr] = timeMatch;
    const startDayjs = dayjs(startStr, DATE_FORMAT);
    if (!startDayjs.isValid()) {
      return null;
    }

    const projectMatch = new RegExp(/^(.*?): (.*)$/).exec(projectLine);
    
    let project = projectLine;
    let comment = '';
    
    if (projectMatch) {
      project = projectMatch[1];
      comment = projectMatch[2];
    }

    const endTime = endStr ? dayjs(endStr, DATE_FORMAT) : null;
    if (endTime != null && !endTime.isValid()) {
      return null;
    }

    return {
      project,
      start: startDayjs.toDate(),
      end: endTime ? endTime.toDate() : undefined,
      comment: comment || undefined,
    };
  }

  async getEntries(): Promise<TimeEntry[]> {
    try {
      const content = await fs.readFile(this.logsPath, 'utf-8');
      const lines = content.split('\n').filter((line) => line.trim() !== '');
      const entries: TimeEntry[] = [];

      for (let i = 0; i < lines.length; i += 2) {
        const timeLine = lines[i];
        const projectLine = lines[i + 1];

        if (!timeLine || !projectLine) break;

        const entry = this.parseEntryLines(timeLine, projectLine);
        if (entry) {
          entries.push(entry);
        }
      }

      return entries;
    } catch (error: any) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }

  async updateEntries(entries: TimeEntry[]): Promise<void> {
    await this.ensureBaseDirectoryExist();
    const content = entries.map((entry) => this.formatEntry(entry)).join('');
    await fs.writeFile(this.logsPath, content);
  }
}
