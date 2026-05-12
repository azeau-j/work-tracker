import * as prompts from '@clack/prompts';
import dayjs from 'dayjs';
import { execSync } from 'node:child_process';
import { StartTimer } from '@app/domain/usecases/StartTimer.js';
import { StopTimer } from '@app/domain/usecases/StopTimer.js';
import { LogTime } from '@app/domain/usecases/LogTime.js';
import { ListProjects } from '@app/domain/usecases/ListProjects.js';
import { GetActiveTimer } from '@app/domain/usecases/GetActiveTimer.js';
import { TimeEntry } from '@app/domain/entities/TimeEntry.js';

function notify(title: string, message: string) {
  if (process.platform !== 'darwin') return;
  try {
    const escapedMessage = message.replace(/"/g, '\\"');
    const escapedTitle = title.replace(/"/g, '\\"');
    const script = `display notification "${escapedMessage}" with title "${escapedTitle}"`;
    execSync(`osascript -e '${script}'`);
  } catch (e) {
    // Échec silencieux
  }
}

/**
 * Formate le message de fin de session (durée + projet + commentaire).
 */
function formatTimeEntryStop(result: TimeEntry): string {
  const durationMin = dayjs(result.end).diff(dayjs(result.start), 'minute');
  const hours = Math.floor(durationMin / 60);
  const minutes = durationMin % 60;
  const commentStr = result.comment ? ` - ${result.comment}` : '';
  return `⏹ Chronomètre arrêté. Temps enregistré : ${hours}h ${minutes}m sur "${result.project}"${commentStr}.`;
}

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
    notify('Saisie des heures', `▶ Chronomètre démarré pour "${finalProject}"`);
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
    notify('Saisie des heures', formatTimeEntryStop(result).replace('⏹ Chronomètre arrêté. ', ''));
    prompts.outro(formatTimeEntryStop(result));
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
    const isDarwin = process.platform === 'darwin';

    if (activeTimer) {
      let comment: string | undefined = undefined;

      if (isDarwin) {
        const commentScript = `
          tell application "System Events"
            activate
            set commentResponse to text returned of (display dialog "Commentaire (optionnel) :" default answer "" with title "Arrêter le chrono")
          end tell
          return commentResponse
        `;

        try {
          comment = execSync(`osascript -e '${commentScript.replace(/'/g, "'\\''")}'`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
        } catch (e) {
          comment = undefined;
        }
      } else {
        const commentResponse = await prompts.text({
          message: 'Commentaire (optionnel) :',
          placeholder: 'Sur quoi avez-vous travaillé ?'
        });
        if (prompts.isCancel(commentResponse)) {
          prompts.cancel('Opération annulée.');
          process.exit(0);
        }
        comment = commentResponse as string;
      }

      const result = await stopTimer.execute({ comment: comment || undefined });
      const message = formatTimeEntryStop(result);
      notify('Saisie des heures', message.replace('⏹ Chronomètre arrêté. ', ''));
      if (isDarwin) {
        console.log(message);
      } else {
        prompts.outro(message);
      }
    } else {
      let finalProject = '';

      if (isDarwin) {
        const projects = await listProjects.execute();
        const projectList = projects.map(p => `"${p.replace(/"/g, '\\"')}"`).join(', ');
        
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
        
        try {
          finalProject = execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
        } catch (e) {
          console.log("Opération annulée.");
          process.exit(0);
        }
      } else {
        finalProject = await selectProject(listProjects);
      }

      if (!finalProject) {
        if (isDarwin) {
          console.error("Le nom du projet ne peut pas être vide.");
        } else {
          prompts.log.error("Le nom du projet ne peut pas être vide.");
        }
        process.exit(1);
      }

      await startTimer.execute(finalProject);
      notify('Saisie des heures', `▶ Chronomètre démarré pour "${finalProject}"`);
      if (isDarwin) {
        console.log(`▶ Démarré: ${finalProject}`);
      } else {
        prompts.outro(`▶ Chronomètre démarré pour le projet "${finalProject}".`);
      }
    }
  } catch (error: any) {
    if (process.platform === 'darwin') {
      console.error(error.message);
    } else {
      prompts.log.error(error.message);
    }
    process.exit(1);
  }
}
