import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import Adminto from './components/Adminto.jsx'

const Blank = () => {

  return (<>

  </>)
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Blank' showTitle={false}>
      <Blank {...properties} />
    </Adminto>
  );
})