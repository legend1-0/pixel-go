import { Routes, Route } from "react-router";
import Editor from './components/editor/Editor';
import HeroContainer from './Hero/HeroContainer';
import HowToUsePage from './components/how-to-use/HowToUsePage';

import "./App.css"
function App() {
  return (  
     <div>
     <Routes>
      <Route path="/" element={<HeroContainer />} />
      <Route path="/projects" element={<Editor />}/>
      <Route path="/howtouse" element={<HowToUsePage />} />
      <Route path="/editor/:projectId" element={<Editor />} />
    </Routes>
      

    </div>);
}

export default App;