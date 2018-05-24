import { ISenderInfo } from "../../provider/Models/ISenderInfo";
import { Notification } from "./Notification";

export enum NotificationTypes {
    DEFAULT,
    BUTTON,
    INLINE,
    INLINEBUTTON
}

export function TypeResolver(payload: Notification & ISenderInfo): NotificationTypes {
    const button: boolean = typeof payload.buttons === "object" && payload.buttons.length > 0 ? true : false;
    const inline: boolean = typeof payload.inputs === "object" && payload.inputs.length > 0 ? true : false;

    let type: NotificationTypes = NotificationTypes.DEFAULT;

    if(button && !inline){
        type = NotificationTypes.BUTTON;
    } else if(!button && inline){
        type = NotificationTypes.INLINE;
    } else if(button && inline){
        type = NotificationTypes.INLINEBUTTON;
    }

    return type;
}