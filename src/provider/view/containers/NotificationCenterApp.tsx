import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {connect, Provider} from 'react-redux';

import {Header} from '../components/Header/Header';
import {Footer} from '../components/Footer/Footer';
import {NotificationView} from '../components/NotificationView/NotificationView';
import {RootState, mutable} from '../../store/State';
import {Store} from '../../store/Store';
import {RootAction} from '../../store/Actions';

export enum GroupingType {
    APPLICATION = 'Application',
    DATE = 'Date'
}

export interface Actionable {
    dispatch: (action: RootAction)=>void;
}

type Props = ReturnType<typeof mapStateToProps> & Actionable;

export function NotificationCenterApp(props: Props) {
    const [groupBy, setGroupBy] = React.useState(GroupingType.DATE);
    const {notifications, dispatch} = props;

    return (
        <div className='notification-center'>
            <Header
                groupBy={groupBy}
                handleGroupBy={setGroupBy}
                dispatch={dispatch}
            />
            <NotificationView
                notifications={mutable(notifications)}
                groupBy={groupBy}
                dispatch={dispatch}
            />
            <Footer />
        </div>
    );
}

const mapStateToProps = (state: RootState, ownProps: Actionable) => ({
    notifications: Object.values(state.notifications),
    ...ownProps
});

const Container = connect(mapStateToProps)(NotificationCenterApp);

/**
 * Render the Notification Center app in the given window.
 * @param document The window.document to render to.
 * @param store The store to retrieve data from.
 */
export function renderApp(document: Document, store: Store): void {
    ReactDOM.render(
        <Provider store={store['_store']}>
            <Container dispatch={store.dispatch} />
        </Provider>,
        document.getElementById('react-app')
    );
}
