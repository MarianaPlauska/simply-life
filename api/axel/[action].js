// Roteador único — APIs AXEL/IA (limite Hobby: 12 serverless functions)

import morningBrief from '../_lib/handlers/axel/morning-brief.js';
import orchestrateTasks from '../_lib/handlers/axel/orchestrate-tasks.js';
import taskEstimate from '../_lib/handlers/axel/task-estimate.js';
import ingestEmail from '../_lib/handlers/axel/ingest-email.js';
import ingestTasks from '../_lib/handlers/axel/ingest-tasks.js';
import estimateProtein from '../_lib/handlers/axel/estimate-protein.js';
import processEvent from '../_lib/handlers/axel/process-event.js';
import financeCoach from '../_lib/handlers/axel/finance-coach.js';
import financePurchaseCheck from '../_lib/handlers/axel/finance-purchase-check.js';
import fetchNews from '../_lib/handlers/axel/fetch-news.js';
import generateGreeting from '../_lib/handlers/axel/generate-greeting.js';
import adminUsers from '../_lib/handlers/axel/admin-users.js';
import todayVerdict from '../_lib/handlers/axel/today-verdict.js';

const ROUTES = {
  'morning-brief': morningBrief,
  'orchestrate-tasks': orchestrateTasks,
  'task-estimate': taskEstimate,
  'ingest-email': ingestEmail,
  'ingest-tasks': ingestTasks,
  'estimate-protein': estimateProtein,
  'process-event': processEvent,
  'finance-coach': financeCoach,
  'finance-purchase-check': financePurchaseCheck,
  'fetch-news': fetchNews,
  'generate-greeting': generateGreeting,
  'admin-users': adminUsers,
  'today-verdict': todayVerdict,
};

function pickQuery(value)
{
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function handler(req, res)
{
  const action = pickQuery(req.query.action);
  const route = ROUTES[action];

  if (!route)
  {
    return res.status(404).json({ error: 'Rota AXEL não encontrada' });
  }

  return route(req, res);
}
