import {Signal, Aggregators} from 'openfin-service-signal';

import {AsyncInit} from '../controller/AsyncInit';

/**
 * Subset of properties of `Store` that are safe for use from actions and components.
 */
export interface StoreAPI<S, A> {
    state: S;
    dispatch(action: A): Promise<void>;
}

export abstract class Action<S> {
    public readonly type?: string;

    constructor(type?: string) {
        this.type = type;
    }

    public reduce(state: S): S {
        return state;
    }
}

export abstract class AsyncAction<S> extends Action<S> {
    public abstract async dispatch(api: StoreAPI<S, Action<S>>): Promise<void>;
}

export interface Reducer<S> {
    reduce(state: S): S;
}

type Listener<S> = (getState: () => S) => void;

export class Store<S, A extends Action<S>> extends AsyncInit implements StoreAPI<S, A> {
    private _currentState: S;
    private _listeners: Listener<S>[] = [];

    public readonly onAction: Signal<[A], Promise<void>, Promise<void>> = new Signal(Aggregators.AWAIT_VOID);

    constructor(initialState: S) {
        super();
        this._currentState = initialState;
    }

    public get state(): S {
        return this._currentState;
    }

    public getState(): S {
        return this._currentState;
    }

    public async dispatch(action: A): Promise<void> {
        if (action instanceof AsyncAction) {
            // Action has custom dispatch logic
            await action.dispatch(this);
        }
        this.reduceAndSignal(action);
    }

    public subscribe(listener: Listener<S>) {
        this._listeners.push(listener);

        return () => {
            const index: number = this._listeners.indexOf(listener);
            if (index >= 0) {
                this._listeners.splice(index, 1);
            }
        };
    }

    protected async init(): Promise<void> {}

    protected setState(state: S): void {
        this._currentState = state;
    }

    private async reduceAndSignal(action: A) {
        // emit signal last
        this.reduce(action);
        await this.onAction.emit(action);
    }

    private reduce(action: A): void {
        this._currentState = action.reduce(this.state);
        this._listeners.forEach(listener => listener(() => this.getState()));
    }
}
