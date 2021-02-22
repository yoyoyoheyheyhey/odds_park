## 概要
競馬は全通り買えば、的中率100%になりますが絶対に負けます。  
絶対に負けるというのは、合計投資額が最低払戻額よりも上回ってしまい損失が出てしまうということです。  

しかし、オッズが歪んでいる買い目を最適に組み合わせて全通り買うことでそれを覆します。  
全通り買っている（的中率100%になっている）のに、合計払戻額が最低払戻額よりも上回るということです。

このアプリはその買い目の探索とそれの自動買い付けbotになります。

![Screen-Recording-2020-10-19-at-1 (1)](https://user-images.githubusercontent.com/47162279/108665770-11e84900-7519-11eb-90f6-a090af554b6b.gif)

## オッズの歪みとは
1~7番までの馬がいるとします。  

以下２つの買い目はどちらも的中率が同じになります。

 - 1番を単勝で買う
 - 1番を軸馬にして流しで馬単を買う（例：[[1,2], [1,3], [1,4], [1,5], [1,6], [1,7]] )

しかしながら、馬単流しのほうがお得になる場合があります。
お得になるというのは、馬単流しのほうがオッズが高くなるということです。
これがオッズの歪みです。

## 合成オッズ
オッズの歪みを見つけるには合成オッズという概念を使います。
合成オッズというのは複数の買い目を一つの買い目として見立ててオッズを算出するものです。  
この場合、馬単流しをひとつの買い目としてオッズを算出します。

### 算出方法
それぞれのオッズの逆数の和の逆数が合成オッズになります。  

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
