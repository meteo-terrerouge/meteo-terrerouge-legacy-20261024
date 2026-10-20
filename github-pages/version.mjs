import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pagesDir = path.dirname(fileURLToPath(import.meta.url));
const changelog = await readFile(path.join(path.dirname(pagesDir), "CHANGELOG.md"), "utf8");
const versions = [...changelog.matchAll(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2} \u2014 v(\d+\.\d{3}) \u2014 /gm)];

if (!versions.length) throw new Error("Aucune version publiable n'a ete trouvee dans CHANGELOG.md.");

const requested = process.argv.find(argument => argument.startsWith("--version="))?.slice("--version=".length);
export const releaseVersion = requested || versions.at(-1)[1];

if (!/^\d+\.\d{3}$/.test(releaseVersion)) throw new Error(`Version invalide : ${releaseVersion}`);
if (!versions.some(match => match[1] === releaseVersion)) {
  throw new Error(`La version v${releaseVersion} n'existe pas dans CHANGELOG.md.`);
}

const requestedBuild = process.argv.find(argument => argument.startsWith("--build="))?.slice("--build=".length);
if (requestedBuild && !/^\d{17}$/.test(requestedBuild)) throw new Error(`Identifiant de build invalide : ${requestedBuild}`);

export const sandboxBuild = requestedBuild || releaseVersion.replace(".", "-");
export const cacheVersion = releaseVersion.replace(".", "-");
