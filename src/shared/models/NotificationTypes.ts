import {ISenderInfo} from '../../provider/models/ISenderInfo';
import {Notification} from './Notification';

export enum NotificationTypes {
    DEFAULT = 'DEFAULT',
    BUTTON = 'BUTTON',
    INLINE = 'INLINE',
    INLINEBUTTON = 'INLINEBUTTON'
}

export function TypeResolver(payload: Notification|Notification&ISenderInfo): NotificationTypes {
    const button: boolean = typeof payload.buttons === 'object' && payload.buttons.length > 0 ? true : false;
    const inline: boolean = typeof payload.inputs === 'object' && payload.inputs.length > 0 ? true : false;

    let type: NotificationTypes = NotificationTypes.DEFAULT;

    if (button && !inline) {
        type = NotificationTypes.BUTTON;
    } else if (!button && inline) {
        type = NotificationTypes.INLINE;
    } else if (button && inline) {
        type = NotificationTypes.INLINEBUTTON;
    }

    return type;
}