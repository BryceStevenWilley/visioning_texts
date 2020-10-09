// I have no idea what's working, but you need
// <script type="text/javascript" src="lib/d3.min.js"></script>
// In the main page html

import {
  splitBK, splitBKWhatsapp, splitBKFacebook, perPersonWordCount, getStatistics,
  xyTimeOfDay, xyTimeFilter, xyDayOfYear, wordOccurFull, wordOccurLessDiff, emojiFilter
} from './math.js'

export function string2IntArray (inputStr) {
  return inputStr.split(',').filter((el) => el.length > 0) // .map((el) => Number(el))
}

function set_graph_0_pie (totalsData, names) {
  const pieGenerator = d3.pie()
    .value(function (d) { return d.texts })

  const colors = ['#66298c', 'green']
  const arcGenerator = d3.arc()
    .innerRadius(20)
    .outerRadius(100)

  const arcData = pieGenerator(totalsData)

  const u = d3.select('#graph0-pie-pie').selectAll('path').data(arcData)
  u.enter().append('path').merge(u)
    .attr('d', arcGenerator)
    .attr('stroke', 'white')
    .attr('fill', function (d, i) {
      return colors[names.indexOf(d.data.name)]
    })
  u.exit().remove()

  const t = d3.select('#graph0-pie-labels').selectAll('text').data(arcData)
  t.enter().append('text').merge(t)
    .attr('fill', 'white')
    .attr('text-anchor', 'middle')
    .each(function (d) {
      const centroid = arcGenerator.centroid(d)
      d3.select(this)
        .attr('x', centroid[0])
        .attr('y', centroid[1])
        .attr('dy', '0.33em')
        .text(d.data.name)
    })
  t.exit().remove()

  const annotationArcGenerator = d3.arc()
    .innerRadius(100)
    .outerRadius(150)

  const t2 = d3.select('#graph0-pie-annotations').selectAll('text').data(arcData)
  t2.enter().append('text').merge(t2)
    .attr('fill', 'white')
    .attr('text-anchor', 'middle')
    .each(function (d) {
      const centroid = annotationArcGenerator.centroid(d)
      d3.select(this)
        .attr('x', centroid[0])
        .attr('y', centroid[1])
        .attr('dy', '0.33em')
        .text(d.data.texts)
    })
  t2.exit().remove()
}

function set_graph_0_whisk (stats, isZoomBar, mid, prevBars, elemId,
  color, description) {
  const minBar = Math.max(stats.min, stats.q1 - 1.5 * stats.interQuantileRange)
  const maxBar = Math.min(stats.max, stats.q3 + 1.5 * stats.interQuantileRange)
  const height = 32

  let xScale = d3.scaleLinear().domain([stats.min, stats.max]).range([0, 800])
  if (prevBars.length !== 0) {
    xScale = d3.scaleLinear().domain([stats.min, stats.q3 + 1.5 * stats.interQuantileRange])
      .range([0, 700])
  }

  d3.select(elemId + '-line')
    .attr('y1', mid).attr('y2', mid)
    .attr('x1', xScale(minBar)).attr('x2', xScale(maxBar))
    .attr('stroke', 'white')

  if (prevBars.length !== 0) {
    d3.select(elemId + '-connection')
      .attr('stroke', 'white')
      .attr('y1', prevBars[0]).attr('y2', mid)
      .attr('x1', prevBars[1][0] - 1)
      .attr('x2', stats.min - 2)

    d3.select(elemId + '-connection2')
      .attr('stroke', 'white')
      .attr('y1', prevBars[0]).attr('y2', mid)
      .attr('x1', prevBars[1][1] - 1)
      .attr('x2', 700)
  }

  d3.select(elemId + '-box')
    .attr('y', mid - height / 2)
    .attr('x', xScale(stats.q1))
    .attr('height', height)
    .attr('width', (xScale(stats.q3) - xScale(stats.q1)))
    .attr('stroke', 'white')
    .attr('fill', color)

  const u = d3.select(elemId + '-whisk').selectAll('line').data([minBar,
    stats.median, maxBar])
  u.enter().append('line').merge(u)
    .attr('y1', mid - height / 2)
    .attr('y2', mid + height / 2)
    .attr('x1', function (d) { return xScale(d) })
    .attr('x2', function (d) { return xScale(d) })
    .attr('stroke', 'white')
  u.exit().remove()

  let toAddDots = [stats.min, stats.max]
  if (!isZoomBar) {
    toAddDots = [stats.max]
  }
  const c = d3.select(elemId + '-whisk').selectAll('circle').data(toAddDots)
  c.enter().append('circle').merge(c)
    .attr('cy', mid)
    .attr('cx', function (d) { return xScale(d) })
    .attr('r', 3)
    .attr('fill', 'white')
  c.exit().remove()

  let labelData = [stats.min, minBar, stats.median, maxBar, stats.max]
  if (isZoomBar && prevBars.length === 0) {
    labelData = [stats.max]
  }
  const t = d3.select(elemId + '-labels').selectAll('text').data(labelData)
  t.enter().append('text').merge(t)
    .attr('x', function (d) { return xScale(d) })
    .attr('y', mid + height)
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .text(function (d) { return d })
  t.exit().remove()

  d3.select(elemId + '-annotations').text(description)
    .attr('y', mid - height)
    .attr('alignment-baseline', 'baseline')
    .attr('fill', 'white')

  if (prevBars.length === 0) {
    return [xScale(minBar), xScale(maxBar)]
  } else {
    return []
  }
}

function setGraph0 (data) {
  const totalsData = perPersonWordCount(data)

  set_graph_0_pie(totalsData, data.names)

  const justWords = totalsData.map(function (d) {
    return d.words
  }).reduce(function (total, d) {
    return total.concat(d)
  }, [])
  const wordStats = getStatistics(justWords)

  const justChars = totalsData.map(function (d) {
    return d.chars
  }).reduce(function (total, d) {
    return total.concat(d)
  }, [])
  const charStats = getStatistics(justChars)

  let height = 460
  let tallHeight = 0
  if (wordStats.max - wordStats.q3 > 10 * wordStats.interQuantileRange * 2) {
    height += 100
    tallHeight = 460
    const bars = set_graph_0_whisk(wordStats, true, 0, [],
      '#graph0-word', 'green',
      'Words per text')
    set_graph_0_whisk(wordStats, true, 75, [0, bars], '#graph0-word-zoom', 'green', '')
  } else {
    tallHeight = 370
    set_graph_0_whisk(wordStats, false, 0, [], '#graph0-word', 'green', 'Words per text')
  }
  d3.select('#graph0-char').attr('transform', `translate(50, ${tallHeight})`)
  if (charStats.max - charStats.q3 > 10 * charStats.interQuantileRange) {
    height += 100
    const bars = set_graph_0_whisk(charStats, true, 0, [],
      '#graph0-char', 'green',
      'Characters per text')
    set_graph_0_whisk(charStats, true, 75, [0, bars],
      '#graph0-char-zoom', 'green', '')
  } else {
    set_graph_0_whisk(charStats, false, 0, [], '#graph0-char', 'green', 'Characters per text')
  }

  d3.select('#graph0')
    .attr('height', height)
    .attr('width', 1000)
}

function setGraph1Weekly (data, day) {
  const filteredTimes = xyTimeFilter(data, day)

  const maxBarHeight = 400
  const maxAll = Math.max(...data.map(function (item) { return item.texts }))
  const maxFiltered = Math.max(...filteredTimes.map(function (item) { return item.texts }))
  const maxFound = Math.max(maxAll, maxFiltered)
  const barScaleHeight = d3.scaleLinear().domain([0, maxFound]).range([0, maxBarHeight])
  const barScalePlace = d3.scaleLinear().domain([0, maxFound]).range([maxBarHeight, 0])

  const u = d3.select('#graph1-bars')
    .selectAll('rect')
    .data(filteredTimes)

  const barWidth = 20

  d3.select('#graph1')
    .attr('width', filteredTimes.length * barWidth + 28)
    .attr('height', maxBarHeight + 50)

  const trans = d3.transition()
    .duration(500)

  u.enter().append('rect').merge(u)
    .transition(trans)
    .attr('width', barWidth - 1)
    .attr('height', function (d) {
      return barScaleHeight(d.texts) + 'px'
    })
    .attr('x', function (d) {
      return d.hour * barWidth + 3
    })
    .attr('y', function (d, i) {
      return barScalePlace(d.texts) + 'px'
    })
    .attr('fill', function (d) {
      return '#ffd90a'
    })
  u.exit().remove()

  const t = d3.select('#graph1-labels')
    .selectAll('text')
    .data(filteredTimes)

  t.enter()
    .append('text')
    .merge(t)
    .attr('fill', 'white')
    .attr('y', function (d, i) {
      return maxBarHeight + 15
    })
    .attr('x', function (d, i) {
      return (d.hour + 1) * barWidth
    })
    .attr('text-anchor', 'end')
    .text(function (d) {
      return d.hour
    })

  d3.select('#graph1-axis-left')
    .call(d3.axisRight().scale(barScalePlace))
}

function getGraph2Placement() {
  const maxBarLength = 400
  const maxFound = Math.max(...window.daysInYear.map(function (item) {
    return item.texts
  }))
  const barScale = d3.scaleLinear().domain([0, maxFound]).range([0, maxBarLength])

  const fullWidth = Math.min(window.daysInYear.length * 3, screen.width - 50)
  const width = fullWidth / window.daysInYear.length

  return [maxBarLength, maxFound, barScale, fullWidth, width]
}

function setGraph2 (data) {
  const [maxBarLength, maxFound, barScale, fullWidth, width] = getGraph2Placement()
  d3.select('#graph2')
    .attr('width', fullWidth + 100)
    .attr('height', maxBarLength + 50)

  const u = d3.select('#graph2-bars')
    .selectAll('rect')
    .data(window.daysInYear)
  u.enter()
    .append('rect')
    .merge(u)
    .attr('width', width)
    .attr('height', function (d) {
      return barScale(d.texts) + 'px'
    })
    .attr('x', function (d) {
      return d.day_count * width + 3
    })
    .attr('y', function (d) {
      return maxBarLength - barScale(d.texts) + 'px'
    })
    .attr('fill', function (d) {
      return (d.date.getMonth() % 2 == 0) ? '#ffd90a' : 'grey'
    })
  u.exit().remove()

  const t = d3.select('#graph2-labels')
    .selectAll('text')
    .data(window.daysInYear)
  t.enter()
    .append('text')
    .merge(t)
    .attr('fill', 'white')
    .attr('x', function (d) {
      return d.day_count * width + 3
    })
    .attr('y', maxBarLength + 25)
    .text(function (d) {
      let options
      if (window.daysInYear.length > 365) {
        options = { month: 'short', year: '2-digit' }
      } else {
        options = { month: 'long' }
      }
      return (d.date.getDate() === 1)
        ? d.date.toLocaleDateString('en-US', options)
        : ''
    })
    .attr('text-anchor', 'start')
  t.exit().remove()

  const barScalePlace = d3.scaleLinear().domain([0, maxFound]).range([maxBarLength, 0])
  d3.select('#graph2-axis-left')
    .call(d3.axisRight().scale(barScalePlace))

  xDayAvg(7)
}

function setGraph3Words (wordCountLess, names) {
  const wordOccurEvenLess = wordCountLess.filter(function (item) {
    return Math.abs(item[1]) > 20
  })

  const binCount = 10
  const linScale = d3.scaleLinear().domain([-1, 1]).range([0, binCount])
  const startEmpty = []
  for (let i = 0; i < binCount; i++) {
    startEmpty.push({ val: linScale.invert(i), list: [] })
  }
  const chunk = wordOccurEvenLess.reduce(function (total, item) {
    const toAdd = { word: item[2], total: item[1] }
    const tmp = Math.floor(linScale(item[0]))
    if (tmp < total.length) {
      total[tmp].list.push(toAdd)
    } else {
      total[total.length - 1].list.push(toAdd)
    }
    return total
  }, startEmpty)

  let maxLength = 0
  chunk.forEach(function (item) {
    item.list.sort(function (i1, i2) {
      return i1.total - i2.total
    })
    if (item.list.length > 40) {
      item.list = item.list.slice(0, 40)
      item.list.push({ word: '...', total: 1 })
    }
    maxLength = Math.max(maxLength, item.list.length)
  })

  const height = 1000
  const width = 1000

  const diffScale = d3.scaleLinear().domain([-1, 1]).range([0, width])
  // const maxWordTotal = Math.max(...word_count_even_less.map(function (w) { return w[1] }))
  // const totalScale = d3.scaleLinear().domain([0, maxWordTotal]).range([height, 0])
  const colorScale = d3.scaleLinear().domain([-1, 1]).range(['#ffd90a', 'white'])

  const t = d3.select('#graph3-labels')
    .selectAll('text')
    .data(chunk)
  t.enter()
    .append('text')
    .merge(t)
    .attr('alignment-baseline', 'middle')
    .attr('fill', function (d) {
      return colorScale(d.val)
    })
    .attr('text-anchor', 'middle')
    .attr('transform', function (d) {
      return 'translate(' + diffScale(d.val) + ',0)' // + (totalScale(d[1]) + 10) + ')';
    }).html(function (d) {
      return d.list.reduce(function (all, item) {
        return all + '<tspan x="0" dy="1.4em">' + item.word + '</tspan>'
      }, '')
    })
  t.exit().remove()

  const revScale = d3.scaleLinear().domain([-1, 1]).range([width, 0])
  const t2 = d3.select('#graph3-annotations').selectAll('text').data(names)
  t2.enter()
    .append('text')
    .merge(t2)
    .attr('fill', 'white')
    .attr('text-anchor', 'middle')
    .attr('transform', function (d, i) {
      return 'translate(' + revScale((i - 0.5) * 2) + ',0)'
    })
    .text(function (d) {
      return d
    })

  d3.select('#graph3')
    .attr('height', Math.min((height + 40) * 4 / 3, 60 * 0.75 + 1.4 * 12 * maxLength) + 'pt')
    .attr('width', width + 80)

  d3.select('#graph3-axis-bottom')
    .call(d3.axisBottom().scale(diffScale))
}

function setGraph4Emojis (emojiCount) {
  const emojiScale = 900

  const u = d3.select('#graph4-wrapper')
    .selectAll('div')
    .data(emojiCount)
  u.enter()
    .append('div')
    .html(function (d, i) {
      return `<h3> ${d.name}'s</h3>\n<svg id="graph4-${i}"></svg>`
    })
  u.exit().remove()
  d3.select('#graph4-wrapper')
    .selectAll('div')
    .classed('blocked', true)

  emojiCount.forEach(function (n_c, i) {
    const emoji_count_b = n_c.emoji_count
    // Treat the sum as the total volume the emojis take up.
    const justCounts = emoji_count_b.map((em) => em[0])
    const emojiMaxCount = justCounts.reduce((max, a) => Math.max(max, a), 0)
    const volumeScale = d3.scaleLinear().domain([0, emojiMaxCount]).range([0, 50])
    const width = 680
    const height = 680
    d3.select('#graph4-' + i)
      .attr('width', width)
      .attr('height', height)

    d3.forceSimulation(emoji_count_b)
      .force('charge', d3.forceManyBody().strength(5))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(function (d) {
        return Math.sqrt(emojiScale * volumeScale(d[0])) / Math.PI * 1.05
      }))
      .on('tick', ticked)

    const u = d3.select('#graph4-' + i)
      .selectAll('g')
      .data(emoji_count_b)
    u.enter()
      .append('g')
      .merge(u)
      .html(function (d) {
        const emojiRad = Math.sqrt(emojiScale * volumeScale(d[0])) / Math.PI
        const fontSize = emojiRad * 1.74
        const scootY = fontSize / 2.78
        return `<text text-anchor="middle" y="${scootY}" font-size="${fontSize}">
                    ${d[1]}<title>Use count: ${d[0]} </title>
                    </text>`
      })
      .attr('transform', function (d) {
        return `translate(${d.x},${d.y})`
      })
    u.exit().remove()

    function ticked () {
      const u2 = d3.select('#graph4-' + i)
        .selectAll('g')
        .data(emoji_count_b)
      u2.enter()
        .append('g')
        .merge(u2)
        .attr('transform', function (d) {
          return `translate(${d.x},${d.y})`
        })
      u.exit().remove()
    }
  })
}

function getFileType (mimeType, fileName) {
  if (mimeType === 'text/plain' || (!mimeType && fileName.indexOf('.txt') !== -1)) {
    return 'whatsapp_text'
  } else if (mimeType === 'text/csv' || mimeType === 'application/vnd.ms.excel' ||
                 (!mimeType && fileName.indexOf('.csv') !== -1)) {
    // If excel is installed on window's system, csv will be reported as excel from the
    // registary: https://stackoverflow.com/a/28233618/11416267
    return 'signal_csv'
  } else if (mimeType === 'application/json' || (!mimeType && fileName.indexOf('.json') !== -1)) {
    return 'fb_json'
  } else {
    return 'unknown'
  }
}

export function handleFileSelect (evt) {
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    const files = evt.target.files // FileList object

    // files is a FileList of File objects. List some properties.
    window.file_to_read = files[0]
    const f = window.file_to_read
    const fileType = getFileType(f.type, f.name)
    if (fileType === 'unknown') {
      alert("Can't read this type of file (" + f.type + ') at the moment.' +
                  ' Please try a Signal csv, a WhatsApp text file, or a Facebook json file.')
      return
    }
    const sizeStr = (f.size > 1000)
      ? (
          (f.size > 1000000)
            ? (f.size / 1000000).toFixed(2) + 'MB'
            : (f.size / 1000).toFixed(2) + 'kB')
      : f.size + 'bytes'
    let dispName = escape(f.name)
    if (dispName.length > 20) {
      dispName = dispName.slice(0, 20) + '...'
    }
    document.getElementById('list').innerHTML = '<ul>' +
            '<li><strong>' + dispName + '</strong> (' + (f.type || 'n/a') + '),' +
            sizeStr + ', last modified: ' +
            (f.lastModifiedDate
              ? f.lastModifiedDate.toLocaleDateString()
              : 'n/a') +
            '</li></ul>'
    if (fileType === 'signal_csv') {
      d3.select('#signal-input-table').classed('hide', false)
    }
    d3.select('button').classed('hide', false)
  } else {
    alert('The File APIs are not fully supported in this browser.')
  }
  refreshShow()
}

export function refreshShow () {
  const bName = document.getElementById('b-name-input').value
  const kName = document.getElementById('k-name-input').value
  const bIds = string2IntArray(document.getElementById('b-ids-input').value)
  const kIds = string2IntArray(document.getElementById('k-ids-input').value)
  if (kIds.length !== 0 && bIds.length !== 0 && bName.length !== 0 && kName.length !== 0) {
    document.getElementById('show-button').disabled = false
  } else {
    document.getElementById('show-button').disabled = true
  }
}

export function triggerProcess (f) {
  d3.select('div').classed('hide', false)

  const reader = new FileReader()
  reader.onload = (function (theFile) {
    return function (e) {
      const addressId = document.getElementById('address-input').value
      const bName = document.getElementById('b-name-input').value
      const kName = document.getElementById('k-name-input').value
      const bIds = string2IntArray(document.getElementById('b-ids-input').value)
      const kIds = string2IntArray(document.getElementById('k-ids-input').value)
      let data
      const fileType = getFileType(theFile.type, theFile.name)
      if (fileType === 'signal_csv') {
        const csvObj = d3.csvParse(e.target.result)
        data = splitBK(csvObj, bIds, kIds, bName, kName, addressId)
      } else if (fileType === 'whatsapp_text') {
        data = splitBKWhatsapp(e.target.result)
      } else if (fileType === 'fb_json') {
        data = splitBKFacebook(e.target.result)
      }
      setGraph0(data)
      setTimeout(function () {
        window.time_of_days = xyTimeOfDay(data)
        setGraph1Weekly(window.time_of_days, -1)
        window.daysInYear = xyDayOfYear(data)
        setGraph2(window.daysInYear)
        setTimeout(function () {
          const wordOccurances = wordOccurFull(data)
          setGraph3Words(wordOccurLessDiff(wordOccurances), data.names)
          setGraph4Emojis(emojiFilter(wordOccurances))
        }, 10)
      }, 10)
    }
  })(f)
  reader.readAsText(f)
}

export function daySelect (day) {
  setGraph1Weekly(window.time_of_days, day)
}

export function xDayAvg (x) {
  const [maxBarLength, , barScale, , width] = getGraph2Placement()

  const trans = d3.transition()
    .duration(500)

  const lineGenerator = d3.line()
    .x(function (d, i) {
      return i * width
    })
    .y(function (d, i) {
      const startIdx = Math.max(i - (x - 1) / 2, 0)
      const endIdx = Math.min(i + (x - 1) / 2, window.daysInYear.length)
      let sum = 0
      for (let ii = startIdx; ii < endIdx; ii++) {
        sum += window.daysInYear[ii].texts
      }
      const days = endIdx - startIdx
      return maxBarLength - barScale(sum / days)
    })
  const pathData = lineGenerator(window.daysInYear)

  d3.select('#graph2-path')
    .transition(trans)
    .attr('d', pathData)
    .attr('stroke', '#66298c')
    .attr('stroke-width', 2)
    .attr('fill', 'none')
}
