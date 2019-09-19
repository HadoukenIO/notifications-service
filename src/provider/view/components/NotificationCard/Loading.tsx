import React from 'react';

interface Props {
    hidden?: boolean;
}

Loading.defaultProps = {
    hidden: false
};

// TODO: [SERVICE-605] Use this component as the base for loading UI/Error messages
export function Loading(props: Props) {
    return (
        <div className="loading-screen">
            <div className="throbber dot-stretching"></div>
        </div>
    );
}
