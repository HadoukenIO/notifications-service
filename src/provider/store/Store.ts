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

    public async dispatch(store: StoreAPI<S, Action<S>>): Promise<void> {
        await store.dispatch(this);
    }

    public reduce(state: S): S {
        return state;
    }
}

type Listener<S> = (getState: () => S) => void;

export class Store<S, A extends Action<S>> extends AsyncInit implements StoreAPI<S, A> {
    public readonly onAction: Signal<[A], Promise<void>, Promise<void>> = new Signal(Aggregators.AWAIT_VOID);

    private _currentState: S;
    private readonly _listeners: Listener<S>[] = [];

    constructor(initialState: S) {
        super();
        this._currentState = initialState;
    }

    public get api(): StoreAPI<S, A> {
        return {
            state: this.state,
            dispatch: this.dispatch.bind(this)
        };
    }

    public get state(): S {
        return this._currentState;
    }

    public async dispatch(action: A): Promise<void> {
        return this.reduceAndSignal(action);
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

    private reduceAndSignal(action: A): Promise<void> {
        // emit signal last
        this.reduce(action);
        return this.onAction.emit(action);
    }

    private reduce(action: A): void {
        this._currentState = action.reduce(this.state);
        this._listeners.forEach(listener => listener(() => this._currentState));
    }

    // intended to be used by react-redux only
    private getState(): S {
        return this._currentState;
    }
}
