import {Signal} from 'openfin-service-signal';
import {injectable, inject} from 'inversify';
import {PointTopLeft} from 'openfin/_v2/api/system/point';
import {Rect, MonitorInfo} from 'openfin/_v2/api/system/monitor';
import {Transition, TransitionOptions} from 'openfin/_v2/api/window/transition';
import Bounds from 'openfin/_v2/api/window/bounds';
import {_Window} from 'openfin/_v2/api/window/window';

import {Inject} from '../common/Injectables';
import {MonitorModel} from '../model/MonitorModel';

import {AsyncInit} from './AsyncInit';

interface LayouterConfig {
    spacing: number;
    anchor: PointTopLeft;
    animationTime: number;
}

export interface LayoutItem {
    animate(transitions: Transition, options: TransitionOptions): Promise<void>;
    setTransform(transform: Bounds): Promise<void>;
    readonly dimensions: Promise<WindowDimensions>;
    position: PointTopLeft;
}

export interface LayoutStack {
    items: LayoutItem[];
    layoutHeight: number;
}

export type WindowDimensions = {height: number, width: number};

@injectable()
export class Layouter extends AsyncInit {
    private static INTERNAL_CONFIG: Readonly<LayouterConfig> = {
        spacing: 10,
        anchor: {top: 1, left: 1},
        animationTime: 100
    };

    private readonly _monitorModel: MonitorModel;
    private _availableRect!: Required<Rect>;

    public onLayoutRequired: Signal<[]> = new Signal();

    constructor(@inject(Inject.MONITOR_MODEL) monitorModel: MonitorModel) {
        super();

        this._monitorModel = monitorModel;
    }

    public async init(): Promise<void> {
        await this._monitorModel.initialized;

        this._availableRect = this._monitorModel.monitorInfo.primaryMonitor.availableRect;

        this._monitorModel.onMonitorInfoChanged.add((monitorInfo: MonitorInfo) => {
            this._availableRect = monitorInfo.primaryMonitor.availableRect;
            this.onLayoutRequired.emit();
        });
    }

    /**
     * Anchor point of the layout. clamped between -1 (for minimum) and 1 (for maximum) for each dimension.
     * @returns {PointTopLeft} anchor position
     */
    private get anchor(): PointTopLeft {
        return Layouter.INTERNAL_CONFIG.anchor;
    }

    /**
     * Direction of the layout animation for the current layout configuration
     * @returns -1 (bottom to top) or 1 (up to bottom)
     */
    private get direction(): number {
        return (Layouter.INTERNAL_CONFIG.anchor.top >= 0) ? -1 : 1;
    }

    /**
     * Returns the spacing between each layoutable item for the current layout configuration
     * @returns spacing
     */
    private get spacing(): number {
        return Layouter.INTERNAL_CONFIG.spacing * this.direction;
    }

    /**
     * Returns initial (spawn) position of any item for the current layout configuration
     * @returns initial (spawn) position
     */
    private get spawnPosition(): PointTopLeft {
        const origin: PointTopLeft = {
            top: (this._availableRect.bottom - this._availableRect.top) / 2,
            left: (this._availableRect.right - this._availableRect.left) / 2
        };
        const margin: number = (this.anchor.top < 0) ? this.spacing : 0;
        return {
            top: this._availableRect.top + origin.top + origin.top * this.anchor.top + margin,
            left: this._availableRect.left + origin.left + origin.left * this.anchor.left
        };
    }

    /**
     * Returns the usable screen height for the current layout configuration
     * @returns height available
     */
    private get availableHeight(): number {
        const origin = this._availableRect.bottom / 2;
        const screenHeight = this._availableRect.bottom - this._availableRect.top;
        const top = this._availableRect.top + origin + origin * this.anchor.top;
        return screenHeight - (this.direction < 0 ? screenHeight - top : top);
    }

    /**
     * Layout a given stack of Layoutable items
     * @param stack Target layoutable item stack
     */
    public async layout(stack: LayoutStack): Promise<void> {
        // eslint-disable-next-line prefer-const
        let {top, left} = this.spawnPosition;
        let prev: number;
        stack.layoutHeight = 0;
        for (const item of stack.items) {
            const {height} = await item.dimensions;
            prev = top;
            top = top + height * this.direction + this.spacing;
            const newPosition: PointTopLeft = {
                top: (this.direction <= 0) ? top : prev,
                left: left
            };
            item.position = newPosition;
            this.moveItem(item, item.position);
            // update stack height.
            stack.layoutHeight += height + Layouter.INTERNAL_CONFIG.spacing;
        }
    }

    /**
     * Animate item to its natural size and specified position
     * @param item Target layoutable item
     * @param position Position of the window.
     */
    public async moveItem(item: LayoutItem, position: PointTopLeft): Promise<void> {
        const bounds: Bounds = await this.calculateItemBounds(item, position);
        const config: LayouterConfig = Layouter.INTERNAL_CONFIG;

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
     * @param item Target layoutable item
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
     * @param item Target layoutable item
     */
    public async setInitialTransform(item: LayoutItem): Promise<void> {
        const dimensions: WindowDimensions = await item.dimensions;
        const spawnTransform: Bounds = await this.calculateItemBounds(item, this.spawnPosition, {width: dimensions.width, height: 0});
        item.position = this.spawnPosition;

        await item.setTransform(spawnTransform);
    }

    /**
     * Checks if item would fit in screen fully if it was added to the given stack and laid out.
     * @param stack Stack to add the item
     * @param queue queue to check the items.
     */
    public async getFittingItems(stack: LayoutStack, queue: LayoutItem[]): Promise<LayoutItem[]> {
        let availableHeight: number = this.availableHeight - stack.layoutHeight;
        const fittingItems: LayoutItem[] = [];
        while (queue.length > 0) {
            const {height} = await queue[0].dimensions;
            if (height + Layouter.INTERNAL_CONFIG.spacing < availableHeight) {
                availableHeight -= height;
                fittingItems.push(queue.shift()!);
            } else {
                break;
            }
        }
        return fittingItems;
    }

    /**
     * Get bounds for the window, or the possible bounds given a position and the window dimensions.
     * @param item Target layoutable item
     * @param position Position of the window.
     * @param dimensions Dimension of the window.
     */
    private async calculateItemBounds(item: LayoutItem, position?: PointTopLeft, dimensions?: WindowDimensions): Promise<Required<Bounds>> {
        const {width, height} = dimensions || await item.dimensions;
        // eslint-disable-next-line prefer-const
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
}
