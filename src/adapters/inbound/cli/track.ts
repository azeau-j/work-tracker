import * as prompts from '@clack/prompts';
import dayjs from 'dayjs';
import { StartTimer } from '@app/domain/usecases/StartTimer.js';
import { StopTimer } from '@app/domain/usecases/StopTimer.js';
import { LogTime } from '@app/domain/usecases/LogTime.js';
import { ListProjects } from '@app/domain/usecases/ListProjects.js';

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
