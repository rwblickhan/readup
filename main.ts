import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import { Readability } from "npm:@mozilla/readability";

export async function exportLink(url: URL) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  try {
    const html = await fetch(url).then((res) => res.text());
    const document = new DOMParser().parseFromString(html, "text/html");
    const reader = new Readability(document);
    const article = reader.parse();
    Deno.writeFileSync("tmp.html", encoder.encode(article?.content));
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
        "tmp.html",
      ],
    });
    command.spawn();
    const { code, stderr } = await command.output();
    if (code !== 0) {
      console.error(decoder.decode(stderr));
    }
    Deno.removeSync("tmp.html");
  } catch (error) {
    console.error(`Failed to fetch ${url} due to error: ${error}`);
  }
}

if (import.meta.main) {
  exportLink(new URL("https://example.org"));
}
