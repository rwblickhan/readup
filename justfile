html link:
    deno run --allow-net --allow-write --allow-run html.ts {{link}}

md file:
    deno run md.ts {{file}}

setup_pdf:
    pipx install marker-pdf

pdf file: setup_pdf
    deno run --allow-read --allow-run pdf.ts {{file}}