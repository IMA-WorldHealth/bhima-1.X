Bhima Coding Style Guide
========================

#### Introduction

Software sustainability is only achieved by implimenting sustainable development
practices at every step of the development practice.  For bhima, IMA-WorldHealth
requires that all code be subject to proper formatting, static analysis (linting),
and adhere to this style guide. 

Note: This is far from complete.  But it touches on some issues we've had thus far.

## Javascript

##### Variable Declarations

Always use `var`.

```javascript
// good
var x = 7;
var y = "Some String";

// bad
x = 7;
y = "Some String";
```

Using one `var` statement for a series of assignments is acceptable, but be sure to
indent properly.  Proper indentation aligns all the variable names to increase
readability.

```javascript
// good
var x = 7,
    y = "Some String";

// bad
var x = 7, y = "Some String";
```

##### Function Declarations

Anonymous functions are useful.  When declaring an anonymous function, insert a space
between the keyword `function` and the following parens.  For named function, do not 
include the space.

```javascript
// good
function (a, b) { return a + b; }
function sum(a, b) { return a + b; }

// bad
function(a, b) { return a + b; }
function sum (a, b) { return a + b; }
```

Prefer named functions to assigning functions to a `var`.


```javascript
// good
function sum(a, b) { return a + b; }

// bad
var sum = function sum(a, b) { return a + b; }
```

Always terminate return statement with a semicolon (`;`).

```javascript
// good
function power(x, n) { return x * power(x, n-1); }

// bad
function power(x, n) { return x * power(x, n-1) }
```

###### Objects

Always use object literal syntax.

```javascript
// good
var o = {};
var a = [];

// bad
var o = new Object();
var a = new Array();
```
