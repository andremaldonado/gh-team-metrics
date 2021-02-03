"use strict"

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import pullRequests from './data/pullRequests.js'

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 --user "username1" --user "username2"')
  .array('user')
  .demandOption(['user'])
  .argv
const usersToFetch = argv.user
const startDate = new Date(Date.now() - 7776000000) // 3 months
const endDate = new Date(Date.now())

pullRequests(
  usersToFetch,
  startDate,
  endDate
).catch((error) => console.error(error))
