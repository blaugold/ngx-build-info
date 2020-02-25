import { Architect } from '@angular-devkit/architect';
import { ArchitectHost } from '@angular-devkit/architect/src/internal';
import { TestingArchitectHost } from '@angular-devkit/architect/testing';
import { JsonObject, schema } from '@angular-devkit/core';
import { expect } from 'chai';
import * as fs from 'fs-extra';
import * as gitRepoInfo from 'git-repo-info';
import * as path from 'path';

describe('Build Info Builder', () => {
  let architect: Architect;
  let architectHost: TestingArchitectHost;
  const projects: { [projectName: string]: JsonObject } = {};

  beforeEach(async () => {
    const registry = new schema.CoreSchemaRegistry();
    registry.addPostTransform(schema.transforms.addUndefinedDefaults);

    const workspaceDir = await makeTestWorkspaceDir();

    architectHost =
      new TestingArchitectHost(workspaceDir, workspaceDir, mockArchitectHost(projects));
    architect     = new Architect(architectHost, registry);

    await architectHost.addBuilderFromPackage(path.resolve(__dirname, '..'));
  });


  it('should put build-info.ts in environments dir per default', async () => {
    const { defaultBuildInfoFile, target } = await prepareProject({ name: 'a', version: '1.0.0' });

    architectHost.addTarget(target, 'ngx-build-info:build-info');

    const run = await architect.scheduleTarget(target, {});
    await run.result;
    await run.stop();

    await import(defaultBuildInfoFile);
  });

  it('should put build-info in output relative to project root', async () => {
    const { metadata, target } = await prepareProject({ name: 'a', version: '1.0.0' });

    architectHost.addTarget(target, 'ngx-build-info:build-info');

    const run = await architect.scheduleTarget(target, { output: 'build-info.ts' });
    await run.result;
    await run.stop();

    const buildInfoFile = path.resolve(
      architectHost.workspaceRoot,
      metadata.root,
      'build-info.ts',
    );

    await import(buildInfoFile);
  });

  it('should source name and version from package.json', async () => {
    const { target, defaultBuildInfoFile } = await prepareProject({ name: 'a', version: '1.0.0' });

    architectHost.addTarget(target, 'ngx-build-info:build-info');

    const run = await architect.scheduleTarget(target);
    await run.result;
    await run.stop();

    const { BUILD_INFO } = await import(defaultBuildInfoFile);
    expect(BUILD_INFO.name).to.eq('a');
    expect(BUILD_INFO.version).to.eq('1.0.0');
  });

  it('should include git repo info', async () => {
    const { target, defaultBuildInfoFile } = await prepareProject({ name: 'a', version: '1.0.0' });

    architectHost.addTarget(target, 'ngx-build-info:build-info');

    const run = await architect.scheduleTarget(target);
    await run.result;
    await run.stop();

    const gitInfo = gitRepoInfo();

    const { BUILD_INFO } = await import(defaultBuildInfoFile);
    expect(BUILD_INFO.branch).to.eq(gitInfo.branch);
    expect(BUILD_INFO.rev).to.eq(gitInfo.abbreviatedSha);
    expect(BUILD_INFO.tag).to.eq(gitInfo.lastTag);
    expect(BUILD_INFO.commitsSinceLastTag)
      .to.eq(gitInfo.commitsSinceLastTag == Infinity ? null : gitInfo.commitsSinceLastTag);
    expect(BUILD_INFO.authorDate).to.eq(gitInfo.authorDate);
  });

  it('should include build number', async () => {
    const { target, defaultBuildInfoFile } = await prepareProject({ name: 'a', version: '1.0.0' });
    const buildNumber                      = 42;

    process.env['BUILD_NUMBER'] = buildNumber.toString();

    architectHost.addTarget(target, 'ngx-build-info:build-info');

    const run = await architect.scheduleTarget(target);
    await run.result;
    await run.stop();

    const { BUILD_INFO } = await import(defaultBuildInfoFile);
    expect(BUILD_INFO.buildNumber).to.eq(buildNumber);
  });

  async function prepareProject({ name, version }: { name: string, version: string }) {
    const dir = await makeProjectDir(name);

    const packageJsonContent = { name, version };
    await writeProjectPackageJson(dir, packageJsonContent);

    const target   = { project: name, target: 'build-info' };
    const metadata = { root: `projects/${name}`, sourceRoot: 'src' };

    projects[target.project] = metadata;

    const defaultBuildInfoFile = path.resolve(
      architectHost.workspaceRoot,
      metadata.root,
      metadata.sourceRoot,
      'environments/build-info.ts',
    );

    return { dir, target, metadata, defaultBuildInfoFile };
  }

  async function makeProjectDir(name: string) {
    const dir = path.resolve(architectHost.workspaceRoot, `projects/${name}`);
    await fs.mkdirp(dir);
    return dir;
  }

  function writeProjectPackageJson(projectDir: string, packageJsonContent: { version: string }) {
    return fs.writeFile(
      path.resolve(projectDir, 'package.json'),
      JSON.stringify(packageJsonContent, null, 2),
    );
  }
});

async function makeTestWorkspaceDir() {
  const tmpDir = path.resolve(__dirname, '../.tmp');
  await fs.mkdirp(tmpDir);
  return fs.mkdtemp(path.resolve(tmpDir, 'build-info-test-workspace-'));
}

function mockArchitectHost(projects: { [p: string]: JsonObject }) {
  return {
    async getProjectMetadata(projectName: string): Promise<JsonObject | null> {
      return projects[projectName] || null;
    },
  } as ArchitectHost;
}
