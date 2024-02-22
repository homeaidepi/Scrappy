const core = require('@actions/core');
const { profile } = require('console');
// const axios = require('axios');
// const { Octokit } = require("@octokit/rest");
// const fetch = require("cross-fetch");
const fs = require('fs');
const { get } = require('http');
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
      let date = meta[key].replace("D:", "").replace(/-07'00'/, "");
      // format the date to be more readable
      date = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)} ${date.slice(8, 10)}:${date.slice(10, 12)}:${date.slice(12, 14)}`;
      console.log(`${key}: ${date}`);
      return;
    }
    if (key !== "Metadata") {
      console.log(`${key}: ${meta[key]}`);
    }
  });
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
  let rowDay = '';
  let rowDifferential = '';
  let rowPressure = '';
  let rowTemperature = '';
  let rowFlowTime = '';  
  let rowRelativeDensity = ''; 
  let rowPlate ='';
  let rowVolume = '';
  let rowHeatingValue = '';
  let rowEnergy = '';

  let rows = [];
  let total = {};
  let summary = '';

  let elementsToSkip = [11, 12, 13, 14, 15, 16, 17, 18, 19, 25, 26, 27, 28, 29, 30, 31, 62, 63, 64, 65, 66, 67, 68, 71, 72, 73, 74];

  page.forEach((element, elementIndex) => {
    // exclude elements with no text
    if (element.text === '' || element.text === ' ' || element.text === '\n') {
      return;
    }

    // skip elements 
    if (elementsToSkip.includes(elementIndex + 1)) {
      return;
    }

    // Meter Status element element 8 is the value and 9 is the key
    meterStatus = getValue(orderedText, pageIndex, 8);
    // # Pressure Base element 10 is the value  and element 11 is the key
    pressureBase = getValue(orderedText, pageIndex, 10);
    // # Contact Hr. element 20 is the value element 21 is the key
    contactHr = getValue(orderedText, pageIndex, 20);
    // Temperature Base Element 23 is is the key Element 24 is the value
    temperatureBase = getValue(orderedText, pageIndex, 24);
    // # Atmospheric Pressure element 34 is the key and element 37 is the value
    atmosPressure = getValue(orderedText, pageIndex, 37);
    // # Calc Method element 47 is the key and element 48 is the value
    calcMethod = getValue(orderedText, pageIndex, 48);
    // # Z Method element 50 is the key and element 52 is the value
    zMethod = getValue(orderedText, pageIndex, 52);
    // # Tube ID element 60 is the key and element 59 is the value
    tubeID = getValue(orderedText, pageIndex, 59);
    // # Tap Location element 72 is the key and element 73 is the value
    tapLocation = getValue(orderedText, pageIndex, 73);
    // # Tap Type element 79 is the key and element 78 is the value
    tapType = getValue(orderedText, pageIndex, 78);
    // # Full Well Stream element 35 is the key and element 33 is the value
    fullWellStream = getValue(orderedText, pageIndex, 33);
    // # WV Technique element 39 is the key and element 38 is the value
    wvTechnique = getValue(orderedText, pageIndex, 38);
    // # WV Method element 49 is the key and element 51 is the value
    wvMethod = getValue(orderedText, pageIndex, 51);
    // # HV Condition element 61 is the key and element 58 is the value
    hvCondition = getValue(orderedText, pageIndex, 58);
    // # Meter Type element 71 is the key and element 70 is the value
    meterType = getValue(orderedText, pageIndex, 70);
    // # Interval element 76 is the key and element 77 is the value
    interval = getValue(orderedText, pageIndex, 77);

    // now go get rows
    rows = getRows(orderedText, pageIndex);

    // now get the total
    total = getTotal(orderedText, pageIndex);

    // now get the summary
    summary = getSummary(orderedText, pageIndex);

    // we need to get row data now and then we can process the elements
    // row 1 starts at element 110 and ends at element 121
    //console.log(`Element ${elementIndex + 1}: ${element.text}`);

  });
  
  let pageOutput = {
    page : pageIndex + 1,
    meterStatus,
    pressureBase,
    contactHr,
    temperatureBase,
    atmosPressure,
    calcMethod,
    zMethod,
    tubeID,
    tapLocation,
    tapType,
    fullWellStream,
    wvTechnique,
    wvMethod,
    hvCondition,
    meterType,
    interval,
    rows,
    total,
    summary
  };

  console.log(JSON.stringify(pageOutput, null, 2));
}

const getSummary = (orderedText, pageIndex) => {
  let summary = getValue(orderedText, pageIndex, 409);
  return summary;
}

const getTotal = (orderedText, pageIndex) => {
  let total = {};
  let totalDifferential = getValue(orderedText, pageIndex, 406);
  let totalPressure = getValue(orderedText, pageIndex, 405);
  let totalTemperature = getValue(orderedText, pageIndex, 404);
  let totalFlowTime = getValue(orderedText, pageIndex, 402);
  let totalRelativeDensity = getValue(orderedText, pageIndex, 401);
  let totalVolume = getValue(orderedText, pageIndex, 407);
  let totalEnergy = getValue(orderedText, pageIndex, 403);

  total = {
    totalDifferential,
    totalPressure,
    totalTemperature,
    totalFlowTime,
    totalRelativeDensity,
    totalVolume,
    totalEnergy
  };

  return total;

}

const getRows = (orderedText, pageIndex) => {
  let rows = [];
  let numOfRows = 30;
  for (let i = 0; i < numOfRows; i++) {
    rows.push(getRow(orderedText, pageIndex, i));
  }
  return rows;
}

const getRow = (orderedText, pageIndex, index) => {
  // rowDay = element 110 value
  rowDay = getValue(orderedText, pageIndex, 110 + ((index * 10)));
  // rowDifferential = element 109 value
  rowDifferential = getValue(orderedText, pageIndex, 109 + ((index * 10)));
  // rowPressure = element 108 value
  rowPressure = getValue(orderedText, pageIndex, 108 + ((index * 10)));
  // rowTemperature = element 107 value
  rowTemperature = getValue(orderedText, pageIndex, 107 + ((index * 10)));
  // rowFlowTime = element 106 value
  rowFlowTime = getValue(orderedText, pageIndex, 106 + ((index * 10)));
  // rowRelativeDensity = element 105 value
  rowRelativeDensity = getValue(orderedText, pageIndex, 105 + ((index * 10)));
  // rowPlate = element 104 value
  rowPlate = getValue(orderedText, pageIndex, 104 + ((index * 10)));
  // rowVolume = element 103 value
  rowVolume = getValue(orderedText, pageIndex, 103 + ((index * 10)));
  // rowHeatingValue = element 102 value
  rowHeatingValue = getValue(orderedText, pageIndex, 102 + ((index * 10)));
  // rowEnergy = element 101 value
  rowEnergy = getValue(orderedText, pageIndex, 101 + ((index * 10)));

  return {
    rowDay,
    rowDifferential,
    rowPressure,
    rowTemperature,
    rowFlowTime,
    rowRelativeDensity,
    rowPlate,
    rowVolume,
    rowHeatingValue,
    rowEnergy
  };
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

const getValue = (orderedText, pageIndex, valueIndex) => {
  let value = orderedText[pageIndex][valueIndex -1].text;

  // remove any preceding or trailing white space
  value = value.trim();
  return value;
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


