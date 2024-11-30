import { join, parse } from "https://deno.land/std@0.208.0/path/mod.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/exists.ts";
import { normalize } from "https://deno.land/std@0.208.0/path/normalize.ts";

async function extractMetadata(
  markdownPath: string
): Promise<{ title?: string; author?: string }> {
  try {
    const content = await Deno.readTextFile(markdownPath);
    const lines = content.split("\n");

    let title: string | undefined;
    let author: string | undefined;

    // Find the first h1 tag
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("# ")) {
        title = line.slice(2).trim();
        // Check next non-empty line for author
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j].trim();
          if (nextLine && !nextLine.startsWith("#")) {
            author = nextLine;
            break;
          }
        }
        break;
      }
    }

    return { title, author };
  } catch (error) {
    console.error(`Error reading markdown file: ${error}`);
    return {};
  }
}

async function convertMarkdownToEpub(inputPath: string) {
  if (!(await exists(inputPath))) {
    console.error(`Input file not found: ${inputPath}`);
    Deno.exit(1);
  }

  const { name, dir } = parse(inputPath);
  const outputPath = join(dir, `${name}.epub`);
  const inputDir = parse(inputPath).dir;

  const { title, author } = await extractMetadata(inputPath);

  const metadataArgs: string[] = [];
  if (title) {
    metadataArgs.push("--metadata", `title=${title}`);
  }
  if (author) {
    metadataArgs.push("--metadata", `author=${author}`);
  }

  const command = new Deno.Command("pandoc", {
    args: [
      inputPath,
      "-o",
      outputPath,
      "-f",
      "markdown",
      "-t",
      "epub",
      "--webtex",
      "--embed-resources",
      "--standalone",
      "--resource-path",
      inputDir,
      ...metadataArgs,
    ],
  });

  const { success, stderr } = await command.output();

  if (!success) {
    const error = new TextDecoder().decode(stderr);
    console.error(`Pandoc conversion failed: ${error}`);
    Deno.exit(1);
  }

  console.log(`Successfully created EPUB at: ${outputPath}`);
}

if (import.meta.main) {
  if (Deno.args.length === 0) {
    console.error("Please provide both input and output dirs");
    Deno.exit(1);
  }
  const inputPath = normalize(Deno.args[0]);
  await convertMarkdownToEpub(inputPath);
  Deno.exit(0);
}

export default convertMarkdownToEpub;
