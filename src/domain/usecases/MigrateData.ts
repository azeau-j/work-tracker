import { ProjectRepository } from '../ports/outbound/ProjectRepository.js';
import { TimeEntryRepository } from '../ports/outbound/TimeEntryRepository.js';

export interface MigrationSource {
  projectRepo: ProjectRepository;
  timeRepo: TimeEntryRepository;
}

export interface MigrationDestination {
  projectRepo: ProjectRepository;
  timeRepo: TimeEntryRepository;
}

export class MigrateData {
  async execute(source: MigrationSource, destination: MigrationDestination): Promise<void> {
    const projects = await source.projectRepo.getProjects();
    for (const project of projects) {
      await destination.projectRepo.addProject(project);
    }

    const entries = await source.timeRepo.getEntries();
    await destination.timeRepo.updateEntries(entries);
  }
}
