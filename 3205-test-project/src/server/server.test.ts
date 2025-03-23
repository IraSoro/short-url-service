import http from "http";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { app, ShortenCreation } from "./server.ts";
import { Hash } from "./models/Hash.ts";
import { Redirection } from "./models/Redirection.ts";
import { Url } from "./models/Url.ts";

const port = 1234;
const host = `http://localhost:${port}`;
let server: http.Server | null = null;

beforeEach(() => {
  server = app.listen(port);
});

afterEach(() => {
  server?.close();
});

describe("POST /shorten", () => {
  const originalUrl = "http://it-doesnt-matter.com";
  const shortenUrl = "03c7aa4a";

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("should create a new shortUrl and return status 201", async () => {
    vi.spyOn(Hash, "findOne").mockResolvedValueOnce(null);
    vi.spyOn(Url, "create").mockResolvedValue({
      shortUrl: shortenUrl,
    });
    vi.spyOn(Hash, "create").mockResolvedValueOnce({});

    const resp = await fetch(`${host}/shorten`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        originalUrl: originalUrl,
      } satisfies ShortenCreation),
    });

    expect(resp.status).toEqual(201);
    expect(await resp.text()).toEqual(shortenUrl);
  });

  test("should return OK and shortUrl if it already exists", async () => {
    vi.spyOn(Hash, "findOne").mockResolvedValueOnce({
      // @ts-expect-error Mocked record
      shortUrl: shortenUrl,
    });

    const resp = await fetch(`${host}/shorten`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        originalUrl: originalUrl,
      } satisfies ShortenCreation),
    });

    expect(resp.status).toEqual(200);
    expect(await resp.text()).toEqual(shortenUrl);
  });

  test("should return 400 if alias is provided and it's has more than 20 characters", async () => {
    vi.spyOn(Hash, "findOne").mockResolvedValueOnce(null);

    const resp = await fetch(`${host}/shorten`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        originalUrl: originalUrl,
        alias: "some-alias-with-more-than-20-characters",
      } satisfies ShortenCreation),
    });

    expect(resp.status).toEqual(400);
  });

  test("should return alias if it provided", async () => {
    const alias = "alias123";

    vi.spyOn(Hash, "findOne").mockResolvedValueOnce(null);
    vi.spyOn(Url, "create").mockResolvedValue({
      shortUrl: alias,
    });
    vi.spyOn(Hash, "create").mockResolvedValueOnce({});

    const resp = await fetch(`${host}/shorten`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        originalUrl: originalUrl,
        alias: alias,
      } satisfies ShortenCreation),
    });

    expect(resp.status).toEqual(201);
    expect(await resp.text()).toEqual(alias);
  });
});

describe("GET /:shortUrl", () => {
  const shortenUrl = "03c7aa4a";

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("should return 404 if shortenUrl doesn't exists", async () => {
    vi.spyOn(Url, "findOne").mockResolvedValueOnce(null);

    const resp = await fetch(`${host}/${shortenUrl}`);

    expect(resp.status).toEqual(404);
  })
  
  test("should redirect to originalUrl", async () => {
    const realOriginalUrl = "https://google.com";
    const mockedUrl = {
      originalUrl: realOriginalUrl,
      shortUrl: shortenUrl,
      clickCount: 10,
      save: vi.fn().mockResolvedValueOnce({}),
    };
    // @ts-expect-error Mocked value
    vi.spyOn(Url, "findOne").mockResolvedValue(mockedUrl);
    vi.spyOn(Redirection, "create").mockResolvedValueOnce({});

    const resp = await fetch(`${host}/${shortenUrl}`);

    expect(mockedUrl.clickCount).toEqual(11);
    expect(resp.status).toEqual(200);
    expect(resp.redirected).toEqual(true);
  });
});
