const crypto = require("crypto-js");
const xml2js = require("xml2js");
const fs = require("fs");
const path = require("path");

const DIRECTORY = "demo_order";
const BUNDLE_SIZE = 50;

// Helper function to hash a text using SHA-3
function hashSha3(text) {
  return crypto.SHA3(text, { outputLength: 256 }).toString(crypto.enc.Hex);
}

// Recursive function to traverse the XML tree and hash each field
function traverseAndHash(node, parentTag = null) {
  let hashDict = {};
  for (let childTag in node) {
    if (typeof node[childTag] === "object") {
      let childHashDict = traverseAndHash(
        node[childTag],
        (parentTag = childTag)
      );
      hashDict = { ...hashDict, ...childHashDict };
    } else {
      let hashedValue = hashSha3(node[childTag]);
      let key = parentTag ? `${parentTag}-${childTag}` : childTag;
      hashDict[key] = hashedValue;
    }
  }
  return hashDict;
}

// Function to process an XML file
async function processXmlFile(filePath) {
  let xmlData = fs.readFileSync(filePath);
  let parsedData = await xml2js.parseStringPromise(xmlData);

  let xmlHashDict = traverseAndHash(parsedData);
  // Concatenate the hashes in the xmlHashDict
  let concatenatedHashes = Object.values(xmlHashDict).join("");

  // Compute the overarching hash
  let overarchingHash = hashSha3(concatenatedHashes);

  return overarchingHash;
}

// Function to process XML files in a directory and its subdirectories
async function processXmlFilesInDirectory(directory) {
  let hashes = {};

  try {
    const items = await fs.promises.readdir(directory, { withFileTypes: true });

    // Listing all items using forEach
    for (const item of items) {
      // Check if the item is a directory
      if (item.isDirectory()) {
        // Process the directory recursively
        let subDirHashes = await processXmlFilesInDirectory(
          path.join(directory, item.name)
        );
        hashes = { ...hashes, ...subDirHashes };
      }

      // Check if the file has a .xml extension
      if (item.isFile() && item.name.endsWith(".xml")) {
        // Process the file
        let filePath = path.join(directory, item.name);
        // await till the file is processed

        let hash = await processXmlFile(filePath);
        hashes[filePath] = hash;

        // Move the file to the "processed" directory
        // moveXmlFilesToProcessedDirectory(filePath);
      }
    }
  } catch (error) {
    console.log("Unable to scan directory: " + error);
  }
  return hashes;
}

// Function to move XML files to processed directory
async function moveXmlFilesToProcessedDirectory(filePath) {
  try {
    // processed directory
    const baseProcessedDir = path.join(path.dirname(DIRECTORY), "processed");

    // Get the relative directory path from the current working directory
    const fileDir = path.dirname(filePath);
    const relativeDirPath = path.relative(DIRECTORY, fileDir);

    // Generate a unique filename using the current timestamp
    const originalFileName = path.basename(filePath, ".xml");
    const timestamp = new Date().getTime();
    const newFileName = `${originalFileName}.processed(${timestamp}).xml`;

    // Create the new file path with the relative directory hierarchy
    const processedDir = path.join(baseProcessedDir, relativeDirPath);
    const newFilePath = path.join(processedDir, newFileName);

    // Create the "processed" directory if it doesn't exist
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir);
    }

    // Move the file to the "processed" directory
    await fs.promises.rename(filePath, newFilePath);
  } catch (error) {
    console.log("Unable to move file to processed directory: " + error);
  }
}

// Start processing XML files in the directory and its subdirectories
async function hasher() {
  let directoryPath = path.join(__dirname, DIRECTORY);
  let hashPerFile = await processXmlFilesInDirectory(directoryPath);
  let hashes = Object.values(hashPerFile);
  let length = BUNDLE_SIZE;
  let concatHash = "";

  if (hashes.length < BUNDLE_SIZE) {
    length = hashes.length;
  }

  for (let i = 0; i < length; i++) {
    concatHash += hashes[i];
  }
  let overreachingHash = hashSha3(concatHash);
  console.log(overreachingHash);
  return overreachingHash;
}

module.exports = hasher;
