import { addServicePorts } from './ports';
import { expect } from 'chai';
import 'mocha';
import * as _ from 'lodash';

describe('addServicePorts function', () => {
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
    { service: { ports: ['60203'] } },
    { service: { ports: ['60203:60203'] } },
    { service: { ports: ['60203-60203'] } },
    {
      service: { ports: [{ target: 60203, host_ip: '0.0.0.0', protocol: 'tcp', published: 60203, mode: 'host' }] },
    },
  ];
  const output = {
    ExposedPorts: {
      '60203/tcp': {},
    },
    HostConfig: {
      PortBindings: {
        '60203/tcp': [
          {
            HostPort: '60203',
          },
        ],
      },
    },
  };
  for (const fixture of fixtures) {
    let service = fixture.service;
    it(`service: '${JSON.stringify(service)}' should include '${JSON.stringify(output)}'`, () => {
      let opts = _.cloneDeep(defaultOpts);
      addServicePorts(service, opts);
      expect(opts).to.deep.include(output);
    });
  }
});
