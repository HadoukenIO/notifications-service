import * as React from 'react';

interface DevelopementOnlyProps {
    children?: React.ReactNode;
}

export function DevelopmentOnly(props: DevelopementOnlyProps): React.ReactElement | null {
    if (process.env.NODE_ENV !== 'production') {
        return null;
    } else {
        return <div className="developmentOnly">{props.children}</div>;
    }
}
