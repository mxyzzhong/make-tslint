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
    clearInterval(interval);
  };
}

function writeFile(url) {
  return new Promise((res, rej) => {
    const writeStream = fs.createWriteStream(lintJsonPath);
    const client = https.get(url);

    client.on('response', response => {
      if (response.statusCode === 200) {
        response.pipe(writeStream);
      } else {
        rej(
          Error(
            `\x1b[31m${response.statusMessage}\n\x1b[0mDownload file: \x1b[33m${url}\x1b[0m failed`
          )
        );
      }
    });

    client.on('close', () => {
      setImmediate(res);
    });

    client.on('error', error => {
      rej(error);
    });
  });
}

function installPkgs() {
  return new Promise((res, rej) => {
    const lintJson = require(lintJsonPath);
    const pkgs = lintJson.extends;
    if (Array.isArray(pkgs) && pkgs.length) {
      exec(`npm i tslint ${pkgs.join(' ')}  --save-dev`, err => {
        if (err) {
          rej(err);
        }
        res();
      });
    }
  });
}

function addLintScript() {
  return new Promise((res, rej) => {
    const packageJsonPath = path.resolve(process.cwd(), './package.json');
    const packageJson = require(packageJsonPath);
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts.lint = 'tslint src/**/*.ts{,x}';
    fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), err => {
      if (err) {
        rej(err);
      }
      res();
    });
  });
}

let jsonUrl = config.jsonUrl;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question(`Enter the json url, default: ${jsonUrl}\n`, async url => {
  if (url) {
    jsonUrl = url;
  }
  rl.close();
  const stopLoading = loading();
  try {
    await writeFile(jsonUrl);
    await installPkgs();
    await addLintScript();
  } catch (e) {
    stopLoading();
    console.error(`\x1b[31mfailed: ${e.message}\x1b[0m`);
    process.exit();
  }
  console.log('\x1b[32mtslint installed\x1b[0m');
  process.exit();
});
