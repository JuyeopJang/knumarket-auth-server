import { initializeDatabase } from './lib/database';
import ReportController from './api/report/report.con';
import UserController from './api/user/user.con';
import App from './app.js';

async function startServer() {
  await initializeDatabase();

  const app = new App([
    new UserController(),
    new ReportController()
  ]);

  app.listen();
}
startServer();