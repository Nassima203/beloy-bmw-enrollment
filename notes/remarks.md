# Remarks on the brief

The brief was clear. These are small points where I had to make a choice.

1. **The "from" price.** The brief does not say if it is a monthly or a yearly price. I used the monthly price of the Essential package (€38.50 a month), because it is the lowest price.

2. **The payment method.** Paying with an entity and a reference at a cash machine looks like Multibanco, a system used in Portugal. It is not common in France, so I wrote simple, general steps.

3. **Server error (500).** The documentation says we can retry once. It does not say what to show if it fails again. I show a clear message with a "Try again" button. The error code only goes to the console.

4. **"Licence held for less than two years".** The documentation does not say from which date the two years are counted. I count them from today. In a real project, the insurer's API decides.

5. **Monthly or yearly amount.** The contract example always returns the monthly amount. A customer who pays yearly would see the wrong amount. So my API stub returns the amount for the frequency the customer chose.

6. **Price of each model.** The customer can change the car model, but the brief does not give a price for each model. If the model changes, I keep the price from the order.

7. **Licence and age.** The brief does not give a minimum age for the licence. I only check that the licence date is after the date of birth. The insurance rules are checked by the API.

8. **Nothing selected on the cover screen.** For a new quote, no package is selected. If the customer comes back from the review screen, I keep their choice, so they don't have to choose again.

9. **Phone number format.** The brief does not say which formats to accept. I accept French numbers like "06 12 34 56 78" and send them as "+33612345678", like the example in the API documentation.

10. **Changing answers from the review screen.** If the customer changes their car or driver details, they get new prices, so they choose a package again. This is logical, but it could surprise someone.
