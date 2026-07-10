import { Routes, Route } from "react-router";
import Editor from './components/editor/Editor';
import HeroContainer from './Hero/HeroContainer';

function App() {
  return (  
     <div>
     <Routes>
      <Route path="/" element={<HeroContainer />} />
      <Route path="/editor" element={<Editor />}/>
    </Routes>
      

    </div>);
}

export default App;