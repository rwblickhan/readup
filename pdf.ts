import { join, parse } from "https://deno.land/std@0.208.0/path/mod.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/exists.ts";
import { normalize } from "https://deno.land/std@0.208.0/path/normalize.ts";
import convertMarkdownToEpub from "./md.ts";

async function convertPdfToEpub(inputPath: string) {
  if (!(await exists(inputPath))) {
    console.error(`Input file not found: ${inputPath}`);
    Deno.exit(1);
  }

  const { name, dir } = parse(inputPath);
  const inputDir = parse(inputPath).dir;
  const outputDir = join(dir, name);
  const markdownPath = join(outputDir, `${name}.md`);

  const markerCommand = new Deno.Command("marker_single", {
    args: [inputPath, "--output_dir", inputDir],
  });

  const { success: markerSuccess, stderr: markerStderr } =
    await markerCommand.output();

  if (!markerSuccess) {
    const error = new TextDecoder().decode(markerStderr);
    console.error(`Marker conversion failed: ${error}`);
    Deno.exit(1);
  }

  console.log(`Successfully created markdown at: ${markdownPath}`);

  // Then convert markdown to EPUB
  await convertMarkdownToEpub(markdownPath);
}

if (import.meta.main) {
  if (Deno.args.length === 0) {
    console.error("Please provide both input and output dirs");
    Deno.exit(1);
  }
  const inputPath = normalize(Deno.args[0]);
  await convertPdfToEpub(inputPath);
  Deno.exit(0);
}
