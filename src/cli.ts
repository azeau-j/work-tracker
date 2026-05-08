#!/usr/bin/env node
import { Command } from 'commander';
import { registerCommands } from "./adapters/inbound/cli/registerCommands.js";
import { FileSystemTimeEntryRepository } from './adapters/outbound/fs/FileSystemTimeEntryRepository.js';
import { FileSystemProjectRepository } from './adapters/outbound/fs/FileSystemProjectRepository.js';
import { SqliteDatabase } from './adapters/outbound/sqlite/SqliteDatabase.js';
import { SqliteProjectRepository } from './adapters/outbound/sqlite/SqliteProjectRepository.js';
import { SqliteTimeEntryRepository } from './adapters/outbound/sqlite/SqliteTimeEntryRepository.js';
import { StartTimer } from './domain/usecases/StartTimer.js';
import { StopTimer } from './domain/usecases/StopTimer.js';
import { LogTime } from './domain/usecases/LogTime.js';
import { GetReport } from './domain/usecases/GetReport.js';
import { ListProjects } from './domain/usecases/ListProjects.js';
import { MigrateData } from './domain/usecases/MigrateData.js';
import { TimeEntryRepository } from './domain/ports/outbound/TimeEntryRepository.js';
import { ProjectRepository } from './domain/ports/outbound/ProjectRepository.js';
import { StorageRegistry } from './adapters/outbound/StorageRegistry.js';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import * as toml from '@iarna/toml';

const program = new Command();

program
  .name('work')
  .description('CLI pour simplifier noter vos heures de travail')
  .version('1.0.0');

const storageDir = path.join(os.homedir(), '.work');
const configPath = path.join(storageDir, 'config.toml');

StorageRegistry.register('fs', () => ({
  projectRepo: new FileSystemProjectRepository(storageDir),
  timeRepo: new FileSystemTimeEntryRepository(storageDir)
}));

StorageRegistry.register('sqlite', () => {
  const dbPath = path.join(storageDir, 'work-tracker.db');
  const db = new SqliteDatabase(dbPath);
  return {
    projectRepo: new SqliteProjectRepository(db),
    timeRepo: new SqliteTimeEntryRepository(db)
  };
});

let storageType = 'fs'; 

if (fs.existsSync(configPath)) {
  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const parsedConfig = toml.parse(configContent) as any;
    if (parsedConfig?.storage?.type) {
      storageType = parsedConfig.storage.type;
    }
  } catch (e) {
    console.error('Erreur lors de la lecture du fichier config.toml. Utilisation du stockage par défaut (fs).');
  }
} else {
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  fs.writeFileSync(configPath, '[storage]\ntype = "fs"\n');
}

let timeRepo: TimeEntryRepository;
let projectRepo: ProjectRepository;

try {
  const activeStorage = StorageRegistry.get(storageType);
  projectRepo = activeStorage.projectRepo;
  timeRepo = activeStorage.timeRepo;
} catch (e) {
  console.error(`Système de stockage '${storageType}' inconnu. Retour à 'fs'.`);
  storageType = 'fs';
  const activeStorage = StorageRegistry.get('fs');
  projectRepo = activeStorage.projectRepo;
  timeRepo = activeStorage.timeRepo;
}

const deps = {
  startTimer: new StartTimer(timeRepo, projectRepo),
  stopTimer: new StopTimer(timeRepo),
  logTime: new LogTime(timeRepo, projectRepo),
  getReport: new GetReport(timeRepo),
  listProjects: new ListProjects(projectRepo),
  migrateData: new MigrateData(),
  storageDir,
  storageType,
};

registerCommands(program, deps);

if (process.argv.length === 2) {
  program.help();
} else {
  program.parse();
}
