/**
 * OpenFin Notifications provide developers with a uniform way to create, display and organize desktop notifications
 * as well as responding to notification events.
 *
 * Notifications will be displayed as toasts as well as being listed and organized in a Notification Center. The
 * Notification Center can be accessed by clicking on the system tray notification icon.
 *
 * ## Getting Started
 *
 * See the [Desktop Services documentation](https://developers.openfin.co/docs/desktop-services) for details on
 * including a desktop service within your application. Once configured via your application manifest, the API
 * documented here will function as expected.
 *
 * ### Basic example:
 * ```ts
 * // Non-Interactive "fire and forget" notification
 * // Clicking the notification will pass an `notification-activated` event back to the application.
 * // There will still be a `notification-closed` event when the service closes the notification (this occurs in all cases).
 * await create({
 *     title: 'Build Complete',
 *     body: 'Job "develop#123" finished with state "SUCCESS"',
 *     category: 'Build Statuses'
 * });
 * ```
 *
 * @module Notifications
 */

/**
 * Need a comment block here so that the comment block above is interpreted as a file comment, and not a comment on the
 * import below.
 *
 * @hidden
 */
import {ActionDeclaration, NotificationActionResult} from './actions';
import {tryServiceDispatch, eventEmitter} from './connection';
import {ButtonOptions, ControlOptions} from './controls';
import {APITopic} from './internal';

/**
 * Configuration options for constructing a Notifications object.
 */
export interface NotificationOptions {
    /**
     * A unique identifier for the Notification.
     *
     * If not provided at time of creation, one will be generated for you and returned as part of the {@link create} method.
     */
    id?: string;

    /**
     * Title of the notification.
     *
     * Displayed as the first line of the notification, in a heading style.
     */
    title: string;

    /**
     * Notification body text.
     * 
     * This is the main notification content, displayed below the notification title. The notification will expand to fit the length of this text.
     */
    body: string;

    /**
     * Describes the context of this notification. Allows users to control different notification types that are raised
     * by an application.
     *
     * This string is not displayed on the notification itself, but should be user-readable. It will be displayed in
     * the notification center preferences section, and any string passed as a `category` should make sense when
     * displayed in that context.
     *
     * In general, event categories should list all the different types of notifications raised by your app. As a
     * general guide, if a user may want to have different preferences for some subset of notifications created by your
     * app, then ensure those notifications have a distinct category.
     *
     * For example - given a calendar app, notification categories could be:
     * - `"Upcoming Events"`: Notification that an event is about to start
     * - `"Event Start"`: Notification raised when event starts, expiring at the event end time
     * - `"Event Modified"`: When an event is modified
     * - `"Event Cancelled"`: When an event is cancelled
     * - `"Event Response"`: An attendee has responded to an event invitation that you created
     * - `"Daily Agenda"`: A notification sent each morning with event reminders
     *
     * **NOTE:** The user-facing UI that a user would use to manage their preferences is still in progress. This
     * property has been added in advance of this UI being released, to ensure future compatibility.
     */
    category: string;

    /**
     * URL of the icon to be displayed in the notification.
     */
    icon?: string;

    /**
     * Any custom context data associated with the notification.
     */
    customData?: CustomData;

    /**
     * The timestamp shown on the notification. If omitted, the current date/time will be used.
     *
     * This is presentational only - a future date will not incur a scheduling action.
     */
    date?: Date;

    /**
     * A timestamp at which point the notification will be removed from the user's notification center.
     *
     * If omitted or `null`, notification will persist until user explicitly actions/clears it.
     */
    expires?: Date|null;

    /**
     * A list of button definitions, to display below the notification text.
     *
     * Notifications support up to four buttons, attempting to add more than four will result in the notification
     * being rejected by the service.
     */
    buttons?: ButtonOptions[];

    /**
     * An action that will fire when the notification is clicked. This only fires on clicks to the notification body,
     * interactions with buttons (both application-defined buttons, and the default 'X' close button) will not trigger
     * a select action.
     *
     * If omitted or `null`, applications will not receive a {@link NotificationActionEvent|`notification-action`}
     * event when the notification is clicked. See {@link Actions} for more details on Notification actions, and
     * receiving interaction events from notifications.
     */
    onSelect?: ActionDeclaration<never, never>|null;
}

/**
 * Application-defined context data that can be attached to notifications.
 */
export type CustomData = any;

/**
 * A fully-hydrated form of {@link NotificationOptions}.
 *
 * After {@link create|creating} a notification, the service will return this object - which will be the given options
 * object, with any unspecified fields filled-in with default values.
 *
 * This object should be treated as immutable, modifying its state will not have any effect on the notification that
 * the user sees on-screen.
 */
export type Notification = Readonly<NotificationOptions & Required<NotificationOptions>>>;

/**
 * Event that is fired for interactions with notification UI elements. It is important to note that applications will
 * only receive these events if they indicate to the service that they want to receive these events. See
 * {@link Actions} for a full example of how actions are defined, and how an application can listen to and handle them.
 *
 * This can be for the notification button(s). Later versions of the service will add additional control types. All
 * actions, for all control types, will be returned to the application via the same `notification-action` event type.
 * Check the contents of the event object for details on what triggered this action, which control the user
 * interacted with, and what metadata was attached to the action.
 *
 * This type includes a generic type argument, should applications wish to define their own interface for action
 * results. See {@link NotificationActionResult} for details.
 *
 * @event
 */
export interface NotificationActionEvent<T = {}> {
    type: 'notification-action';

    /**
     * The notification that created this action
     */
    notification: Readonly<Notification>;

    /**
     * Indicates what triggered this action.
     * 
     * Note that the `programmatic` trigger is not yet implemented.
     */
    trigger: ActionTrigger;

    /**
     * The control whose interaction resulted in this action being raised. Will only be present when {@link trigger} is
     * {@link ActionTrigger.CONTROL}.
     *
     * Future versions of the service will add additional controls beyond buttons, and interactions with these new
     * control types will also come through this one event type. For best forward-compatibility, applications should
     * always check the `type` property of this control, and not assume that the type will always be `'button'`.
     *
     * This field is marked optional as future versions of the service will also include alternate methods of raising
     * `notification-action` events that do not originate from a button or other control.
     *
     * When present, the object here will always be strictly equal to one of the control definitions within
     * `notification`. This means `indexOf` checks and other equality checks can be performed on this field if
     * required, such as:
     *
     * ```ts
     * function onNotificationAction(event: NotificationActionEvent): void {
     *     if (event.control && event.control.type === 'button') {
     *         const butttonIndex = event.notification.buttons.indexOf(event.control);
     *
     *         // Handle button click
     *         // . . .
     *     }
     * }
     * ```
     */
    control?: ControlOptions;

    /**
     * Application-defined metadata that this event is passing back to the application.
     *
     * A `notification-action` event is only raised if the {@link NotificationOptions|notification definition} includes
     * a payload on the actions of one or more controls (and if the user then performs the corresponding action).
     *
     * See the comment on the {@link NotificationActionEvent} type for an example of buttons that do and don't raise
     * actions.
     */
    result: NotificationActionResult<T>;
}

/**
 * Lists the different triggers for a notification {@link Actions|action}. Each action that is triggered will result in
 * a {@link NotificationActionEvent|`notification-action`} event, which can be captured by the application that raised
 * the notification.
 */
export enum ActionTrigger {
    /**
     * The user interacted with one of the controls within the notification. This currently means a button click, but
     * other control types will be added in future releases.
     */
    CONTROL = 'control',

    /**
     * The user clicked the body of the notification itself. Any clicks of the notification that don't hit a control
     * will result in this event being fired.
     */
    BODY = 'body',

    /**
     * The action was triggered programmatically by an application.
     * 
     * *Not currently supported - will be implemented in a future release*
     */
    PROGRAMMATIC = 'programmatic'
}

/**
 * Event fired whenever the notification has been closed.
 *
 * This event is fired regardless of how the notification was closed - i.e.: via a call to `clear`/`clearAll`, or by a
 * user clicking either the notification itself, the notification's close button, or a button on the notification.
 *
 * @event
 */
export interface NotificationClosedEvent {
    type: 'notification-closed';

    /**
     * The notification that has just been closed.
     *
     * This object will match what is returned from the `create` call when the notification was first created.
     */
    notification: Notification;
}

/**
 * Event fired whenever a new notification has been created.
 *
 * @event
 */
export interface NotificationCreatedEvent {
    type: 'notification-created';

    /**
     * The notification that has just been created.
     *
     * This object will match what is returned from the `create` call.
     */
    notification: Notification;
}

/**
 * @hidden
 */
export type NotificationEvent = NotificationActionEvent | NotificationClosedEvent | NotificationCreatedEvent;

export function addEventListener(eventType: 'notification-action', listener: (event: NotificationActionEvent) => void): void;
export function addEventListener(eventType: 'notification-created', listener: (event: NotificationCreatedEvent) => void): void;
export function addEventListener(eventType: 'notification-closed', listener: (event: NotificationClosedEvent) => void): void;

/**
 * Adds a listener, see definitions of individual event interfaces for details on each event.
 *
 * @param eventType The event being subscribed to
 * @param listener The callback function to add
 */
export function addEventListener<E extends NotificationEvent>(eventType: E['type'], listener: (event: E) => void): void {
    if (typeof fin === 'undefined') {
        throw new Error('fin is not defined. The openfin-notifications module is only intended for use in an OpenFin application.');
    }

    eventEmitter.addListener(eventType, listener);
}

export function removeEventListener(eventType: 'notification-action', listener: (event: NotificationActionEvent) => void): void;
export function removeEventListener(eventType: 'notification-created', listener: (event: NotificationCreatedEvent) => void): void;
export function removeEventListener(eventType: 'notification-closed', listener: (event: NotificationClosedEvent) => void): void;

/**
 * Removes a listener previously added with {@link addEventListener}.
 *
 * Has no effect if `eventType` isn't a valid event, or `listener` isn't a callback registered against `eventType`.
 *
 * @param eventType The event being unsubscribed from
 * @param listener The callback function to remove
 */
export function removeEventListener<E extends NotificationEvent>(eventType: E['type'], listener: (event: E) => void): void {
    if (typeof fin === 'undefined') {
        throw new Error('fin is not defined. The openfin-notifications module is only intended for use in an OpenFin application.');
    }

    eventEmitter.removeListener(eventType, listener);
}

/**
 * Creates a new Notification.
 *
 * The Notification will appear in the Notification Center and as a toast if the Center is not visible.
 *
 * If a Notification is created with an `id` of an already existing Notification, the existing Notification will be recreated with the new content.
 *
 * ```ts
 * import {create} from 'openfin-notifications';
 *
 * create({
 *      id: "uniqueNotificationId",
 *      title: "Notification Title",
 *      body: "Text to display within the notification body",
 *      icon: "https://openfin.co/favicon.ico"
 * });
 * ```
 *
 * @param options Notification configuration options.
 */
export async function create(options: NotificationOptions): Promise<Notification> {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.CREATE_NOTIFICATION, options);
}

/**
 * Clears a specific Notification from the Notification Center.
 *
 * Returns true if the Notification was successfully cleared.  Returns false if the Notification was not cleared, without errors.
 *
 * ```ts
 * import {clear} from 'openfin-notifications';
 *
 * clear("uniqueNotificationId");
 * ```
 *
 * @param id ID of the Notification to clear.
 */
export async function clear(id: string): Promise<boolean> {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.CLEAR_NOTIFICATION, {id});
}

/**
 * Retrieves all Notifications which were created by the calling application, including child windows.
 *
 * ```ts
 * import {getAll} from 'openfin-notifications'
 *
 * getAll().then((notifications: Notification[]) => {
 *     console.log(`Service has ${notifications.length} notifications for this app:`, notifications);
 * });
 * ```
 */
export async function getAll(): Promise<Notification[]>{
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.GET_APP_NOTIFICATIONS, undefined);
}

/**
 * Clears all Notifications which were created by the calling application, including child windows.
 *
 * Returns the number of successfully cleared Notifications.
 *
 * ```ts
 * import {clearAll} from 'openfin-notifications';
 *
 * clearAll();
 * ```
 */
export async function clearAll(): Promise<number> {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.CLEAR_APP_NOTIFICATIONS, undefined);
}

/**
 * Toggles the visibility of the Notification Center.
 *
 * ```ts
 * import {toggleNotificationCenter} from 'openfin-notifications';
 *
 * toggleNotificationCenter();
 * ```
 */
export async function toggleNotificationCenter(): Promise<void> {
    return tryServiceDispatch(APITopic.TOGGLE_NOTIFICATION_CENTER, undefined);
}
