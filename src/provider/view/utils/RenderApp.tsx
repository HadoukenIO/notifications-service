import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {Store} from 'redux';
import {History} from 'history';

import {WebWindow} from '../../model/WebWindow';
import {ServiceStore} from '../../store/ServiceStore';
import {RootState} from '../../store/State';
import {Router, AppRoute} from '../components/Router/Router';
import {WebWindowProvider} from '../contexts/WebWindowContext';

/**
 * Render a component into a window.
 * @param Component Component to render.
 * @param webWindow Target window.
 * @param store Provider store.
 * @param target DOM element to render to.
 * @param props Props to pass to the Component.
 */
export function renderComponentInWindow<T>(
    Component: (props: T) => React.ReactElement<T> | null,
    webWindow: WebWindow,
    store: ServiceStore,
    target: Element,
    props: T
): void {
    ReactDOM.render(
        <Provider store={store as unknown as Store<RootState>}>
            <WebWindowProvider value={webWindow}>
                <Component {...props} />
            </WebWindowProvider>
        </Provider>,
        target
    );
}

/**
 * Render a router and routes into a window.
 * @param routes Routes to display.
 * @param webWindow Target window.
 * @param store Provider store.
 * @param history History state to use for the router.
 * @param target DOM element to render to.
 */
export function renderRouterInWindow(
    routes: AppRoute[],
    webWindow: WebWindow,
    store: ServiceStore,
    history: History,
    target: Element
): void {
    ReactDOM.render(
        <Provider store={store as unknown as Store<RootState>}>
            <WebWindowProvider value={webWindow}>
                <Router routes={routes} history={history} />
            </WebWindowProvider>
        </Provider>,
        target
    );
}
