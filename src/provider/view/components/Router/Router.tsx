import * as React from 'react';
import {Switch, Route} from 'react-router';
import {Router as BrowserRouter} from 'react-router-dom';
import {History} from 'history';

export interface AppRoute {
    Component: React.ComponentType<any> | React.FC;
    exact: boolean;
    path: string;
}

interface Props {
    routes: AppRoute[];
    history: History<any>;
}

export const Router: React.FC<Props> = (props) => {
    const {routes = [], history} = props;
    return (
        <BrowserRouter history={history}>
            <Switch>{routes.map(renderRoute)}</Switch>
        </BrowserRouter>
    );
};

const renderRoute = (route: AppRoute) => {
    const {path, exact, Component} = route;
    return <Route key={path} component={Component} exact={exact} path={path} />;
};
