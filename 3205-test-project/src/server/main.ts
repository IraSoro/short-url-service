import express, { Request } from "express";
import ViteExpress from "vite-express";
import short from "short-uuid";
import { CronJob } from "cron";

import { initializeDatabase } from "./database.ts";
import { Hash } from "./models/Hash.ts";
import { Url } from "./models/Url.ts";
import { Op } from "sequelize";
import { Redirection } from "./models/Redirection.ts";

// TODO:
// - [ ] Реализовать frontend
// - [ ] Реализовать тесты

async function calculateSHA256FromUrl(url: string) {
  const originalUrlAsBuffer = new TextEncoder().encode(url);
  const hashBuffer = await crypto.subtle.digest("SHA-256", originalUrlAsBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((item) => item.toString(16).padStart(2, "0")).join("");
}

const app = express();
const translator = short();

app.use(express.json());

// POST /shorten: принимает JSON с полями:
// - originalUrl (обязательное) - исходный URL,
// - expiresAt (опциональное) - дата окончания действия укороченной ссылки,
// - alias (опциональное) - пользовательский алиас для URL (максимальная длина 20 символов)
// Эндпоинт возвращает уникальный укороченный URL.
// curl --request POST --header "Content-Type: application/json" --data '{ "originalUrl":"https://www.npmjs.com/package/vite-express" }' localhost:3000/shorten
// curl --request POST --header "Content-Type: application/json" --data '{ "originalUrl":"https://www.npmjs.com/package/vite-express", "alias":"123" }' localhost:3000/shorten
// curl --request POST --header "Content-Type: application/json" --data '{ "originalUrl":"https://www.npmjs.com/package/vite-express", "alias":"123", "expiresAt": "Thu, 20 Mar 2025 21:12:00 GMT" }' localhost:3000/shorten
app.post("/shorten", async (req: Request<{}, {}, { originalUrl: string; expiresAt?: string; alias?: string; }>, resp) => {
  const hash = await calculateSHA256FromUrl(req.body.originalUrl);
  const foundRecord = await Hash.findOne({
    where: { hash: hash },
    include: [{
      model: Url,
      attributes: ["shortUrl"],
    }],
  });
  if (foundRecord) {
    return resp.status(200).send(foundRecord.shortUrl);
  }

  if (req.body.alias && req.body.alias.length >= 20) {
    return resp.status(400).send("Alias should contain less than 20 characters");
  }

  const url = await Url.create({
    shortUrl: req.body.alias || translator.generate(),
    originalUrl: req.body.originalUrl,
    clickCount: 0,
    expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
  });

  await Hash.create({
    hash: hash,
    shortUrl: url.shortUrl,
    url: url,
  });

  resp.status(201).send(url.shortUrl);
});

// GET /{shortUrl}: переадресует пользователя на оригинальный URL.
// Если ссылка не найдена, возвращает ошибку 404.
// curl localhost:3000/gKGqnUMEYPQ8Z76izrRacC
app.get("/:shortUrl", async (req: Request<{ shortUrl: string }>, resp) => {
  const url = await Url.findOne({ where: { shortUrl: req.params.shortUrl } });
  if (!url) {
    return resp.status(404).send("Error: Can't find short url");
  }
  url.clickCount++;
  await url.save();
  await Redirection.create({
    ipAddress: req.ip || "",
    shortUrl: url.shortUrl,
  });
  return resp.redirect(308, url.originalUrl);
});

// GET /info/{shortUrl}: возвращает информацию о сокращённой ссылке:
// originalUrl (оригинальная ссылка),
// createdAt (дата создания),
// clickCount (количество переходов по короткой ссылке).
// curl localhost:3000/info/gKGqnUMEYPQ8Z76izrRacC
app.get("/info/:shortUrl", async (req: Request<{ shortUrl: string }>, resp) => {
  const url = await Url.findOne({ where: { shortUrl: req.params.shortUrl } });
  if (!url) {
    return resp.status(404).send("Error: Can't find short url");
  }
  return resp.status(200).json({
    originalUrl: url.originalUrl,
    createdAt: url.createdAt,
    clickCount: url.clickCount,
  });
});

app.get("/analytics/:shortUrl", async(req: Request<{ shortUrl: string}>, resp) => {
  const url = await Url.findOne({ where: { shortUrl: req.params.shortUrl }});
  if (!url) {
    return resp.status(404).send("Error: Can't find short url");
  }
  const redirects = await Redirection.findAll({
    where: { shortUrl: req.params.shortUrl },
    order: [
      ["createdAt", "DESC"],
    ],
    limit: 5,
    attributes: ["ipAddress"]
  });
  return resp.status(200).json({
    clickCount: url.clickCount,
    ipAddresses: redirects.map((redirection) => redirection.ipAddress),
  });
})

// DELETE /delete/{shortUrl}: удаляет короткую ссылку.
// curl --request DELETE localhost:3000/delete/gKGqnUMEYPQ8Z76izrRacC
app.delete("/delete/:shortUrl", async (req: Request<{ shortUrl: string }>, resp) => {
  const deletedHash = await Hash.destroy({
    where: { shortUrl: req.params.shortUrl },
  });
  if (!deletedHash) {
    return resp.status(404).send("Error: Can't find short url");
  }
  await Url.destroy({
    where: { shortUrl: req.params.shortUrl },
  });
  return resp.status(200).send();
});

await initializeDatabase();
const job = new CronJob(
  "0 2 * * *", // every day at 2am UTC+0
  async () => {
    console.log("Cleanup expired records");
    const currentDate = new Date();
    const urls = await Url.findAll({
      where: {
        expiresAt: {
          [Op.lt]: currentDate,
        },
      }
    })
    if (urls.length === 0) {
      return;
    }
    for (const url of urls) {
      await Hash.destroy({
        where: {
          shortUrl: url.shortUrl,
        }
      })
    }
    await Url.destroy({
      where: {
        expiresAt: {
          [Op.lt]: currentDate,
        }
      }
    })
    console.log(`Deleted ${urls.length} records`);
  },
  null, // onComplete
  true, // start
  "Etc/UTC",
);
job.start();
ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000...")
);
