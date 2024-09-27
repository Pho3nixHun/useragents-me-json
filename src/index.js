import { fileURLToPath } from "url";
import {
  getTablesAsRecord,
  fetchHtml,
  gracefullyOpenFile,
  explainErrorCode,
} from "#libs";
import { JSDOM } from "jsdom";
import "dotenv/config";
export * from "#libs";

const ARGS = process.argv0.split(2);
const {
  USERAGENTS_URL = "https://www.useragents.me/",
  OUTPUT_FILE = "",
  PRETTIFY_JSON = ARGS.includes("-p") || ARGS.includes("--pretty"),
} = process.env;
const jsonIndent = ["true", true].includes(PRETTIFY_JSON) ? 4 : 0;

const printUsage = () => {
  const help = `Usage: npm start
    Fetches the HTML content of a page and extracts the tables as JSON.
    Can work from an .env file:
        USERAGENTS_URL - The URL of the page to fetch. Default: 'https://www.useragents.me/'.
        OUTPUT_FILE - The path to the output JSON file. Default: ''.
        PRETTIFY_JSON - Whether to prettify the JSON output. Default: false.
    CLI Options:
        --help, -h - Show this help message.
        --pretty, -p - Prettify the JSON output.`;
  console.log(help);
};

if (ARGS.includes("--help") || ARGS.includes("-h")) {
  printUsage();
  process.exit(0);
}

/** @typedef {object} UserAgents
 * @property {object[]} mostCommonDesktopUseragents
 * @property {string} mostCommonDesktopUseragents.share
 * @property {string} mostCommonDesktopUseragents.osAndBrowser
 * @property {string} mostCommonDesktopUseragents.useragent
 * @property {object[]} mostCommonMobileUseragents
 * @property {string} mostCommonMobileUseragents.share
 * @property {string} mostCommonMobileUseragents.device
 * @property {string} mostCommonMobileUseragents.osAndBrowser
 * @property {string} mostCommonMobileUseragents.useragent
 * @property {object[]} latestWindowsDesktopUseragents
 * @property {string} latestWindowsDesktopUseragents.osAndBrowser
 * @property {string} latestWindowsDesktopUseragents.useragent
 * @property {object[]} latestMacDesktopUseragents
 * @property {string} latestMacDesktopUseragents.osAndBrowser
 * @property {string} latestMacDesktopUseragents.useragent
 * @property {object[]} latestLinuxDesktopUseragents
 * @property {string} latestLinuxDesktopUseragents.osAndBrowser
 * @property {string} latestLinuxDesktopUseragents.useragent
 * @property {object[]} latestIphoneUseragents
 * @property {string} latestIphoneUseragents.device
 * @property {string} latestIphoneUseragents.osAndBrowser
 * @property {string} latestIphoneUseragents.useragent
 * @property {object[]} latestIpodUseragents
 * @property {string} latestIpodUseragents.device
 * @property {string} latestIpodUseragents.osAndBrowser
 * @property {string} latestIpodUseragents.useragent
 * @property {object[]} latestIpadUseragents
 * @property {string} latestIpadUseragents.device
 * @property {string} latestIpadUseragents.osAndBrowser
 * @property {string} latestIpadUseragents.useragent
 * @property {object[]} latestAndroidMobileUseragents
 * @property {string} latestAndroidMobileUseragents.device
 * @property {string} latestAndroidMobileUseragents.osAndBrowser
 * @property {string} latestAndroidMobileUseragents.useragent
 * @property {string} lastUpdated
 */

/**
 *
 * Fetches the UserAgents JSON from the specified URL.
 *
 * @param {string} url - The URL of the page to fetch.
 * @returns {Promise<UserAgents | Error>} - A promise that resolves to the JSON object if successful, or an error otherwise.
 */
export const getUserAgentsJson = async (url) => {
  const htmlText = await fetchHtml(url).catch((err) => err);
  const dom = new JSDOM(htmlText);
  return getTablesAsRecord({ root: dom.window.document });
};

const main = async (url, outputFilePath, jsonIndent) => {
  const json = await getUserAgentsJson(url).catch((err) => err);
  if (json instanceof Error) {
    console.error(`Error fetching data: ${json.message}`);
    process.exit(1);
  }

  if (!outputFilePath) {
    console.log(JSON.stringify(json, null, jsonIndent));
    process.exit(0);
  }

  const fh = await gracefullyOpenFile(outputFilePath).catch((err) => err);
  if (fh instanceof Error) {
    console.error(`Error writing output: ${explainErrorCode(fh)}`);
    process.exit(1);
  }
  const newContent = JSON.stringify(json, null, jsonIndent);
  await fh.writeFile(newContent);
  await fh.close();
  console.log(`Success: JSON written to ${outputFilePath}`);
  process.exit(0);
};

const isCommonJS = typeof require !== "undefined" && require.main === module;
const isESModule =
  import.meta.url === `file://${fileURLToPath(import.meta.url)}`;
const isRunningAsCli = isCommonJS || isESModule;

if (isRunningAsCli) {
  main(USERAGENTS_URL, OUTPUT_FILE, jsonIndent);
}
