import React from "react";
import CreateReactScript from "./Utils/CreateReactScript";
import { createRoot } from "react-dom/client";
import Adminto from "./components/Adminto";
import '../css/coming-soon.css'


const Tasks = () => {
  return <>
    <div className="row coming-soon" style={{height: 'calc(100vh - 165px)'}}></div>
  </>
}

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Tareas'>
      <Tasks {...properties} />
    </Adminto>
  );
})