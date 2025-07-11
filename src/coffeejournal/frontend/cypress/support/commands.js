// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Coffee Journal specific commands

Cypress.Commands.add('waitForPageLoad', () => {
  // Wait for React to load and main content to appear
  cy.get('[data-testid="app-main"], main, .App-main').should('be.visible')
})

Cypress.Commands.add('navigateToProducts', () => {
  cy.visit('/products')
  cy.waitForPageLoad()
})

Cypress.Commands.add('navigateToSettings', () => {
  cy.visit('/settings')
  cy.waitForPageLoad()
})

Cypress.Commands.add('checkForApiErrors', () => {
  // Check that no API error messages are visible
  cy.get('body').should('not.contain', 'Failed to load')
  cy.get('body').should('not.contain', 'Error')
  cy.get('body').should('not.contain', '404')
  cy.get('body').should('not.contain', '500')
})