import * as React from 'react';

import {ClassNameBuilder} from '../../utils/ClassNameBuilder';

import * as Styles from './Icon.module.scss';

export enum IconState {
    DEFAULT = 'default',
    DISABLED = 'disabled',
    ACTIVE = 'active'
}

interface Props {
    className?: string;
    color?: string;
    forceHeight?: boolean;
    onClick?: (event: React.MouseEvent) => void;
    scale?: boolean;
    size?: string | number;
    src: string;
    state?: IconState;
    title?: string;
}

export const Icon: React.FC<Props> = React.memo((props) => {
    const {className = '', forceHeight = false, scale, size, src, color, title, onClick, state = IconState.DEFAULT} = props;
    const sizeStr = typeof props.size === 'string' ? size : `${size}px`;
    const classes = new ClassNameBuilder(Styles, 'icon', [className, !!className])
        .add(['disabled', state === IconState.DISABLED])
        .add(['click', !!onClick])
        .add(['active', state === IconState.ACTIVE]);

    const style: React.CSSProperties = {
        WebkitMaskImage: `url(${src})`
    };
    if (size) {
        style.width = sizeStr;
    }
    if (size && !scale) {
        style.height = sizeStr;
    }
    if (forceHeight) {
        style.minHeight = sizeStr;
    }
    if (color) {
        style.color = color;
    }

    return (
        <div title={title} className={classes.toString()} style={style} onClick={state === IconState.DISABLED ? undefined : onClick}></div>
    );
});

Icon.displayName = 'Icon';
