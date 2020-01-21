function split_b_k(data, b_ids, k_ids, b_name, k_name, address_id) {
    all_ids = b_ids.concat(k_ids);
    var full_data = data.filter(function(row) {
        return all_ids.includes(row.TYPE) && row.ADDRESS == address_id;
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

var my_regex = /(\d+)\/(\d+)\/(\d+)/;
var mm_dd_regex = /^(((0)?[0-9])|((1)[0-2]))([\.\/])([0-2][0-9]|(3)[0-1])([\.\/])(\d{2}|\d{4}), ([0-9]?[0-9]):([0-9][0-9])(:[0-9][0-9])?( [aApP][mM])? -/;
var international_regex = /^([0-2][0-9]|(3)[0-1])([\.\/])(((0)[0-9])|((1)[0-2]))([\.\/])(\d{2}|\d{4}), ([0-9]?[0-9]):([0-9][0-9])(:[0-9][0-9])?( [aApP][mM])? -/;
var brace_regex = /^\[([0-2][0-9]|(3)[0-1])([\.\/])(((0)[0-9])|((1)[0-2]))([\.\/])(\d{2}|\d{4}), (([0-9])?[0-9]):([0-9][0-9])(:[0-9][0-9])?( [aApP][mM])?\]/;

function split_b_k_whatsapp(text) {
    let lines = text.split('\n').filter(function(d) { return d.length != 0; });
    var used_regex;
    var used_delim;
    var used_formats;
    let time_s_a = 'HH:mm:ss a';
    let time_m = 'HH:mm a';
    let time_s = 'HH:mm:ss';
    let time_ = 'HH:mm';
    let used = lines.reduce(function(used_st, l) {
        if (used_st['regex']) {
            return used_st;
        }
        let match_mm_dd = mm_dd_regex.test(l);
        let match_international = international_regex.test(l);
        let match_brace = brace_regex.test(l);
        // TODO(brycew): this is awful. Find a better way to support locales?
        if (match_mm_dd && !match_international && !match_brace) {
            return {'regex' :mm_dd_regex,
                    'delim' : '-',
                    'formats' : [
                        'M/DD/YY, ' + time_,
                        'M/DD/YY, ' + time_m,
                        'M/DD/YY, ' + time_s,
                        'M/DD/YY, ' + time_s_a,
                        'M/DD/YYYY, ' + time_,
                        'M/DD/YYYY, ' + time_m,
                        'M/DD/YYYY, ' + time_s,
                        'M/DD/YYYY, ' + time_s_a,
                                ]};
        } else if (match_international && !match_mm_dd && !match_brace) {
            return {'regex' :international_regex,
                    'delim' : '-',
                    'formats' : [
                        'DD/M/YY, ' + time_,
                        'DD/M/YY, ' + time_m,
                        'DD/M/YY, ' + time_s,
                        'DD/M/YY, ' + time_s_a,
                        'DD/M/YYYY, ' + time_,
                        'DD/M/YYYY, ' + time_m,
                        'DD/M/YYYY, ' + time_s,
                        'DD/M/YYYY, ' + time_s_a,
                    ]};
        } else if (match_brace && !match_mm_dd && !match_international) {
            return {'regex' : brace_regex,
                    'delim' : ']',
                    'formats' : [
                        '[DD.M.YY, ' + time_,
                        '[DD.M.YY, ' + time_m,
                        '[DD.M.YY, ' + time_s,
                        '[DD.M.YY, ' + time_s_a,
                        '[DD.M.YYYY, ' + time_,
                        '[DD.M.YYYY, ' + time_m,
                        '[DD.M.YYYY, ' + time_s,
                        '[DD.M.YYYY, ' + time_s_a,
                        '[DD/M/YY, ' + time_,
                        '[DD/M/YY, ' + time_m,
                        '[DD/M/YY, ' + time_s,
                        '[DD/M/YY, ' + time_s_a,
                        '[DD/M/YYYY, ' + time_,
                        '[DD/M/YYYY, ' + time_m,
                        '[DD/M/YYYY, ' + time_s,
                        '[DD/M/YYYY, ' + time_s_a,
                    ]};
        } else {
            // ambiguity: still empty
            return {};
        }
    }, {});
    if (!used['regex']) {
        console.log("The input file has an ambigious date format. TODO(brycew): fix");
        console.log("Example line: " + lines[0]);
    }

    lines = lines.slice(1);
    lines = lines.reduce(function(total, l) {
        let delim_idx = l.indexOf(used.delim);
        let time_str = l.slice(0, delim_idx);
        if (l.match(used.regex)) {
            total.push(l);
        } else {
            total[total.length - 1] = total[total.length - 1].concat(l);
        }
        return total;
    }, []);
    let full_data = lines.map(function(l) {
        let delim_idx = l.indexOf(used.delim);
        let time_str = l.slice(0, delim_idx);
        let rest_str = l.slice(delim_idx + 1);
        let colon_idx = rest_str.indexOf(':');
        let name_str = rest_str.slice(0, colon_idx);
        let msg_str = rest_str.slice(colon_idx + 1);
        return {'name' : name_str.trim().split(' ')[0], 'BODY' : msg_str.trim(),
                'date' : moment(time_str.trim(), used.formats).toDate()};
    });
    let names = full_data.reduce(function(total, d) {
        total.add(d.name);
        return total;
    }, new Set());
    var list_names = Array.from(names);
    if (list_names.length > 2) {
        console.log("WARNING: only 2 participants are supported at the moment, we parsed multiple:");
        console.log(list_names);
    }

    return {'names' : list_names, 'data': full_data};
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
        let name_filt = data.data.filter(function(row) {
            return row.name == n;
        });
        let chars = name_filt.map(function(row) {
            return row.BODY.length;
        });
        let words = name_filt.map(function(d) {
            let tmp = word_split(d);
            return tmp.split(' ').filter(function(str) {
                return str.length != 0;
            }).length;
        });
        return {
            'name' : n,
            'texts' : name_filt.length,
            'chars' : chars,
            'words' : words
        };
    });
}

function xy_time_of_day(data) {
    let all_times= [];
    for (var i = 0; i < 24 * 7; i++) {
        all_times.push({'name' : 'both',
                        'hour_day_hash' : i,
                        'hour' : i % 24,
                        'day' : Math.floor(i / 24),
                        'texts' : 0});
    }
    return data.data.map(function(item) {
        return item.date.getHours() + item.date.getDay() * 24;
    }).reduce(function(histo, hash) {
        histo[hash].texts = +histo[hash].texts + 1;
        return histo;
    }, all_times);
}

function xy_time_filter(data, day) {
    if (day == -1) {
        let all_times= [];
        for (var i = 0; i < 24; i++) {
            all_times.push({'name' : 'both',
                            'hour' : i,
                            'texts' : 0});
        }
        return data.reduce(function(histo, d) {
            histo[d.hour].texts = +histo[d.hour].texts + d.texts;
            return histo;
        }, all_times);
    } else {
        return data.filter(function(d) {
            return d.day == day;
        });
    }
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
                let word_lower = word.toLowerCase();
                histo[word_lower] = histo[word_lower] ? +histo[word_lower] + 1 : 1;
                return histo;
            }, {});
        return {'name' : n, 'word_count' : word_counts};
    });
}

var emoji_rgx = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/ug;

function word_count_less_diff(word_count_map) {
    let simple_words = ['the', 'and', 'And', 'a', 'to', 'was', 'is', 'of', 'but',
                        'my', 'like', 'this', 'think', 'if', 'all', 'she', 'going', 'her',
                        'i', 'you', 'that', 'it', 'be'];

    let smaller = word_count_map.map(function(n) {
        let tmp_map = {}, key;
        for (key in n.word_count) {
            if (n.word_count.hasOwnProperty(key) && n.word_count[key] > 5
                && !simple_words.includes(key) && !emoji_rgx.test(key)) {
                tmp_map[key] = n.word_count[key];
            }
        }
        return {'name' : n.name, 'word_count' : tmp_map};
    });

    // Assumption of exactly 2 people
    let min_alone = 10;

    let diff = smaller.reduce(function(total, n) {
        if (Object.keys(total).length == 0) {
            return n.word_count;
        }
        var tmp_combine = {}, key;
        for (key in n.word_count) {
            if (n.word_count.hasOwnProperty(key)) {
                if (total.hasOwnProperty(key)) {
                    let diff_val = total[key] - n.word_count[key];
                    tmp_combine[key] = [diff_val,
                        (total[key] + n.word_count[key])];
                } else {
                    if (n.word_count[key] > min_alone) {
                        tmp_combine[key] = [-n.word_count[key], n.word_count[key]];
                    }
                }
            }
        }
        for (key in total) {
            if (!n.word_count.hasOwnProperty(key) && total[key] > min_alone) {
                tmp_combine[key] = [total[key], total[key]];
            }
        }
        return tmp_combine;
    }, {});

    let final_list = [], key;
    for (key in diff) {
        if (diff.hasOwnProperty(key)) {
            final_list.push([diff[key][0] / diff[key][1], diff[key][1], key]);
        }
    }
    return final_list;
}

function emoji_filter(word_count_map) {
    var splitter = new GraphemeSplitter();
    return word_count_map.map(function(x) {
        let tmp_map = {}, key_word;
        for (key_word in x.word_count) {
            if (x.word_count.hasOwnProperty(key_word) && key_word.match(emoji_rgx)) {
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
