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

function set_graph_0(data) {
    let totals_data = total_to_from_data(data);

    var maxBarWidth = 400;
    var barScale = d3.scaleLinear()
        .domain([0, Math.max(...totals_data.map(function (d) { return d.texts;}))])
        .range([0, maxBarWidth]);

    var colors = ['#ffd90a', 'green'];

    d3.select('#graph0')
        .attr('height', 140);

    let u = d3.select('#graph0_bars').selectAll('rect').data(totals_data);
    u.enter().append('rect').merge(u)
        .attr('height', 19)
        .attr('width', function(d) {
            return barScale(d.texts) + 'px';
        })
        .attr('y', function(d, i) {
            return i * 20;
        })
        .attr('fill', function(d) {
            return colors[data.names.indexOf(d.name)];
        });
    u.exit().remove();

    let t = d3.select('#graph0_labels').selectAll('text').data(totals_data);
    t.enter().append('text').merge(t)
        .attr('y', function(d, i) {
            return i * 20 + 13;
        })
        .attr('text-anchor', 'end')
        .attr('fill', 'white')
        .text(function(d) {
            return d.name;
        });
    t.exit().remove();

    let t2 = d3.select('#graph0_annotations').selectAll('text').data(totals_data);
    t2.enter().append('text').merge(t2)
        .attr('y', function(d, i) {
            return i * 20 + 13;
        })
        .attr('x', function(d) {
            return barScale(d.texts) + d.texts.toString().length * 10;
        })
        .attr('fill', 'white')
        .attr('text-anchor', 'end')
        .text(function(d) {
            return d.texts;
        });
    t2.exit().remove();

    let sums = totals_data.reduce(function(total, d) {
        total.texts = +total.texts + d.texts;
        total.words = +total.words + d.words;
        total.chars = +total.chars + d.chars;
        return total;
    }, {'texts' : 0, 'words' : 0, 'chars' : 0});

    let x = d3.select('#graph0_avgs').selectAll('div').data([sums]);
    x.enter().append('div').merge(x)
        .text(function(d) {
            return (d.words / d.texts).toFixed(3) + ' average words per text, ' +
                (d.chars / d.texts).toFixed(3) + ' average characters per text';
        });
    x.exit().remove();
}

function set_graph_1(data, day) {
    let filtered_times = xy_time_filter(data, day);

    var maxBarHeight = 400;
    var maxFound = Math.max(...filtered_times.map(function(item) {
        return item.texts;
    }));
    var barScale = d3.scaleLinear().domain([0, maxFound]).range([0, maxBarHeight]);

    var u = d3.select("#graph1_bars")
        .selectAll('rect')
        .data(filtered_times);

    let bar_width = 20;

    d3.select('#graph1')
        .attr('width', data.length * bar_width)
        .attr('height', maxBarHeight + 50);

    u.enter()
        .append('rect')
        .merge(u)
        .attr('width', bar_width)
        .attr('height', function(d) {
            return barScale(d.texts) + 'px';
        })
        .attr('x', function(d) {
            return d.hour * bar_width + 3;
        })
        .attr('y', function(d, i) {
            return maxBarHeight - barScale(d.texts) + 'px';
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
            return maxBarHeight + 13;
        })
        .attr('x', function(d, i) {
            return (d.hour + 1) * bar_width + 3;
        })
        .attr('text-anchor', 'end')
        .text(function(d) {
            return d.hour;
        });
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
        .attr('width', full_width + 50)
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
            return (d.date.getDate() == 1 || d.day_count == 0) ? d.date.toLocaleDateString('en-US', options) : '';
        })
        .attr('text-anchor', 'start');
    t.exit().remove();

    x_day_avg(7);
}

function set_graph_3(word_count_less) {
    let word_count_even_less = word_count_less.filter(function(item) {
        return Math.abs(item[0]) > 0.4;
    });

    word_count_even_less.sort(function(i1, i2) {
        return i1[0] - i2[0];
    });

    let height = 20;

    d3.select('#graph3')
        .attr('height', (word_count_even_less.length + 2) * height);

    let u1 = d3.select('#graph3_bars')
        .selectAll('rect')
        .data(word_count_even_less);
    u1.enter()
        .append('rect')
        .merge(u1)
        .attr('fill', '#ffd90a')
        .attr('height', height - 1)
        .attr('width', function(d) {
            return Math.abs(100 * d[0]);
        })
        .attr('x', function(d) {
            return Math.min(100 * d[0], 0);
        })
        .attr('y', function(d, i) {
            return i * 20;
        });
    u1.exit().remove();

    let t = d3.select('#graph3_labels')
        .selectAll('text')
        .data(word_count_even_less);
    t.enter()
        .append('text')
        .merge(t)
        .attr('alignment-baseline', 'hanging')
        .attr('fill', 'white')
        .attr('text-anchor', function(d) {
            return d[0] < 0 ? 'start' : 'end';
        })
        .attr('y', function(d, i) {
            return i * 20;
        }).text(function(d) {
            return d[1];
        });
    t.exit().remove();
}

function set_graph_4(emoji_count) {
    var width = 500;
    var height = 500;

    let emoji_scale = 900;

    let u = d3.select('#graph4_wrapper')
        .selectAll('div')
        .data(emoji_count);
    u.enter()
        .append('div')
        .html(function(d) {
            return '<h3>' + d.name + '\'s</h3>\n<svg id="graph4_' + d.name
                + '" width="' + width + '" height="' + height + '"></svg>';
        });
    u.exit().remove();

    emoji_count.forEach(function(n_c) {
        let emoji_count_b = n_c.emoji_count;
        var simulation = d3.forceSimulation(emoji_count_b)
            .force('charge', d3.forceManyBody().strength(5))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(function(d) {
                return Math.sqrt(emoji_scale * d[0]) / Math.PI * 1.05;
            }))
            .on('tick', ticked);

        function ticked() {
            var u = d3.select('#graph4_' + n_c.name)
                .selectAll('g')
                .data(emoji_count_b);
            u.enter()
                .append('g')
                .html(function(d) {
                    let emoji_rad = Math.sqrt(emoji_scale * d[0]) / Math.PI;
                    let font_size = emoji_rad * 1.74;
                    let scoot_y = font_size / 2.78;
                    return '<text text-anchor="middle" y="' + scoot_y
                        + '" font-size=\"' + font_size + '\">' + d[1] + '</text';
                })
                .merge(u)
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
        if (f.type != 'text/csv') {
            alert('You need to upload a CSV file');
            return;
        }
        let size_str = (f.size > 1000) ? (
            (f.size > 1000000) ? (f.size / 1000000).toFixed(2) + 'MB' : (f.size / 1000).toFixed(2) + 'kB')
            : f.size + 'bytes';
        document.getElementById('list').innerHTML = '<ul>' +
            '<li><strong>' + escape(f.name) + '</strong> (' +  (f.type || 'n/a') + '),' +
            size_str + ', last modified: ' +
            (f.lastModifiedDate ?
             f.lastModifiedDate.toLocaleDateString() : 'n/a') +
            '</li></ul>';
        d3.select('#input_table').classed('hide', false);
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
            let b_name = document.getElementById("b_name_input").value;
            let k_name = document.getElementById("k_name_input").value;
            let b_ids = string_to_int_array(document.getElementById('b_ids_input').value);
            let k_ids = string_to_int_array(document.getElementById('k_ids_input').value);
            csv_obj = d3.csvParse(e.target.result);
            let data = split_b_k(csv_obj, b_ids, k_ids, b_name, k_name);
            set_graph_0(data);
            setTimeout(function() {
                time_of_days = xy_time_of_day(data);
                set_graph_1(time_of_days, -1);
                days_in_year = xy_day_of_year(data);
                set_graph_2(days_in_year);
                setTimeout(function() {
                    let word_count_map = word_count_full(data);
                    set_graph_3(word_count_less_diff(word_count_map));
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
        .attr('d', pathData)
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('fill', "none");
}
