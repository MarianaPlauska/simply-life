// Cron diário único - Gmail + push de boletos (plano Hobby: 1×/dia)

import gmailSync from './gmail-sync.js';
import pushBills from './push-bills.js';
import pushHealth from './push-health.js';
import demoReset from './demo-reset.js';
import weeklyDigest from './weekly-digest.js';

function invokeHandler(handler, req)
{
  return new Promise((resolve, reject) =>
  {
    const res = {
      statusCode: 200,
      status(code)
      {
        this.statusCode = code;
        return this;
      },
      json(data)
      {
        resolve({ status: this.statusCode, data });
      },
      end()
      {
        resolve({ status: this.statusCode, data: null });
      },
    };

    Promise.resolve(handler(req, res)).catch(reject);
  });
}

export default async function handler(req, res)
{
  if (req.method !== 'GET' && req.method !== 'POST')
  {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || '';
  if (cronSecret && auth !== `Bearer ${cronSecret}`)
  {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const gmail = await invokeHandler(gmailSync, req);
  const push = await invokeHandler(pushBills, req);
  const health = await invokeHandler(pushHealth, req);
  const demo = await invokeHandler(demoReset, req);
  const digest = await invokeHandler(weeklyDigest, req);

  return res.status(200).json({
    status: 'ok',
    gmail: gmail.data,
    push: push.data,
    health: health.data,
    demo: demo.data,
    digest: digest.data,
  });
}
