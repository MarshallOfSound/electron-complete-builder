"use strict"

const fs = require("fs")
const path = require("path")
const packageJson = readPackageJson(path.join(process.cwd(), "package.json"))

const DEFAULT_APP_DIR_NAME = "app"

function reportResult(result) {
  if (result.status != 0) {
    console.error(result)
    throw result.error
  }
}

function readPackageJson(path) {
  try {
    return JSON.parse(fs.readFileSync(path))
  }
  catch (e) {
    if (e instanceof SyntaxError) {
      console.error(path + " is not a valid JSON file")
    }
    throw e
  }
}

exports.installDependencies = function (arch, appDir) {
  if (appDir == null) {
    appDir = "app"
  }

  const electronPrebuiltDep = packageJson.devDependencies["electron-prebuilt"]
  if (electronPrebuiltDep == null) {
    throw new Error("Cannot find electron-prebuilt dependency to get electron version")
  }

  const env = Object.assign(process.env, {
    npm_config_disturl: "https://atom.io/download/atom-shell",
    npm_config_target: electronPrebuiltDep.substring(1),
    npm_config_runtime: "electron",
    HOME: require("os").homedir() + "/.electron-gyp",
  })

  if (arch != null) {
    env.npm_config_arch = arch
  }

  const processWorkingDirectory = path.join(process.cwd(), appDir)
  console.log("Installing production dependencies to " + processWorkingDirectory)

  let npmExecPath = process.env.npm_execpath || process.env.NPM_CLI_JS
  let npmExecArgs = ["install"]
  if (npmExecPath == null) {
    npmExecPath = "npm"
  }
  else {
    npmExecArgs.unshift(npmExecPath)
    npmExecPath = (process.env.npm_node_execpath || process.env.NODE_EXE || process.env.NODE_EXE || "node")
  }
  reportResult(require("child_process").spawnSync(npmExecPath, npmExecArgs, {
    cwd: processWorkingDirectory,
    stdio: "inherit",
    env: env
  }))
}

exports.reportResult = reportResult
exports.readPackageJson = readPackageJson
exports.packageJson = packageJson

exports.commonArgs = [
  {
    name: "appDir",
    type: String,
    defaultValue: DEFAULT_APP_DIR_NAME,
    description: "Relative (to the working directory) path to the folder containing the application package.json"
  }
]