import { Recording } from '@jupiterone/integration-sdk-testing';
import { fetchClusters } from '.';
import { createMockAzureStepExecutionContext } from '../../../../test/createMockAzureStepExecutionContext';
import { setupAzureRecording } from '../../../../test/helpers/recording';
import { configFromEnv } from '../../../../test/integrationInstanceConfig';
import { ACCOUNT_ENTITY_TYPE } from '../../active-directory';
import {
  ContainerServicesEntities,
  ContainerServicesRelationships,
} from './constants';

let recording: Recording;

afterEach(async () => {
  if (recording) {
    await recording.stop();
  }
});

test(
  'step - container services clusters',
  async () => {
    const instanceConfig = {
      ...configFromEnv,
      directoryId: '19ae0f99-6fc6-444b-bd54-97504efc66ad',
      subscriptionId: '193f89dc-6225-4a80-bacb-96b32fbf6dd0',
    };

    recording = setupAzureRecording({
      directory: __dirname,
      name: 'container-services-step-clusters',
    });

    const context = createMockAzureStepExecutionContext({
      instanceConfig,
      entities: [
        {
          _class: ['Account'],
          _type: 'azure_subscription',
          _key: `/subscriptions/${instanceConfig.subscriptionId}`,
        },
      ],
      setData: {
        [ACCOUNT_ENTITY_TYPE]: { defaultDomain: 'www.fake-domain.com' },
      },
    });

    await fetchClusters(context);

    expect(context.jobState.collectedEntities.length).toBeGreaterThan(0);
    expect(
      context.jobState.collectedEntities.filter(
        (e) => e._type === ContainerServicesEntities.CLUSTER._type,
      ),
    ).toMatchGraphObjectSchema({
      _class: 'Cluster',
      schema: {
        additionalProperties: false,
        properties: {
          _type: { const: 'azure_container_services_cluster' },
          _key: { type: 'string' },
          _class: { type: 'array', items: { const: 'Rule' } },
          id: { type: 'string' },
          name: { type: 'string' },
          displayName: { type: 'string' },
          type: { const: 'Microsoft.ContainerService/managedClusters' },
          webLink: { type: 'string' },
          _rawData: { type: 'array', items: { type: 'object' } },
          skuName: { type: 'string' },
          location: { type: 'string' },
          principalId: { type: 'string' },
          tenantId: { type: 'string' },
          provisioningState: { type: 'string' },
          maxAgentPools: { type: 'number' },
          kubernetesVersion: { type: 'string' },
          dnsPrefix: { type: 'string' },
          fqdn: { type: 'string' },
          nodeResourceGroup: { type: 'string' },
          enableRBAC: { type: 'boolean' },
          enablePodSecurityPolicy: { type: 'boolean' },
          disableLocalAccounts: { type: 'boolean' },
        },
      },
    });

    expect(
      context.jobState.collectedEntities.filter(
        (e) => e._type === ContainerServicesEntities.NODE_POOL._type,
      ),
    ).toMatchGraphObjectSchema({
      _class: 'Group',
      schema: {
        additionalProperties: false,
        properties: {
          _type: { const: 'azure_container_services_node_pool' },
          _key: { type: 'string' },
          _class: { type: 'array', items: { const: 'Group' } },
          id: { type: 'string' },
          name: { type: 'string' },
          displayName: { type: 'string' },
          webLink: { type: 'string' },
          _rawData: { type: 'array', items: { type: 'object' } },
          count: { type: 'number' },
          vmSize: { type: 'string' },
          vnetSubnetID: { type: 'string' },
          podSubnetID: { type: 'string' },
          maxPods: { type: 'number' },
          osType: { type: 'string' },
          maxCount: { type: 'number' },
          minCount: { type: 'number' },
          enableAutoScaling: { type: 'boolean' },
          agentPoolType: { type: 'string' },
          mode: { type: 'string' },
          provisioningState: { type: 'string' },
          availabilityZones: { type: 'array', items: { type: 'string' } },
          enableNodePublicIP: { type: 'boolean' },
          enableEncryptionAtHost: { type: 'boolean' },
          enableUltraSSD: { type: 'boolean' },
          enableFIPS: { type: 'boolean' },
        },
      },
    });

    expect(
      context.jobState.collectedRelationships.filter(
        (e) =>
          e._type ===
          ContainerServicesRelationships.RESOURCE_GROUP_HAS_CLUSTER._type,
      ),
    ).toMatchDirectRelationshipSchema({
      schema: {
        properties: {
          _class: { const: 'HAS' },
          _type: {
            const: 'azure_resource_group_has_container_services_cluster',
          },
        },
      },
    });

    expect(
      context.jobState.collectedRelationships.filter(
        (e) =>
          e._type ===
          ContainerServicesRelationships.CLUSTER_HAS_NODE_POOL._type,
      ),
    ).toMatchDirectRelationshipSchema({
      schema: {
        properties: {
          _class: { const: 'HAS' },
          _type: { const: 'azure_container_services_cluster_has_node_pool' },
        },
      },
    });
  },
  1000 * 10,
);
