import {StoredNotification} from '../../model/StoredNotification';
import {TitledNotification} from '../components/NotificationCard/NotificationCard';
import {StoredApplicationMap} from '../../store/State';

import {getDateTitle} from './Time';

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
    notifications: TitledNotification[];
}

/**
 * When creating a new notification group, this function determines the
 * user-visible title for the group
 * @param notification Notificiation
 * @param groupingType Grouping method
 */
export function getGroupTitle(notification: TitledNotification, groupingType: GroupingType): string {
    if (groupingType === GroupingType.APPLICATION) {
        return notification.title;
    } else if (groupingType === GroupingType.DATE) {
        const {date} = notification.notification;
        return getDateTitle(date);
    }
    throw new Error(`invalid groupMethod : ${groupingType}`);
}

/**
 * Group notifications together based on the given grouping method e.g. application/date.
 * @param notifications List of notifications to sort into groups.
 * @param applications A map of application registry to resolve the notification title
 * @param groupMethod Grouping type to use for sorting.
 */
export function groupNotifications(notifications: StoredNotification[], applications: StoredApplicationMap, groupMethod: GroupingType): Group[] {
    const groupMap = notifications.map((notification) => {
        // Map stored notifications to titled notifications
        return {...notification, title: (applications.get(notification.source.uuid) || {title: notification.source.name || ''}).title};
    }).sort((a: StoredNotification, b: StoredNotification) => {
        // Sort notifications by date (groups will then also be sorted by date)
        return b.notification.date.valueOf() - a.notification.date.valueOf();
    }).reduce((groups: Map<string, Group>, currentNotification: TitledNotification) => {
        const key = (groupMethod === GroupingType.DATE) ? getGroupTitle(currentNotification, groupMethod) : currentNotification.source.uuid;
        // If group title already exists just add it to the group
        if (groups.has(key)) {
            const group = groups.get(key)!;
            group.notifications.push(currentNotification);
        } else {
            groups.set(key, {
                key: key,
                type: groupMethod,
                title: getGroupTitle(currentNotification, groupMethod),
                notifications: [currentNotification]
            });
        }
        return groups;
    }, new Map<string, Group>());

    return Array.from(groupMap.values());
}
