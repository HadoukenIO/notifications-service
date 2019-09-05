import * as React from 'react';

import './CircleButton.scss';

type IconType = 'accept' | 'cancel' | 'close' | 'hide' | 'pin' | 'dismiss';

interface Props {
    onClick?: () => void;
    type: IconType;
    alt?: string;
    size?: 'small' | 'normal' | 'large';
}

CircleButton.defaultProps = {
    size: 'normal'
};

export function CircleButton(props: Props) {
    const {onClick, type, size, alt} = props;

    const handleClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        if (onClick) {
            onClick();
        }
    };

    return (
        <div className={`icon ${type} ${size}`} onClick={handleClick} title={alt}>
            <div className="image">
            </div>
        </div>
    );
}
