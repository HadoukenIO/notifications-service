import * as React from 'react';

import './CircleButton.scss';

export enum IconType {
    ACCEPT = 'accept',
    CANCEL = 'cancel',
    CLOSE = 'close',
    HIDE = 'hide',
    PIN = 'pin',
    MINIMIZE = 'minimize'
}

export enum Size {
    SMALL = 'small',
    NORMAL = 'normal',
    LARGE = 'large'
}

interface Props {
    onClick?: () => void;
    type: IconType;
    alt?: string;
    size?: Size;
    id?: string;
}

CircleButton.defaultProps = {
    size: 'normal'
};

export function CircleButton(props: Props) {
    const {onClick, type, size, alt, id} = props;

    const handleClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        if (onClick) {
            onClick();
        }
    };

    return (
        <div id={id} className={`icon ${type} ${size}`} onClick={handleClick} title={alt}>
            <div className="image">
            </div>
        </div>
    );
}
