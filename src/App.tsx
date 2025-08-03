import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Showcase from "./Components/Showcase"
import Chat from "./Components/Chat"

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Showcase/>}></Route>
                <Route path='/chat' element={<Chat/>}></Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App
