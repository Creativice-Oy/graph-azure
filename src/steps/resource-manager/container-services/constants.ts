import { RelationshipClass } from '@jupiterone/data-model';
import { createResourceGroupResourceRelationshipMetadata } from '../utils/createResourceGroupResourceRelationship';

export const STEP_RM_CONTAINER_SERVICES_CLUSTERS =
  'rm-container-services-clusters';

export const ContainerServicesEntities = {
  CLUSTER: {
    _type: 'azure_container_services_cluster',
    _class: ['Cluster'],
    resourceName: '[RM] Container Services Cluster',
  },
  NODE_POOL: {
    _type: 'azure_container_services_node_pool',
    _class: ['Group'],
    resourceName: '[RM] Container Services Node Pool',
  },
};

export const ContainerServicesRelationships = {
  RESOURCE_GROUP_HAS_CLUSTER: createResourceGroupResourceRelationshipMetadata(
    ContainerServicesEntities.CLUSTER._type,
  ),
  CLUSTER_HAS_NODE_POOL: {
    _type: 'azure_container_services_cluster_has_node_pool',
    _class: RelationshipClass.HAS,
    sourceType: ContainerServicesEntities.CLUSTER._type,
    targetType: ContainerServicesEntities.NODE_POOL._type,
  },
};
