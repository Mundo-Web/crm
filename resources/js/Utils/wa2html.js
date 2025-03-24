const wa2html = (input) => {
    const lines = input.split('\n');
    let html = '';
    let inList = false;
    let listType = '';

    const convertInlineFormats = (text) => {
        // Convert bold (*text*)
        text = text.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
        
        // Convert italic (_text_)
        text = text.replace(/_(.*?)_/g, '<em>$1</em>');
        
        // Convert strikethrough (~text~)
        text = text.replace(/~(.*?)~/g, '<s>$1</s>');
        
        // Convert code (```text```)
        text = text.replace(/```(.*?)```/g, '<code>$1</code>');
        
        return text;
    };

    for (let line of lines) {
        line = line.trim();
        if (!line) {
            if (inList) {
                html += `</${listType}>\n`;
                inList = false;
            }
            continue;
        }

        // Convert unordered lists (- item)
        const ulMatch = line.match(/^-\s+(.+)$/);
        if (ulMatch) {
            if (!inList || listType !== 'ul') {
                if (inList) {
                    html += `</${listType}>\n`;
                }
                html += '<ul>\n';
                inList = true;
                listType = 'ul';
            }
            html += `<li>${convertInlineFormats(ulMatch[1])}</li>\n`;
            continue;
        }

        // Convert ordered lists (1. item)
        const olMatch = line.match(/^\d+\.\s+(.+)$/);
        if (olMatch) {
            if (!inList || listType !== 'ol') {
                if (inList) {
                    html += `</${listType}>\n`;
                }
                html += '<ol>\n';
                inList = true;
                listType = 'ol';
            }
            html += `<li>${convertInlineFormats(olMatch[1])}</li>\n`;
            continue;
        }

        // Convert blockquotes (> text)
        const quoteMatch = line.match(/^>\s+(.+)$/);
        if (quoteMatch) {
            if (inList) {
                html += `</${listType}>\n`;
                inList = false;
            }
            html += `<blockquote>${convertInlineFormats(quoteMatch[1])}</blockquote>\n`;
            continue;
        }

        // Normal text
        if (inList) {
            html += `</${listType}>\n`;
            inList = false;
        }
        html += `<p>${convertInlineFormats(line)}</p>\n`;
    }

    if (inList) {
        html += `</${listType}>\n`;
    }

    return html.trim();
};

export default wa2html;