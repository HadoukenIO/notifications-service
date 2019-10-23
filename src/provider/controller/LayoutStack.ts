import {Toast} from '../model/Toast';

/**
 * Specialised data structure for tracking Toast objects. Holds all active toasts, both visible and queued.
 *
 * Ensures ID uniqueness and correct toast lifecycle.
 */
export class LayoutStack {
    private readonly _items: Toast[];
    private readonly _queue: Toast[];
    private _height: number;

    constructor() {
        this._items = [];
        this._queue = [];
        this._height = 0;
    }

    /**
     * List of toasts currently visible to the user.
     *
     * Includes toasts that are currently transitioning in/out.
     */
    public get items(): ReadonlyArray<Toast> {
        return this._items;
    }

    /**
     * List of toasts waiting to be displayed.
     *
     * Only used when there are more toasts than can fit on-screen, and for a brief period when toasts are being
     * initialised.
     */
    public get queue(): ReadonlyArray<Toast> {
        return this._queue;
    }

    /**
     * The combined height of all toasts in `items`. Includes padding between toasts.
     *
     * NOTE: The height is always calculated externally. Set the height using `updateHeight`.
     */
    public get height(): number {
        return this._height;
    }

    public clear(): void {
        this._items.length = 0;
        this._queue.length = 0;
        this._height = 0;
    }

    public getToast(id: string): Toast|null {
        const predicate = (toast: Toast) => toast.id === id;
        return this._items.find(predicate) || this._queue.find(predicate) || null;
    }

    public existsWithinStack(id: string): boolean {
        return this._items.findIndex((toast) => toast.id === id) >= 0;
    }

    public existsWithinQueue(id: string): boolean {
        return this._queue.findIndex((toast) => toast.id === id) >= 0;
    }

    public addToQueue(toast: Toast): void {
        const existing = this.getToast(toast.id);

        if (existing === null) {
            this._queue.push(toast);
        } else if (existing !== toast) {
            console.warn(`Cannot add toast to queue, stack/queue already contains a toast with the ID ${toast.id}`);
        } else {
            console.warn(`Cannot add toast to queue, stack/queue already contains this toast instance (ID: ${toast.id})`);
        }
    }

    public moveToStack(toast: Toast): boolean {
        const index = this._queue.findIndex((t) => t.id === toast.id);

        if (index >= 0) {
            this._queue.splice(index, 1);
            this._items.unshift(toast);

            return true;
        } else {
            console.warn(`Cannot move item from queue to stack, no toast with id ${toast.id} in queue`);

            return false;
        }
    }

    public remove(toast: Toast): boolean {
        const id = toast.id;
        const itemsIndex = this._items.findIndex((item) => item.id === id);
        const queueIndex = this._queue.findIndex((queue) => queue.id === id);

        if (itemsIndex >= 0) {
            this._items.splice(itemsIndex, 1);
        }
        if (queueIndex >= 0) {
            this._queue.splice(queueIndex, 1);
        }

        return itemsIndex >= 0 || queueIndex >= 0;
    }

    public updateHeight(height: number): void {
        this._height = height;
    }
}
