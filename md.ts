import { join, parse } from "https://deno.land/std@0.208.0/path/mod.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/exists.ts";
import { normalize } from "https://deno.land/std@0.208.0/path/normalize.ts";

async function convertMarkdownToEpub(inputPath: string) {
  if (!(await exists(inputPath))) {
    console.error(`Input file not found: ${inputPath}`);
    Deno.exit(1);
  }

  const { name, dir } = parse(inputPath);
  const outputPath = join(dir, `${name}.epub`);
  const inputDir = parse(inputPath).dir;

  const command = new Deno.Command("pandoc", {
    args: [
      inputPath,
      "-o",
      outputPath,
      "-f",
      "markdown",
      "-t",
      "epub",
      "--embed-resources",
      "--standalone",
      "--resource-path",
      inputDir,
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
