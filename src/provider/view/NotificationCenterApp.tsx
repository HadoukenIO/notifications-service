import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {Header} from './components/Header/Header';
import {NotificationView} from './components/NotificationView/NotificationView';
import {Footer} from './components/Footer/Footer';
import {setup} from './setup';
import {NotificationCenter} from '../controller/NotificationCenter';

interface AppState {
    groupBy: GroupingType;
    handleGroupBy: (groupBy: GroupingType) => void;
}

export enum GroupingType {
    APPLICATION,
    DATE
}

export class NotificationCenterApp extends React.Component<{}, AppState> {
    constructor(props: {}) {
        super(props);

        this.state = {
            groupBy: GroupingType.APPLICATION,
            handleGroupBy: this.handleGroupBy.bind(this)
        };
    }

    public componentWillMount() {
        setup(true);
        NotificationCenter.instance.hideWindow();
    }

    public render(): JSX.Element {
        return (
            <div>
                <Header
                    groupBy={this.state.groupBy}
                    handleGroupBy={this.state.handleGroupBy}
                    handleHideWindow={NotificationCenter.instance.hideWindow}
                />
                <NotificationView groupBy={this.state.groupBy} />
                <Footer />
            </div>
        );
    }

    private handleGroupBy(groupBy: GroupingType): void {
        this.setState(Object.assign({}, this.state, {groupBy}));
    }
}


ReactDOM.render(<NotificationCenterApp />, document.getElementById('react-app'));