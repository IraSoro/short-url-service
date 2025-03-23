import { Sequelize } from "sequelize-typescript";
import { Hash } from "./models/Hash.ts";
import { Redirection } from "./models/Redirection.ts";
import { Url } from "./models/Url.ts";

const sequelize = new Sequelize(
  {
    database: process.env.POSTGRES_DATABASE,
    dialect: "postgres",
    host: process.env.POSTGRES_HOST,
    username: process.env.POSTGRES_USERNAME,
    password: process.env.POSTGRES_PASSWORD,
    logging: false,
    models: [
      Hash,
      Redirection,
      Url
    ],
  }
);

export async function initializeDatabase() {
  const maxAttempts = 10;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.warn(`Connection to database attempt ${attempt} of ${maxAttempts}`);
    try {
      await sequelize.authenticate();
      await sequelize.sync();
      console.log("Connected to PostgreSQL");
      break;
    } catch (error) {
      if (attempt == maxAttempts) {
        throw error;
      }
      console.error("FAILED");
      await new Promise<void>((resolve) => setTimeout(() => {
        resolve();
      }, 10 * 1000));
    }
  }
}
