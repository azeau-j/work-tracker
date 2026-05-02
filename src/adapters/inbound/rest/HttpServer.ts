import http from 'node:http';
import { URL } from 'node:url';
import dayjs from 'dayjs';
import { ListProjects } from '@app/domain/usecases/ListProjects.js';
import { GetReport } from '@app/domain/usecases/GetReport.js';
import {getDateRange} from "../../../utils/period.js";

export interface ServerDependencies {
  listProjects: ListProjects;
  getReport: GetReport;
}

export function createHttpServer(deps: ServerDependencies) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '', `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method;

    const sendJson = (data: any, status = 200) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };

    try {
      if (method === 'GET' && pathname === '/projects') {
        const projects = await deps.listProjects.execute();
        return sendJson(projects);
      }

      if (method === 'GET' && pathname === '/report') {
        const period = url.searchParams.get('period') ?? 'month';
        const { start, end } = getDateRange(period);

        const result = await deps.getReport.execute({
          startDate: start.toDate(),
          endDate: end.toDate(),
        });

        const projectDurationsObj: Record<string, number> = {};
        result.projectDurations.forEach((value, key) => {
          projectDurationsObj[key] = value;
        });

        return sendJson({
          totalMinutes: result.totalMinutes,
          projectDurations: projectDurationsObj,
          entries: result.filteredEntries
        });
      }

      return sendJson({ error: 'Not Found' }, 404);

    } catch (error) {
      console.error('Server Error:', error);
      return sendJson({ error: 'Internal Server Error' }, 500);
    }
  });
}