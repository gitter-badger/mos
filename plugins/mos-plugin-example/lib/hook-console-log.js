'use strict'
module.exports = hookConsoleLog

const callsites = require('callsites')
const removeLastEOL = require('../../remove-last-eol')
const normalizePath = require('normalize-path')

const originalLog = console.log

function hookConsoleLog (filePath) {
  console.log = function () {
    const site = getCallsiteForFile(callsites(), filePath)

    originalLog('\n$\n' + JSON.stringify({
      message: getRealConsoleOutput.apply(null, arguments),
      line: site.line - 1,
      column: site.column,
    }))
  }
}

function getRealConsoleOutput () {
  const originalWrite = process.stdout.write

  let message
  process.stdout.write = msg => { message = msg }

  originalLog.apply(console, arguments)

  process.stdout.write = originalWrite

  return removeLastEOL(message)
}

function getCallsiteForFile (callsites, fileName) {
  const stack = trace(callsites)
  return stack.find(callsite => callsite.file === fileName)
}

function trace (callsites) {
  return callsites.map(callsite => ({
    file: normalizePath(callsite.getFileName()) || '?',
    line: callsite.getLineNumber(),
    column: callsite.getColumnNumber(),
  }))
}
