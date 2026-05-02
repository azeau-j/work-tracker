import { TimeEntryRepository } from '@app/domain/ports/outbound/TimeEntryRepository.js';
import { ProjectRepository } from '@app/domain/ports/outbound/ProjectRepository.js';
import dayjs from 'dayjs';

export class LogTime {
  constructor(
    private readonly timeEntryRepo: TimeEntryRepository,
    private readonly projectRepo: ProjectRepository
  ) {}

  async execute(params: {
    project: string;
    durationMinutes: number;
    comment?: string;
    endTime?: Date;
  }): Promise<void> {
    await this.projectRepo.addProject(params.project);

    const end = params.endTime ?? new Date();
    const start = this.calculateStartDate(end, params.durationMinutes);

    await this.timeEntryRepo.addEntry({
      project: params.project,
      start,
      end,
      comment: params.comment?.trim() || undefined,
    });
  }

  private calculateStartDate(endDate: Date, durationMinutes: number): Date {
    return dayjs(endDate).subtract(durationMinutes, 'minute').toDate();
  }
}
