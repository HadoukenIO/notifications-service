import * as React from 'react';

import './CircleButton.scss';

enum IconType {
    accept = 'accept',
    cancel = 'cancel',
    close = 'close',
    hide = 'hide',
    pin = 'pin',
    dismiss = 'dismiss'
}

enum Size {
    small = 'small',
    normal = 'normal',
    large = 'large'
}

interface Props {
    onClick?: () => void;
    type: IconType[keyof IconType];
    alt?: string;
    size?: Size[keyof Size];
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
