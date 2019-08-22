const markdown = require('markdown-it');

const md = markdown('zero', {breaks: true});

md.enable('hr');
md.enable('paragraph');
md.enable('newline');
md.enable('heading');
md.enable('lheading');
md.enable('list');
md.enable('blockquote');
md.enable('emphasis');

export function renderMarkdown(str: string) {
    return md.render(str);
}
