"use strict"

const getWeekNumber = function(date) {
 
  var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  var dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1))
  const weekNumber = parseInt(yearStart.getUTCFullYear() + '' + Math.ceil((((d - yearStart) / 86400000) + 1)/7))
  return weekNumber

};

export default getWeekNumber
