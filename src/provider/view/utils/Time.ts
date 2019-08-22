// require because this is imported by the tests
// which have esModuleIntrop = false
const moment = require('moment');

moment.updateLocale('en', {
    relativeTime: {
        future: 'in %s',
        past: '%s ago',
        s: 'seconds',
        ss: '%ss',
        m: 'a minute',
        mm: '%dm',
        h: 'an hour',
        hh: '%dh',
        d: 'a day',
        dd: '%dd',
        M: 'a month',
        MM: '%dM',
        y: 'a year',
        yy: '%dY'
    }
});

export function getDate(date: Date | number) {
    return moment(date).fromNow();
}
