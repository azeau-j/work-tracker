#!/usr/bin/env node
import { Command } from 'commander';
import { registerCommands } from "./adapters/inbound/cli/registerCommands.js";
import { FileSystemTimeEntryRepository } from './adapters/outbound/FileSystemTimeEntryRepository.js';
import { FileSystemProjectRepository } from './adapters/outbound/FileSystemProjectRepository.js';
import { StartTimer } from './domain/usecases/StartTimer.js';
import { StopTimer } from './domain/usecases/StopTimer.js';
import { LogTime } from './domain/usecases/LogTime.js';
import { GetReport } from './domain/usecases/GetReport.js';
import { ListProjects } from './domain/usecases/ListProjects.js';
import path from 'node:path';
import os from 'node:os';

const program = new Command();

program
  .name('work')
  .description('CLI pour simplifier noter vos heures de travail')
  .version('1.0.0');

const storageDir = path.join(os.homedir(), '.work');
const timeRepo = new FileSystemTimeEntryRepository(storageDir);
const projectRepo = new FileSystemProjectRepository(storageDir);

const deps = {
  startTimer: new StartTimer(timeRepo, projectRepo),
  stopTimer: new StopTimer(timeRepo),
  logTime: new LogTime(timeRepo, projectRepo),
  getReport: new GetReport(timeRepo),
  listProjects: new ListProjects(projectRepo),
  storageDir,
};

registerCommands(program, deps);

if (process.argv.length === 2) {
  program.help();
} else {
  program.parse();
}
