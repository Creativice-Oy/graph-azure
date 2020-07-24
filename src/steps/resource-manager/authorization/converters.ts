import {
  RoleDefinition,
  PrincipalType,
  RoleAssignment,
} from '@azure/arm-authorization/esm/models';
import {
  Entity,
  Relationship,
  RelationshipDirection,
  convertProperties,
  createIntegrationRelationship,
} from '@jupiterone/integration-sdk-core';

import { AzureWebLinker } from '../../../azure';
import {
  ROLE_DEFINITION_ENTITY_CLASS,
  ROLE_DEFINITION_ENTITY_TYPE,
  getJupiterTypeForPrincipalType,
  ROLE_ASSIGNMENT_RELATIONSHIP_CLASS,
  createRoleAssignmentRelationshipType,
} from './constants';

export function createRoleDefinitionEntity(
  webLinker: AzureWebLinker,
  data: RoleDefinition,
): Entity {
  const entity = {
    ...convertProperties(data),
    _key: data.id as string,
    _type: ROLE_DEFINITION_ENTITY_TYPE,
    _class: ROLE_DEFINITION_ENTITY_CLASS,
    _rawData: [{ name: 'default', rawData: data }],
    displayName: data.roleName,
    description: data.description,
    actions: ([] as string[]).concat(
      ...(data.permissions?.map((p) => p.actions || []) || []),
    ),
    notActions: ([] as string[]).concat(
      ...(data.permissions?.map((p) => p.notActions || []) || []),
    ),
    dataActions: ([] as string[]).concat(
      ...(data.permissions?.map((p) => p.dataActions || []) || []),
    ),
    notDataActions: ([] as string[]).concat(
      ...(data.permissions?.map((p) => p.notDataActions || []) || []),
    ),
    webLink: webLinker.portalResourceUrl(data.id),
  };
  return entity;
}

export function createRoleAssignmentRelationship(
  webLinker: AzureWebLinker,
  roleAssignment: RoleAssignment,
): Relationship {
  const targetType = getJupiterTypeForPrincipalType(
    roleAssignment.principalType as PrincipalType,
  );
  const roleDefinitionKey = (roleAssignment.roleDefinitionId as string).replace(
    roleAssignment.scope as string,
    '',
  );
  return createIntegrationRelationship({
    _class: ROLE_ASSIGNMENT_RELATIONSHIP_CLASS,
    _type: createRoleAssignmentRelationshipType(targetType),
    properties: {
      ...convertProperties(roleAssignment),
      webLink: webLinker.portalResourceUrl(roleAssignment.id),
    },
    _mapping: {
      relationshipDirection: RelationshipDirection.FORWARD,
      sourceEntityKey: roleDefinitionKey,
      targetFilterKeys: ['id'],
      targetEntity: {
        id: roleAssignment.principalId,
      },
      skipTargetCreation: false,
    },
  });
}
