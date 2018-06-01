function add(foo, bar) {
  return foo + bar;
}
function subtract(foo, bar) {
  return foo - bar;
}
console.log((Math.random() > 0.9 ? add : subtract)(1, 2));
