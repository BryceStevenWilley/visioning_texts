function split_b_k(data, b_ids, k_ids, b_name, k_name) {
    all_ids = b_ids.concat(k_ids);
    var full_data = data.filter(function(row) {
        return all_ids.includes(row.TYPE);
    }).map(function(row) {
        if (b_ids.includes(row.TYPE)) {
            return {'name' : b_name,
                    'date' : new Date(parseInt(row.DATE_SENT, 10)),
                    'ID' : row.ID,
                    'BODY' : row.BODY
                   };
        } else {  // in k_ids
            return {'name' : k_name,
                    'date' : new Date(parseInt(row.DATE_SENT, 10)),
                    'ID' : row.ID,
                    'BODY' : row.BODY
                   };
        }
    });
    return {'names' : [b_name, k_name], 'data' : full_data};
}
function word_split(row) {
    return row.BODY.replace(/[.,!?\n]/g, '');
}

function word_reduce(all_words, msg) {
    return all_words.concat(msg.split(' ').filter(function(str) {
        return str.length != 0;
    }));
}

function total_to_from_data(data) {
    return data.names.map(function(n) {
        name_filt = data.data.filter(function(row) {
            return row.name == n;
        });
        return {
            'name' : n,
            'texts' : name_filt.length,
            'chars' : name_filt.map(function(row) {
                return row.BODY.length;
            }).reduce(function(total, num) {
                return total + num;
            }, 0),
            'words' : name_filt.map(word_split).reduce(word_reduce, []).length
        };
    });
}

function xy_time_of_day(data) {
    let all_hours = [];
    for (var i = 0; i < 24; i++) {
        all_hours.push({'name' : 'both', 'hour' : i, 'texts' : 0});
    }
    return data.data.map(function(item) {
        return item.date.getHours();
    }).reduce(function(histo, hour) {
        histo[hour].texts = +histo[hour].texts + 1;
        return histo;
    }, all_hours);
}

function xy_time_of_day_sep_person(data) {
    return data.names.map(function(n) {
        let all_hours = [];
        for (var i = 0; i < 24; i++) {
            all_hours.push({'name' : n, 'hour' : i, 'texts' : 0});
        }
        return data.data.filter(function(item) {
            return item.name == n;
        }).map(function(item) {
            return item.date.getHours();
        }).reduce(function(histo, hour) {
            histo[hour].texts = +histo[hour].texts + 1;
            return histo;
        }, all_hours);
    }).reduce(function(total, item) {
        return total.concat(item);
    }, []);
}

function min_max_date(data) {
    return data.data.reduce(function(min_max, row) {
        return [Math.min(min_max[0], row.date.getTime()), Math.max(min_max[1], row.date.getTime())];
    }, [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]).map(function(elem) {
        let tmp = new Date(elem);
        return new Date(tmp.getFullYear(), tmp.getMonth(), tmp.getDate());
    });
}

function milliseconds_in_day() {
    return 1000 * 60 * 60 * 24;
}

function step_dates(min_date, max_date, name) {
    let d = new Date(min_date.getTime());
    let date_array = [];
    let max_date_after = new Date(max_date.getTime() + milliseconds_in_day());
    while (d.getTime() <= max_date_after.getTime()) {
        date_array.push({'name' : name, 'date' : d, 'texts' : 0, 'day_count' : date_array.length});
        d = new Date(d.getTime() + milliseconds_in_day());
    }

    return date_array;
}

function xy_day_of_year(data) {
    let min_max = min_max_date(data);

    let all_days = step_dates(min_max[0], min_max[1], 'both');
    return data.data.map(function(item) {
        return Math.floor((item.date - min_max[0]) / milliseconds_in_day());
    }).reduce(function(histo, day) {
        histo[day].texts = +histo[day].texts + 1;
        return histo;
    }, all_days);
}

function xy_day_of_year_sep_person(data) {
    let min_max = min_max_date(data);

    return data.names.map(function(n) {
        let all_days = step_dates(min_max[0], min_max[1], n);
        return data.data.filter(function(item) {
            return item.name == n;
        }).map(function(item) {
            return Math.floor((item.date - min_max[0]) / milliseconds_in_day());
        }).reduce(function(histo, day) {
            histo[day].texts = +histo[day].texts + 1;
            return histo;
        }, all_days);
    }).reduce(function(total, item) {
        return total.concat(item);
    }, []);
}

function word_count_full(data) {
    return data.names.map(function(n) {
        let word_counts = data.data.filter(function(row) {
            return row.name == n;
        }).map(word_split).reduce(word_reduce, [])
            .reduce(function(histo, word) {
                histo[word] = histo[word] ? +histo[word] + 1 : 1;
                return histo;
            }, {});
        return {'name' : n, 'word_count' : word_counts};
    });
}

function word_count_less(word_count_map) {
    return word_count_map.map(function(n) {
        let result = [], key;
        for (key in n.word_count) {
            if (n.word_count.hasOwnProperty(key) && n.word_count[key] > 5) {
                result.push([n.word_count[key], key]);
            }
        }
        return {'name' : n, 'word_count' : result};
    });
}


function emoji_filter(word_count_map) {
    var emoji_rgx = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/ug;

    var splitter = new GraphemeSplitter();
    return word_count_map.map(function(x) {
        let tmp_map = {}, key_word;
        for (key_word in x.word_count) {
            if (x.word_count.hasOwnProperty(key_word)) {
                let graphemes = splitter.iterateGraphemes(key_word);
                let result = graphemes.next();
                while (!result.done) {
                    let emj = result.value;
                    if (emoji_rgx.test(emj)) {
                        tmp_map[emj] = tmp_map[emj] ? tmp_map[emj] + 1 : 1;
                    }
                    result = graphemes.next();
                }
            }
        }
        let result = [];
        for (key_word in tmp_map) {
            if (tmp_map.hasOwnProperty(key_word)) {
                result.push([tmp_map[key_word], key_word]);
            }
        }

        return {
            'name' : x.name,
            'emoji_count' : result};
    });
}
