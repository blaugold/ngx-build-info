# ngx-build-info

An Angular CLI builder which generates a build info file.

## Installation

Install the build:

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

## Usage

Run the builder when the build info file should be (re)generated.

```shell script
ng run app:build-info
```
