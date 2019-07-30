import {injectable} from 'inversify';

import {PointTopLeft} from 'openfin/_v2/api/system/point';
import {Rect} from 'openfin/_v2/api/system/monitor';
import {Transition, TransitionOptions} from 'openfin/_v2/api/window/transition';
import {MonitorEvent} from 'openfin/_v2/api/events/system';

import Bounds from 'openfin/_v2/api/window/bounds';
import { _Window } from 'openfin/_v2/api/window/window';
import {EventEmitter} from 'events';

interface LayouterConfig {
    spacing: number;
    margin: number;
    anchor: PointTopLeft;
    animationTime: number;
}

export interface LayoutItem {
    animate(transitions: Transition, options: TransitionOptions): Promise<void>;
    setTransform(transform: Bounds): Promise<void>;
    readonly dimensions: Promise<WindowDimensions>;
    position: PointTopLeft;
}

export type WindowDimensions = {height: number, width: number};

export enum LayoutEvent {
    LAYOUT_REQUIRED = 'layoutRequired'
}

@injectable()
export class Layouter {

    private static INTERNAL_CONFIG: LayouterConfig = {
        spacing: 10,
        margin: 50,
        anchor:{top: 1, left: 1},
        animationTime: 100
    };
    private _availableRect!: Required<Rect>;

    public static eventEmitter: EventEmitter = new EventEmitter();

    constructor() {
        fin.System.getMonitorInfo().then(monitorInfo => {
            this._availableRect = monitorInfo.primaryMonitor.availableRect;
        });

        fin.System.addListener('monitor-info-changed', (async (event: MonitorEvent<string, string>) => {
            const monitorInfo = await fin.System.getMonitorInfo();
            this._availableRect = monitorInfo.primaryMonitor.availableRect;
            Layouter.eventEmitter.emit(LayoutEvent.LAYOUT_REQUIRED);
        }));
    }

    /**
     * Anchor point of the layout. clamped between -1 (for minimum) and 1 (for maximum) for each dimension.
     * @return {PointTopLeft} anchor position
     */
    private get anchor(): PointTopLeft {
        return Layouter.INTERNAL_CONFIG.anchor;
    }

    /**
     * Direction of the layout animation for the current layout configuration
     * @return {number} -1 (bottom to top) or 1 (up to bottom)
     */
    private get direction(): number {
        return (Layouter.INTERNAL_CONFIG.anchor.top >= 0) ? -1 : 1;
    }

    /**
     * Returns the spacing between each layoutable item for the current layout configuration
     * @return {number} spacing
     */
    private get spacing(): number {
        return Layouter.INTERNAL_CONFIG.spacing * this.direction;
    }

    /**
     * Returns the gap between the top of current available screen rectangle and item spawn position for the current layout configuration
     * @returns {number} margin
     */
    private get margin(): number {
        return Layouter.INTERNAL_CONFIG.margin * this.direction;
    }

    /**
     * Returns initial (spawn) position of any item for the current layout configuration
     * @returns {PointTopLeft} initial (spawn) position
     */
    private get spawnPosition(): PointTopLeft {
        const [originX, originY] = [this._availableRect.right / 2, this._availableRect.bottom / 2];
        return {
            top: originY + originY * this.anchor.top + this.margin,
            left: originX + originX * this.anchor.left
        };
    }

    /**
     * Layout a given stack of Layoutable items
     * @param item {LayoutItem} Target layoutable item stack
     */
    public async layout(items: LayoutItem[]): Promise<void> {
        let {top, left} = this.spawnPosition;
        let prev: number;
        for (const item of items) {
            let {height} = await item.dimensions;
            prev = top;
            top = top + height * this.direction + this.spacing;
            let newPosition = {
                top: (this.direction <= 0) ? top : prev,
                left: left
            };
            if (item.position.top !== newPosition.top || item.position.left !== newPosition.left) {
                item.position = newPosition;
                this.moveItem(item, item.position);
            }
        }
    }

    /**
     * Animate item to its natural size and specified position
     * @param item {LayoutItem} Target layoutable item
     * @param position {PointTopLeft} Position of the window.
     */
    public async moveItem(item: LayoutItem, position: PointTopLeft): Promise<void> {
        const bounds: Bounds = await this.calculateItemBounds(item, position);
        const config: LayouterConfig = Layouter.INTERNAL_CONFIG;

        if (!window) {
            return;
        }
        return item.animate(
            {
                opacity: {
                    opacity: 1,
                    duration: config.animationTime * 5
                },
                position: {
                    top: bounds.top,
                    left: bounds.left,
                    duration: config.animationTime
                },
                size: {
                    width: bounds.width,
                    height: bounds.height,
                    duration: config.animationTime
                }
            },
            {
                interrupt: true,
                tween: 'linear'
            }
        );
    }

    /**
     * Trigger the pre stack remove animation of the item.
     * @param item {LayoutItem} Target layoutable item
     */
    public async removeItem(item: LayoutItem): Promise<void> {
        const direction: number = (this.anchor.top >= 0) ? 1 : 0;
        const {height} = await item.dimensions;
        const config: LayouterConfig = Layouter.INTERNAL_CONFIG;
        const bounds: Bounds = await this.calculateItemBounds(item);

        return item.animate(
            {
                size: {
                    height: 0,
                    width: bounds.width,
                    duration: config.animationTime
                },
                position: {
                    top: bounds.top + height * direction,
                    left: bounds.left,
                    duration: config.animationTime
                }
            },
            {
                interrupt: false,
                tween: 'linear'
            }
        );
    }

    /**
     * Moves and resizes the window to its initial position after its spawn
     * @param item {LayoutItem} Target layoutable item
     */
    public async setInitialTransform(item: LayoutItem): Promise<void> {
        const dimensions: WindowDimensions = await item.dimensions;
        const spawnTransform: Bounds = await this.calculateItemBounds(item, this.spawnPosition, {width: dimensions.width, height: 0});
        item.position = this.spawnPosition;

        await item.setTransform(spawnTransform);
    }

    /**
     * Get bounds for the window, or the possible bounds given a position and the window dimensions.
     * @param item {LayoutItem} Target layoutable item
     * @param position {PointTopLeft} Position of the window.
     * @param dimensions {WindowDimensions} Dimension of the window.
     */
    private async calculateItemBounds(item: LayoutItem, position?: PointTopLeft, dimensions?: WindowDimensions): Promise<Required<Bounds>> {
        const {width, height} = dimensions || await item.dimensions;
        let {top, left} = position || item.position;
        left = left - width * ((this.anchor.left > 0) ? 1 : 0);
        return {
            top,
            left,
            width: width,
            height: height,
            bottom: top + height,
            right: left + width
        };
    }

    private set anchor(newAnchor: PointTopLeft) {
        Layouter.INTERNAL_CONFIG.anchor = newAnchor;
    }

}