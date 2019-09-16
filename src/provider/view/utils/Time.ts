// require because this is imported by the tests
// which have esModuleIntrop = false
const moment = require('moment');

moment.updateLocale('en', {
    relativeTime: {
        future: 'in %s',
        past: '%s ago',
        s: 'a moment',
        m: '1m',
        mm: '%dm',
        h: '1h',
        hh: '%dh',
        d: 'a day',
        dd: '%d days',
        M: 'a month',
        MM: '%d months',
        y: 'a year',
        yy: '%d years'
    }
});

export function getDate(date: Date | number) {
    return moment(date).fromNow();
}
