import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Adminto from './components/Adminto'
import CreateReactScript from './Utils/CreateReactScript'
import Tippy from '@tippyjs/react';
import ProjectsRest from './actions/ProjectsRest';
import DateRange from './Reutilizables/Projects/DateRange';
import Assigneds from './Reutilizables/Projects/Assigneds';

const Integrations = () => {
  return (<>
  </>
  )
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Integraciones'>
      <Integrations {...properties} />
    </Adminto>
  );
})