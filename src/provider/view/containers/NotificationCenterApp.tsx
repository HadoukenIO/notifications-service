import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {connect, Provider} from 'react-redux';
import {Store} from 'redux';

import {Header} from '../components/Header/Header';
import {Footer} from '../components/Footer/Footer';
import {NotificationView} from '../components/NotificationView/NotificationView';
import {RootState} from '../../store/State';
import {RootAction} from '../../store/Actions';
import {ServiceStore} from '../../store/ServiceStore';
import {WebWindow} from '../../model/WebWindow';

export enum GroupingType {
    APPLICATION = 'Application',
    DATE = 'Date'
}

export interface Actionable {
    storeDispatch: (action: RootAction) => void;
}

type Props = ReturnType<typeof mapStateToProps> & Actionable;

export function NotificationCenterApp(props: Props) {
    const [groupBy, setGroupBy] = React.useState(GroupingType.DATE);
    const {notifications, storeDispatch} = props;

    return (
        <div className='notification-center'>
            <Header
                groupBy={groupBy}
                handleGroupBy={setGroupBy}
                storeDispatch={storeDispatch}
            />
            <NotificationView
                notifications={notifications}
                groupBy={groupBy}
                storeDispatch={storeDispatch}
            />
            <Footer />
        </div>
    );
}

const mapStateToProps = (state: RootState, ownProps: Actionable) => ({
    notifications: state.notifications,
    ...ownProps
});

const Container = connect(mapStateToProps)(NotificationCenterApp);

/**
 * Render the Notification Center app in the given window.
 * @param webWindow The web window to render to
 * @param store The store to retrieve data from.
 */
export function renderApp(webWindow: WebWindow, store: ServiceStore): void {
    ReactDOM.render(
        // Replace redux store with service store implementation.
        // This will resolve the interface incompatibility issues.
        <Provider store={store as unknown as Store<RootState>}>
            <Container storeDispatch={store.dispatch.bind(store)} />
        </Provider>,
        webWindow.document.getElementById('react-app')
    );
}
