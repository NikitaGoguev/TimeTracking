# TimeTracking
Node.js MongoDB Vue

Важный момент: для того чтобы избежать конфликта между синтаксисом Vue и Nunjucks последние настроены так, что для серверных шаблонов вместо фигурных скобок используются квадратные:

```js
  tags: {
    blockStart: "[%",
    blockEnd: "%]",
    variableStart: "[[",
    variableEnd: "]]",
    commentStart: "[#",
    commentEnd: "#]",
  },
```