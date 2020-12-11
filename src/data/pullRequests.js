"use strict"

import babar from 'babar'
import { GraphQLClient, gql } from 'graphql-request'

import getWeekNumber from '../helpers/date.js'

const ghEndpoint = 'https://api.github.com/graphql'
const graphQLClient = new GraphQLClient(ghEndpoint, {
    headers: {
      authorization: 'Bearer ' + process.env.GH_TOKEN,
    },
  })

async function getData(users, startWeek, endWeek) {
  let data = []
  let averageTimeToMerge = 0

  const promises = users.map(async (currentUser) => {
    let currentCursor = ''
    
    while (currentCursor != undefined) {

      if (currentCursor != '') { 
        currentCursor = ', after: "' + currentCursor + '"' 
      }

      let pullRequestsQuery = gql`
        {
          user(login: "${currentUser}") {
            pullRequests(first: 50, orderBy: {field: CREATED_AT, direction: DESC}, states: MERGED${currentCursor}) {
              totalCount
              edges {
                cursor
                node {
                  state
                  createdAt
                  repository {
                    name
                  }
                  mergedAt
                }
              }
            }
          }
        }
      `

      let ghData
      try {
        ghData = await graphQLClient.request(pullRequestsQuery)
      } 
      catch(e) {
        console.error(e)
      }

      currentCursor = undefined

      if (ghData) {
        ghData.user.pullRequests.edges.forEach((edge) => {
          edge.node.user = currentUser
          edge.node.week = getWeekNumber(new Date(edge.node.createdAt))
          if (edge.node.week >= startWeek && edge.node.week <= endWeek) {
            edge.node.timeToMerge = (Date.parse(edge.node.mergedAt) - Date.parse(edge.node.createdAt)) / 3600000
            averageTimeToMerge += edge.node.timeToMerge
            
            data.push(edge.node)
          }
        })

        if (ghData.user.pullRequests.edges.length > 0) {
          let firstPR = ghData.user.pullRequests.edges[ghData.user.pullRequests.edges.length - 1]
          currentCursor = firstPR.cursor
        }
      }
    }
  })

  await Promise.all(promises)
  averageTimeToMerge = averageTimeToMerge / data.length
 
  let weeks = []
  for (var i = startWeek; i <= endWeek; i++) {
    const weekPullRequests = data.filter((prItem) => {
      return prItem.week === i
    })

    let averageTimeToMerge = 0
    weekPullRequests.forEach((pullRequest) => {
      averageTimeToMerge += pullRequest.timeToMerge
    })
    averageTimeToMerge = averageTimeToMerge / weekPullRequests.length
    
    weeks.push({
      "week": i, 
      "prQuantity": weekPullRequests.length, 
      "averageTimeToMerge": averageTimeToMerge
    })
  }

  return { 
    "allData": data, 
    "weeks": weeks,
    "averageTimeToMerge": parseInt(averageTimeToMerge) 
  }

}

async function showPeopleStats (prData, users) {

  let prByUser = []

  const promises = users.map(async (currentUser) => {
    const prQuantity = prData.filter((pullRequest) => {
          return pullRequest.user === currentUser
        }).length
    prByUser.push(
      {
        currentUser, 
        prQuantity
      }
    )
  })
  await Promise.all(promises)
  
  console.table(prByUser)
}

function showAverageTimeToMerge(averageTimeToMerge) {
  console.log("-------------------------------------------")
  console.log(`Average time to merge: ${averageTimeToMerge} hours`)
  console.log("-------------------------------------------")
}

async function showTimeToMergeGraph (prData, startWeek, endWeek) {
  console.log(babar(
    prData.map(week => {
      return [week.week, week.averageTimeToMerge]
    }), 
    {
      caption: "Time to merge PR from the last 3 months"
    }
  ))
}

async function showPullRequestsGraph (prData, startWeek, endWeek) {
  console.log(babar(
    prData.map(week => {
      return [week.week, week.prQuantity]
    }), 
    {
      caption: "Team PR from the last 3 months (merged)"
    }
  ))
}

const pullRequests = async (users, start, end) => {
  let prData = await getData(users, start, end)
  console.clear()
  await showPullRequestsGraph(prData.weeks, start, end)
  await showPeopleStats(prData.allData, users)
  showAverageTimeToMerge(prData.averageTimeToMerge)
  await showTimeToMergeGraph(prData.weeks, start, end)
}

export default pullRequests
