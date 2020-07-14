#!/usr/bin/env node

import meow from 'meow';
import execa from 'execa';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import {
  pascalCase as toPascalCase,
  paramCase as toParamCase,
} from 'change-case';
import resolveAsBin from 'resolve-as-bin';

import { getModularRoot } from './getModularRoot';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
// See https://github.com/facebook/create-react-app/blob/f36d61a/packages/react-scripts/bin/react-scripts.js#L11-L16
process.on('unhandledRejection', (err) => {
  throw err;
});

const cracoBin = resolveAsBin('craco');
const cracoConfig = path.join(__dirname, '..', 'craco.config.js');

function execSync(
  file: string,
  args: string[],
  options: { log?: boolean } & execa.SyncOptions = { log: true },
) {
  const { log, ...opts } = options;
  if (log) {
    console.log(chalk.grey(`$ ${file} ${args.join(' ')}`));
  }
  return execa.sync(file, args, {
    stdin: process.stdin,
    stderr: process.stderr,
    stdout: process.stdout,
    ...opts,
  });
}

function isYarnInstalled(): boolean {
  try {
    execa.sync('yarn', ['-v']);
    return true;
  } catch (err) {
    return false;
  }
}

function run() {
  const cli = meow({
    description: 'Dashboards for a new generation',
    help: `
  Usage:
    $ modular add <widget-name>
    $ modular start
    $ modular build
    $ modular test
`,
  });

  if (isYarnInstalled() === false) {
    console.error(
      'Please install `yarn` before attempting to run `modular-scripts`.',
    );
    process.exit(1);
  }

  const command = cli.input[0];
  switch (command) {
    case 'add':
      return addWidget(cli.input[1]);
    case 'test':
      return test(process.argv.slice(3));
    case 'start':
      return start();
    case 'build':
      return build();
    default:
      console.log(cli.help);
      process.exit(1);
  }
}

function addWidget(name: string) {
  const modularRoot = getModularRoot();

  const newWidgetPackageName = toParamCase(name);
  const newWidgetComponentName = toPascalCase(name);

  const newWidgetPath = path.join(modularRoot, 'widgets', newWidgetPackageName);
  const templatePath = path.join(__dirname, '..', 'template');

  // create a new widget source folder
  if (fs.existsSync(newWidgetPath)) {
    console.error(`The widget named ${name} already exists!`);
    process.exit(1);
  }

  fs.mkdirpSync(newWidgetPath);
  fs.copySync(path.join(templatePath, 'widgets/starter'), newWidgetPath);

  const widgetRootFilePaths = fs
    .readdirSync(newWidgetPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() === false)
    .map((file) => path.join(newWidgetPath, file.name));

  for (const widgetFilePath of widgetRootFilePaths) {
    fs.writeFileSync(
      widgetFilePath,
      fs
        .readFileSync(widgetFilePath, 'utf8')
        .replace(/PackageName\$\$/g, newWidgetPackageName)
        .replace(/ComponentName\$\$/g, newWidgetComponentName),
    );
  }

  execSync('yarn', [], { cwd: newWidgetPath });

  execSync('yarn', ['prettier'], {
    cwd: modularRoot,
  });
}

function test(args: string[]) {
  const modularRoot = getModularRoot();

  return execSync(cracoBin, ['test', '--config', cracoConfig, ...args], {
    cwd: path.join(modularRoot, 'app'),
    log: false,
  });
}

function start() {
  const modularRoot = getModularRoot();

  execSync(cracoBin, ['start', '--config', cracoConfig], {
    cwd: path.join(modularRoot, 'app'),
    log: false,
  });
}

function build() {
  const modularRoot = getModularRoot();

  execSync(cracoBin, ['build', '--config', cracoConfig], {
    cwd: path.join(modularRoot, 'app'),
    log: false,
  });
}

try {
  void run();
} catch (err) {
  console.error(err);
}

// TODOS
// - remove craco, meow, etc
// - make sure react/react-dom have the same versions across the repo
// fix stdio coloring
// verify IDE integration
// how do you write tests for this???
// sparse checkout helpers
// auto assign reviewers???
// SOON
// - show an actual example working, with an app registry and everything
// - try to use module federation? will need to fork react-scripts and/or webpack

// unanswered questions
//   - global store/data flow?
//   - drilldown pattern
//   - filters
//   etc etc

// desktop / RN / custom renderers
// er, angular?