import {Signal} from 'openfin-service-signal';

import {AsyncInit} from '../controller/AsyncInit';
import {ErrorAggregator} from '../model/Errors';

export abstract class Action<S> {
    public abstract readonly type: string;

    public async dispatch(store: StoreAPI<S>): Promise<void> {
        await store.dispatch(this);
    }

    public reduce(state: S): S {
        return state;
    }
}

export class Init<S> extends Action<S> {
    public readonly type = '@@INIT';
    private readonly initialState: S;

    constructor(initialState: S) {
        super();
        this.initialState = initialState;
    }

    public reduce(state: S): S {
        return this.initialState;
    }
}

type Listener<S> = (getState: () => S) => void;

export type StoreAPI<S> = Pick<Store<S>, 'dispatch' | 'state'>;

export class Store<S> extends AsyncInit {
    public readonly onAction: Signal<[Action<S>], Promise<void>, Promise<void>> = new Signal(ErrorAggregator);

    private _currentState!: S;
    private readonly _listeners: Listener<S>[] = [];

    constructor(initialState: S) {
        super();
        // This is used by dev tools
        new Init(initialState).dispatch(this);
    }

    public get state(): S {
        return this._currentState;
    }

    public dispatch(action: Action<S>): Promise<void> {
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

    private reduceAndSignal(action: Action<S>): Promise<void> {
        // emit signal last
        this.reduce(action);
        return this.onAction.emit(action);
    }

    private reduce(action: Action<S>): void {
        this._currentState = action.reduce(this.state);
        this._listeners.forEach(listener => listener(() => this._currentState));
    }

    // intended to be used by react-redux only
    private getState(): S {
        return this._currentState;
    }
}
