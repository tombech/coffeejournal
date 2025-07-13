# Cypress Integration Testing Setup Plan

## Quick Setup (30 minutes)

1. **Install Cypress**
   ```bash
   cd src/coffeejournal/frontend
   npm install --save-dev cypress
   ```

2. **Create Basic Test Suite**
   ```javascript
   // cypress/e2e/critical-flows.cy.js
   describe('Coffee Journal Critical Flows', () => {
     beforeEach(() => {
       cy.visit('/')
     })

     it('can navigate to main pages without errors', () => {
       cy.contains('Products').click()
       cy.url().should('include', '/products')
       
       cy.contains('Settings').click()
       cy.url().should('include', '/settings')
       
       cy.contains('All brews').click()
       cy.url().should('include', '/brew-sessions')
     })

     it('displays products with proper roaster names (no object errors)', () => {
       cy.visit('/products')
       // Would catch [object Object] rendering
       cy.get('[data-testid="product-card"]').each(($card) => {
         cy.wrap($card).should('not.contain', '[object Object]')
         cy.wrap($card).should('not.contain', 'undefined')
       })
     })

     it('can create a new brew session', () => {
       cy.visit('/products/1')  // specific product page
       cy.contains('Log New Session').click()
       
       // Fill out basic required fields
       cy.get('[name="brew_method"]').type('V60')
       cy.get('[name="amount_coffee_grams"]').type('18')
       cy.get('[name="amount_water_grams"]').type('300')
       
       cy.contains('Log Session').click()
       cy.contains('successfully').should('be.visible')
     })

     it('can edit products without object rendering errors', () => {
       cy.visit('/products/1/edit')
       cy.contains('Edit Coffee Product').should('be.visible')
       
       // Check that lookup fields display names, not objects
       cy.get('[data-testid="roaster-input"]').should('not.contain', '[object Object]')
       cy.get('[data-testid="country-input"]').should('not.contain', '[object Object]')
     })
   })
   ```

3. **Add npm Scripts**
   ```json
   {
     "scripts": {
       "cypress:open": "cypress open",
       "cypress:run": "cypress run",
       "test:e2e": "cypress run"
     }
   }
   ```

## Coverage Goals

**High Value Tests (would catch our recent bugs):**
- [ ] All main pages load without JavaScript errors
- [ ] Products display with proper roaster names (no `[object Object]`)
- [ ] Edit forms populate correctly with lookup data
- [ ] New brew session creation works end-to-end
- [ ] Settings page lookup managers function

**Nice to Have:**
- [ ] Form validation works
- [ ] Toast notifications appear
- [ ] Data persists after page refresh

## Maintenance Strategy

- **Run on major changes**: Before releases/deployments
- **CI Integration**: Run on PRs to main branch
- **Keep tests simple**: Focus on user workflows, not implementation details