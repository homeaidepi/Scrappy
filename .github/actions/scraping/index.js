const core = require('@actions/core');
const { profile } = require('console');
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

    // throw an error if the secrets are not set
    if (secrets === undefined) {
      throw new Error("secrets is undefined");
    }

    // set the pdfFileName to a default if it is not set
    if (pdfFileName === undefined || pdfFileName === '') {
      pdfFileName = 'files/123.pdf';
    }
    // show the length of the secrets
    //console.log('Has secrets: ' + secrets.length + ' characters');

    //console.log('Decoding secrets...');
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

    // console.log('Parsed this many secrets: ' + Object.keys(parsedSecrets).length + ' secrets');

    console.log('Setting secrets as environment variables...');
    // set the secrets as environment variables
    Object.keys(parsedSecrets).forEach(key => {
      if (key !== undefined && parsedSecrets[key] !== undefined) {
        process.env[key] = parsedSecrets[key];
      }
    });

    // get the file name resolve to a local path atm
    pdfFileName = path.resolve(pdfFileName);

    console.log(`Scrappy PDF FileName: ${pdfFileName}`);
    const pdfParser = new PDFParser(this, 1);
    console.log('PDF Parser Created');

    pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
    pdfParser.on("pdfParser_dataReady", pdfData => {
      console.log("Scrappy Processing PDF");
      const parsedPages = parsePages(pdfData);
      const orderedText = orderText(parsedPages);
      printMeta(pdfData);
      printText(orderedText, 2);
    });

    await pdfParser.loadPDF(pdfFileName, 1).then(() => {
      console.log('Scrappy Loaded PDF');
    });

    core.setOutput("time", new Date().toTimeString());
    core.setOutput("result", result);

  } catch (error) {
    core.setFailed(error.message);
    console.log(error);
  }
}

const printMeta = (pdfData) => {
  let meta = pdfData.Meta;
  // for each field in the meta object print it out
  Object.keys(meta).forEach(key => {
    // format the creation date
    if (key === 'CreationDate' || key === 'ModDate') {
      // date format is written like "D:20210914154800-07'00'"
      // we need to remove the D: and the timezone
      let date = cleanDateValue(meta[key]);
      console.log(`${key}: ${date}`);
      return;
    }
    console.log(`${key}: ${meta[key]}`);
  });
};

const cleanDateValue = (date) => {
  return date.replace('D:', '').replace(/-07'00'/, '');
};

const parsePages = (pdfData) => {
  const pages = pdfData.Pages;
  const parsedPages = pages.map(page => {
    const parsedText = parseText(page.Texts);
    return parsedText;
  });
  return parsedPages;
};

const parseText = (texts) => {
  const parsedText = texts.map(text => {
    const parsed = {
      x: text.x,
      y: text.y,
      text: decodeURIComponent(text.R[0].T)
    };
    return parsed;
  });
  return parsedText;
}

const orderText = (parsedPages) => {
  const orderedText = parsedPages.map(page => {
    const ordered = page.sort((a, b) => a.y - b.y);
    return ordered;
  });
  return orderedText;
};

const printText = (orderedText, numberOfPagesToOutput) => {
  orderedText.forEach((page, pageIndex) => {
    if (pageIndex + 1 > numberOfPagesToOutput) {
      return;
    }
    console.log(`Page ${pageIndex + 1}`);


    let profile = null // default profile
    // TODO determine the profile to load

    return processProfile(profile, page, orderedText, pageIndex);

  });
};

const processProfile = (profile, page, orderedText, pageIndex) => {
  switch (profile) {
    case "Profile1":
    default:
      return processProfile1(page, orderedText, pageIndex);
    case "Profile2":
      //return processProfile2(page, orderedText, pageIndex);
      break;
    case "Profile3":
      //return processProfile3(page, orderedText, pageIndex);
      break;
  }
}

const processProfile1 = (page, orderedText, pageIndex) => {
  let meterStatus = '';
  let pressureBase = '';
  let contactHr = '';
  let temperatureBase = '';
  let atmosPressure = '';
  let calcMethod = '';
  let zMethod = '';
  let tubeID = '';
  let tapLocation = '';
  let tapType = '';
  let fullWellStream = '';
  let wvTechnique = '';
  let wvMethod = '';
  let hvCondition = '';
  let meterType = '';
  let interval = '';
  // let CO2 = '';
  // let N2 = '';
  // let C1 = '';
  // let C2 = '';
  // let C3 = '';
  // let IC4 = '';
  // let NC4 = '';
  // let IC5 = '';
  // let NC5 = '';
  // let NEO = '';
  // let C6 = '';
  // let C7 = '';
  // let C8 = '';
  // let C9 = '';
  // let C10 = '';
  // let AR = '';
  // let CO = '';
  // let H2 = '';
  // let O2 = '';
  // let He = '';  
  // let H2O = '';
  // let H2S = '';
  // let H2Sppm = '';

  page.forEach((element, elementIndex) => {
    // exclude elements with no text
    if (element.text === '' || element.text === ' ' || element.text === '\n') {
      return;
    }

    // skip elements 11-19, 26-32, 62-68, 71-74
    if ((elementIndex > 10 && elementIndex < 20) || (elementIndex > 24 && elementIndex < 33) || (elementIndex > 61 && elementIndex < 69)) {
      return;
    }

    // Meter Status element 9 is the key and value is element 8
    if (elementIndex === 8 || elementIndex === 9) {
      meterStatus = outputKeyAndValueFromPage(orderedText, pageIndex, 9, 8);
      return;
    }
    // # Pressure Base element 10 is the value  and element 11 is the key
    if (elementIndex === 9 || elementIndex === 10) {
      pressureBase = outputKeyAndValueFromPage(orderedText, pageIndex, 11, 10);
      return;
    }
    // # Contact Hr. element 20 is the value element 21 is the key
    if (elementIndex === 19 || elementIndex === 20) {
      contactHr = outputKeyAndValueFromPage(orderedText, pageIndex, 21, 20);
      return;
    }
    // Temperature Base Element 23 is is the key Element 24 is the value
    if (elementIndex === 22 || elementIndex === 23) {
      temperatureBase = outputKeyAndValueFromPage(orderedText, pageIndex, 23, 24);
      return;
    }

    // dont include "Element" wording if the index is less then 25
    // if (elementIndex < 25) {
    //   console.log(`${element.text}`);
    //   return;
    // }

    console.log(`Element ${elementIndex + 1}: ${element.text}`);

  });

}

const outputKeyAndValueFromPage = (orderedText, pageIndex, keyIndex, valueIndex) => {
  let { key, value } = getKeyValuePairs(orderedText, pageIndex, keyIndex, valueIndex);
  if (key !== '' && value !== '') { console.log(`${key} ${value}`); }
}

const getKeyValuePairs = (orderedText, pageIndex, keyIndex, valueIndex) => {
  const key = orderedText[pageIndex][keyIndex - 1].text;
  const value = orderedText[pageIndex][valueIndex - 1].text;
  return { key, value };
};

// const stringifyNestedObjects = (key, value) => {
//   if (typeof value === 'object' && value !== null) {
//     return JSON.stringify(value); // stringify nested objects
//   }
//   return value; // return other values as is
// };

async function run() {
  await Promise.all([
    await processPdf()
  ]);
}

run()


