import { CreatePayload } from '../../client/internal';

export enum NotificationType {
    DEFAULT = 'DEFAULT',
    BUTTON = 'BUTTON',
    INLINE = 'INLINE',
    INLINEBUTTON = 'INLINEBUTTON'
}

export function resolveType(payload: CreatePayload): NotificationType {
    const button: boolean = typeof payload.buttons === 'object' && payload.buttons.length > 0 ? true : false;
    const inline: boolean = typeof payload.inputs === 'object' && payload.inputs.length > 0 ? true : false;

    let type: NotificationType = NotificationType.DEFAULT;

    if (button && !inline) {
        type = NotificationType.BUTTON;
    } else if (!button && inline) {
        type = NotificationType.INLINE;
    } else if (button && inline) {
        type = NotificationType.INLINEBUTTON;
    }

    return type;
}