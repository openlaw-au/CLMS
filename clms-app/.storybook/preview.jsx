import { MemoryRouter } from 'react-router-dom';
import '../src/index.css';

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  decorators: [
    (StoryFn) => (
      <MemoryRouter>
        {StoryFn()}
      </MemoryRouter>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
    layout: 'fullscreen',
  },
};

export default preview;
