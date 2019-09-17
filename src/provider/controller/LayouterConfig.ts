import {Point} from '../model/Toast';

/**
 * Collection of all `Layouter`-related constants and pre-calculated properties.
 */
export class LayouterConfig {
    /**
     * Defines the corner of the screen in which toasts are displayed.
     *
     * This is used to calculate the pixel co-ordinates of the "anchor point" (the position at which new toasts will
     * be placed), and how toasts are positioned relative to that point.
     *
     * This will ultimately be user-selectable.
     */
    public readonly anchor: Readonly<Point<0|1>>;

    /**
     * Indicates where the anchor point of a toast is, relative to its center.
     *
     * This is used to produce offsets in the correct direction, given the chosen anchor point.
     */
    public readonly origin: Readonly<Point<-1|1>>;

    /**
     * The direction in which toasts will move away from the anchor point as additional toasts are added to the stack.
     *
     * This will always be calculated from {@link anchor}, and will not be user-selectable.
     */
    public readonly direction: Readonly<Point<-1|0|1>>;

    /**
     * Size of gap between subsequent toasts, and between toast stack and the edge of the monitor `available` area.
     */
    public readonly spacing: number = 10;

    /**
     * The time required for toasts to move
     */
    public readonly animDurationMove: number = 100;

    /**
     * The time required for toasts to fade in/out
     */
    public readonly animDurationFade: number = this.animDurationMove * 5;

    constructor(corner: Point<-1|1>) {
        this.origin = {...corner};
        this.anchor = {
            x: Math.max(corner.x, 0) as 0|1,
            y: Math.max(corner.y, 0) as 0|1
        };
        this.direction = {
            x: 0,
            y: -corner.y as -1|0|1
        };
    }
}
