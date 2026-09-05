import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import AppProviders from './providers/AppProviders';
import '../styles/globals.css';

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}

export default App;
