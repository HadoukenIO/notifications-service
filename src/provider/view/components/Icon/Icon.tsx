import * as React from 'react';

import {ClassNameBuilder} from '../../utils/ClassNameBuilder';

import * as Styles from './Icon.module.scss';

interface Props {
    className?: string;
    color?: string;
    onClick?: (event: React.MouseEvent) => void;
    size?: string | number;
    src: string;
    title?: string;
}

export const Icon: React.FC<Props> = React.memo((props) => {
    const {className = '', size, src, color, title, onClick} = props;
    const sizeStr = typeof props.size === 'string' ? size : `${size}px`;
    const classes = new ClassNameBuilder(Styles, 'icon', [className, !!className])
        .add(['click', !!onClick]);

    const style: React.CSSProperties = {
        WebkitMaskImage: `url(${src})`
    };
    if (size) {
        style.width = sizeStr;
        style.height = sizeStr;
    }
    if (color) {
        style.color = color;
    }

    return (
        <div title={title} className={classes.toString()} style={style} onClick={onClick}></div>
    );
});

Icon.displayName = 'Icon';
