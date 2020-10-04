import { AzureWebLinker } from '../../../azure';
import {
  convertProperties,
  createIntegrationEntity,
  Entity,
} from '@jupiterone/integration-sdk-core';
import { ContainerGroup } from '@azure/arm-containerinstance/esm/models';
import { ContainerWithId, VolumeWithId } from './types';
import { ContainerInstanceEntities } from './contants';

export function createContainerGroupEntity(
  webLinker: AzureWebLinker,
  data: ContainerGroup,
): Entity {
  return createIntegrationEntity({
    entityData: {
      source: data,
      assign: {
        ...convertProperties(data),
        _key: data.id,
        _type: ContainerInstanceEntities.CONTAINER_GROUP._type,
        _class: ContainerInstanceEntities.CONTAINER_GROUP._class,
        id: data.id,
        name: data.name,
        webLink: webLinker.portalResourceUrl(data.id),
      },
    },
  });
}

export function createContainerEntity(data: ContainerWithId): Entity {
  /**
   * NOTE: We pull the id off so that it is not recorded as raw data.
   * Azure does not assign an id to Containers in a Container Group, so we create it.
   * This is also why we are not attaching a webLink to the Container Entity
   */
  const { id, ...container } = data;
  return createIntegrationEntity({
    entityData: {
      source: container,
      assign: {
        ...convertProperties(container),
        _key: id,
        _type: ContainerInstanceEntities.CONTAINER._type,
        _class: ContainerInstanceEntities.CONTAINER._class,
        id: id,
        name: container.name,
        image: container.image,
      },
    },
  });
}

export function createVolumeEntity(data: VolumeWithId): Entity {
  /**
   * NOTE: We pull the id off so that it is not recorded as raw data.
   * Azure does not assign an id to Volumes in a Container Group, so we create it.
   * This is also why we are not attaching a webLink to the Volume Entity
   */
  const { id, ...volume } = data;
  return createIntegrationEntity({
    entityData: {
      source: volume,
      assign: {
        ...convertProperties(volume),
        _key: id,
        _type: ContainerInstanceEntities.VOLUME._type,
        _class: ContainerInstanceEntities.VOLUME._class,
        id: id,
        name: volume.name,
        classification: null,
        /**
         * While all Azure Storage options store data encrypted at rest, you can point your volume to an external source which may not be encrypted
         * https://docs.microsoft.com/en-us/azure/storage/common/storage-service-encryption
         * https://docs.microsoft.com/en-us/azure/container-instances/container-instances-container-groups#storage
         */
        encrypted: null,
      },
    },
  });
}
