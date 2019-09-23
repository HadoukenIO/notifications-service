import * as React from 'react';

export const WindowContext = React.createContext<Window>(window);
export const WindowProvider = WindowContext.Provider;
export const WindowConsumer = WindowContext.Consumer;
