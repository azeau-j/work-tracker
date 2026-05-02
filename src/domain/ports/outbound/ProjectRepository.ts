export interface ProjectRepository {
  getProjects(): Promise<string[]>;
  addProject(project: string): Promise<void>;
}
