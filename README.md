## The distortion of the odds

horseNumbers = [1, 2, 3, 4, 5, 6, 7]

- [[1]] // win
- [[1,2], [1,3], [1,4], [1,5], [1,6], [1,7]] // exacta wheel

These two tickets have to be the same odds since the prediction of these are identical. Nevertheless, either of them can be a better deal than the other sometimes. That is the distortion of the odds.

## The composite odds
To define which is the better, we're going to use the compositte odds, which is the odds that is calculated by considering a multi-point ticket as a single-point ticket.   

### How to calculate
Calculate the inverse of the odds of each and find the inverse of the sum of the odds.

```javascript
// e.g.)
winOdds = 14.7
exactcaOdds = [347.2, 37.4, 54.0, 662.7, 169.6, 607.5]

1 / ((1 / 347.2) + (1 / 37.4) + (1 / 54.0) + (1 / 662.7) + (1 / 169.6) + (1 / 607.5))
// => 17.48619626748472
// now we know we better to buy the wheel than the win for this.
```
