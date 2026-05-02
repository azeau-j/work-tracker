import { describe, it, expect, vi } from 'vitest';
import { ListProjects } from './ListProjects.js';
import { ProjectRepository } from '@app/domain/ports/outbound/ProjectRepository.js';

describe('ListProjects Use Case', () => {
  it('should return the list of projects from the repository', async () => {
    // Arrange
    const mockProjects = ['Project A', 'Project B'];
    const mockProjectRepo: ProjectRepository = {
      getProjects: vi.fn().mockResolvedValue(mockProjects),
      addProject: vi.fn(),
    };
    const usecase = new ListProjects(mockProjectRepo);

    // Act
    const result = await usecase.execute();

    // Assert
    expect(mockProjectRepo.getProjects).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockProjects);
  });
});
