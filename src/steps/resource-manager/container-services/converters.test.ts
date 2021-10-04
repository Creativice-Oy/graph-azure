import { createAzureWebLinker } from '../../../azure';
import {
  AgentPool,
  ManagedCluster,
} from '@azure/arm-containerservice/esm/models';
import { createClusterEntitiy, createNodePoolEntity } from './converters';

const webLinker = createAzureWebLinker('something.onmicrosoft.com');

describe('createClusterEntity', () => {
  test('properties transferred', () => {
    const data: ManagedCluster = {
      id: 'id',
      name: 'name',
      sku: {
        name: 'Basic',
      },
      identity: {
        principalId: 'principalId',
        tenantId: 'tenantId',
      },
      provisioningState: 'Succeeded',
      maxAgentPools: 10,
      kubernetesVersion: '1.15.3',
      dnsPrefix: 'dnsPrefix',
      fqdn: 'fqdn',
      nodeResourceGroup: 'nodeResourceGroup',
      enableRBAC: true,
      enablePodSecurityPolicy: false,
      disableLocalAccounts: false,
      location: 'location',
    };

    expect(createClusterEntitiy(webLinker, data)).toEqual({
      _key: 'id',
      _type: 'azure_container_services_cluster',
      _class: ['Cluster'],
      _rawData: [{ name: 'default', rawData: data }],
      id: 'id',
      createdOn: undefined,
      displayName: 'name',
      name: 'name',
      skuName: 'Basic',
      location: 'location',
      principalId: 'principalId',
      tenantId: 'tenantId',
      provisioningState: 'Succeeded',
      maxAgentPools: 10,
      kubernetesVersion: '1.15.3',
      dnsPrefix: 'dnsPrefix',
      fqdn: 'fqdn',
      nodeResourceGroup: 'nodeResourceGroup',
      enableRBAC: true,
      enablePodSecurityPolicy: false,
      disableLocalAccounts: false,
      webLink: webLinker.portalResourceUrl('id'),
    });
  });
});

describe('createNodePoolEntity', () => {
  test('properties transferred', () => {
    const data: AgentPool = {
      id: 'id',
      name: 'name',
      count: 1,
      vmSize: 'vmSize',
      vnetSubnetID: 'vnet-id',
      podSubnetID: 'pod-id',
      maxPods: 2,
      osType: 'Windows',
      maxCount: 10,
      minCount: 2,
      enableAutoScaling: true,
      agentPoolType: 'AvailabilitySet',
      mode: 'System',
      provisioningState: 'Succeeded',
      availabilityZones: ['1', '2'],
      enableNodePublicIP: false,
      enableEncryptionAtHost: false,
      enableUltraSSD: false,
      enableFIPS: false,
    };

    expect(createNodePoolEntity(webLinker, data)).toEqual({
      _key: 'id',
      _type: 'azure_container_services_node_pool',
      _class: ['Group'],
      _rawData: [{ name: 'default', rawData: data }],
      id: 'id',
      createdOn: undefined,
      displayName: 'name',
      name: 'name',
      count: 1,
      vmSize: 'vmSize',
      vnetSubnetID: 'vnet-id',
      podSubnetID: 'pod-id',
      maxPods: 2,
      osType: 'Windows',
      maxCount: 10,
      minCount: 2,
      enableAutoScaling: true,
      agentPoolType: 'AvailabilitySet',
      mode: 'System',
      provisioningState: 'Succeeded',
      availabilityZones: ['1', '2'],
      enableNodePublicIP: false,
      enableEncryptionAtHost: false,
      enableUltraSSD: false,
      enableFIPS: false,
      webLink: webLinker.portalResourceUrl('id'),
    });
  });
});
