import * as React from 'react';

import {renderMarkdown} from '../../utils/Markdown';

import './Body.scss';

interface Props {
    text?: string;
}

export function Body(props: Props) {
    const {text = ''} = props;
    return (
        <div className="text" dangerouslySetInnerHTML={{__html: renderMarkdown(text)}}></div>
    );
}
