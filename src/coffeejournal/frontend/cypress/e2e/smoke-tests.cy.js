describe('Coffee Journal - Smoke Tests', () => {
  it('core application functionality works', () => {
    // Test that the app loads and basic navigation works
    cy.visit('/')
    cy.get('[data-testid="app-main"]').should('be.visible')
    cy.get('body').should('not.contain', '[object Object]')
    
    // Test that all routes load without JavaScript errors
    const routes = ['/', '/products', '/brew-sessions', '/settings']
    routes.forEach(route => {
      cy.visit(route)
      cy.get('body').should('not.contain', '[object Object]')
      cy.get('body').should('not.contain', 'Cannot find module')
      cy.get('body').should('not.contain', 'Module not found')
    })
  })

  it('prevents the specific bugs we encountered', () => {
    // Test React Router DOM compatibility
    cy.visit('/products')
    cy.get('body').should('not.contain', 'react-router-dom')
    cy.get('body').should('not.contain', 'index.mjs')
    
    // Test object rendering in any forms
    cy.visit('/products/new')
    cy.get('body').should('not.contain', '[object Object]')
    
    // Test edit forms if they exist
    cy.visit('/products/edit/1', { failOnStatusCode: false })
    cy.get('body').should('not.contain', '[object Object]')
  })
})