const core = require('@actions/core');
const axios = require('axios');
const { Octokit } = require("@octokit/rest");
const fetch = require("cross-fetch");

async function processPdf() {
  let result = null;
  try {
    // get all the inputs
    let pdfFileName = core.getInput('pdfFileName');
    const secrets = core.getInput("secrets");

    if (secrets === undefined) {
        throw new Error("secrets is undefined");
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

    // using the octokit to get the pdf file 
    // or fetch it from some azure file blob or something
    //let result = await axios.default.get(url);
    
    //console.log(`result: ${result}`);
    core.setOutput("time", new Date().toTimeString());
    core.setOutput("result", JSON.stringify(result));
    
  } catch (error) {
    core.setFailed(error.message);
    console.log(error);
  }
}

async function run() {
  await Promise.all([
    await processPdf()
  ]);
}

run()


