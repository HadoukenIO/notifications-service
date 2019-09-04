import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {connect, Provider} from 'react-redux';

import {Header} from '../../components/Header/Header';
import {NotificationView} from '../../components/NotificationView/NotificationView';
import {RootState} from '../../../store/State';
import {Store} from '../../../store/Store';
import {RemoveNotifications, Actionable} from '../../../store/Actions';
import {GroupingType} from '../../utils/Grouping';
import {WebWindow} from '../../../model/WebWindow';

import '../../styles/_main.scss';
import './NotificationCenterApp.scss';

type Props = ReturnType<typeof mapStateToProps> & Actionable;

export function NotificationCenterApp(props: Props) {
    const [groupBy, setGroupBy] = React.useState(GroupingType.DATE);
    const {notifications, visible, storeDispatch} = props;

    const handleClearAll = () => {
        storeDispatch(new RemoveNotifications(notifications));
    };

    return (
        <div className='notification-center'>
            <Header
                groupBy={groupBy}
                handleGroupBy={setGroupBy}
                storeDispatch={storeDispatch}
                centerVisible={visible}
                onClearAll={handleClearAll}
            />
            <NotificationView
                notifications={notifications}
                groupBy={groupBy}
                storeDispatch={storeDispatch}
            />
        </div>
    );
}

const mapStateToProps = (state: RootState, ownProps: Actionable) => ({
    ...ownProps,
    notifications: state.notifications,
    visible: state.windowVisible
});

const Container = connect(mapStateToProps)(NotificationCenterApp);

/**
 * Render the Notification Center app in the given window.
 * @param webWindow The web window to render to
 * @param store The store to retrieve data from.
 */
export function renderApp(webWindow: WebWindow, store: Store): void {
    ReactDOM.render(
        <Provider store={store['_store']}>
            <Container storeDispatch={store.dispatch.bind(store)} />
        </Provider>,
        webWindow.document.getElementById('react-app')
    );
}
