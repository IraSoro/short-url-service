import express, { Request } from "express";
import ViteExpress from "vite-express";
import short from "short-uuid";

const app = express();

app.use(express.json());

// TODO: Вот это поменять на Postgres
const cache = new Map<string, {
  originalUrl: string;
  shortUrl: string;
  createdAt: string;
  clickCount: number;
}>();

const translator = short();

async function calculateSHA256FromUrl(url: string) {
  const originalUrlAsBuffer = new TextEncoder().encode(url);
  const hashBuffer = await crypto.subtle.digest("SHA-256", originalUrlAsBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((item) => item.toString(16).padStart(2, "0")).join("");
}

// POST /shorten: принимает JSON с полями:
// - originalUrl (обязательное) - исходный URL,
// - expiresAt (опциональное) - дата окончания действия укороченной ссылки,
// - alias (опциональное) - пользовательский алиас для URL (максимальная длина 20 символов)
// Эндпоинт возвращает уникальный укороченный URL.
// curl --request POST --header "Content-Type: application/json" --data '{ "originalUrl":"https://www.npmjs.com/package/vite-express" }' localhost:3000/shorten
// curl --request POST --header "Content-Type: application/json" --data '{ "originalUrl":"https://www.npmjs.com/package/vite-express", "alias":"123" }' localhost:3000/shorten
// curl --request POST --header "Content-Type: application/json" --data '{ "originalUrl":"https://www.npmjs.com/package/vite-express", "alias":"123", "expiresAt": "Thu, 20 Mar 2025 21:12:00 GMT" }' localhost:3000/shorten
app.post("/shorten", async (req: Request<{}, {}, {
  originalUrl: string;
  expiresAt?: string;
  alias?: string;
}>, resp) => {
  // TODO: Добавить expiresAt, возможно через БД
  const hash = await calculateSHA256FromUrl(req.body.originalUrl);
  if (cache.has(hash)) {
    resp.send(cache.get(hash));
    return;
  }

  if (req.body.alias) {
    // TODO: Добавить проверку на длину
    // TODO: Не знаю что делать, если уже еть в БД, но пользователь прислал alias, возвращать alias или перезаписывать на alias
    cache.set(hash, {
      originalUrl: req.body.originalUrl,
      shortUrl: req.body.alias,
      clickCount: 0,
      createdAt: new Date().toUTCString(),
    });
    resp.send(req.body.alias)
    return;
  }

  const shortUrl = translator.generate();
  cache.set(hash, {
    originalUrl: req.body.originalUrl,
    shortUrl: shortUrl,
    clickCount: 0,
    createdAt: new Date().toUTCString(),
  });
  resp.send(shortUrl);
})

// GET /{shortUrl}: переадресует пользователя на оригинальный URL.
// Если ссылка не найдена, возвращает ошибку 404.
// curl localhost:3000/gKGqnUMEYPQ8Z76izrRacC
app.get("/:shortUrl", (req: Request<{ shortUrl: string}>, resp) => {
  for (const [key, value] of cache) {
    if (value.shortUrl === req.params.shortUrl) {
      value.clickCount++;
      cache.set(key, value);
      resp.redirect(308, value.originalUrl);
      return;
    }
  }
  resp.status(404).send("Error: Can't find short url");
})

// GET /info/{shortUrl}: возвращает информацию о сокращённой ссылке:
// originalUrl (оригинальная ссылка),
// createdAt (дата создания),
// clickCount (количество переходов по короткой ссылке).
// curl localhost:3000/info/gKGqnUMEYPQ8Z76izrRacC
app.get("/info/:shortUrl", (req: Request<{ shortUrl: string}>, resp) => {
  for (const [key, value] of cache) {
    if (value.shortUrl === req.params.shortUrl) {
      resp.status(200).json({
        originalUrl: value.originalUrl,
        createdAt: value.createdAt,
        clickCount: value.clickCount,
      });
      return
    }
  }
  resp.status(404).send("Error: Can't find short url");
});

// DELETE /delete/{shortUrl}: удаляет короткую ссылку.
// curl --request DELETE localhost:3000/delete/gKGqnUMEYPQ8Z76izrRacC
app.delete("/delete/:shortUrl", (req: Request<{ shortUrl: string}>, resp) => {
  for (const [key, value] of cache) {
    if (value.shortUrl === req.params.shortUrl) {
      cache.delete(key);
      resp.status(200).send();
      return;
    }
  }
  resp.status(404).send("Error: Can't find short url");
})

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000..."),
);
