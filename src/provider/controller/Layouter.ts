import {Signal} from 'openfin-service-signal';
import {injectable, inject} from 'inversify';
import {Rect, MonitorInfo} from 'openfin/_v2/api/system/monitor';
import {_Window} from 'openfin/_v2/api/window/window';

import {Inject} from '../common/Injectables';
import {MonitorModel} from '../model/MonitorModel';
import {Rectangle, Point, ToastState, ReadonlyRectangle, Toast} from '../model/Toast';

import {AsyncInit} from './AsyncInit';
import {LayouterConfig} from './LayouterConfig';
import {LayoutStack} from './LayoutStack';

export interface LayoutItem {
    readonly state: ToastState;
    readonly size: Readonly<Point>;

    setState(state: ToastState): Promise<void>;
    setTransform(transform: ReadonlyRectangle): Promise<void>;
    animate(bounds: ReadonlyRectangle, config: LayouterConfig): Promise<void>;
}

@injectable()
export class Layouter extends AsyncInit {
    private readonly _monitorModel: MonitorModel;
    private _availableRect!: ReadonlyRectangle;
    private _spawnPosition!: Point;
    private readonly _config: LayouterConfig;

    public onLayoutRequired: Signal<[]> = new Signal();

    constructor(@inject(Inject.MONITOR_MODEL) monitorModel: MonitorModel) {
        super();

        this._monitorModel = monitorModel;
        this._config = new LayouterConfig({x: 1, y: 1});
    }

    public async init(): Promise<void> {
        await this._monitorModel.initialized;

        this.onMonitorChange(this._monitorModel.monitorInfo.primaryMonitor.availableRect);

        this._monitorModel.onMonitorInfoChanged.add((monitorInfo: MonitorInfo) => {
            this.onMonitorChange(monitorInfo.primaryMonitor.availableRect);
            this.onLayoutRequired.emit();
        });
    }

    /**
     * Layout a given stack of Layoutable items. Toast positions are calculated and assigned synchronously.
     *
     * @param stack Target layoutable item stack
     */
    public layout(stack: LayoutStack): void {
        const {spacing} = this._config;
        const promises: Promise<void>[] = [];
        let currentOffset: number = 0;

        for (const item of stack.items) {
            if (item.state >= ToastState.ACTIVE) {
                const transform: Rectangle = this.calculateItemBounds(item, currentOffset);
                promises.push(item.animate(transform, this._config));

                // Only add spacing between elements if item has non-zero height
                currentOffset += transform.size.y + (spacing * Math.sign(transform.size.y));
            } else {
                // Should never happen, toasts should remain in queue until they are initialised
                console.warn(`An uninitialised toast is in the stack: ${item.id}`);
            }
        }

        stack.updateHeight(currentOffset);
    }

    /**
     * Moves and resizes the window to its initial position after its spawn
     * @param item Target layoutable item
     */
    public async setInitialTransform(item: LayoutItem): Promise<void> {
        return item.setTransform(this.calculateItemBounds(item, 0));
    }

    /**
     * Checks if item would fit in screen fully if it was added to the given stack and laid out.
     *
     * The items returned should be removed from the queue and added to the stack.
     *
     * @param stack Current stack/queue state
     * @param queuedItems Items waiting to be queued. (typically, `stack.queue`)
     */
    public getFittingItems(stack: LayoutStack, queuedItems: ReadonlyArray<LayoutItem>): LayoutItem[] {
        const {spacing} = this._config;
        const fittingItems: LayoutItem[] = [];
        const queue: LayoutItem[] = queuedItems.slice();
        let availableHeight: number = this._availableRect.size.y - stack.height;

        for (let i = 0, length = queue.length; i < length && queue[i].state >= ToastState.QUEUED; i++) {
            const height = queue[i].size.y;

            if (height + spacing < availableHeight) {
                availableHeight -= height;
                fittingItems.push(queue[i]);
            } else {
                break;
            }
        }

        return fittingItems;
    }

    private onMonitorChange(available: Rect): void {
        const {anchor, spacing, origin} = this._config;

        this._availableRect = {
            origin: {x: available.left, y: available.top},
            size: {x: available.right - available.left, y: available.bottom - available.top}
        };

        const {origin: monitorOrigin, size: monitorSize} = this._availableRect;
        this._spawnPosition = {
            x: monitorOrigin.x + (monitorSize.x * anchor.x) - (spacing * origin.x),
            y: monitorOrigin.y + (monitorSize.y * anchor.y) - (spacing * origin.y)
        };
    }

    private calculateItemBounds(item: LayoutItem, offset: number): Rectangle {
        const {anchor, direction} = this._config;
        const spawnPos: Point = this._spawnPosition;

        const size: Point = {
            x: item.size.x,
            y: item.state === ToastState.ACTIVE ? item.size.y : 0
        };
        const origin: Point = {
            x: spawnPos.x - (size.x * anchor.x) + (offset * direction.x),
            y: spawnPos.y - (size.y * anchor.y) + (offset * direction.y)
        };

        return {origin, size};
    }
}
