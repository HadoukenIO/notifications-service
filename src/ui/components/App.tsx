import * as React from 'react';
import { Header } from './Header';
import { NotificationView } from './NotificationView';
import { Footer } from './Footer';

interface IAppState {
    groupBy?: eGroupMethod;
    handleGroupBy?: (groupBy: eGroupMethod) => void;
}

export enum eGroupMethod {
    APPLICATION,
    DATE
}

export class App extends React.Component<{}, IAppState> {
    constructor(props: {}) {
        super(props);

        this.state = {
            groupBy: eGroupMethod.APPLICATION,
            handleGroupBy: this.handleGroupBy.bind(this)
        };
    }

    public render(): JSX.Element {
        return (
            <div>
                <Header groupBy={this.state.groupBy} handleGroupBy={this.state.handleGroupBy} />
                <NotificationView groupBy={this.state.groupBy} />
                <Footer />
            </div>
        );
    }

    private handleGroupBy(groupBy: eGroupMethod): void {
        this.setState(Object.assign({}, this.state, {groupBy}));
    }
}