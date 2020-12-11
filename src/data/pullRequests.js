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

  const promises = users.map(async (currentUser) => {
    let currentCursor = ''
    
    while (currentCursor != undefined) {

      if (currentCursor != '') { 
        currentCursor = ', after: "' + currentCursor + '"' 
      }

      let pullRequestsQuery = gql`
        {
          user(login: "${currentUser}") {
            pullRequests(first: 50, orderBy: {field: CREATED_AT, direction: DESC}${currentCursor}) {
              totalCount
              edges {
                cursor
                node {
                  state
                  createdAt
                  repository {
                    name
                  }
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
          if (edge.node.week >= startWeek && edge.node.week <= endWeek)
            data.push(edge.node)
        })

        if (ghData.user.pullRequests.edges.length > 0) {
          let firstPR = ghData.user.pullRequests.edges[ghData.user.pullRequests.edges.length - 1]
          currentCursor = firstPR.cursor
        }
      }
    }
  })

  await Promise.all(promises)
  return data

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

async function showPullRequestsGraph (prData, startWeek, endWeek) {

  let prByWeek = []
  for (var i = startWeek; i <= endWeek; i++) {
    const prQuantity = prData.filter((prItem) => {
      return prItem.week === i
    }).length
    prByWeek.push([i,prQuantity])
  }

  console.log(babar(prByWeek, {
    caption: "PRs do time nas últimas semanas"
  }))
}

const pullRequests = async (users, start, end) => {
  let prData = await getData(users, start, end)
  console.clear()
  showPullRequestsGraph(prData, start, end)
  showPeopleStats(prData, users)
}

export default pullRequests
