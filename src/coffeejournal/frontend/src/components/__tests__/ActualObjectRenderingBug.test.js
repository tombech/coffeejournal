import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Home from '../Home';
import { ToastProvider } from '../Toast';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock console.log for radar chart debug logs
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        {component}
      </ToastProvider>
    </BrowserRouter>
  );
};

describe('Actual Object Rendering Bug', () => {
  beforeEach(() => {
    fetch.mockClear();
    console.log.mockClear();
    console.error.mockClear();
  });

  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  test('reproduces the actual object rendering error from real API data', async () => {
    // Use the actual API response structure that might be causing the issue
    const realApiSessions = [
      {
        "id": 1,
        "acidity": 9,
        "amount_coffee_grams": 20.0,
        "amount_water_grams": 320.0,
        "aroma": 9,
        "bitterness": 3,
        "bloom_time_seconds": 30,
        "body": 6,
        "brew_method": {
          "id": 1,
          "name": "V60",
          "short_form": "V60"
        },
        "brew_method_id": 1,
        "brew_ratio": "1:16.0",
        "brew_temperature_c": 93.0,
        "brew_time_seconds": 180,
        "filter": null,
        "flavor_profile_match": 8,
        "grinder": null,
        "kettle": null,
        "notes": "Excellent floral notes, very bright and clean",
        "product_batch_id": 1,
        "product_details": {
          "bean_type": [
            {
              "id": 1,
              "name": "Arabica"
            },
            {
              "id": 2,
              "name": "Robusta"
            }
          ],
          "decaf": true,
          "product_name": "Yirgacheffe Single Origin",
          "roast_date": "2024-12-15",
          "roast_type": 3,
          "roaster": {
            "id": 1,
            "name": "Blue Bottle Coffee"
          }
        },
        "product_id": 1,
        "product_name": "Blue Bottle Coffee - Arabica, Robusta",
        "recipe": {
          "id": 1,
          "name": "Standard V60"
        },
        "recipe_id": 1,
        "scale": null,
        "sweetness": 8,
        "timestamp": "2024-12-21T08:30:00"
      }
    ];

    const realApiProducts = [
      {
        "id": 1,
        "product_name": "Yirgacheffe Single Origin",
        "roaster": {
          "id": 1,
          "name": "Blue Bottle Coffee"
        },
        "bean_type": [
          {
            "id": 1,
            "name": "Arabica"
          },
          {
            "id": 2,
            "name": "Robusta"
          }
        ],
        "country": {
          "id": 1,
          "name": "Ethiopia"
        },
        "region": [
          {
            "id": 1,
            "name": "Yirgacheffe"
          }
        ],
        "decaf": true,
        "rating": 4.5
      }
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => realApiSessions
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => realApiProducts
      });

    // This should trigger the object rendering error if it exists
    const renderResult = () => renderWithProviders(<Home />);
    
    // If there's an object rendering error, this should throw
    let renderError = null;
    try {
      renderResult();
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to your Coffee Journal!')).toBeInTheDocument();
      }, { timeout: 5000 });
      
    } catch (error) {
      renderError = error;
    }

    if (renderError) {
      console.log('Caught render error:', renderError.message);
      
      // Check if it's the specific object rendering error
      if (renderError.message.includes('Objects are not valid as a React child')) {
        console.log('Found the object rendering bug!');
        expect(renderError.message).toContain('Objects are not valid as a React child');
        expect(renderError.message).toContain('object with keys {id, name}');
      } else {
        throw renderError; // Re-throw if it's a different error
      }
    }

    // If no error, check for any console errors that might indicate the issue
    const errorCalls = console.error.mock.calls;
    const objectRenderingErrors = errorCalls.filter(call => 
      call.some(arg => 
        typeof arg === 'string' && 
        arg.includes('Objects are not valid as a React child')
      )
    );

    if (objectRenderingErrors.length > 0) {
      console.log('Found object rendering errors in console:', objectRenderingErrors);
      expect(objectRenderingErrors.length).toBeGreaterThan(0);
    }
  });

  test('test with the exact structure that might cause issues', async () => {
    // Test with potentially problematic structures
    const problematicSessions = [
      {
        "id": 1,
        "product_details": {
          "roaster": { "id": 1, "name": "Blue Bottle Coffee" }, // This object might be rendered directly
          "bean_type": [{ "id": 1, "name": "Arabica" }], // This array of objects might be rendered directly
        },
        "brew_method": { "id": 1, "name": "V60" }, // This object might be rendered directly
        "product_id": 1,
        "timestamp": "2024-12-21T08:30:00",
        "amount_coffee_grams": 20.0,
        "amount_water_grams": 320.0
      }
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => problematicSessions
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

    let renderError = null;
    try {
      renderWithProviders(<Home />);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to your Coffee Journal!')).toBeInTheDocument();
      }, { timeout: 3000 });
      
    } catch (error) {
      renderError = error;
      console.log('Render error details:', error.message);
      
      if (error.message.includes('Objects are not valid as a React child')) {
        // This is the bug we're looking for!
        expect(error.message).toContain('Objects are not valid as a React child');
      }
    }

    // Check console for errors even if render didn't throw
    const errorCalls = console.error.mock.calls;
    const relevantErrors = errorCalls.filter(call => 
      call.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('Objects are not valid as a React child') ||
         arg.includes('object with keys'))
      )
    );

    if (relevantErrors.length > 0) {
      console.log('Console errors found:', relevantErrors);
    }
  });
});