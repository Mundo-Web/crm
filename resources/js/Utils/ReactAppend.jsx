import { createRoot } from 'react-dom/client';

const ReactAppend = (parent, children) => {
  const container = document.createElement('div');
  parent.append(container);
  const root = createRoot(container);
  root.render(children);
}

export default ReactAppend;