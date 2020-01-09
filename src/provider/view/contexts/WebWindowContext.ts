import * as React from 'react';

import {WebWindow} from '../../model/WebWindow';

export const WebWindowContext = React.createContext<WebWindow>({} as WebWindow);
export const WebWindowProvider = WebWindowContext.Provider;
export const WebWindowConsumer = WebWindowContext.Consumer;
