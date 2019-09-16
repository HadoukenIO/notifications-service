// require because this is imported by the tests
// which have esModuleIntrop = false
const moment = require('moment');

let localeData = moment.localeData();

const language = navigator.language;
localeData = moment.localeData(language);

moment.defineLocale(localeData, {
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

export function getDateTitle(date: Date | number): string {
    return moment(date).calendar(localeData, {
        sameDay: '[Today]',
        nextDay: '[Tomorrow]',
        nextWeek: 'dddd',
        lastDay: '[Yesterday]',
        lastWeek: '[Last] dddd',
        sameElse: 'LL'
    });
}

export function getDate(date: Date | number): string {
    return moment(date).fromNow();
}
