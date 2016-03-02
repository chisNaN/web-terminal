var compute_utils = require('../js/utils.js');
var assert = require('assert');

assert.equal( compute_utils.compare_versions('v0.0.10', 'v0.0.10'), false);

assert.equal( compute_utils.compare_versions('v0.0.09', 'v0.0.10'), false);
assert.equal( compute_utils.compare_versions('v0.0.10', 'v0.0.09'), true);

// this is maybe a bit weird??
assert.equal( compute_utils.compare_versions('v0.0.099', 'v0.0.10'), true);
assert.equal( compute_utils.compare_versions('v0.0.10', 'v0.0.099'), false);

assert.equal( compute_utils.compare_versions('v0.0.9', 'v0.0.10'), false);
assert.equal( compute_utils.compare_versions('v0.0.10', 'v0.0.9'), true);

assert.equal( compute_utils.compare_versions('v1.0.10', 'v0.0.10'), true);
assert.equal( compute_utils.compare_versions('v0.0.10', 'v0.0.10'), false);

assert.equal( compute_utils.compare_versions('v1.0.11', 'v0.9.99'), true);
assert.equal( compute_utils.compare_versions('v0.9.99', 'v1.0.11'), false);

assert.equal( compute_utils.compare_versions('v1.1.11', 'v1.0.99'), true);
assert.equal( compute_utils.compare_versions('v1.0.99', 'v1.1.11'), false);
