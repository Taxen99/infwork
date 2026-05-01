import fs from "fs/promises"

const ao3 = await fs.readFile("ao3.html", "utf-8");
const work = await fs.readFile("work.html", "utf-8");
const skin = await fs.readFile("skin.css", "utf-8");

const out = ao3.replace("@@work@@", work).replace("@@skin@@", skin);

await fs.writeFile("index.html", out);