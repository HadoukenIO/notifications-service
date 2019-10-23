import moment from 'moment';

const language = this.navigator ? navigator.language : 'en';

moment.updateLocale(language, {
    relativeTime: {
        future: (value: string) => value === 'now' ? 'soon' : `in ${value}`,
        past: (value: string) => value === 'now' ? value : `${value} ago`,
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
    return moment(date).calendar(undefined, {
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
