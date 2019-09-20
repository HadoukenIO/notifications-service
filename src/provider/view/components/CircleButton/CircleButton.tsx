import * as React from 'react';

import {usePreventMouseDownPropagating} from '../../hooks/Clicks';
import './CircleButton.scss';
import {ClassNames} from '../../utils/ClassNames';

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

export interface Props {
    onClick?: () => void;
    type: IconType;
    alt?: string;
    size?: Size;
    id?: string;
}

export function CircleButton(props: Props) {
    const {onClick, type, size = Size.NORMAL, alt, id} = props;
    const ref = React.createRef<HTMLDivElement>();
    const classNames = new ClassNames('icon', type, size);

    const handleClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        if (onClick) {
            onClick();
        }
    };

    usePreventMouseDownPropagating(ref);

    return (
        <div ref={ref} id={id} className={classNames.toString()} onClick={handleClick} title={alt}>
            <div className="image">
            </div>
        </div>
    );
}
