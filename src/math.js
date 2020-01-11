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

function total_to_from_messages(data) {
    return data.names.map(function(n) {
        return {
            'name' : n,
            'texts' : data.data.filter(function(row) {
                return row.name == n;
            }).length
        };
    });
}

function total_to_from_chars(split_data) {
    return data.names.map(function(n) {
        return {
            'name' : n,
            'chars' : data.data.filter(function(row) {
                return row.name == n;
            }).map(function(row) {
                return row.BODY.length;
            }).reduce(function(total, num) {
                return total + num;
            }, 0)
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

function word_count(data) {
    return data.names.map(function(n) {
        let word_counts = data.data.filter(function(row) {
                return row.name == n;
            }).map(function(row) {
                return row.BODY.replace(/[.,!?\n]/g, '');
            }).reduce(function(all_words, msg) {
                return all_words.concat(msg.split(' ').filter(function(str) {
                    return str.length != 0;
                }));
            }, []).reduce(function(histo, word) {
                histo[word] = histo[word] ? +histo[word] + 1 : 1;
                return histo;
            }, {});
        var result = [], key;
        for (key in word_counts) {
            if (word_counts.hasOwnProperty(key) && word_counts[key] > 5) {
                result.push([word_counts[key], key]);
            }
        }

        return {
            'name' : n,
            'word_count' : result
        };
    });
}

function emoji_filter(word_count_map) {
    var emoji_regex = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/ug;

    return word_count_map.map(function(n_d) {
        return {
            'name' : n_d.name,
            'emoji_count' : n_d.word_count.filter(function(d) {
                return emoji_regex.test(d[1]);
            })
        };
    });

}
