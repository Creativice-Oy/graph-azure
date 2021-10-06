import { Recording } from '@jupiterone/integration-sdk-testing';
import { IntegrationConfig } from '../../../types';
import {
  getMatchRequestsBy,
  setupAzureRecording,
} from '../../../../test/helpers/recording';
import { createMockAzureStepExecutionContext } from '../../../../test/createMockAzureStepExecutionContext';
import {
  ACCOUNT_ENTITY_TYPE,
  fetchGroups,
  fetchServicePrincipals,
  fetchUsers,
  GROUP_ENTITY_TYPE,
  SERVICE_PRINCIPAL_ENTITY_TYPE,
  USER_ENTITY_TYPE,
} from '../../active-directory';
import { buildKeyVaultAccessPolicyRelationships, fetchKeyVaults } from '.';
import {
  ACCOUNT_KEY_VAULT_RELATIONSHIP_TYPE,
  KeyVaultEntities,
  KEY_VAULT_SERVICE_ENTITY_CLASS,
} from './constants';
import { configFromEnv } from '../../../../test/integrationInstanceConfig';
import { getMockAccountEntity } from '../../../../test/helpers/getMockEntity';
import { RESOURCE_GROUP_RESOURCE_RELATIONSHIP_CLASS } from '../utils/createResourceGroupResourceRelationship';

let recording: Recording;

describe('step = key vaults', () => {
  afterAll(async () => {
    if (recording) {
      await recording.stop();
    }
  });

  it('should collect an Azure Key Vault entity', async () => {
    recording = setupAzureRecording({
      directory: __dirname,
      name: 'resource-manager-step-key-vaults',
      options: {
        matchRequestsBy: getMatchRequestsBy({
          config: configFromEnv,
        }),
      },
    });

    const context = createMockAzureStepExecutionContext({
      instanceConfig: configFromEnv,
      setData: {
        [ACCOUNT_ENTITY_TYPE]: getMockAccountEntity(configFromEnv),
      },
    });

    await fetchKeyVaults(context);

    expect(context.jobState.collectedEntities.length).toBeGreaterThan(0);
    expect(context.jobState.collectedEntities).toMatchGraphObjectSchema({
      _class: KEY_VAULT_SERVICE_ENTITY_CLASS,
    });

    expect(
      context.jobState.collectedRelationships.filter(
        (e) => e._type === ACCOUNT_KEY_VAULT_RELATIONSHIP_TYPE,
      ),
    ).toMatchDirectRelationshipSchema({
      schema: {
        properties: {
          _class: { const: 'HAS' },
          _type: { const: 'azure_account_has_keyvault_service' },
        },
      },
    });

    expect(
      context.jobState.collectedRelationships.filter(
        (e) => e._type === RESOURCE_GROUP_RESOURCE_RELATIONSHIP_CLASS,
      ),
    ).toMatchDirectRelationshipSchema({
      schema: {
        properties: {
          _class: { const: 'HAS' },
          _type: { const: 'azure_resource_group_has_keyvault_service' },
        },
      },
    });
  });
});

describe('rm-keyvault-principal-relationships', () => {
  afterEach(async () => {
    if (recording) {
      await recording.stop();
    }
  });

  async function getSetupEntities(config: IntegrationConfig) {
    const accountEntity = getMockAccountEntity(config);

    const context = createMockAzureStepExecutionContext({
      instanceConfig: config,
      setData: {
        [ACCOUNT_ENTITY_TYPE]: accountEntity,
      },
    });

    await fetchKeyVaults(context);
    const keyVaultEntities = context.jobState.collectedEntities.filter(
      (e) => e._type === KeyVaultEntities.KEY_VAULT._type,
    );
    expect(keyVaultEntities.length).toBeGreaterThan(0);

    await fetchUsers(context);
    const userEntities = context.jobState.collectedEntities.filter(
      (e) => e._type === USER_ENTITY_TYPE,
    );
    expect(userEntities.length).toBeGreaterThan(0);

    await fetchGroups(context);
    const groupEntities = context.jobState.collectedEntities.filter(
      (e) => e._type === GROUP_ENTITY_TYPE,
    );
    expect(groupEntities.length).toBeGreaterThan(0);

    await fetchServicePrincipals(context);
    const servicePrincipalEntities = context.jobState.collectedEntities.filter(
      (e) => e._type === SERVICE_PRINCIPAL_ENTITY_TYPE,
    );
    expect(servicePrincipalEntities.length).toBeGreaterThan(0);

    return {
      keyVaultEntities,
      principals: {
        userEntities,
        groupEntities,
        servicePrincipalEntities,
      },
    };
  }

  test('sucess', async () => {
    recording = setupAzureRecording({
      directory: __dirname,
      name: 'rm-keyvault-principal-relationships',
      options: {
        matchRequestsBy: getMatchRequestsBy({ config: configFromEnv }),
      },
    });

    const { keyVaultEntities, principals } = await getSetupEntities(
      configFromEnv,
    );

    const context = createMockAzureStepExecutionContext({
      instanceConfig: configFromEnv,
      entities: keyVaultEntities,
    });

    await buildKeyVaultAccessPolicyRelationships(context);

    const keyVaultPrincipalMappedRelationships =
      context.jobState.collectedRelationships;

    expect(keyVaultPrincipalMappedRelationships).toTargetEntities([
      ...principals.userEntities,
      ...principals.groupEntities,
      ...principals.servicePrincipalEntities,
    ]);
  }, 10_000);
});
