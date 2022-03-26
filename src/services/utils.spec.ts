import { getServiceNetworks } from './utils';
import { expect } from 'chai';
import 'mocha';
import * as _ from 'lodash';

describe('getServiceNetworks function', () => {
  const projectName = 'test';
  const fixtures = [
    { service: { networks: ['front-tier', 'back-tier'] } },
    { service: { networks: { 'front-tier': { aliases: ['alias1'] }, 'back-tier': { aliases: ['alias2'] } } } },
  ];
  const output = ['test_front-tier', 'test_back-tier'];

  for (const fixture of fixtures) {
    let service = fixture.service;
    it(`service: '${JSON.stringify(service)}' should include '${JSON.stringify(output)}'`, () => {
      let serviceNetworks = getServiceNetworks(projectName, service);
      expect(serviceNetworks).to.eql(output);
    });
  }
});
