import * as prompts from '@clack/prompts';
import dayjs from 'dayjs';
import { execSync } from 'node:child_process';
import { StartTimer } from '@app/domain/usecases/StartTimer.js';
import { StopTimer } from '@app/domain/usecases/StopTimer.js';
import { LogTime } from '@app/domain/usecases/LogTime.js';
import { ListProjects } from '@app/domain/usecases/ListProjects.js';
import { GetActiveTimer } from '@app/domain/usecases/GetActiveTimer.js';

async function promptNewProject(): Promise<string> {
  const newProject = await prompts.text({
    message: 'Nom du nouveau projet :',
    validate: (val) => (!val || val.trim() === '' ? 'Le nom ne peut pas être vide' : undefined)
  });

  if (prompts.isCancel(newProject)) {
    prompts.cancel('Opération annulée.');
    process.exit(0);
  }
  return newProject as string;
}

async function selectProject(listProjects: ListProjects): Promise<string> {
  const projects = await listProjects.execute();
  const projectOptions = projects.map(proj => ({ value: proj, label: proj }));

  projectOptions.push({ value: '__NEW__', label: '✨ Nouveau projet...' });

  const projectSelect = await prompts.select({
    message: 'Sur quel projet travaillez-vous ?',
    options: projectOptions,
  });

  if (prompts.isCancel(projectSelect)) {
    prompts.cancel('Opération annulée.');
    process.exit(0);
  }

  if (projectSelect === '__NEW__') {
    return await promptNewProject();
  } else {
    return projectSelect as string;
  }
}

export async function startCommand(usecase: StartTimer, listProjects: ListProjects, projectName?: string) {
  try {
    let finalProject = projectName;

    finalProject ??= await selectProject(listProjects);

    await usecase.execute(finalProject);
    prompts.outro(`▶ Chronomètre démarré pour le projet "${finalProject}".`);
  } catch (error: any) {
    prompts.log.error(error.message);
    process.exit(1);
  }
}

export async function stopCommand(usecase: StopTimer) {
  try {
    const comment = await prompts.text({
      message: 'Commentaire (optionnel) :',
      placeholder: 'Sur quoi avez-vous travaillé ?'
    });

    if (prompts.isCancel(comment)) {
      prompts.cancel('Opération annulée.');
      process.exit(0);
    }

    const result = await usecase.execute({ comment: comment as string || undefined });
    
    const durationMin = dayjs(result.end).diff(dayjs(result.start), 'minute');
    const hours = Math.floor(durationMin / 60);
    const minutes = durationMin % 60;

    prompts.outro(`⏹ Chronomètre arrêté. Temps enregistré : ${hours}h ${minutes}m sur "${result.project}".`);
  } catch (error: any) {
    prompts.log.error(error.message);
    process.exit(1);
  }
}

async function promptForDuration(): Promise<number> {
  const durationStr = await prompts.text({
    message: 'Durée (ex: "1h30", "45m") :',
    validate: (val) => (!val || !/^(\d+h)?(\d+m)?$/.test(val.trim()) ? 'Format invalide (ex: 1h30, 45m)' : undefined)
  });

  if (prompts.isCancel(durationStr)) {
    prompts.cancel('Annulé.');
    process.exit(0);
  }

  const val = durationStr.toString().trim();
  let totalMinutes = 0;
  const hoursMatch = new RegExp(/(\d+)h/).exec(val);
  const minsMatch = new RegExp(/(\d+)m/).exec(val);
  
  if (hoursMatch) totalMinutes += parseInt(hoursMatch[1], 10) * 60;
  if (minsMatch) totalMinutes += parseInt(minsMatch[1], 10);

  return totalMinutes;
}

export async function logCommand(useCase: LogTime, listProjects: ListProjects) {
  try {
    const projects = await listProjects.execute();
    const projectOptions = projects.map(proj => ({ value: proj, label: proj }));
    projectOptions.push({ value: '__NEW__', label: '✨ Nouveau projet...' });

    const projectSelect = await prompts.select({
      message: 'Quel projet souhaitez-vous logguer ?',
      options: projectOptions,
    });

    if (prompts.isCancel(projectSelect)) return prompts.cancel('Annulé.');

    let finalProject = projectSelect;
    if (projectSelect === '__NEW__') {
      finalProject = await promptNewProject();
    }

    const totalMinutes = await promptForDuration();

    const comment = await prompts.text({
      message: 'Commentaire (optionnel) :'
    });

    if (prompts.isCancel(comment)) return prompts.cancel('Annulé.');

    await useCase.execute({
      project: finalProject,
      durationMinutes: totalMinutes,
      comment: comment.toString().trim() || undefined
    });

    prompts.outro(`✔ Temps enregistré pour "${finalProject}".`);
  } catch (error: any) {
    prompts.log.error(error.message);
    process.exit(1);
  }
}

export async function toggleCommand(
  getActiveTimer: GetActiveTimer,
  startTimer: StartTimer,
  stopTimer: StopTimer,
  listProjects: ListProjects
) {
  try {
    const activeTimer = await getActiveTimer.execute();

    if (activeTimer) {
      const result = await stopTimer.execute({});
      const durationMin = dayjs(result.end).diff(dayjs(result.start), 'minute');
      const hours = Math.floor(durationMin / 60);
      const minutes = durationMin % 60;
      console.log(`⏹ Arrêté: ${result.project} (${hours}h ${minutes}m)`);
    } else {
      const projects = await listProjects.execute();
      const projectList = projects.map(p => `"${p}"`).join(', ');
      
      // AppleScript pour choisir dans une liste ou saisir un nouveau
      const script = `
        set projectList to {${projectList}}
        set newListOption to "✨ Nouveau projet..."
        copy newListOption to end of projectList
        
        tell application "System Events"
          activate
          set chosenProject to choose from list projectList with title "Démarrer un chrono" with prompt "Choisissez un projet :" default items {newListOption}
        end tell
        
        if chosenProject is false then
          error "User cancelled"
        else if item 1 of chosenProject is newListOption then
          tell application "System Events"
            set newProject to text returned of (display dialog "Nom du nouveau projet :" default answer "" with title "Nouveau projet")
          end tell
          return newProject
        else
          return item 1 of chosenProject
        end if
      `;
      
      let finalProject = '';
      try {
        finalProject = execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
      } catch (e) {
        console.log("Opération annulée.");
        process.exit(0);
      }

      if (!finalProject) {
        console.error("Le nom du projet ne peut pas être vide.");
        process.exit(1);
      }

      await startTimer.execute(finalProject);
      console.log(`▶ Démarré: ${finalProject}`);
    }
  } catch (error: any) {
    console.error(error.message);
    process.exit(1);
  }
}
