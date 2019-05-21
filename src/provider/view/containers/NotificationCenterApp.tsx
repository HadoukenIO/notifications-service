import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Dispatch, bindActionCreators} from 'redux';
import {connect, Provider} from 'react-redux';

import {toggleCenterWindowVisibility} from '../../store/ui/actions';
import {removeNotifications, clickNotification, clickNotificationButton} from '../../store/notifications/actions';
import {getAllNotifications} from '../../store/notifications/selectors';
import {Header} from '../components/Header/Header';
import {Footer} from '../components/Footer/Footer';
import {NotificationView} from '../components/NotificationView/NotificationView';
import {UIHandlers} from '../../model/UIHandlers';
import {RootState, Store} from '../../store';

export enum GroupingType {
    APPLICATION = 'Application',
    DATE = 'Date'
}

type Props = ReturnType<typeof mapDispatchToProps> & ReturnType<typeof mapStateToProps> & UIHandlers;

const NotificationCenterApp = (props: Props) => {
    const [groupBy, setGroupBy] = React.useState(GroupingType.DATE);
    const {notifications, ...rest} = props;

    return (
        <div className='notification-center'>
            <Header
                groupBy={groupBy}
                handleGroupBy={setGroupBy}
                onHideWindow={rest.onToggleWindow}
            />
            <NotificationView
                notifications={notifications}
                groupBy={groupBy}
                {...rest}
            />
            <Footer />
        </div>
    );
};

const mapDispatchToProps = (dispatch: Dispatch) => bindActionCreators(
    {
        onClickNotification: clickNotification,
        onClickButton: clickNotificationButton,
        onRemoveNotifications: removeNotifications,
        onToggleWindow: toggleCenterWindowVisibility
    },
    dispatch
);

const mapStateToProps = (state: RootState) => ({
    notifications: getAllNotifications(state)
});

const Container = connect(mapStateToProps, mapDispatchToProps)(NotificationCenterApp);

/**
 * Render the Notification Center app in the given window.
 * @param document The window.document to render to.
 * @param store The store to retrieve data from.
 */
export function renderApp(document: Document, store: Store): void {
    ReactDOM.render(
        <Provider store={store}>
            <Container />
        </Provider>,
        document.getElementById('react-app')
    );
}
