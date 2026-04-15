/**
 * __mocks__/fileMock.js — Jest transform stub for static assets
 *
 * Jest cannot process binary files (images, SVGs, etc.) the same way Vite can.
 * This stub replaces any imported asset with a simple string so tests don't crash.
 */

module.exports = "test-file-stub";
