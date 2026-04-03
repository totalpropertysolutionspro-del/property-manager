import serverless from "serverless-http";
import { app } from "../../backend/src/app.js";
import { initializeDatabase } from "../../backend/src/db/index.js";

let initialized = false;

const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
  if (!initialized) {
    await initializeDatabase();
    initialized = true;
  }
  return serverlessHandler(event, context);
};
