import {
  createDirectRelationship,
  IntegrationStepExecutionContext,
  Step,
} from '@jupiterone/integration-sdk-core';
import { createAzureWebLinker } from '../../../azure';
import { IntegrationConfig, IntegrationStepContext } from '../../../types';
import { getAccountEntity, STEP_AD_ACCOUNT } from '../../active-directory';
import createResourceGroupResourceRelationship from '../utils/createResourceGroupResourceRelationship';
import { ContainerServicesClient } from './client';
import {
  ContainerServicesEntities,
  ContainerServicesRelationships,
  STEP_RM_CONTAINER_SERVICES_CLUSTERS,
} from './constants';
import { createClusterEntitiy, createNodePoolEntity } from './converters';
import { RelationshipClass } from '@jupiterone/data-model';

export async function fetchClusters(
  executionContext: IntegrationStepContext,
): Promise<void> {
  const { instance, logger, jobState } = executionContext;
  const accountEntity = await getAccountEntity(jobState);
  const webLinker = createAzureWebLinker(accountEntity.defaultDomain as string);
  const client = new ContainerServicesClient(instance.config, logger);

  await client.iterateClusters(async (cluster) => {
    const clusterEntity = createClusterEntitiy(webLinker, cluster);
    await jobState.addEntity(clusterEntity);

    cluster.agentPoolProfiles?.map(async (agentPoolProfile) => {
      const nodePoolEntity = createNodePoolEntity(webLinker, agentPoolProfile);
      await jobState.addEntity(nodePoolEntity);
      await jobState.addRelationship(
        createDirectRelationship({
          _class: RelationshipClass.HAS,
          from: clusterEntity,
          to: nodePoolEntity,
        }),
      );
    });

    await createResourceGroupResourceRelationship(
      executionContext,
      clusterEntity,
    );
  });
}

export const containerServicesSteps: Step<
  IntegrationStepExecutionContext<IntegrationConfig>
>[] = [
  {
    id: STEP_RM_CONTAINER_SERVICES_CLUSTERS,
    name: 'Fetch Container Services Clusters',
    entities: [
      ContainerServicesEntities.CLUSTER,
      ContainerServicesEntities.NODE_POOL,
    ],
    relationships: [
      ContainerServicesRelationships.RESOURCE_GROUP_HAS_CLUSTER,
      ContainerServicesRelationships.CLUSTER_HAS_NODE_POOL,
    ],
    dependsOn: [STEP_AD_ACCOUNT],
    executionHandler: fetchClusters,
  },
];
