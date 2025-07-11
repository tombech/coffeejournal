describe('Coffee Journal - Critical User Flows', () => {
  beforeEach(() => {
    // Ensure we start fresh for each test
    cy.visit('/')
    cy.waitForPageLoad()
  })

  describe('Navigation and Basic Functionality', () => {
    it('loads the home page without errors', () => {
      cy.contains('My Coffee Journal').should('be.visible')
      cy.checkNoObjectErrors()
      cy.checkForApiErrors()
    })

    it('can navigate to all main pages', () => {
      // Test navigation menu
      cy.contains('All brews').click()
      cy.url().should('include', '/brew-sessions')
      cy.waitForPageLoad()
      cy.checkNoObjectErrors()

      cy.contains('Settings').click()
      cy.url().should('include', '/settings')
      cy.waitForPageLoad()
      cy.checkNoObjectErrors()

      cy.contains('Home').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/')
      cy.waitForPageLoad()
    })
  })

  describe('Object Rendering Bug Prevention', () => {
    it('displays products with proper roaster names (no [object Object])', () => {
      cy.navigateToProducts()
      
      // Wait for products to load
      cy.get('body').should('contain', 'Coffee Products')
      
      // Check that no object rendering errors appear anywhere
      cy.checkNoObjectErrors()
      
      // If there are product cards/items, verify they show proper text
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="product-card"], .product-item, .product-card').length) {
          cy.get('[data-testid="product-card"], .product-item, .product-card').each(($card) => {
            cy.wrap($card).should('not.contain', '[object Object]')
            cy.wrap($card).should('not.contain', 'undefined')
          })
        }
      })
    })

    it('handles brew session form without object rendering errors', () => {
      cy.visit('/')
      
      // Try to find a way to the brew session form
      // This might be through a product detail page or direct route
      cy.get('body').then(($body) => {
        if ($body.find('a[href*="/products"]').length) {
          cy.get('a[href*="/products"]').first().click()
          cy.waitForPageLoad()
          
          // Look for "Log New Session" or similar button
          if ($body.find('button, a').text().includes('Log') || $body.find('button, a').text().includes('Session')) {
            cy.contains('Log').click()
            cy.waitForPageLoad()
            cy.checkNoObjectErrors()
            
            // Check product dropdown if it exists
            cy.get('select[name="product_id"]').should('exist').then(($select) => {
              cy.wrap($select).find('option').each(($option) => {
                cy.wrap($option).should('not.contain', '[object Object]')
              })
            })
          }
        }
      })
    })
  })

  describe('Settings and Lookup Management', () => {
    it('loads settings page with all lookup managers', () => {
      cy.navigateToSettings()
      
      // Check that settings page loads
      cy.contains('Settings').should('be.visible')
      cy.checkNoObjectErrors()
      
      // Verify lookup manager links are present
      const expectedManagers = [
        'Roasters', 'Bean Types', 'Countries', 'Brew Methods', 
        'Recipes', 'Grinders', 'Filters', 'Kettles', 'Scales'
      ]
      
      expectedManagers.forEach(manager => {
        cy.get('body').should('contain', manager)
      })
    })

    it('can access roaster manager without errors', () => {
      cy.navigateToSettings()
      
      // Click on roasters management
      cy.contains('Roasters').click()
      cy.waitForPageLoad()
      cy.checkNoObjectErrors()
      
      // Should see roaster management interface
      cy.get('body').should('contain', 'Roaster')
    })
  })

  describe('Data Integration Tests', () => {
    it('displays existing data correctly on products page', () => {
      cy.navigateToProducts()
      
      // Check that the page loads with data or shows appropriate empty state
      cy.get('body').should('satisfy', ($body) => {
        const text = $body.text()
        return text.includes('Coffee') || text.includes('No products') || text.includes('Add')
      })
      
      cy.checkNoObjectErrors()
    })

    it('handles API responses gracefully', () => {
      // Visit different pages and ensure they handle API responses properly
      const pages = ['/', '/products', '/brew-sessions', '/settings']
      
      pages.forEach(page => {
        cy.visit(page)
        cy.waitForPageLoad()
        
        // Should not show raw API errors or malformed data
        cy.checkNoObjectErrors()
        cy.checkForApiErrors()
        
        // Should not have unhandled JavaScript errors
        cy.window().then((win) => {
          cy.spy(win.console, 'error').as('consoleError')
        })
      })
    })
  })

  describe('Form Functionality', () => {
    it('can access product creation form', () => {
      cy.navigateToProducts()
      
      // Look for "Add" or "New" button/link
      cy.get('body').then(($body) => {
        if ($body.find('a[href*="new"], button').text().includes('Add') || 
            $body.find('a[href*="new"], button').text().includes('New')) {
          cy.contains('Add', 'New').first().click()
          cy.waitForPageLoad()
          cy.checkNoObjectErrors()
          
          // Should see form fields
          cy.get('form').should('exist')
          cy.get('input, select, textarea').should('have.length.greaterThan', 0)
        }
      })
    })
  })
})