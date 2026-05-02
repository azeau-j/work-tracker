import { createHttpServer } from './adapters/inbound/rest/HttpServer.js';
import { FileSystemTimeEntryRepository } from './adapters/outbound/FileSystemTimeEntryRepository.js';
import { FileSystemProjectRepository } from './adapters/outbound/FileSystemProjectRepository.js';
import { ListProjects } from './domain/usecases/ListProjects.js';
import { GetReport } from './domain/usecases/GetReport.js';
import path from 'node:path';
import os from 'node:os';

const storageDir = path.join(os.homedir(), '.work');
const timeRepo = new FileSystemTimeEntryRepository(storageDir);
const projectRepo = new FileSystemProjectRepository(storageDir);

const deps = {
  listProjects: new ListProjects(projectRepo),
  getReport: new GetReport(timeRepo),
};

const server = createHttpServer(deps);
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
  console.log(`📂 Storage directory: ${storageDir}`);
});
