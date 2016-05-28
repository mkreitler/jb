// Expressions are binary trees that represent mathematical expressions.

me.exp = {};

me.exp.expression = function(expStr) {
  this.init();
};

me.exp.expression.prototype.init = function(expStr) {
  this.tree = this.parse(expStr);
};

me.exp.expression.prototype.parse = function(expStr) {

};