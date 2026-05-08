import * as prompts from "@clack/prompts";
import { Command } from "commander";
import { startCommand, stopCommand, logCommand } from './track.js';
import { reportCommand } from './report.js';
import { migrateCommand } from './migrate.js';
import { StartTimer } from '@app/domain/usecases/StartTimer.js';
import { StopTimer } from '@app/domain/usecases/StopTimer.js';
import { LogTime } from '@app/domain/usecases/LogTime.js';
import { GetReport } from '@app/domain/usecases/GetReport.js';
import { ListProjects } from '@app/domain/usecases/ListProjects.js';
import { MigrateData, MigrationSource } from '@app/domain/usecases/MigrateData.js';
import path from "node:path";

export interface Dependencies {
  startTimer: StartTimer;
  stopTimer: StopTimer;
  logTime: LogTime;
  getReport: GetReport;
  listProjects: ListProjects;
  migrateData: MigrateData;
  fsSource: MigrationSource;
  sqliteSource: MigrationSource;
  storageDir: string;
}

export function registerCommands(program: Command, deps: Dependencies) {
  program
    .command('start [project]')
    .description('Démarre un chronomètre pour un projet')
    .action(async (project) => {
      prompts.intro('⏳ Work - Start');
      await startCommand(deps.startTimer, deps.listProjects, project);
    });

  program
    .command('stop')
    .description('Arrête le chronomètre en cours')
    .action(async () => {
      prompts.intro('⏳ Work - Stop');
      await stopCommand(deps.stopTimer);
    });

  program
    .command('log')
    .description('Enregistre manuellement du temps passé sur un projet')
    .action(async () => {
      prompts.intro('📝 Work - Log manuel');
      await logCommand(deps.logTime, deps.listProjects);
    });

  program
    .command('report')
    .description('Affiche un rapport des heures travaillées')
    .option('-p, --period <period>', "Période (today, yesterday, week, month, last-month)", 'month')
    .option('-d, --detail', 'Affiche le détail par jour')
    .action(async (options) => {
      prompts.intro('📊 Work - Rapport');
      await reportCommand(deps.getReport, options);
    });

  program
    .command('migrate')
    .description('Migre les données entre FileSystem et SQLite')
    .action(async () => {
      prompts.intro('🚚 Work - Migration');
      await migrateCommand(deps.migrateData, deps.storageDir, deps.fsSource, deps.sqliteSource);
    });

  program
    .command('edit')
    .description("Ouvre le fichier de logs dans l'éditeur par défaut ($EDITOR)")
    .action(async () => {
      const { spawn } = await import('node:child_process');
      const editor = process.env.EDITOR || 'nano';
      const logsPath = path.join(deps.storageDir, 'logs.txt');

      prompts.log.info(`Ouverture de ${logsPath} avec ${editor}...`);

      const child = spawn(editor, [logsPath], {
        stdio: 'inherit',
      });

      child.on('exit', () => {
        prompts.outro('Édition terminée.');
      });
    });
}
