import { NotificationContext } from "./Notification";
import { OptionButton } from "./OptionButton";
/**
 * @description interface for notification event
 */
export interface NotificationEvent {
    name: string;
    uuid: string;
    id: string;
    context: NotificationContext;
    buttons: OptionButton[];
    buttonIndex: number;
}