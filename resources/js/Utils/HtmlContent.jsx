import React from 'react';

const HtmlContent = ({ className, html }) => {
  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
};

export default HtmlContent;