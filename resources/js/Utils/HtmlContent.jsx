import React from 'react';

const HtmlContent = ({ className, style, html }) => {
  return (
    <div className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />
  );
};

export default HtmlContent;