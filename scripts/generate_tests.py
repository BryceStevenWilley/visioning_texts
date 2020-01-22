#!/usr/bin/env python3

import itertools
import uuid
from datetime import datetime

# 0: month num, 1: day num, 2: 4 int year, 3: 2 int year
dash_date_strs = [
    '{0:02d}/{1:02d}/{2:04d}', # MM/DD/YYYY
    '{1:02d}/{0:02d}/{2:04d}', # DD/MM/YYYY
    '{0:02d}/{1:02d}/{3:02d}', # MM/DD/YY
    '{1:02d}/{0:02d}/{3:02d}', # DD/MM/YY
    '{0:d}/{1:d}/{2:04d}', # M/D/YYYY
    '{1:d}/{0:d}/{2:04d}', # D/M/YYYY
    '{0:d}/{1:d}/{3:02d}', # M/D/YY
    '{1:d}/{0:d}/{3:02d}', # D/M/YY
]

dot_date_strs = [temp_str.replace('/', '.') for temp_str in dash_date_strs]

# 0: hour, 1: min, 2: seconds, 3: 12 mod hour, 4: AM/PM, 5: a.m.
time_strs = [
    '{0:02d}:{1:02d}', # HH:MM
    '{3:d}:{1:02d} {4}', # H:MM a
    '{3:d}:{1:02d} {5}', # H:MM a.
    '{0:02d}:{1:02d}:{2:02d}', # HH:MM:SS
    '{3:d}:{1:02d}:{2:02d} {4}', # H:MM:SS a
    '{3:d}:{1:02d}:{2:02d} {5}', # H:MM:SS a.
]

full_datetime_strs = [
    '[{0}, {1}]',
    '{0}, {1} -'
]

sample_data = [
    [datetime(2019, 11, 1, 1, 2, 3), 'Bryce: Hi'],
    [datetime(2019, 11, 1, 13, 2, 3), 'Bryce: If\nyou'],
    [datetime(2019, 11, 10, 1, 2, 3), 'Bryce: are looking'],
    [datetime(2019, 11, 10, 13, 2, 3), 'Bryce: at this test data'],
    [datetime(2020, 1, 1, 1, 2, 3), 'Bryce: Why?'],
    [datetime(2020, 1, 1, 21, 12, 33), 'You: Because I can'],
    [datetime(2020, 1, 20, 3, 12, 33), 'Bryce: I guess you can.'],
    [datetime(2020, 1, 20, 16, 12, 33), 'Bryce: Do what you want I guess.']
]

def main():
    all_date_strs = dash_date_strs + dot_date_strs
    for dt_template in itertools.product(all_date_strs, time_strs, full_datetime_strs):
        out_file = open(uuid.uuid4().hex + '.txt', 'w')
        for data in sample_data:
            d = data[0]
            AP = 'AM' if d.hour < 12 else 'PM'
            ap = 'a.m.' if d.hour < 12 else 'p.m.'
            date_str = dt_template[0].format(d.month, d.day, d.year, d.year % 100)
            time_str = dt_template[1].format(d.hour, d.minute, d.second, d.hour % 12, ap, AP)
            full_str = dt_template[2].format(date_str, time_str)
            out_file.write('{0} {1}\n'.format(full_str, data[1]))
        out_file.close()

if __name__ == '__main__':
    main()
