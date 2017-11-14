/**
 * test
 */
import { assert } from 'chai';
import * as mock from 'mock-fs';

import { filterEntries } from '..';
import { ISybaseEntry } from '../src//interfaces';

describe('filterEntries', () => {
  const env: NodeJS.ProcessEnv = { ...process.env };

  const interfacesFile: string =
`alpha
\tmaster tcp ether alpha.example.com 4100
\tquery tcp ether alpha.example.com 4100
beta
\tmaster tcp ether beta.example.com 4100
\tquery tcp ether beta.example.com 4100
gamma
\tmaster tcp ether gamma.example.com 4100
\tquery tcp ether gamma.example.com 4100
`;

  const expectedMasterEntry: ISybaseEntry = {
    serviceType: 'master',
    protocol: 'tcp',
    network: 'ether',
    machine: 'alpha.example.com',
    port: '4100',
    filter: undefined
  };
  const expectedQueryEntry: ISybaseEntry = { ...expectedMasterEntry, serviceType: 'query' };

  before(() => {
    mock({
        '/usr/local/sybase/interfaces': interfacesFile
    });
    delete process.env.SYBASE;
    delete process.env.IFILE;
  });

  after(() => {
    process.env = env;
    mock.restore();
  });

  it('should retrieve the master and query entries when both exist', (done: MochaDone) => {
    filterEntries('alpha', {}, (entries: ISybaseEntry[]) => {
      assert.lengthOf(entries, 2, 'entries length is 2');
      const masterEntry: ISybaseEntry = <ISybaseEntry>entries.find((e: ISybaseEntry) => e.serviceType === 'master');
      const queryEntry: ISybaseEntry = <ISybaseEntry>entries.find((e: ISybaseEntry) => e.serviceType === 'query');
      assert.deepEqual(masterEntry, expectedMasterEntry);
      assert.deepEqual(queryEntry, expectedQueryEntry);
      done();
    });
  });

  it('should do something about IFILE', () => {
    assert.equal(process.env.IFILE, null, 'blah');
  });
});
