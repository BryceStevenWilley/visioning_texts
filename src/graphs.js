// I have no idea what's working, but you need
// <script type="text/javascript" src="lib/d3.min.js"></script>
// In the main page html

function string_to_int_array(input_str) {
    all_ints = input_str.split(',');
    var int_array = [];
    for (var i = 0, val; val = all_ints[i]; i++) {
        int_array.push(val);
    }
    return int_array;
}

function set_graph_0(data) {
    texts_data = total_to_from_messages(data);
    chars_data = total_to_from_chars(data);

    var maxBarWidth = 400;
    var barScale = d3.scaleLinear()
        .domain([0, Math.max(...texts_data.map(function (d) { return d.texts;}))])
        .range([0, maxBarWidth]);

    var colors = ['blue', 'green'];

    let u = d3.select('#graph0_bars').selectAll('rect').data(texts_data);
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

    let t = d3.select('#graph0_labels').selectAll('text').data(texts_data);
    t.enter().append('text').merge(t)
        .attr('y', function(d, i) {
            return i * 20 + 13;
        })
        .text(function(d) {
            return d.name;
        });
    t.exit().remove();
}

function set_graph_1(data) {
    time_of_days = xy_time_of_day(data);

    var maxBarHeight = 400;
    var maxFound = Math.max(...time_of_days.map(function(item) {
        return item.texts;
    }));
    var barScale = d3.scaleLinear().domain([0, maxFound]).range([0, maxBarHeight]);

    var colors = ['blue', 'green'];

    var u = d3.select("#graph1_bars")
        .selectAll('rect')
        .data(time_of_days);

    let width = 20;

    d3.select('#graph2')
        .attr('width', time_of_days.length * width);

    u.enter()
        .append('rect')
        .merge(u)
        .attr('width', width)
        .attr('height', function(d) {
            return barScale(d.texts) + 'px';
        })
        .attr('x', function(d) {
            var temp = data.names.indexOf(d.name) * width;
            return d.hour * width * 2 + 3 + temp;
        })
        .attr('y', function(d, i) {
            return maxBarHeight - barScale(d.texts) + 'px';
        })
        .attr('fill', function(d) {
            return colors[data.names.indexOf(d.name)];
        });
    u.exit().remove();

    var t = d3.select('#graph1_labels')
        .selectAll('text')
        .data(time_of_days);

    t.enter()
        .append('text')
        .merge(t)
        .attr('y', function(d, i) {
            return maxBarHeight + 13;
        })
        .attr('x', function(d, i) {
            return d.hour * width * 2 + 3 + width;
        })
        .text(function(d) {
            return (data.names.indexOf(d.name) == 0) ? d.hour : '';
        });
}

function set_graph_2(data) {
    let days_in_year = xy_day_of_year(data);
    var maxBarWidth = 400;
    var maxFound = Math.max(...days_in_year.map(function(item) {
        return item.texts;
    }));
    var barScale = d3.scaleLinear().domain([0, maxFound]).range([0, maxBarWidth]);

    let height = 15;

    var colors = ['blue', 'green'];

    d3.select('#graph2')
        .attr('height', days_in_year.length * height);

    let u = d3.select('#graph2_bars')
        .selectAll('rect')
        .data(days_in_year);
    u.enter()
        .append('rect')
        .merge(u)
        .attr('height', height)
        .attr('width', function(d) {
            return barScale(d.texts) + 'px';
        })
        .attr('y', function(d) {
            var temp = data.names.indexOf(d.name) * height;
            return d.day_count * height * 2 + 3 + temp;
        })
        .attr('fill', function(d) {
            return colors[data.names.indexOf(d.name)];
        });
    u.exit().remove();

    let t = d3.select('#graph2_labels')
        .selectAll('text')
        .data(days_in_year);
    t.enter()
        .append('text')
        .merge(t)
        .attr('y', function(d) {
            return d.day_count * height * 2 + 3 + height;
        })
        .text(function(d) {
            return (data.names.indexOf(d.name) == 0) ? d.date.toDateString() : '';
        });
    t.exit().remove();
}

function set_graph_3_4(data) {
    let word_count_map = word_count(data);

    // TODO: remove too common stuff
    // TODO: sort data
    // TODO: cut off to top 100,
    // TODO: attach to text, arranged somehow.

    var emoji_regex = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/ug;

    let emoji_count = word_count_map.map(function(n_d) {
        return {
            'name' : n_d.name,
            'emoji_count' : n_d.word_count.filter(function(d) {
                return emoji_regex.test(d[1]);
            })
        };
    });

    console.log(emoji_count);
    // TODO: sort data
    // TODO: attach to text, arranged somehow
}

function handleFileSelect(evt) {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        var files = evt.target.files; // FileList object

        // files is a FileList of File objects. List some properties.
        var output = [];
        for (var i = 0, f; f = files[i]; i++) {
            output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a',') =',
                        f.size, ' bytes, last modified: ',
                        f.lastModifiedDate ?
                        f.lastModifiedDate.toLocaleDateString() : 'n/a',
                        '</li>');
            var reader = new FileReader();
            reader.onload = (function(theFile) {
                return function(e) {
                    var b_name = document.getElementById("b_name_input").value;
                    var k_name = document.getElementById("k_name_input").value;
                    var b_ids = string_to_int_array(document.getElementById('b_ids_input').value);
                    var k_ids = string_to_int_array(document.getElementById('k_ids_input').value);

                    csv_obj = d3.csvParse(e.target.result);
                    data = split_b_k(csv_obj, b_ids, k_ids, b_name, k_name);
                    set_graph_0(data);
                    set_graph_1(data);
                    set_graph_2(data);
                    set_graph_3_4(data);
                };
            })(f);
            reader.readAsText(f);
        }
        document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';

    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
}
