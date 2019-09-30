#!/usr/bin/env node

const readline = require('readline');
const https = require('https');
const fs = require('fs');
const path = require('path');

const { exec } = require('child_process');

const config = require('./config.json');

const lintJsonPath = path.resolve(process.cwd(), './tslint.json');

function loading() {
  const chars = ['|', '/', '-', '\\'];
  let i = 0;

  const interval = setInterval(() => {
    process.stdout.write('\r' + chars[i++]);
    i &= chars.length - 1;
  }, 300);

  return () => {
    process.stdout.write('\r');
    clearInterval(interval)
  };
}

function writeFile(url) {
  const writeStream = fs.createWriteStream(lintJsonPath);
  const client = https.get(url);

  client.on('response', response => {
    if (response.statusCode === 200) {
      response.pipe(writeStream);
    } else {
      throw Error(
        `\x1b[31m${response.statusMessage}\n\x1b[0mDownload file: \x1b[33m${url}\x1b[0m failed`
      );
    }
  });

  client.on('close', () => {
    setImmediate(installPkgs);
  });

  client.on('error', error => {
    throw error;
  });
}

function installPkgs() {
  const lintJson = require(lintJsonPath);
  const pkgs = lintJson.extends;
  if (Array.isArray(pkgs) && pkgs.length) {
    const stopLoading = loading();
    exec(`npm i ${pkgs.join(' ')}  --save-dev`, err => {
      if (err) {
        throw err;
      }
      stopLoading();
      console.log('\x1b[32mtslint installed\x1b[0m');
    });
  }
}

let jsonUrl = config.jsonUrl;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question(`Enter the json url, default: ${jsonUrl}\n`, url => {
  if (url) {
    jsonUrl = url;
  }
  rl.close();
  writeFile(jsonUrl);
});
