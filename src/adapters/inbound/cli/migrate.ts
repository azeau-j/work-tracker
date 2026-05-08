import * as prompts from "@clack/prompts";
import fs from "node:fs";
import path from "node:path";
import { MigrateData } from "../../../domain/usecases/MigrateData.js";
import { StorageRegistry } from "../../outbound/StorageRegistry.js";

export async function migrateCommand(
  migrateData: MigrateData, 
  storageDir: string
) {
  const systems = StorageRegistry.getAvailableSystems();
  const options = systems.map(system => ({
    value: system,
    label: system === 'fs' ? 'FileSystem' : system.charAt(0).toUpperCase() + system.slice(1)
  }));

  const sourceSystem = await prompts.select({
    message: 'Choisissez le système source (depuis lequel copier les données) :',
    options,
  });

  if (prompts.isCancel(sourceSystem)) return;

  const destSystem = await prompts.select({
    message: 'Choisissez le système de destination (vers lequel copier les données) :',
    options,
  });

  if (prompts.isCancel(destSystem)) return;

  if (sourceSystem === destSystem) {
    prompts.log.error('La source et la destination doivent être différentes.');
    return;
  }

  const destOption = options.find(o => o.value === destSystem);
  const destLabel = destOption ? destOption.label : (destSystem as string);
  const confirm = await prompts.confirm({
    message: `Cette opération va écraser les données de ${destLabel}. Une sauvegarde (.bak) sera créée. Continuer ?`,
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
    } else if (destSystem === 'fs') {
      if (fs.existsSync(logsPath)) fs.copyFileSync(logsPath, `${logsPath}.bak`);
      if (fs.existsSync(projectsPath)) fs.copyFileSync(projectsPath, `${projectsPath}.bak`);
    }

    s.message('Migration des données...');
    const source = StorageRegistry.get(sourceSystem as string);
    const destination = StorageRegistry.get(destSystem as string);

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
