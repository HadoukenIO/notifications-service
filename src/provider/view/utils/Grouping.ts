import moment = require('moment');

import {StoredNotification} from '../../model/StoredNotification';

export enum GroupingType {
    APPLICATION = 'Application',
    DATE = 'Date'
}

/**
 * A notification group - a set of notifications that should be grouped together
 * within the UI.
 *
 * Grouping method can vary, but all grouping methods will produce a set of
 * these groups.
 */
export interface Group {
    /**
     * Unique key for this group. Mainly used for storing a date string so as time passes we do not need to recalculate the date to group the notifications by.
     */
    key: string;
    /**
     * The grouping type used to create this group.
     */
    type: GroupingType;
    /**
     * User-visibile title that will be displayed above these notifications
     */
    title: string;

    /**
     * The notifications to display within this group.
     *
     * This array should always contain at least one notification. If there are no
     * notifications that fit within this category then the group should be deleted.
     */
    notifications: StoredNotification[];
}

/**
 * When creating a new notification group, this function determines the
 * user-visible title for the group
 * @param notification Notificiation
 * @param groupingType Grouping method
 */
export function getGroupTitle(notification: StoredNotification, groupingType: GroupingType): string {
    if (groupingType === GroupingType.APPLICATION) {
        return notification.source.name || notification.source.uuid;
    } else if (groupingType === GroupingType.DATE) {
        const {date} = notification.notification;
        return moment(date).calendar(undefined, {
            sameDay: '[Today]',
            nextDay: '[Tomorrow]',
            nextWeek: 'dddd',
            lastDay: '[Yesterday]',
            lastWeek: '[Last] dddd',
            sameElse: 'DD/MM/YYYY'
        });
    }
    throw new Error(`invalid groupMethod : ${groupingType}`);
}

/**
 * Group notifications together based on the given grouping method e.g. application/date.
 * @param notifications List of notifications to sort into groups.
 * @param groupMethod Grouping type to use for sorting.
 */
export function groupNotifications(notifications: StoredNotification[], groupMethod: GroupingType): Map<string, Group> {
    // Sort notifications by date, this also causes the most recent group to be first
    notifications.sort((a: StoredNotification, b: StoredNotification) =>
        b.notification.date.valueOf() - a.notification.date.valueOf());
    // Reduce the notifications array into a Map of notifications grouped by their title
    const groupMap = notifications.reduce((groups: Map<string, Group>, currentNotification: StoredNotification) => {
        const groupTitle = getGroupTitle(currentNotification, groupMethod);
        // If group title already exists just add it to the group
        if (groups.has(groupTitle)) {
            const group = groups.get(groupTitle)!;
            group.notifications.push(currentNotification);
        } else {
            // Create a new group and add the notification to the group
            let key: string = currentNotification.source.name || currentNotification.source.uuid;
            if (groupMethod === GroupingType.DATE) {
                const date = new Date(currentNotification.notification.date);
                key = [
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate()
                ].join('-');
            }
            groups.set(groupTitle, {
                key: key,
                type: groupMethod,
                title: groupTitle,
                notifications: [currentNotification]
            });
        }
        return groups;
    }, new Map<string, Group>());

    return groupMap;
}
