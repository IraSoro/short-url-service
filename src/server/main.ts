import ViteExpress from "vite-express";
import { CronJob } from "cron";

import { app } from "./server.ts"
import { initializeDatabase } from "./database.ts";
import { Url } from "./models/Url.ts";
import { Op } from "sequelize";
import { Hash } from "./models/Hash.ts";

await initializeDatabase();

const job = new CronJob(
  process.env.CRON_EXPIRED_JOBS_CLEANUP || "0 2 * * *", // Default to everyday at 2am UTC+0
  async () => {
    console.log("Cleanup expired records");
    const currentDate = new Date();
    const urls = await Url.findAll({
      where: {
        expiresAt: {
          [Op.lt]: currentDate,
        },
      },
    });
    if (urls.length === 0) {
      return;
    }
    for (const url of urls) {
      await Hash.destroy({
        where: {
          shortUrl: url.shortUrl,
        },
      });
    }
    await Url.destroy({
      where: {
        expiresAt: {
          [Op.lt]: currentDate,
        },
      },
    });
    console.log(`Deleted ${urls.length} records`);
  },
  null, // onComplete
  true, // start
  "Etc/UTC"
);
job.start();

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000...")
);
