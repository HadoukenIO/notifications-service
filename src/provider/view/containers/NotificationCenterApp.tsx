import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {connect, Provider} from 'react-redux';

import {Header} from '../components/Header/Header';
import {Footer} from '../components/Footer/Footer';
import {NotificationView} from '../components/NotificationView/NotificationView';
import {RootState} from '../../store/State';
import {Store} from '../../store/Store';
import {RootAction} from '../../store/Actions';
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
export function renderApp(webWindow: WebWindow, store: Store): void {
    webWindow.render(<Provider store={store['_store']}>
        <Container storeDispatch={store.dispatch.bind(store)} />
    </Provider>);
}
