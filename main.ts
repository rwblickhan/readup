import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import { Readability } from "npm:@mozilla/readability";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function exportLink(url: URL) {
  try {
    const html = await fetch(url).then((res) => res.text());
    const document = new DOMParser().parseFromString(html, "text/html");

    const imgs = document?.getElementsByTagName("img") ?? [];
    for (const img of imgs) {
      img.removeAttribute("decoding");
      img.removeAttribute("loading");
      img.removeAttribute("srcset");
      img.removeAttribute("width");
      img.removeAttribute("height");
      img.removeAttribute("sizes");
    }

    const reader = new Readability(document);
    const article = reader.parse();
    Deno.writeFileSync(
      `${article?.title}.html`,
      encoder.encode(article?.content),
    );
    const command = new Deno.Command("pandoc", {
      args: [
        "-f",
        "html",
        "-t",
        "epub",
        "-o",
        `${article?.title}.epub`,
        "--metadata",
        `title=${article?.title}`,
        "--metadata",
        `author=${article?.byline}`,
        `${article?.title}.html`,
      ],
    });
    const { code, stderr } = await command.output();
    if (code !== 0) {
      console.error(decoder.decode(stderr));
    }
    Deno.removeSync(`${article?.title}.html`);
    console.log(`Successfully exported ${url}`);
  } catch (error) {
    console.error(`Failed to fetch ${url} due to error: ${error}`);
  }
}

if (import.meta.main) {
  if (Deno.args.length === 0) {
    console.error("Please provide at least one link as an argument");
    Deno.exit(1);
  }
  const urls = [];
  for (const arg of Deno.args) {
    try {
      urls.push(new URL(arg));
    } catch {
      console.error(`${arg} is not a valid URL`);
    }
  }
  await Promise.all(urls.map((url) => exportLink(url)));
  Deno.exit(0);
}
