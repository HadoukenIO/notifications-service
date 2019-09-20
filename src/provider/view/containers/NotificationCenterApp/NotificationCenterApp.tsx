import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {connect, Provider} from 'react-redux';
import {Store} from 'redux';

import {Header} from '../../components/Header/Header';
import {NotificationView} from '../../components/NotificationView/NotificationView';
import {RootState} from '../../../store/State';
import {ServiceStore} from '../../../store/ServiceStore';
import {RemoveNotifications} from '../../../store/Actions';
import {GroupingType} from '../../utils/Grouping';
import {WebWindow} from '../../../model/WebWindow';
import {Actionable} from '../../types';
import {WindowProvider, WindowContext} from '../../components/Wrappers/WindowContext';

import '../../styles/_main.scss';
import './NotificationCenterApp.scss';

type Props = ReturnType<typeof mapStateToProps> & Actionable;

export function NotificationCenterApp(props: Props) {
    const [groupBy, setGroupBy] = React.useState(GroupingType.DATE);
    const {notifications, applications, visible, storeApi, centerLocked} = props;
    const window = React.useContext(WindowContext);
    const handleClearAll = () => {
        new RemoveNotifications(notifications).dispatch(storeApi);
    };

    React.useEffect(() => {
        window.document.title = 'Center';
    });

    return (
        <div className='notification-center'>
            <Header
                groupBy={groupBy}
                handleGroupBy={setGroupBy}
                centerVisible={visible}
                onClearAll={handleClearAll}
                storeApi={storeApi}
                centerLocked={centerLocked}
            />
            <NotificationView
                notifications={notifications}
                applications={applications}
                groupBy={groupBy}
                storeApi={storeApi}
            />
        </div>
    );
}

const mapStateToProps = (state: RootState, ownProps: Actionable) => ({
    ...ownProps,
    notifications: state.notifications,
    visible: state.centerVisible,
    applications: state.applications,
    centerLocked: state.centerLocked
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
            <WindowProvider value={webWindow.nativeWindow}>
                <Container storeApi={store} />
            </WindowProvider>
        </Provider>,
        webWindow.document.getElementById('react-app')
    );
}
