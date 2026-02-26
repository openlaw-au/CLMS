import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../../context/AppContext';
import LandingPage from './LandingPage';

export default {
  title: 'Pages/LandingPage',
  component: LandingPage,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (StoryFn) => (
      <MemoryRouter>
        <AppProvider>
          {StoryFn()}
        </AppProvider>
      </MemoryRouter>
    ),
  ],
};

export const Default = {};
