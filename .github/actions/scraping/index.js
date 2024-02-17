const core = require('@actions/core');
// const axios = require('axios');
// const { Octokit } = require("@octokit/rest");
// const fetch = require("cross-fetch");
const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');

async function processPdf() {
  let result = null;
  try {
    // get all the inputs
    let pdfFileName = core.getInput('pdfFileName');
    const secrets = core.getInput("secrets");

    if (secrets === undefined) {
        throw new Error("secrets is undefined");
    }
    if (pdfFileName === undefined || pdfFileName === '') {
      pdfFileName = 'files/123.pdf';
    }
    // show the length of the secrets
    console.log('Has secrets: ' + secrets.length + ' characters');

    console.log('Decoding secrets...');
    // the secrets are double base64 encoded, so we need to decode them twice
    const decodedSecrets = Buffer.from(secrets, 'base64').toString('ascii');
    // its double encoded, so we need to decode it again
    const decodedSecrets2 = Buffer.from(decodedSecrets, 'base64').toString('ascii');

    console.log('Parsing secrets...');
    // the secrets are like an .env file, so we need to parse by line break
    const parsedSecrets = decodedSecrets2.split('\n').reduce((acc, line) => {
        // split each line by the equals sign
        const [key, value] = line.split('=');
        // set the key and value in the accumulator
        acc[key] = value;
        return acc;
    }, {});

    console.log('Parsed this many secrets: ' + Object.keys(parsedSecrets).length + ' secrets');

    console.log('Setting secrets as environment variables...');
    // set the secrets as environment variables
    Object.keys(parsedSecrets).forEach(key => {
        if (key !== undefined && parsedSecrets[key] !== undefined) {
            process.env[key] = parsedSecrets[key];
        }
    });
    
    console.log(`pdfFileName: ${pdfFileName}`);

    // the pdf file is local to this execution
    // read the file and process with PDF Parser
    // or use some other library to extract the data

    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
    pdfParser.on("pdfParser_dataReady", pdfData => {
      console.log("Data Ready");
      console.log(pdfData);
      result = pdfParser.getRawTextContent();
      console.log('Result', result);
    });

    await pdfParser.loadPDF(pdfFileName, 1);

    // using the octokit to get the pdf file 
    // or fetch it from some azure file blob or something
    //let result = await axios.default.get(url);
    
    core.setOutput("time", new Date().toTimeString());
    core.setOutput("result", result);
    
  } catch (error) {
    core.setFailed(error.message);
    console.log(error);
  }
}

const stringifyNestedObjects = (key, value) => {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value); // stringify nested objects
  }
  return value; // return other values as is
};

async function run() {
  await Promise.all([
    await processPdf()
  ]);
}

run()


