import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Settings from '../Settings';

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Settings Component', () => {
  test('renders settings page title and description', () => {
    renderWithRouter(<Settings />);
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Manage your coffee journal configuration and data.')).toBeInTheDocument();
  });

  test('renders all settings cards', () => {
    renderWithRouter(<Settings />);
    
    // Check all setting categories are present
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Brew Methods')).toBeInTheDocument();
    expect(screen.getByText('Recipes')).toBeInTheDocument();
    expect(screen.getByText('Bean Types')).toBeInTheDocument();
    expect(screen.getByText('Roasters')).toBeInTheDocument();
    expect(screen.getByText('Countries')).toBeInTheDocument();
    expect(screen.getByText('Grinders')).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Kettles')).toBeInTheDocument();
    expect(screen.getByText('Scales')).toBeInTheDocument();
    expect(screen.getByText('Decaf Methods')).toBeInTheDocument();
  });

  test('renders setting card descriptions', () => {
    renderWithRouter(<Settings />);
    
    expect(screen.getByText('Manage your coffee products and batches')).toBeInTheDocument();
    expect(screen.getByText('Configure brewing methods (V60, French Press, etc.)')).toBeInTheDocument();
    expect(screen.getByText('Manage your brewing recipes and techniques')).toBeInTheDocument();
    expect(screen.getByText('Configure coffee bean types and varieties')).toBeInTheDocument();
    expect(screen.getByText('Manage coffee roaster information')).toBeInTheDocument();
    expect(screen.getByText('Configure coffee origin countries and regions')).toBeInTheDocument();
    expect(screen.getByText('Manage coffee grinder equipment')).toBeInTheDocument();
    expect(screen.getByText('Configure coffee filter types')).toBeInTheDocument();
    expect(screen.getByText('Manage kettle equipment')).toBeInTheDocument();
    expect(screen.getByText('Configure scale equipment')).toBeInTheDocument();
    expect(screen.getByText('Manage decaffeination methods')).toBeInTheDocument();
  });

  test('renders correct navigation links', () => {
    renderWithRouter(<Settings />);
    
    // Check that links have correct href attributes
    const productsLink = screen.getByText('Products').closest('a');
    expect(productsLink).toHaveAttribute('href', '/products');
    
    const brewMethodsLink = screen.getByText('Brew Methods').closest('a');
    expect(brewMethodsLink).toHaveAttribute('href', '/settings/brew-methods');
    
    const recipesLink = screen.getByText('Recipes').closest('a');
    expect(recipesLink).toHaveAttribute('href', '/settings/recipes');
    
    const beanTypesLink = screen.getByText('Bean Types').closest('a');
    expect(beanTypesLink).toHaveAttribute('href', '/settings/bean-types');
    
    const roastersLink = screen.getByText('Roasters').closest('a');
    expect(roastersLink).toHaveAttribute('href', '/settings/roasters');
    
    const countriesLink = screen.getByText('Countries').closest('a');
    expect(countriesLink).toHaveAttribute('href', '/settings/countries');
    
    const grindersLink = screen.getByText('Grinders').closest('a');
    expect(grindersLink).toHaveAttribute('href', '/settings/grinders');
    
    const filtersLink = screen.getByText('Filters').closest('a');
    expect(filtersLink).toHaveAttribute('href', '/settings/filters');
    
    const kettlesLink = screen.getByText('Kettles').closest('a');
    expect(kettlesLink).toHaveAttribute('href', '/settings/kettles');
    
    const scalesLink = screen.getByText('Scales').closest('a');
    expect(scalesLink).toHaveAttribute('href', '/settings/scales');
    
    const decafMethodsLink = screen.getByText('Decaf Methods').closest('a');
    expect(decafMethodsLink).toHaveAttribute('href', '/settings/decaf-methods');
  });

  test('renders setting card icons with correct attributes', () => {
    renderWithRouter(<Settings />);
    
    // Check that images have proper alt text and src attributes
    const coffeeBeansImg = screen.getByAltText('Coffee beans');
    expect(coffeeBeansImg).toHaveAttribute('src', '/Roasted_coffee_beans.jpg');
    
    const brewMethodsImgs = screen.getAllByAltText('Brew methods');
    expect(brewMethodsImgs[0]).toHaveAttribute('src', '/coffee-recipe.png');
    
    const recipesImg = screen.getByAltText('Recipes');
    expect(recipesImg).toHaveAttribute('src', '/coffee-recipe.png');
    
    const beanTypesImg = screen.getByAltText('Bean types');
    expect(beanTypesImg).toHaveAttribute('src', '/coffee-bean-brown.png');
    
    const roastersImg = screen.getByAltText('Roasters');
    expect(roastersImg).toHaveAttribute('src', '/coffee-beans.png');
    
    const kettlesImg = screen.getByAltText('Kettles');
    expect(kettlesImg).toHaveAttribute('src', '/kettle.png');
  });

  test('setting cards have proper styling and hover behavior', () => {
    renderWithRouter(<Settings />);
    
    const productCard = screen.getByText('Products').closest('div');
    
    // Check initial styling
    expect(productCard).toHaveStyle({
      backgroundColor: '#f9f9f9',
      cursor: 'pointer'
    });
    
    // Test hover behavior
    fireEvent.mouseEnter(productCard);
    expect(productCard).toHaveStyle({
      backgroundColor: '#f0f0f0'
    });
    
    fireEvent.mouseLeave(productCard);
    expect(productCard).toHaveStyle({
      backgroundColor: '#f9f9f9'
    });
  });

  test('renders grid layout correctly', () => {
    renderWithRouter(<Settings />);
    
    // Find the grid container
    const gridContainer = screen.getByText('Products').closest('div').parentElement;
    
    expect(gridContainer).toHaveStyle({
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '15px'
    });
  });

  test('all setting cards are clickable links', () => {
    renderWithRouter(<Settings />);
    
    // Check that all cards are wrapped in links
    const settingCards = [
      'Products', 'Brew Methods', 'Recipes', 'Bean Types', 'Roasters',
      'Countries', 'Grinders', 'Filters', 'Kettles', 'Scales', 'Decaf Methods'
    ];
    
    settingCards.forEach(cardTitle => {
      const link = screen.getByText(cardTitle).closest('a');
      expect(link).toBeInTheDocument();
      expect(link).toHaveStyle({ textDecoration: 'none' });
    });
  });

  test('renders correct number of setting cards', () => {
    renderWithRouter(<Settings />);
    
    // Should have 11 setting cards total
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(11);
  });

  test('setting cards have consistent structure', () => {
    renderWithRouter(<Settings />);
    
    // Check that each card has title, description, and image
    const productCard = screen.getByText('Products').closest('div');
    
    expect(productCard).toContainElement(screen.getByText('Products'));
    expect(productCard).toContainElement(screen.getByText('Manage your coffee products and batches'));
    expect(productCard).toContainElement(screen.getByAltText('Coffee beans'));
  });

  test('setting card images have proper dimensions', () => {
    renderWithRouter(<Settings />);
    
    const images = screen.getAllByRole('img');
    
    images.forEach(img => {
      expect(img).toHaveStyle({
        width: '48px',
        height: '48px'
      });
    });
  });
});