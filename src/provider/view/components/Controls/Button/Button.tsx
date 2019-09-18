import React from 'react';

import {usePreventMouseDownPropagating} from '../../../hooks/Clicks';
import './Button.scss';

interface Props {
    text?: string;
    icon?: string;
    onClick?: () => void;
}

export function Button(props: Props) {
    const {text, icon, onClick} = props;
    const ref = React.createRef<HTMLDivElement>();

    const handleClick = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (onClick)
            onClick();
    };

    usePreventMouseDownPropagating(ref);

    return (
        <div className="button single-line" onClickCapture={handleClick} ref={ref}>
            <div className="value">
                {icon && <img src={icon} alt="" />}
                <span className="single-line">{text}</span>
            </div>
        </div>
    );
}

