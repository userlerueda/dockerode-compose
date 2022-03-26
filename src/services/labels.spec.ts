import { addServiceLabels } from './labels';
import { expect } from 'chai';
import 'mocha';
import * as _ from 'lodash';

describe('addServiceLabels function', () => {
  const defaultOpts = {
    name: 'test_service_1',
    Image: 'nginx:latest',
    NetworkingConfig: {
      EndpointsConfig: {},
    },
    Labels: {
      'com.docker.compose.project': 'test',
      'com.docker.compose.service': 'service',
    },
  };
  const fixtures = [
    { service: { labels: ['com.dockerode.service=test_service_1', 'com.dockerode.id=12345'] } },
    { service: { labels: { 'com.dockerode.service': 'test_service_1', 'com.dockerode.id': '12345' } } },
  ];
  const output = {
    Labels: {
      'com.docker.compose.project': 'test',
      'com.docker.compose.service': 'service',
      'com.dockerode.service': 'test_service_1',
      'com.dockerode.id': '12345',
    },
  };
  for (const fixture of fixtures) {
    let service = fixture.service;
    it(`service: '${JSON.stringify(service)}' should include '${JSON.stringify(output)}'`, () => {
      let opts = _.cloneDeep(defaultOpts);
      addServiceLabels(service, opts);
      expect(opts).to.deep.include(output);
    });
  }
});
