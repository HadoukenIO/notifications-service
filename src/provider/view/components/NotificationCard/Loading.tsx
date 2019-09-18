import React from 'react';

interface Props {
    hidden?: boolean;
}

Loading.defaultProps = {
    hidden: false
};

export function Loading(props: Props) {
    return (
        <div className="loading-screen">
            <div className="throbber dot-stretching"></div>
        </div>
    );
}
