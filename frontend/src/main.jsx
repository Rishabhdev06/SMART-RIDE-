import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
import UserContext from './context/UserContext.jsx';
import CaptainContext from './context/CapatainContext.jsx';
import SocketProvider from './context/SocketContext.jsx';
import SubscriptionContext from './context/SubscriptionContext.jsx';

createRoot(document.getElementById('root')).render(

  <CaptainContext>
    <UserContext>
      <SubscriptionContext>
        <SocketProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SocketProvider>
      </SubscriptionContext>
    </UserContext>
  </CaptainContext>

)
