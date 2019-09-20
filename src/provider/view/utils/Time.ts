// require because this is imported by the tests
// which have esModuleIntrop = false
const moment = require('moment');

let localeData = moment.localeData();

const language = this.navigator ? navigator.language : 'en';
localeData = moment.localeData(language);

moment.defineLocale(localeData, {
    relativeTime: {
        future: (value: string) => value === 'now' ? 'soon' : 'in ' + value,
        past: (value: string) => value === 'now' ? value : value + ' ago',
        s: 'now',
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
