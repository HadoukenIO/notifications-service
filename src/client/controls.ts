/**
 * Notifications allow additional UI components to be specified by applications. The service will control the
 * positioning and styling of these components.
 *
 * In this version of the service, only buttons are supported. Additional control types will be added in future
 * releases.
 *
 * @module Controls
 */

/**
 * Need a comment block here so that the comment block above is interpreted as a file comment, and not a comment on the
 * import below.
 *
 * @hidden
 */
import {ActionDeclaration} from './actions';

/**
 * Helper to make the `type` field required on any type that defines it as being optional.
 */
type WithExplicitType<T extends {type?: string}> = T & {type: string;};

/**
 * *Not yet implemented*
 *
 * Union of the options objects of all "primary controls" components supported by the service.
 */
export type PrimaryControlOptions = never;

/**
 * Union of options objects of all components that can be added to a notification, includes both buttons and primary
 * controls.
 */
export type ControlOptions = PrimaryControlOptions | WithExplicitType<ButtonOptions>;

/**
 * Configuration options for constructing a Button within a notification.
 */
export interface ButtonOptions {
    /**
     * Identifies the type of this control. Additional control types will be added in future versions of the service.
     *
     * This type declaration is optional, as the other control types will be declared in a slightly different way.
     * Whilst this field is optional when specifiying options, it will be added by the service during creation (see
     * {@link create}) - meaning it will always be present when receiving a `notification-action` event from a button.
     */
    type?: 'button';

    /**
     * User-facing button text.
     *
     * The button caption should be kept short, particularly if there are multiple buttons. Notifications are
     * fixed-width, and all buttons will be displayed on the same row.
     */
    title: string;

    /**
     * Optional icon URL, if an icon should be placed on the button.
     *
     * Icons are placed to the left of the button text.
     */
    iconUrl?: string;

    /**
     * Defines the data to be passed back to the application when the button is clicked.
     *
     * The payload specified here will be returned to the application via a `notification-action` event when the button
     * is clicked.
     *
     * This field must be specified if the application creating the notification wishes to be informed that the user
     * has clicked this button. If the button represents a "dismiss" or some other side-effect-free action then
     * the field may be omitted without consequence. Even if `onClick` is omitted, a `notification-closed` event will
     * still be raised after the button click.
     *
     * Future versions of the service will allow for greater control over what happens when a button is clicked.
     */
    onClick?: ActionDeclaration<never, never>;
}
