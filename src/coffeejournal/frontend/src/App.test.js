import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock console.log for radar chart debug logs
jest.spyOn(console, 'log').mockImplementation(() => {});

describe('App Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    console.log.mockClear();
    
    // Mock API responses for Home component
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });
  });

  afterAll(() => {
    console.log.mockRestore();
  });

  test('renders main app structure', async () => {
    render(<App />);
    
    // Check main app elements
    expect(screen.getByText('My Coffee Journal')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  test('renders navigation menu', async () => {
    render(<App />);
    
    // Check navigation links
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('All brews')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    
    // Check that links have correct href attributes
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
    
    const brewsLink = screen.getByText('All brews').closest('a');
    expect(brewsLink).toHaveAttribute('href', '/brew-sessions');
    
    const settingsLink = screen.getByText('Settings').closest('a');
    expect(settingsLink).toHaveAttribute('href', '/settings');
  });

  test('renders home page by default', async () => {
    render(<App />);
    
    await waitFor(() => {
      // Home component should be rendered by default
      expect(screen.getByText('Welcome to your Coffee Journal!')).toBeInTheDocument();
    });
  });

  test('has proper CSS classes applied', () => {
    render(<App />);
    
    const appDiv = screen.getByText('My Coffee Journal').closest('.App');
    expect(appDiv).toBeInTheDocument();
    
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('App-header');
    
    const main = screen.getByRole('main');
    expect(main).toHaveClass('App-main');
  });

  test('wraps content with ToastProvider', () => {
    render(<App />);
    
    // ToastProvider should be present (though not directly testable)
    // We can verify the app renders without errors
    expect(screen.getByText('My Coffee Journal')).toBeInTheDocument();
  });

  test('header contains navigation list', () => {
    render(<App />);
    
    const nav = screen.getByRole('navigation');
    const list = nav.querySelector('ul');
    const listItems = nav.querySelectorAll('li');
    
    expect(list).toBeInTheDocument();
    expect(listItems).toHaveLength(3); // Home, All brews, Settings
  });

  test('navigation structure is semantic', () => {
    render(<App />);
    
    // Check semantic HTML structure
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    expect(screen.getByRole('navigation')).toBeInTheDocument(); // nav
    expect(screen.getByRole('main')).toBeInTheDocument(); // main
    expect(screen.getByRole('list')).toBeInTheDocument(); // nav ul
  });

  test('app title is correct', () => {
    render(<App />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('My Coffee Journal');
  });

  test('renders without crashing', () => {
    // This test ensures the component doesn't throw during render
    expect(() => render(<App />)).not.toThrow();
  });
});
