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

    //var colors = ['blue', 'green'];

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
            //var temp = data.names.indexOf(d.name) * width;
            //return d.hour * width * 2 + 3 + temp;
            return d.hour * width + 3;
        })
        .attr('y', function(d, i) {
            return maxBarHeight - barScale(d.texts) + 'px';
        })
        .attr('fill', function(d) {
            return 'blue'; //colors[data.names.indexOf(d.name)];
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
            //return d.hour * width * 2 + 3 + width;
            return d.hour * width + 3 + width;
        })
        .text(function(d) {
            return d.hour; //(data.names.indexOf(d.name) == 0) ? d.hour : '';
        });
}

function set_graph_2(data) {
    let days_in_year = xy_day_of_year(data);
    var maxBarWidth = 400;
    var maxFound = Math.max(...days_in_year.map(function(item) {
        return item.texts;
    }));
    var barScale = d3.scaleLinear().domain([0, maxFound]).range([0, maxBarWidth]);

    let height = 3;

    //var colors = ['blue', 'green'];

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
            //var temp = data.names.indexOf(d.name) * height;
            //return d.day_count * height * 2 + 3 + temp;
            return d.day_count * height + 3;
        })
        .attr('fill', function(d) {
            return 'blue'; //colors[data.names.indexOf(d.name)];
        });
    u.exit().remove();

    let t = d3.select('#graph2_labels')
        .selectAll('text')
        .data(days_in_year);
    t.enter()
        .append('text')
        .merge(t)
        .attr('y', function(d) {
            //return d.day_count * height * 2 + 3 + height;
            return d.day_count * height + 3 + height;
        })
        .text(function(d) {
            return (d.date.getDate() == 1) ? d.date.toDateString() : '';
            //(data.names.indexOf(d.name) == 0) ? d.date.toDateString() : '';
        });
    t.exit().remove();
}

function set_graph_3(word_count_map) {
    let simple_words = ['the', 'and', 'And', 'a', 'to', 'was', 'is', 'of', 'but'];
    let word_count_smaller = word_count_map.map(function(n_d) {
        return {
            'name' : n_d.name,
            'word_count' : n_d.word_count.filter(function(d) {
                return !simple_words.includes(d[1]);
            })
        };
    });

    let u1 = d3.select('#graph3')
        .selectAll('div')
        .data(word_count_smaller);
    u1.enter()
        .append('div')
        .merge(u1)
        .attr('id', function(d) {
            return 'section3_' + d.name;
        })
        .html(function(d) {
            return '<h2>' + d.name + '</h2>';
        });
    u1.exit().remove();


    word_count_smaller.forEach(function(elem) {
        elem.word_count.sort(function(i1, i2) {
            return parseInt(i2[0], 10) - parseInt(i1[0], 10);
        });
    });
}

function set_graph_4(word_count_map) {
    let emoji_count = emoji_filter(word_count_map);
    let emoji_count_b = emoji_count[0].emoji_count;
    console.log(emoji_count_b);

    var width = 500;
    var height = 500;
    var simulation = d3.forceSimulation(emoji_count_b)
        .force('charge', d3.forceManyBody().strength(20))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(function(d) {
            return 1.2 * d[0];
        }))
        .on('tick', ticked);

    function ticked() {
        var u = d3.select('#graph4')
            .selectAll('g')
            .data(emoji_count_b);

        u.enter()
            .append('g')
            .html(function(d) {
                let emoji_size = 1.2 * d[0];
                let font_size = emoji_size * 1.7;
                let scoot = font_size / 2.55;
                return '<circle fill="white" r="' + emoji_size + '"/>' +
                    '<text x="' + emoji_size + '" y="' + scoot + '" font-size=\"' + font_size + '\">' + d[1] + '</text';
            })
            .merge(u)
            .attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            });
        u.exit().remove();
    }
}

function set_graph_4_list(word_count_map) {

    // TODO: remove too common stuff
    // TODO: sort data
    // TODO: cut off to top 100,
    // TODO: attach to text, arranged somehow.

    let emoji_count = emoji_filter(word_count_map);

    let u1 = d3.select('#graph4')
        .selectAll('div')
        .data(emoji_count);
    u1.enter()
        .append('div')
        .merge(u1)
        .attr('id', function(d) {
            return 'section4_' + d.name;
        })
        .html(function(d) {
            return '<h2>' + d.name + '</h2>';
        });
    u1.exit().remove();

    emoji_count.forEach(function(elem) {
        elem.emoji_count.sort(function(i1, i2) {
            return parseInt(i2[0], 10) - parseInt(i1[0], 10);
        });
        let u = d3.select('#section4_' + elem.name)
            .selectAll('p')
            .data(elem.emoji_count);
        u.enter()
            .append('p')
            .merge(u)
            .style('font-size', function(d) {
                return d[0] + 'px';
            })
            .text(function(d) {
                return d[1];
            });
        u.exit().remove();
    });
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
                    let word_count_map = word_count(data);
                    set_graph_3(word_count_map);
                    set_graph_4(word_count_map);
                };
            })(f);
            reader.readAsText(f);
        }
        document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';

    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
}
