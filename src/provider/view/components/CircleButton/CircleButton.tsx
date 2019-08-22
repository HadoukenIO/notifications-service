import * as React from 'react';

import './CircleButton.scss';

type IconType = 'accept' | 'cancel' | 'close' | 'hide' | 'pin';

interface Props {
    onClick?: () => void;
    type: IconType;
    size?: 'small' | 'normal' | 'large';
}

CircleButton.defaultProps = {
    size: 'normal'
};

export function CircleButton(props: Props) {
    const {onClick, type, size} = props;

    const handleClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        if (onClick) {
            onClick();
        }
    };

    return (
        <div className={`icon ${type} ${size}`} onClick={handleClick}>
            <div className="image">
            </div>
        </div>
    );
}
