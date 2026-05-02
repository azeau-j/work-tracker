import { ProjectRepository } from '@app/domain/ports/outbound/ProjectRepository.js';

export class ListProjects {
  constructor(private readonly projectRepo: ProjectRepository) {}

  async execute(): Promise<string[]> {
    return this.projectRepo.getProjects();
  }
}
