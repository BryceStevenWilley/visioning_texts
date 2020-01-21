// I have no idea what's working, but you need
// <script type="text/javascript" src="lib/d3.min.js"></script>
// In the main page html

function string_to_int_array(input_str) {
    let all_ints = input_str.split(',');
    let int_array = [];
    for (var i = 0, val; val = all_ints[i]; i++) {
        int_array.push(val);
    }
    return int_array;
}

function set_graph_0_pie(totals_data, names) {
    var pieGenerator = d3.pie()
        .value(function(d) {return d.texts;});
    var maxBarWidth = 400;
    var barScale = d3.scaleLinear()
        .domain([0, Math.max(...totals_data.map(function (d) { return d.texts;}))])
        .range([0, maxBarWidth]);

    var colors = ['#66298c', 'green'];
    var arcGenerator = d3.arc()
        .innerRadius(20)
        .outerRadius(100);

    var arcData = pieGenerator(totals_data);

    let u = d3.select('#graph0_pie_pie').selectAll('path').data(arcData);
    u.enter().append('path').merge(u)
        .attr('d', arcGenerator)
        .attr('stroke', 'white')
        .attr('fill', function(d, i) {
            return colors[names.indexOf(d.data.name)];
        });
    u.exit().remove();

    let t = d3.select('#graph0_pie_labels').selectAll('text').data(arcData);
    t.enter().append('text').merge(t)
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .each(function(d) {
            var centroid = arcGenerator.centroid(d);
            d3.select(this)
                .attr('x', centroid[0])
                .attr('y', centroid[1])
                .attr('dy', '0.33em')
                .text(d.data.name);
        });
    t.exit().remove();

    var annotationArcGenerator = d3.arc()
        .innerRadius(100)
        .outerRadius(150);

    let t2 = d3.select('#graph0_pie_annotations').selectAll('text').data(arcData);
    t2.enter().append('text').merge(t2)
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .each(function(d) {
            var centroid = annotationArcGenerator.centroid(d);
            d3.select(this)
                .attr('x', centroid[0])
                .attr('y', centroid[1])
                .attr('dy', '0.33em')
                .text(d.data.texts);
        });
    t2.exit().remove();
}

function set_graph_0_whisk(just_data, elem_id, color, description) {
    // Stats
    let min = Math.min(...just_data);
    let max = Math.max(...just_data);
    let data_sorted = just_data.sort(d3.ascending);
    let q1 = d3.quantile(data_sorted, .25);
    let median = d3.quantile(data_sorted, .5);
    let q3 = d3.quantile(data_sorted, .75);
    let interQuantileRange = q3 - q1;
    let min_bar = Math.max(min, q1 - 1.5 * interQuantileRange);
    let max_bar = Math.min(max, q3 + 1.5 * interQuantileRange);
    let height = 32;
    let mid = 0;

    let xScale = d3.scaleLinear().domain([0, max]).range([0, 300]);

    d3.select(elem_id + '_line')
        .attr('y1', mid).attr('y2', mid)
        .attr('x1', xScale(min_bar)).attr('x2', xScale(max_bar))
        .attr('stroke', 'white');

    d3.select(elem_id + '_box')
        .attr('y', mid - height / 2)
        .attr('x', xScale(q1))
        .attr('height', height)
        .attr('width', (xScale(q3) - xScale(q1)))
        .attr('stroke', 'white')
        .attr('fill', color);

    let u = d3.select(elem_id + '_whisk').selectAll('line').data([min_bar, median, max_bar]);
    u.enter().append('line').merge(u)
        .attr('y1', mid - height / 2)
        .attr('y2', mid + height / 2)
        .attr('x1', function(d) { return xScale(d); })
        .attr('x2', function(d) { return xScale(d); })
        .attr('stroke', 'white');
    u.exit().remove();

    let outliers = just_data.filter(function(d) {
        return d < min_bar || d > max_bar;
    });
    let c = d3.select(elem_id + '_whisk').selectAll('circle').data([min, max]); //outliers);
    c.enter().append('circle').merge(c)
        .attr('cy', mid)
        .attr('cx', function(d) { return xScale(d); })
        .attr('r', 3)
        .attr('fill', 'white');
    c.exit().remove();

    let t = d3.select(elem_id + '_labels').selectAll('text').data([min, min_bar, median, max_bar, max]);
    t.enter().append('text').merge(t)
        .attr('x', function(d) { return xScale(d); })
        .attr('y', mid + height)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .text(function(d) { return d; });
    t.exit().remove();

    d3.select(elem_id + '_annotations').text(description)
        .attr('y', mid - height)
        .attr('alignment-baseline', 'baseline')
        .attr('fill', 'white');

}

function set_graph_0(data) {
    let totals_data = total_to_from_data(data);

    d3.select('#graph0')
        .attr('height', 450);

    set_graph_0_pie(totals_data, data.names);

    let just_words = totals_data.map(function(d) {
        return d.words;
    }).reduce(function(total, d) {
        return total.concat(d);
    }, []);
    set_graph_0_whisk(just_words, '#graph0_word', 'green', 'Words per text');

    let just_chars = totals_data.map(function(d) {
        return d.chars;
    }).reduce(function(total, d) {
        return total.concat(d);
    }, []);
    set_graph_0_whisk(just_chars, '#graph0_char', 'green', 'Characters per text');
}

function set_graph_1(data, day) {
    let filtered_times = xy_time_filter(data, day);

    var maxBarHeight = 400;
    var maxAll = Math.max(...data.map(function(item) { return item.texts; }));
    var maxFiltered = Math.max(...filtered_times.map(function(item) { return item.texts; }));
    var maxFound = Math.max(maxAll, maxFiltered);
    var barScale_height = d3.scaleLinear().domain([0, maxFound]).range([0, maxBarHeight]);
    var barScale_place = d3.scaleLinear().domain([0, maxFound]).range([maxBarHeight, 0]);

    var u = d3.select("#graph1_bars")
        .selectAll('rect')
        .data(filtered_times);

    let bar_width = 20;

    d3.select('#graph1')
        .attr('width', filtered_times.length * bar_width + 28)
        .attr('height', maxBarHeight + 50);

    var trans = d3.transition()
        .duration(500);

    u.enter().append('rect').merge(u)
        .transition(trans)
        .attr('width', bar_width - 1)
        .attr('height', function(d) {
            return barScale_height(d.texts) + 'px';
        })
        .attr('x', function(d) {
            return d.hour * bar_width + 3;
        })
        .attr('y', function(d, i) {
            return barScale_place(d.texts) + 'px';
        })
        .attr('fill', function(d) {
            return '#ffd90a';
        });
    u.exit().remove();

    var t = d3.select('#graph1_labels')
        .selectAll('text')
        .data(filtered_times);

    t.enter()
        .append('text')
        .merge(t)
        .attr('fill', 'white')
        .attr('y', function(d, i) {
            return maxBarHeight + 15;
        })
        .attr('x', function(d, i) {
            return (d.hour + 1) * bar_width;
        })
        .attr('text-anchor', 'end')
        .text(function(d) {
            return d.hour;
        });

    d3.select('#graph1_axis_left')
        .call(d3.axisRight().scale(barScale_place));
}

function set_graph_2(data) {
    var maxBarLength = 400;
    var maxFound = Math.max(...days_in_year.map(function(item) {
        return item.texts;
    }));
    var barScale = d3.scaleLinear().domain([0, maxFound]).range([0, maxBarLength]);

    let full_width = Math.min(days_in_year.length * 3, screen.width - 50);
    let width = full_width / days_in_year.length;

    d3.select('#graph2')
        .attr('width', full_width + 100)
        .attr('height', maxBarLength + 50);

    let u = d3.select('#graph2_bars')
        .selectAll('rect')
        .data(days_in_year);
    u.enter()
        .append('rect')
        .merge(u)
        .attr('width', width)
        .attr('height', function(d) {
            return barScale(d.texts) + 'px';
        })
        .attr('x', function(d) {
            return d.day_count * width + 3;
        })
        .attr('y', function(d) {
            return maxBarLength - barScale(d.texts) + 'px';
        })
        .attr('fill', function(d) {
            return (d.date.getMonth() % 2 == 0) ? '#ffd90a' : 'grey';
        });
    u.exit().remove();

    let t = d3.select('#graph2_labels')
        .selectAll('text')
        .data(days_in_year);
    t.enter()
        .append('text')
        .merge(t)
        .attr('fill', 'white')
        .attr('x', function(d) {
            return d.day_count * width + 3;
        })
        .attr('y', maxBarLength + 25)
        .text(function(d) {
            let options = {month: 'long'};
            return (d.date.getDate() == 1) ?
                d.date.toLocaleDateString('en-US', options) : '';
        })
        .attr('text-anchor', 'start');
    t.exit().remove();

    var barScale_place = d3.scaleLinear().domain([0, maxFound]).range([maxBarLength, 0]);
    d3.select('#graph2_axis_left')
        .call(d3.axisRight().scale(barScale_place));

    x_day_avg(7);
}

function set_graph_3(word_count_less, names) {
    let word_count_even_less = word_count_less.filter(function(item) {
        return Math.abs(item[1]) > 20;
    });

    let bin_count = 10;
    var lin_scale = d3.scaleLinear().domain([-1, 1]).range([0, bin_count]);
    let start_empty = [];
    for (var i = 0; i < bin_count; i++) {
        start_empty.push({'val' : lin_scale.invert(i), 'list' : []});
    }
    let chunk = word_count_even_less.reduce(function(total, item) {
        let to_add = {'word' : item[2], 'total' : item[1]};
        let tmp = Math.floor(lin_scale(item[0]));
        if (tmp < total.length) {
            total[tmp].list.push(to_add);
        } else {
            total[total.length - 1].list.push(to_add);
        }
        return total;
    }, start_empty);

    let maxLength = 0;
    chunk.forEach(function(item) {
        item.list.sort(function(i1, i2) {
            return i1.total - i2.total;
        });
        if (item.list.length > 40) {
            item.list = item.list.slice(0, 40);
            item.list.push({'word' : '...', 'total' : 1});
        }
        maxLength = Math.max(maxLength, item.list.length);
    });

    let height = 1000;
    let width = 1000;

    var diffScale = d3.scaleLinear().domain([-1, 1]).range([0, width]);
    var maxWordTotal = Math.max(...word_count_even_less.map(function(w) {return w[1];}));
    var totalScale = d3.scaleLinear().domain([0, maxWordTotal]).range([height, 0]);
    var colorScale = d3.scaleLinear().domain([-1, 1]).range(['#ffd90a', 'white']);

    let t = d3.select('#graph3_labels')
        .selectAll('text')
        .data(chunk);
    t.enter()
        .append('text')
        .merge(t)
        .attr('alignment-baseline', 'middle')
        .attr('fill', function(d) {
            return colorScale(d.val);
        })
        .attr('text-anchor', 'middle')
        .attr('transform', function(d) {
            return 'translate(' + diffScale(d.val) + ',0)'; // + (totalScale(d[1]) + 10) + ')';
        }).html(function(d) {
            return d.list.reduce(function(all, item) {
                return all + '<tspan x="0" dy="1.4em">' + item.word + '</tspan>';
            }, '');
        });
    t.exit().remove();

    var revScale = d3.scaleLinear().domain([-1, 1]).range([width, 0]);
    let t2 = d3.select('#graph3_annotations').selectAll('text').data(names);
    t2.enter()
        .append('text')
        .merge(t2)
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .attr('transform', function(d, i) {
            return 'translate(' + revScale((i - 0.5) * 2) + ',0)';
        })
        .text(function(d) {
            return d;
        });

    d3.select('#graph3')
        .attr('height', Math.min((height + 40) * 4 / 3, 60 * .75 + 1.4 * 12 * maxLength) + 'pt')
        .attr('width', width + 80);

    d3.select('#graph3_axis_bottom')
        .call(d3.axisBottom().scale(diffScale));
}

function set_graph_4(emoji_count) {
    let emoji_scale = 900;

    let u = d3.select('#graph4_wrapper')
        .selectAll('div')
        .data(emoji_count);
    u.enter()
        .append('div')
        .html(function(d, i) {
            return '<h3>' + d.name + '\'s</h3>\n<svg id="graph4_' + i + '"></svg>';
        });
    u.exit().remove();

    emoji_count.forEach(function(n_c, i) {
        let emoji_count_b = n_c.emoji_count;
        let width = 50 * Math.sqrt(emoji_count_b.length);
        let height = 50 * Math.sqrt(emoji_count_b.length);
        d3.select('#graph4_' + i)
            .attr('width', width)
            .attr('height', height);

        var simulation = d3.forceSimulation(emoji_count_b)
            .force('charge', d3.forceManyBody().strength(5))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(function(d) {
                return Math.sqrt(emoji_scale * d[0]) / Math.PI * 1.05;
            }))
            .on('tick', ticked);

        let u = d3.select('#graph4_' + i)
            .selectAll('g')
            .data(emoji_count_b);
        u.enter()
            .append('g')
            .merge(u)
            .html(function(d) {
                let emoji_rad = Math.sqrt(emoji_scale * d[0]) / Math.PI;
                let font_size = emoji_rad * 1.74;
                let scoot_y = font_size / 2.78;
                return '<text text-anchor="middle" y="' + scoot_y
                    + '" font-size=\"' + font_size + '\">' + d[1]
                    + '<title>Use count: ' + d[0] + '</title></text>';
            })
            .attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            });
        u.exit().remove();

        function ticked() {
            let u2 = d3.select('#graph4_' + i)
                .selectAll('g')
                .data(emoji_count_b);
            u2.enter()
                .append('g')
                .merge(u2)
                .attr('transform', function(d) {
                    return 'translate(' + d.x + ',' + d.y + ')';
                });
            u.exit().remove();
        }
    });
}

function handleFileSelect(evt) {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        var files = evt.target.files; // FileList object

        // files is a FileList of File objects. List some properties.
        file_to_read = files[0];
        let f = file_to_read;
        if (f.type != 'text/plain' && f.type != 'text/csv' &&
            f.type != 'application/vnd.ms-excel') { // Excel does weird shit sometimes
                // https://stackoverflow.com/a/28233618/11416267
            alert("Can't read this type of file (" + f.type + ") at the moment."
                  + "Please try a Signal csv, or a WhatsApp text file");
            return;
        }
        let size_str = (f.size > 1000) ? (
            (f.size > 1000000) ? (f.size / 1000000).toFixed(2) + 'MB' : (f.size / 1000).toFixed(2) + 'kB')
            : f.size + 'bytes';
        let disp_name = escape(f.name);
        if (disp_name.length > 20) {
            disp_name = disp_name.slice(0, 20) + "...";
        }
        document.getElementById('list').innerHTML = '<ul>' +
            '<li><strong>' + disp_name + '</strong> (' +  (f.type || 'n/a') + '),' +
            size_str + ', last modified: ' +
            (f.lastModifiedDate ?
             f.lastModifiedDate.toLocaleDateString() : 'n/a') +
            '</li></ul>';
        if (f.type == 'text/csv') {
            d3.select('#signal_input_table').classed('hide', false);
        }
        d3.select('button').classed('hide', false);
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
    refresh_show();
}

function trigger_process(f) {
    d3.select('div').classed('hide', false);

    var reader = new FileReader();
    reader.onload = (function(theFile) {
        return function(e) {
            let address_id = parseInt(document.getElementById('address_input').value, 10);
            let b_name = document.getElementById("b_name_input").value;
            let k_name = document.getElementById("k_name_input").value;
            let b_ids = string_to_int_array(document.getElementById('b_ids_input').value);
            let k_ids = string_to_int_array(document.getElementById('k_ids_input').value);
            var data;
            if (f.type == 'text/csv') {
                let csv_obj = d3.csvParse(e.target.result);
                data = split_b_k(csv_obj, b_ids, k_ids, b_name, k_name, address_id);
            } else if (f.type == 'text/plain') {
                data = split_b_k_whatsapp(e.target.result);
            }
            set_graph_0(data);
            setTimeout(function() {
                time_of_days = xy_time_of_day(data);
                set_graph_1(time_of_days, -1);
                days_in_year = xy_day_of_year(data);
                set_graph_2(days_in_year);
                setTimeout(function() {
                    let word_count_map = word_count_full(data);
                    set_graph_3(word_count_less_diff(word_count_map), data.names);
                    set_graph_4(emoji_filter(word_count_map));
                }, 10);
            }, 10);
        };
    })(f);
    reader.readAsText(f);
}

function day_select(day) {
    set_graph_1(time_of_days, day);
}

function x_day_avg(x) {
    var maxBarLength = 400;
    var maxFound = Math.max(...days_in_year.map(function(item) {
        return item.texts;
    }));
    var barScale = d3.scaleLinear().domain([0, maxFound]).range([0, maxBarLength]);

    let full_width = Math.min(days_in_year.length * 3, screen.width - 50);
    let width = full_width / days_in_year.length;

    var trans = d3.transition()
        .duration(500);

    let lineGenerator = d3.line()
        .x(function(d, i) {
            return i * width;
        })
        .y(function(d, i) {
            let start_idx = Math.max(i - (x - 1) / 2, 0);
            let end_idx = Math.min(i + (x - 1) / 2, days_in_year.length);
            let days = end_idx - start_idx;
            var sum = 0;
            for (var ii = start_idx; ii < end_idx; ii++) {
                sum += days_in_year[ii].texts;
            }
            return maxBarLength - barScale(sum / days);
        });
    var pathData = lineGenerator(days_in_year);

    d3.select('#graph2_path')
        .transition(trans)
        .attr('d', pathData)
        .attr('stroke', '#66298c')
        .attr('stroke-width', 2)
        .attr('fill', "none");
}
