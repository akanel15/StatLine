/* eslint-env jest */
const open = jest.fn(() => Promise.resolve({ success: true }));

module.exports = {
  __esModule: true,
  default: { open },
};
