import express, { Request, Response } from "express";
import short from "short-uuid";
import "dotenv/config";

import { sha256Sum as sha256 } from "./hashsum.ts";
import { Hash } from "./models/Hash.ts";
import { Url } from "./models/Url.ts";
import { Redirection } from "./models/Redirection.ts";

const translator = short();
export const app = express();
app.use(express.json());

export interface ShortenCreation {
  originalUrl: string;
  expiresAt?: string;
  alias?: string;
}

app.post(("/shorten"),  async ( req: Request< {}, {}, ShortenCreation >, resp: Response ) => {
  const hash = await sha256(req.body.originalUrl);
  const foundRecord = await Hash.findOne({
    where: { hash: hash },
    include: [
      {
        model: Url,
        attributes: ["shortUrl"],
      },
    ],
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

app.get("/:shortUrl", async (req: Request<{ shortUrl: string }>, resp: Response) => {
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
    // NOTE: Browser may cache redirection, so we should explicitly set `no-store` here
    resp.set("Cache-Control", "no-store");
    return resp.redirect(308, url.originalUrl);
  }
);

app.delete("/delete/:shortUrl", async (req: Request<{ shortUrl: string }>, resp: Response) => {
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
  }
);

app.get("/info/:shortUrl", async (req: Request<{ shortUrl: string }>, resp: Response) => {
    const url = await Url.findOne({ where: { shortUrl: req.params.shortUrl } });
    if (!url) {
      return resp.status(404).send("Error: Can't find short url");
    }
    return resp.status(200).json({
      originalUrl: url.originalUrl,
      createdAt: url.createdAt,
      clickCount: url.clickCount,
    });
  }
);

app.get("/analytics/:shortUrl", async (req: Request<{ shortUrl: string }>, resp: Response) => {
    const url = await Url.findOne({ where: { shortUrl: req.params.shortUrl } });
    if (!url) {
      return resp.status(404).send("Error: Can't find short url");
    }
    const redirects = await Redirection.findAll({
      where: { shortUrl: req.params.shortUrl },
      order: [["createdAt", "DESC"]],
      limit: 5,
      attributes: ["ipAddress"],
    });
    return resp.status(200).json({
      clickCount: url.clickCount,
      ipAddresses: redirects.map((redirection) => redirection.ipAddress),
    });
  }
);
