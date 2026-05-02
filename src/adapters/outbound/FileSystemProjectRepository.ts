import fs from 'node:fs/promises';
import path from 'node:path';
import { ProjectRepository } from '@app/domain/ports/outbound/ProjectRepository.js';

export class FileSystemProjectRepository implements ProjectRepository {
  private readonly projectsPath: string;

  constructor(private readonly basePath: string) {
    this.projectsPath = path.join(this.basePath, 'projects.txt');
  }

  private async ensureBaseDirectoryExist() {
    await fs.mkdir(this.basePath, { recursive: true });
  }

  async getProjects(): Promise<string[]> {
    try {
      const content = await fs.readFile(this.projectsPath, 'utf-8');
      return content.split('\n').filter((p) => p.trim() !== '');
    } catch (error: any) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }

  async addProject(project: string): Promise<void> {
    await this.ensureBaseDirectoryExist();
    const projects = await this.getProjects();
    if (!projects.includes(project)) {
      await fs.appendFile(this.projectsPath, `${project}\n`);
    }
  }
}
