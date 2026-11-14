# Remarks on the brief and API documentation

1. The brief doesn't say whether the "from" price on the landing is yearly or monthly, or whether it should match an API figure. I used monthly, at the Essential price (€38.50 / month).

2. The payment model (entity + reference, paid at a cash machine or in a banking app) is the Portuguese Multibanco system, not a standard French payment method. I kept the next-step copy generic ("pay with a reference").

3. The API docs say a 500 internal_error is "safe to retry once", but not what the customer should see if the retry also fails. To decide when building the error panel.

4. The API says a licence held "less than two years" is refused, but not two years counted from when: today or the delivery date. I count from today.

5. The docs say every figure is fixed, but a contract for an annual customer returning the monthly example amount would contradict the payment screen. My stub computes the premium from the quote figures for the chosen selection and frequency, as a real server would.