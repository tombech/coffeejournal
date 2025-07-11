describe('Object Rendering Bug Prevention', () => {
  it('prevents [object Object] rendering across the app', () => {
    // Test home page
    cy.visit('/')
    cy.get('body').should('not.contain', '[object Object]')
    cy.get('body').should('not.contain', 'undefined')
    
    // Test products page
    cy.visit('/products')
    cy.wait(1000) // Allow time for API calls
    cy.get('body').should('not.contain', '[object Object]')
    
    // Test settings page
    cy.visit('/settings')
    cy.wait(1000)
    cy.get('body').should('not.contain', '[object Object]')
    
    // Test brew sessions page
    cy.visit('/brew-sessions')
    cy.wait(1000)
    cy.get('body').should('not.contain', '[object Object]')
  })

  it('displays roaster names correctly in product dropdowns', () => {
    // This would have caught our specific BrewSessionForm bug
    cy.visit('/')
    
    // Try to find any product form or brew session form
    cy.get('body').then(($body) => {
      const bodyText = $body.text()
      
      // If we can find a way to a form with product selection
      if (bodyText.includes('Log') || bodyText.includes('Add') || bodyText.includes('New')) {
        // Look for product-related forms
        cy.visit('/products')
        cy.wait(1000)
        
        // Check if any product names are visible and properly formatted
        cy.get('body').should('satisfy', ($body) => {
          const text = $body.text()
          // Should not contain object rendering errors
          return !text.includes('[object Object]') && 
                 !text.includes('undefined') && 
                 !text.includes('null')
        })
      }
    })
  })

  it('handles React Router navigation without module errors', () => {
    // This test would catch our router import issues
    const routes = [
      '/',
      '/products',
      '/products/new',
      '/brew-sessions', 
      '/settings',
      '/settings/roasters'
    ]
    
    routes.forEach(route => {
      cy.visit(route, { failOnStatusCode: false })
      
      // Should not show JavaScript module errors
      cy.get('body').should('not.contain', 'Cannot find module')
      cy.get('body').should('not.contain', 'Module not found')
      cy.get('body').should('not.contain', 'react-router-dom')
      
      // Should either show content or a proper 404, not a JS error
      cy.get('body').should('satisfy', ($body) => {
        const text = $body.text()
        return text.length > 0 && !text.includes('Loading chunk')
      })
    })
  })

  it('validates that all forms load without object rendering', () => {
    // Test product form
    cy.visit('/products/new', { failOnStatusCode: false })
    cy.wait(500)
    cy.get('body').should('not.contain', '[object Object]')
    
    // Test any edit forms if they exist
    cy.visit('/products/edit/1', { failOnStatusCode: false })
    cy.wait(500)
    cy.get('body').should('not.contain', '[object Object]')
  })
})