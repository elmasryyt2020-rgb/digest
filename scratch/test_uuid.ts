// Self-check test for UUID format and state helpers
const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  const r = Math.random() * 16 | 0;
  return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
});

// Run assertions
const testUuid = () => {
  const id1 = uuid();
  const id2 = uuid();
  
  console.log('Generated UUID 1:', id1);
  console.log('Generated UUID 2:', id2);

  // Check length
  if (id1.length !== 36) {
    throw new Error(`Invalid UUID length: ${id1.length}`);
  }

  // Check unique
  if (id1 === id2) {
    throw new Error('UUIDs are not unique');
  }

  // Check UUID format (hex digits + hyphens at 8-4-4-4-12)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id1)) {
    throw new Error(`UUID does not match format: ${id1}`);
  }
  if (!uuidRegex.test(id2)) {
    throw new Error(`UUID does not match format: ${id2}`);
  }

  console.log('UUID verification passed.');
};

testUuid();
