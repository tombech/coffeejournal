// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Custom commands for Coffee Journal app
Cypress.Commands.add('startBackend', () => {
  // This would be where we could start the backend server if needed
  // For now, we assume it's running on localhost:5000
})

Cypress.Commands.add('seedTestData', () => {
  // Helper to ensure test data is present
  // Could make API calls to create test data if needed
})

Cypress.Commands.add('checkNoObjectErrors', () => {
  // Reusable command to check for [object Object] rendering
  cy.get('body').should('not.contain', '[object Object]')
  cy.get('body').should('not.contain', 'undefined')
  cy.get('body').should('not.contain', 'null')
})