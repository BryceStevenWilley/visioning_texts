// import { GraphemeSplitter } from '../lib/grapheme-splitter.js'

function splitBK (data, bIds, kIds, bName, kName, addressId) {
  const allIds = bIds.concat(kIds)
  const fullData = data.filter(function (row) {
    return allIds.includes(row.TYPE) && row.ADDRESS == addressId
  }).map(function (row) {
    if (bIds.includes(row.TYPE)) {
      return {
        name: bName,
        date: new Date(parseInt(row.DATE_SENT, 10)),
        ID: row.ID,
        BODY: row.BODY
      }
    } else { // in k_ids
      return {
        name: kName,
        date: new Date(parseInt(row.DATE_SENT, 10)),
        ID: row.ID,
        BODY: row.BODY
      }
    }
  })
  return { names: [bName, kName], data: fullData }
}

function splitBKFacebook (text) {
  const json = JSON.parse(text)
  const names = json.participants.map((p) => p.name)
  const data = json.messages.filter((msg) => {
    return msg.type === 'Generic' && msg.content
  }).map((msg) => {
    return {
      name: msg.sender_name,
      date: new Date(msg.timestamp_ms),
      ID: `${msg.sender_name}_${msg.timestamp_ms}`,
      BODY: decodeURIComponent(escape(msg.content))
    }
  })
  return {
    names: names,
    data: data
  }
}

const datetimeRegex = /(([0-9])?[0-9])([./])(([0-9])?[0-9])([./])(\d{2}|\d{4})(,)? (([0-9])?[0-9]):([0-9][0-9])(:[0-9][0-9])?( [aApP]\.?[mM]\.?)?/
const braceFront = /^\[/
const noBraceFront = /^/
const braceBack = /\]/

function splitBKWhatsapp (text) {
  let lines = text.split('\n').filter(function (d) { return d.length !== 0 })
  let useBraces = ''
  let dateSplit = '/'
  let useMeridian = ''
  let rmPeriods = false
  let delimStr = ''
  let idx = 0
  let testLine = lines[idx].trim()
  let dateLineRegex = datetimeRegex
  while (delimStr === '' && idx < lines.length) {
    if (dateLineRegex.test(testLine)) {
      if (testLine[0] === '[') {
        useBraces = '['
        delimStr = ']'
        dateLineRegex = new RegExp(braceFront.source +
                                         datetimeRegex.source + braceBack.source)
      } else {
        delimStr = '-'
        dateLineRegex = new RegExp(noBraceFront.source + datetimeRegex.source)
      }
    } else {
      idx += 1
      testLine = lines[idx].trim()
    }
  }

  if (idx === lines.length) {
    console.log('WARNING: did not match a date time anywhere in the file: example line: ' +
                    lines[0])
  }

  let sureParseInfo = lines.reduce(function (possibleParseInfo, l) {
    if (possibleParseInfo.regex) {
      return possibleParseInfo
    }
    if (!dateLineRegex.test(l)) {
      return possibleParseInfo // New lines middle of the message likely
    }

    const matches = l.match(dateLineRegex)
    if (matches[3] && matches[3] === '.' && matches[6] && matches[6] === '.') {
      dateSplit = '.'
    }
    if (matches[13]) {
      if (matches[13] === ' a.m.' || matches[13] === ' p.m.') {
        useMeridian = ' a'
        rmPeriods = true
      } else {
        rmPeriods = false
        if (matches[13] === ' AM' || matches[13] === ' PM') {
          useMeridian = ' A'
        } else {
          useMeridian = ' a'
        }
      }
    }
    let yearStr = 'YY'
    if (matches[7]) {
      if (matches[7].length === 2) {
        yearStr = 'YY'
      } else if (matches[7].length === 4) {
        yearStr = 'YYYY'
      } else {
        console.log('WARNING: Found a strange year format: ' + matches[7] + ', ' + l)
      }
    }
    const secondsStr = (matches[12]) ? ':ss' : ''
    const commaSep = (matches[8]) ? matches[8] : ''

    if (matches[1] && matches[4]) {
      const firstInt = parseInt(matches[1], 10)
      if (firstInt > 12) {
        const dateFmt = useBraces + 'D' + dateSplit + 'M' + dateSplit + yearStr +
                    commaSep + ' H:mm' + secondsStr + useMeridian
        return { regex: dateLineRegex, delim: delimStr, formats: [dateFmt] }
      }
      const secondInt = parseInt(matches[4], 10)
      if (secondInt > 12) {
        const dateFmt = useBraces + 'M' + dateSplit + 'D' + dateSplit + yearStr +
                    commaSep + ' H:mm' + secondsStr + useMeridian
        return { regex: dateLineRegex, delim: delimStr, formats: [dateFmt] }
      }
    }

    // ambiguity: still empty
    return {
      best_guess: useBraces + 'M' + dateSplit + 'D' + dateSplit + yearStr +
                ', H:mm' + secondsStr + useMeridian
    }
  }, {})

  if (!sureParseInfo.regex) {
    console.log("The input file has an ambiguous date format, i.e. couldn't tell if MM/DD or DD/MM. Using MM/DD")
    console.log('Example line: ' + lines[0])
    sureParseInfo.regex = dateLineRegex
    sureParseInfo = { regex: dateLineRegex, delim: delimStr, formats: [sureParseInfo.best_guess] }
  }

  lines = lines.reduce(function (total, l) {
    if (l.match(sureParseInfo.regex)) {
      total.push(l)
    } else {
      if (total.length > 0) {
        total[total.length - 1] = total[total.length - 1].concat(l)
      }
    }
    return total
  }, [])
  const fullData = lines.map(function (l) {
    const delimIdx = l.indexOf(sureParseInfo.delim)
    let timeStr = l.slice(0, delimIdx)
    if (rmPeriods) {
      timeStr = timeStr.replace('.', '')
    }
    const restStr = l.slice(delimIdx + 1)
    const colonIdx = restStr.indexOf(':')
    if (colonIdx === -1) {
      // Found a weird whatsapp notification. Delete
      return { name: 'DELETE_ME' }
    }
    const nameStr = restStr.slice(0, colonIdx)
    const msgStr = restStr.slice(colonIdx + 1)
    return {
      name: nameStr.trim().split(' ')[0],
      BODY: msgStr.trim(),
      date: moment(timeStr.trim(), sureParseInfo.formats).toDate()
    }
  })
  const fullFiltered = fullData.filter(function (d) {
    return d.name !== 'DELETE_ME'
  })
  const names = fullFiltered.reduce(function (total, d) {
    total.add(d.name)
    return total
  }, new Set())
  const listNames = Array.from(names)
  if (listNames.length > 2) {
    console.log('WARNING: only 2 participants are supported at the moment, we parsed multiple: ')
    console.log(listNames)
  }

  return { names: listNames, data: fullFiltered }
}

function wordSplit (row) {
  return row.BODY.replace(/[.,!?\t\n]/g, ' ')
}

function wordReduce (allWords, msg) {
  return allWords.concat(msg.split(' ').filter(function (str) {
    return str.length !== 0
  }))
}

function perPersonWordCount (data) {
  return data.names.map(function (n) {
    const onePerson = data.data.filter(function (row) {
      return row.name === n
    })
    const chars = onePerson.map(function (row) {
      return row.BODY.length
    })
    const words = onePerson.map(function (d) {
      const tmp = wordSplit(d)
      return tmp.split(' ').filter(function (str) {
        return str.length !== 0
      }).length
    })
    return {
      name: n,
      texts: onePerson.length,
      chars: chars,
      words: words
    }
  })
}

function getStatistics (justData) {
  // Stats
  const dataSorted = justData.sort(d3.ascending)
  const q1 = d3.quantile(dataSorted, 0.25)
  const q3 = d3.quantile(dataSorted, 0.75)
  return {
    min: dataSorted[0],
    max: dataSorted[dataSorted.length - 1],
    q1: q1,
    median: d3.quantile(dataSorted, 0.5),
    q3: q3,
    interQuantileRange: q3 - q1
  }
}

function xyTimeOfDay (data) {
  const allTimes = []
  for (let i = 0; i < 24 * 7; i++) {
    allTimes.push({
      name: 'both',
      hour_day_hash: i,
      hour: i % 24,
      day: Math.floor(i / 24),
      texts: 0
    })
  }
  return data.data.map(function (item) {
    return item.date.getHours() + item.date.getDay() * 24
  }).reduce(function (histo, hash) {
    histo[hash].texts = +histo[hash].texts + 1
    return histo
  }, allTimes)
}

function xyTimeFilter (data, day) {
  if (day === -1) {
    const allTimes = []
    for (let i = 0; i < 24; i++) {
      allTimes.push({
        name: 'both',
        hour: i,
        texts: 0
      })
    }
    return data.reduce(function (histo, d) {
      histo[d.hour].texts = +histo[d.hour].texts + d.texts
      return histo
    }, allTimes)
  } else {
    return data.filter(function (d) {
      return d.day === day
    })
  }
}

function xyTimeOfDaySepPerson (data) {
  return data.names.map(function (n) {
    const allHours = []
    for (let i = 0; i < 24; i++) {
      allHours.push({ name: n, hour: i, texts: 0 })
    }
    return data.data.filter(function (item) {
      return item.name === n
    }).map(function (item) {
      return item.date.getHours()
    }).reduce(function (histo, hour) {
      histo[hour].texts = +histo[hour].texts + 1
      return histo
    }, allHours)
  }).reduce(function (total, item) {
    return total.concat(item)
  }, [])
}

function minMaxDate (data) {
  return data.data.reduce(function (minMax, row) {
    return [Math.min(minMax[0], row.date.getTime()), Math.max(minMax[1], row.date.getTime())]
  }, [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]).map(function (elem) {
    const dateWithTime = new Date(elem)
    return new Date(dateWithTime.getFullYear(), dateWithTime.getMonth(), dateWithTime.getDate())
  })
}

function millisecsPerDay () {
  return 1000 * 60 * 60 * 24
}

function stepDates (minDate, maxDate, name) {
  let d = new Date(minDate.getTime())
  const dateArray = []
  const maxDateAfter = new Date(maxDate.getTime() + millisecsPerDay())
  while (d.getTime() <= maxDateAfter.getTime()) {
    dateArray.push({ name: name, date: d, texts: 0, day_count: dateArray.length })
    d = new Date(d.getTime() + millisecsPerDay())
  }

  return dateArray
}

function makeTimeHistogram (data, minVal, allDays) {
  return data.map(function (item) {
    return Math.floor((item.date - minVal) / millisecsPerDay())
  }).reduce(function (histo, day) {
    histo[day].texts = +histo[day].texts + 1
    return histo
  }, allDays)
}

function xyDayOfYear (data) {
  const minMax = minMaxDate(data)

  const allDays = stepDates(minMax[0], minMax[1], 'both')
  return makeTimeHistogram(data.data, minMax[0], allDays)
}

function wordOccurFull (data) {
  return data.names.map(function (n) {
    const wordOccur = data.data.filter(function (row) {
      return row.name == n
    }).map(wordSplit).reduce(wordReduce, [])
      .reduce(function (histo, word) {
        const wordLower = word.toLowerCase()
        histo[wordLower] = histo[wordLower] ? +histo[wordLower] + 1 : 1
        return histo
      }, {})
    return { name: n, word_count: wordOccur }
  })
}

const emojiRegex = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/ug

function wordOccurLessDiff (wordOccurMap) {
  const simpleWords = ['the', 'and', 'And', 'a', 'to', 'was', 'is', 'of', 'but',
    'my', 'like', 'this', 'think', 'if', 'all', 'she', 'going', 'her',
    'i', 'you', 'that', 'it', 'be']

  const smaller = wordOccurMap.map(function (n) {
    const tmpMap = {}
    for (const key in n.word_count) {
      if (Object.prototype.hasOwnProperty.call(n.word_count, key) && n.word_count[key] > 5 &&
                !simpleWords.includes(key) && !emojiRegex.test(key)) {
        tmpMap[key] = n.word_count[key]
      }
    }
    return { name: n.name, word_count: tmpMap }
  })

  // Assumption of exactly 2 people
  const minAlone = 10

  const diff = smaller.reduce(function (total, n) {
    if (Object.keys(total).length === 0) {
      return n.word_count
    }
    const tmpCombine = {}
    for (const key in n.word_count) {
      if (Object.prototype.hasOwnProperty.call(n.word_count, key)) {
        if (Object.prototype.hasOwnProperty.call(total, key)) {
          const diffVal = total[key] - n.word_count[key]
          tmpCombine[key] = [diffVal,
            (total[key] + n.word_count[key])]
        } else {
          if (n.word_count[key] > minAlone) {
            tmpCombine[key] = [-n.word_count[key], n.word_count[key]]
          }
        }
      }
    }
    for (const key in total) {
      if (!Object.prototype.hasOwnProperty.call(n.word_count, key) && total[key] > minAlone) {
        tmpCombine[key] = [total[key], total[key]]
      }
    }
    return tmpCombine
  }, {})

  const finalList = []
  for (const key in diff) {
    if (Object.prototype.hasOwnProperty.call(diff, key)) {
      finalList.push([diff[key][0] / diff[key][1], diff[key][1], key])
    }
  }
  return finalList
}

function emojiFilter (wordOccurMap) {
  const splitter = new GraphemeSplitter()
  return wordOccurMap.map(function (x) {
    const tmpMap = {}
    for (const keyWord in x.word_count) {
      if (Object.prototype.hasOwnProperty.call(x.word_count, keyWord) && keyWord.match(emojiRegex)) {
        const count = x.word_count[keyWord]
        const graphemes = splitter.iterateGraphemes(keyWord)
        let result = graphemes.next()
        while (!result.done) {
          const emj = result.value
          if (emojiRegex.test(emj)) {
            tmpMap[emj] = tmpMap[emj] ? tmpMap[emj] + count : count
          }
          result = graphemes.next()
        }
      }
    }
    const result = []
    for (const keyWord in tmpMap) {
      if (Object.prototype.hasOwnProperty.call(tmpMap, keyWord)) {
        result.push([tmpMap[keyWord], keyWord])
      }
    }

    return {
      name: x.name,
      emoji_count: result
    }
  })
}
