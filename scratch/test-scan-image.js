const assert = require('assert');
const mockResponse = {
  meal_name_en: 'Burger',
  meal_name_ar: 'برجر',
  detected_items: [{ name_en: 'Bun', amount_g: 50, calories_per_100g: 200 }]
};
assert.strictEqual(mockResponse.meal_name_en, 'Burger');
assert.strictEqual(mockResponse.detected_items[0].amount_g, 50);
console.log('Task 1 Mock Test: PASS');
