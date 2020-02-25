# ngx-build-info

An Angular CLI builder which generates a build info file.

## Installation

Install the builder:

```shell script
npm install -D ngx-build-info
```

And add a target to the project you want to generate a build info file for in `angular.json`:

```json
{
  ...
  "projects": {
    "app": {
      "architect": {
        "build-info": {
          "builder": "ngx-build-info:build-info" 
        }
      }
    } 
  }
}
``` 

The builder expects to find a `package.json` file in the project root dir, with `name` and
`version`.

The builder also expects to be run in a git repository.

## Options

- **output**: The file name of the build file relative to the project root. The default is
`{PROJECT_ROOT}/{SOURCE_ROOT}/environments/build-info.ts`.

## Usage

Run the builder when the build info file should be (re)generated.

```shell script
ng run app:build-info
```

## Build Info

The build info file contains the following:

```typescript
export const BUILD_INFO = {
  "name": "a",
  "version": "1.0.0",
  "date": "2020-02-25T02:57:46.420Z",
  "branch": "master",
  "rev": "5cbf0ca677",
  "tag": null,
  "commitsSinceLastTag": 0,
  "authorDate": "2020-02-25T02:00:29.000Z",
  "buildNumber": 42
};
```

- **name**: The name in `package.json` of the project the builder is configured in.
- **version**: The version in `package.json` of the project the builder is configured in.
- **date**: The date when the build info was generated.
- **branch**: The current git branch of the repo.
- **rev**: The abbreviated sha of the current git commit.
- **tag**: The last tag in the history of the current commit.
- **commitsSinceLastTag**: The number of commits between the current commit and the last tag.
- **authorDate**: The date when the current commit was authored.
- **buildNumber**: The build number from the one of these environment variables:
    - `BUILD_NUMBER`
    - `CIRCLE_BUILD_NUM`
    - `TRAVIS_BUILD_NUMBER`
