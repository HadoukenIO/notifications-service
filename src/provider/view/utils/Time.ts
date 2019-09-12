// require because this is imported by the tests
// which have esModuleIntrop = false
const moment = require('moment');

moment.updateLocale('en', {
    relativeTime: {
        future: 'in %s',
        past: '%s',
        s: 'just now',
        ss: '%ss ago',
        m: '1m ago',
        mm: '%dm ago',
        h: '1h ago',
        hh: '%dh',
        d: 'a day ago',
        dd: '%dd',
        M: 'a month ago',
        MM: '%dM',
        y: 'a year ago',
        yy: '%dY'
    }
});

export function getDate(date: Date | number) {
    return moment(date).fromNow();
}
