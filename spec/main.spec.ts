/**
 * test
 */
import { assert } from 'chai';
import * as fs from 'fs';
import * as mock from 'mock-fs';

import { ISybaseEntry } from '@src/interfaces';
import { filterEntries } from '..';

describe('filterEntries', () => {
  before(() => {
    mock({
        '/usr/local/sybase/interfaces':
`alpha
\tmaster tcp ether alpha.example.com 4100
\tquery tcp ether alpha.example.com 4100
beta
\tmaster tcp ether beta.example.com 4100
\tquery tcp ether beta.example.com 4100
gamma
\tmaster tcp ether gamma.example.com 4100
\tquery tcp ether gamma.example.com 4100
`
    });
  });

  after(() => mock.restore());

  it('should filter', (done: MochaDone) => {
    filterEntries('alpha', {}, (entries: ISybaseEntry[]) => {
      assert.equal(entries.length, 2, 'entries should equal 2');
      done();
    });
  });

  it('should do something about IFILE', () => {
    assert.equal(process.env.IFILE, null, 'blah');
  });
});
