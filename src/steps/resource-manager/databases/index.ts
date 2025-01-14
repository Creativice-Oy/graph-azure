import { STEP_AD_ACCOUNT } from '../../active-directory/constants';
import {
  STEP_RM_DATABASE_MARIADB_DATABASES,
  STEP_RM_DATABASE_MYSQL_DATABASES,
} from './constants';
import { fetchMariaDBDatabases } from './mariadb';
import { MariaDBEntities, MariaDBRelationships } from './mariadb/constants';
import { fetchMySQLDatabases } from './mysql';
import { MySQLEntities, MySQLRelationships } from './mysql/constants';
import { postgreSqlSteps } from './postgresql';
import { sqlSteps } from './sql';
import {
  Step,
  IntegrationStepExecutionContext,
} from '@jupiterone/integration-sdk-core';
import { IntegrationConfig } from '../../../types';
import { STEP_RM_RESOURCES_RESOURCE_GROUPS } from '../resources/constants';
import {
  diagnosticSettingsEntitiesForResource,
  getDiagnosticSettingsRelationshipsForResource,
} from '../utils/createDiagnosticSettingsEntitiesAndRelationshipsForResource';

export const databaseSteps: Step<
  IntegrationStepExecutionContext<IntegrationConfig>
>[] = [
  {
    id: STEP_RM_DATABASE_MARIADB_DATABASES,
    name: 'MariaDB Databases',
    entities: [
      MariaDBEntities.SERVER,
      MariaDBEntities.DATABASE,
      ...diagnosticSettingsEntitiesForResource,
    ],
    relationships: [
      MariaDBRelationships.RESOURCE_GROUP_HAS_MARIADB_SERVER,
      MariaDBRelationships.MARIADB_SERVER_HAS_MARIADB_DATABASE,
      ...getDiagnosticSettingsRelationshipsForResource(MariaDBEntities.SERVER),
    ],
    dependsOn: [STEP_AD_ACCOUNT, STEP_RM_RESOURCES_RESOURCE_GROUPS],
    executionHandler: fetchMariaDBDatabases,
  },
  {
    id: STEP_RM_DATABASE_MYSQL_DATABASES,
    name: 'MySQL Databases',
    entities: [
      MySQLEntities.SERVER,
      MySQLEntities.DATABASE,
      ...diagnosticSettingsEntitiesForResource,
    ],
    relationships: [
      MySQLRelationships.RESOURCE_GROUP_HAS_MYSQL_SERVER,
      MySQLRelationships.MYSQL_SERVER_HAS_MYSQL_DATABASE,
      ...getDiagnosticSettingsRelationshipsForResource(MySQLEntities.SERVER),
    ],
    dependsOn: [STEP_AD_ACCOUNT, STEP_RM_RESOURCES_RESOURCE_GROUPS],
    executionHandler: fetchMySQLDatabases,
  },
  ...postgreSqlSteps,
  ...sqlSteps,
];
