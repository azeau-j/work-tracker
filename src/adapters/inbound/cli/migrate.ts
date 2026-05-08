import * as prompts from "@clack/prompts";
import fs from "node:fs";
import path from "node:path";
import { MigrateData, MigrationSource } from "../../../domain/usecases/MigrateData.js";

export async function migrateCommand(
  migrateData: MigrateData, 
  storageDir: string,
  fsSource: MigrationSource,
  sqliteSource: MigrationSource
) {
  const sourceSystem = await prompts.select({
    message: 'Choisissez le système source (depuis lequel copier les données) :',
    options: [
      { value: 'fs', label: 'FileSystem' },
      { value: 'sqlite', label: 'SQLite' },
    ],
  });

  if (prompts.isCancel(sourceSystem)) return;

  const destSystem = await prompts.select({
    message: 'Choisissez le système de destination (vers lequel copier les données) :',
    options: [
      { value: 'fs', label: 'FileSystem' },
      { value: 'sqlite', label: 'SQLite' },
    ],
  });

  if (prompts.isCancel(destSystem)) return;

  if (sourceSystem === destSystem) {
    prompts.log.error('La source et la destination doivent être différentes.');
    return;
  }

  const confirm = await prompts.confirm({
    message: `Cette opération va écraser les données de ${destSystem === 'fs' ? 'FileSystem' : 'SQLite'}. Une sauvegarde (.bak) sera créée. Continuer ?`,
  });

  if (!confirm || prompts.isCancel(confirm)) return;

  const s = prompts.spinner();
  s.start('Préparation de la sauvegarde...');

  const dbPath = path.join(storageDir, 'work-tracker.db');
  const logsPath = path.join(storageDir, 'logs.txt');
  const projectsPath = path.join(storageDir, 'projects.txt');
  const configPath = path.join(storageDir, 'config.toml');

  try {
    // Sauvegarde du système de destination
    if (destSystem === 'sqlite') {
      if (fs.existsSync(dbPath)) fs.copyFileSync(dbPath, `${dbPath}.bak`);
    } else {
      if (fs.existsSync(logsPath)) fs.copyFileSync(logsPath, `${logsPath}.bak`);
      if (fs.existsSync(projectsPath)) fs.copyFileSync(projectsPath, `${projectsPath}.bak`);
    }

    s.message('Migration des données...');
    const source = sourceSystem === 'fs' ? fsSource : sqliteSource;
    const destination = destSystem === 'fs' ? fsSource : sqliteSource;

    await migrateData.execute(source, destination);

    s.message('Mise à jour de la configuration...');
    fs.writeFileSync(configPath, `[storage]\ntype = "${destSystem}"\n`);

    s.stop(`Migration terminée ! Stockage actuel : ${destSystem}`);
    prompts.outro('Sauvegarde créée avec succès.');
  } catch (error: any) {
    s.stop('Erreur lors de la migration.');
    prompts.log.error(error.message);
  }
}
