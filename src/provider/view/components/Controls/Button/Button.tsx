import * as React from 'react';

import {ClassNameBuilder} from '../../../utils/ClassNameBuilder';

import * as Styles from './Button.module.scss';

interface Props {
    children?: string;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

export const Button: React.FC<Props> = (props) => {
    const {children, onClick, disabled = false, style, className = ''} = props;
    const classNames = new ClassNameBuilder(Styles, 'button', ['disabled', disabled]);
    classNames.add(className, undefined);

    const handleClick = (event: React.MouseEvent) => {
        event.stopPropagation();

        if (onClick && !disabled) {
            onClick();
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            if (onClick && !disabled) {
                onClick();
            }
        }
    };

    return (
        <div
            className={classNames.toString()}
            onClick={handleClick}
            style={style}
            tabIndex={disabled ? -1 : 0}
            onKeyPress={handleKeyPress}
        >
            {children}
        </div>
    );
};
