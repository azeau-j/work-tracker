import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHttpServer, ServerDependencies } from './HttpServer.js';
import { ListProjects } from '@app/domain/usecases/ListProjects.js';
import { GetReport } from '@app/domain/usecases/GetReport.js';
import { IncomingMessage, ServerResponse } from 'node:http';

describe('HttpServer Inbound Adapter', () => {
  let deps: ServerDependencies;
  let server: any;

  beforeEach(() => {
    deps = {
      listProjects: {
        execute: vi.fn(),
      } as unknown as ListProjects,
      getReport: {
        execute: vi.fn(),
      } as unknown as GetReport,
    };
    server = createHttpServer(deps);
  });

  const createMocks = (url: string, method = 'GET') => {
    const req = {
      url,
      method,
      headers: { host: 'localhost' },
    } as unknown as IncomingMessage;

    const res = {
      writeHead: vi.fn(),
      end: vi.fn(),
    } as unknown as ServerResponse;

    return { req, res };
  };

  it('should return 200 and projects for GET /projects', async () => {
    // Arrange
    const { req, res } = createMocks('/projects');
    const mockProjects = ['Project A', 'Project B'];
    (deps.listProjects.execute as any).mockResolvedValue(mockProjects);

    // Act
    // @ts-ignore - access internal listener for testing without listening on port
    const handler = server._events.request;
    await handler(req, res);

    // Assert
    expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });
    expect(res.end).toHaveBeenCalledWith(JSON.stringify(mockProjects));
  });

  it('should return 200 and report for GET /report', async () => {
    // Arrange
    const { req, res } = createMocks('/report?period=today');
    const mockReport = {
      totalMinutes: 120,
      projectDurations: new Map([['Project A', 120]]),
      filteredEntries: [],
    };
    (deps.getReport.execute as any).mockResolvedValue(mockReport);

    // Act
    const handler = server._events.request;
    await handler(req, res);

    // Assert
    expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });
    const expectedResponse = JSON.stringify({
      totalMinutes: 120,
      projectDurations: { 'Project A': 120 },
      entries: [],
    });
    expect(res.end).toHaveBeenCalledWith(expectedResponse);
  });

  it('should return 404 for unknown routes', async () => {
    // Arrange
    const { req, res } = createMocks('/unknown');

    // Act
    const handler = server._events.request;
    await handler(req, res);

    // Assert
    expect(res.writeHead).toHaveBeenCalledWith(404, { 'Content-Type': 'application/json' });
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ error: 'Not Found' }));
  });
});
