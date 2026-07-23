import { Routes, Route } from "react-router";
import Editor from './components/editor/Editor';
import HeroContainer from './Hero/HeroContainer';
import HowToUsePage from './components/how-to-use/HowToUsePage';
import RequireDesktop from './components/shared/RequireDesktop';
import "./App.css"

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<HeroContainer />} />
        <Route path="/projects" element={<RequireDesktop><Editor /></RequireDesktop>} />
        <Route path="/editor/:projectId" element={<RequireDesktop><Editor /></RequireDesktop>} />
        <Route path="/howtouse" element={<HowToUsePage />} />
      </Routes>
    </div>
  );
}

export default App;