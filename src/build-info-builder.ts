import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import * as fs from 'fs-extra';
import * as path from 'path';

interface Options extends JsonObject {
  output: string | null
}

export default createBuilder(buildInfoBuilder);

async function buildInfoBuilder(options: Options, context: BuilderContext): Promise<BuilderOutput> {
  const project = context.target?.project;
  if (!project) {
    throw new Error('build-info builder has to be run in a project.');
  }

  const projectMetadata = await context.getProjectMetadata(project);
  const projectRoot     = path.resolve(context.workspaceRoot, projectMetadata.root as string);
  const packageJsonFile = path.resolve(projectRoot, 'package.json');

  let packageJson: JsonObject;
  try {
    packageJson = await import(packageJsonFile);
  } catch (e) {
    throw new Error(`Could not load package.json from ${packageJsonFile}: \n${e.message}`);
  }

  const buildInfoFile = !!options.output
    ? path.resolve(projectRoot, options.output)
    : defaultOutput(projectRoot, projectMetadata);

  await fs.mkdirp(path.dirname(buildInfoFile));
  await fs.writeFile(buildInfoFile, buildBuildInfoContents(packageJson));

  return { success: true };
}

function buildBuildInfoContents(packageJson: JsonObject) {
  return `
// DO NOT EDIT. This is a generated file.
// tslint:disable

export const BUILD_INFO = {
  name: '${packageJson.name}',
  version: '${packageJson.version}',
  date: '${new Date().toISOString()}',
};
`;
}

function defaultOutput(projectRoot: string, projectMetadata: JsonObject) {
  return path.resolve(
    projectRoot,
    projectMetadata.sourceRoot as string,
    'environments',
    'build-info.ts',
  );
}
