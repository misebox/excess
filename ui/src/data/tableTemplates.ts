import { Column, Index } from '../models/types'

export interface TableTemplate {
  id: string
  name: string
  description: string
  columns: Column[]
  primaryKey?: string[]
  uniqueConstraints?: Index[]
  indexes?: Index[]
}

export const tableTemplates: TableTemplate[] = [
  {
    id: 'master',
    name: 'Master Table (Reference Table)',
    description: 'Static reference data that rarely changes',
    columns: [
      { id: 'col_1', name: 'id', type: 'number', nullable: false },
      { id: 'col_2', name: 'code', type: 'string', nullable: false, comment: 'Unique identifier code' },
      { id: 'col_3', name: 'name', type: 'string', nullable: false, comment: 'Display name' },
      { id: 'col_4', name: 'description', type: 'string', nullable: true, comment: 'Detailed description' },
      { id: 'col_5', name: 'sort_order', type: 'number', nullable: true, defaultValue: '0', comment: 'Display order' },
      { id: 'col_6', name: 'is_active', type: 'boolean', nullable: false, defaultValue: 'true', comment: 'Active flag' },
      { id: 'col_7', name: 'created_at', type: 'datetime', nullable: false, comment: 'Creation timestamp' },
      { id: 'col_8', name: 'updated_at', type: 'datetime', nullable: true, comment: 'Last update timestamp' }
    ],
    primaryKey: ['id'],
    uniqueConstraints: [
      { name: 'idx_code_unique', columns: ['code'], unique: true }
    ],
    indexes: [
      { name: 'idx_is_active', columns: ['is_active'], unique: false }
    ]
  },
  {
    id: 'transaction',
    name: 'Transaction Table',
    description: 'Transactional data with business operations',
    columns: [
      { id: 'col_1', name: 'id', type: 'number', nullable: false },
      { id: 'col_2', name: 'transaction_number', type: 'string', nullable: false, comment: 'Transaction reference number' },
      { id: 'col_3', name: 'transaction_date', type: 'datetime', nullable: false, comment: 'Transaction date and time' },
      { id: 'col_4', name: 'customer_id', type: 'number', nullable: false, comment: 'Reference to customer' },
      { id: 'col_5', name: 'amount', type: 'number', nullable: false, comment: 'Transaction amount' },
      { id: 'col_6', name: 'currency', type: 'string', nullable: false, defaultValue: 'USD', comment: 'Currency code' },
      { id: 'col_7', name: 'status', type: 'string', nullable: false, comment: 'Transaction status' },
      { id: 'col_8', name: 'notes', type: 'string', nullable: true, comment: 'Additional notes' },
      { id: 'col_9', name: 'created_by', type: 'number', nullable: false, comment: 'User who created the record' },
      { id: 'col_10', name: 'created_at', type: 'datetime', nullable: false, comment: 'Creation timestamp' },
      { id: 'col_11', name: 'modified_by', type: 'number', nullable: true, comment: 'User who last modified' },
      { id: 'col_12', name: 'modified_at', type: 'datetime', nullable: true, comment: 'Last modification timestamp' }
    ],
    primaryKey: ['id'],
    uniqueConstraints: [
      { name: 'idx_transaction_number_unique', columns: ['transaction_number'], unique: true }
    ],
    indexes: [
      { name: 'idx_customer_id', columns: ['customer_id'], unique: false },
      { name: 'idx_transaction_date', columns: ['transaction_date'], unique: false },
      { name: 'idx_status', columns: ['status'], unique: false }
    ]
  },
  {
    id: 'history',
    name: 'History Table / Event Table',
    description: 'Immutable event log or history tracking',
    columns: [
      { id: 'col_1', name: 'id', type: 'number', nullable: false },
      { id: 'col_2', name: 'entity_type', type: 'string', nullable: false, comment: 'Type of entity' },
      { id: 'col_3', name: 'entity_id', type: 'number', nullable: false, comment: 'ID of the entity' },
      { id: 'col_4', name: 'event_type', type: 'string', nullable: false, comment: 'Type of event' },
      { id: 'col_5', name: 'event_timestamp', type: 'datetime', nullable: false, comment: 'When the event occurred' },
      { id: 'col_6', name: 'old_value', type: 'json', nullable: true, comment: 'Previous value (JSON)' },
      { id: 'col_7', name: 'new_value', type: 'json', nullable: true, comment: 'New value (JSON)' },
      { id: 'col_8', name: 'metadata', type: 'json', nullable: true, comment: 'Additional event metadata' },
      { id: 'col_9', name: 'user_id', type: 'number', nullable: true, comment: 'User who triggered the event' },
      { id: 'col_10', name: 'ip_address', type: 'string', nullable: true, comment: 'IP address of the request' },
      { id: 'col_11', name: 'user_agent', type: 'string', nullable: true, comment: 'Browser/client information' }
    ],
    primaryKey: ['id'],
    indexes: [
      { name: 'idx_entity', columns: ['entity_type', 'entity_id'], unique: false },
      { name: 'idx_event_timestamp', columns: ['event_timestamp'], unique: false },
      { name: 'idx_event_type', columns: ['event_type'], unique: false }
    ]
  },
  {
    id: 'association',
    name: 'Association Table (Many-to-Many)',
    description: 'Junction table for many-to-many relationships',
    columns: [
      { id: 'col_1', name: 'id', type: 'number', nullable: false },
      { id: 'col_2', name: 'left_entity_id', type: 'number', nullable: false, comment: 'First entity reference' },
      { id: 'col_3', name: 'right_entity_id', type: 'number', nullable: false, comment: 'Second entity reference' },
      { id: 'col_4', name: 'relationship_type', type: 'string', nullable: true, comment: 'Type of relationship' },
      { id: 'col_5', name: 'sort_order', type: 'number', nullable: true, defaultValue: '0', comment: 'Display order' },
      { id: 'col_6', name: 'attributes', type: 'json', nullable: true, comment: 'Additional relationship attributes' },
      { id: 'col_7', name: 'valid_from', type: 'date', nullable: true, comment: 'Relationship start date' },
      { id: 'col_8', name: 'valid_to', type: 'date', nullable: true, comment: 'Relationship end date' },
      { id: 'col_9', name: 'created_at', type: 'datetime', nullable: false, comment: 'Creation timestamp' }
    ],
    primaryKey: ['id'],
    uniqueConstraints: [
      { name: 'idx_unique_pair', columns: ['left_entity_id', 'right_entity_id'], unique: true }
    ],
    indexes: [
      { name: 'idx_left_entity', columns: ['left_entity_id'], unique: false },
      { name: 'idx_right_entity', columns: ['right_entity_id'], unique: false }
    ]
  },
  {
    id: 'hierarchy',
    name: 'Hierarchy Table',
    description: 'Self-referential table for tree structures',
    columns: [
      { id: 'col_1', name: 'id', type: 'number', nullable: false },
      { id: 'col_2', name: 'parent_id', type: 'number', nullable: true, comment: 'Parent node reference' },
      { id: 'col_3', name: 'name', type: 'string', nullable: false, comment: 'Node name' },
      { id: 'col_4', name: 'path', type: 'string', nullable: true, comment: 'Full path from root' },
      { id: 'col_5', name: 'level', type: 'number', nullable: false, defaultValue: '0', comment: 'Depth in hierarchy' },
      { id: 'col_6', name: 'sort_order', type: 'number', nullable: true, defaultValue: '0', comment: 'Order among siblings' },
      { id: 'col_7', name: 'is_leaf', type: 'boolean', nullable: false, defaultValue: 'true', comment: 'Leaf node indicator' },
      { id: 'col_8', name: 'metadata', type: 'json', nullable: true, comment: 'Additional node data' },
      { id: 'col_9', name: 'created_at', type: 'datetime', nullable: false, comment: 'Creation timestamp' },
      { id: 'col_10', name: 'updated_at', type: 'datetime', nullable: true, comment: 'Last update timestamp' }
    ],
    primaryKey: ['id'],
    indexes: [
      { name: 'idx_parent_id', columns: ['parent_id'], unique: false },
      { name: 'idx_path', columns: ['path'], unique: false },
      { name: 'idx_level', columns: ['level'], unique: false }
    ]
  },
  {
    id: 'audit',
    name: 'Audit Table',
    description: 'Comprehensive audit trail for data changes',
    columns: [
      { id: 'col_1', name: 'id', type: 'number', nullable: false },
      { id: 'col_2', name: 'table_name', type: 'string', nullable: false, comment: 'Table being audited' },
      { id: 'col_3', name: 'record_id', type: 'string', nullable: false, comment: 'Primary key of audited record' },
      { id: 'col_4', name: 'action', type: 'string', nullable: false, comment: 'INSERT, UPDATE, DELETE' },
      { id: 'col_5', name: 'field_name', type: 'string', nullable: true, comment: 'Changed field name' },
      { id: 'col_6', name: 'old_value', type: 'string', nullable: true, comment: 'Previous value' },
      { id: 'col_7', name: 'new_value', type: 'string', nullable: true, comment: 'New value' },
      { id: 'col_8', name: 'changed_by', type: 'number', nullable: false, comment: 'User who made the change' },
      { id: 'col_9', name: 'changed_at', type: 'datetime', nullable: false, comment: 'Timestamp of change' },
      { id: 'col_10', name: 'change_reason', type: 'string', nullable: true, comment: 'Reason for change' },
      { id: 'col_11', name: 'session_id', type: 'string', nullable: true, comment: 'Session identifier' },
      { id: 'col_12', name: 'request_id', type: 'string', nullable: true, comment: 'Request identifier' }
    ],
    primaryKey: ['id'],
    indexes: [
      { name: 'idx_table_record', columns: ['table_name', 'record_id'], unique: false },
      { name: 'idx_changed_at', columns: ['changed_at'], unique: false },
      { name: 'idx_changed_by', columns: ['changed_by'], unique: false }
    ]
  },
  {
    id: 'queue',
    name: 'Work Table / Queue Table',
    description: 'Queue for background processing or workflows',
    columns: [
      { id: 'col_1', name: 'id', type: 'number', nullable: false },
      { id: 'col_2', name: 'queue_name', type: 'string', nullable: false, comment: 'Queue identifier' },
      { id: 'col_3', name: 'task_type', type: 'string', nullable: false, comment: 'Type of task' },
      { id: 'col_4', name: 'priority', type: 'number', nullable: false, defaultValue: '5', comment: 'Task priority (1-10)' },
      { id: 'col_5', name: 'status', type: 'string', nullable: false, defaultValue: 'pending', comment: 'pending, processing, completed, failed' },
      { id: 'col_6', name: 'payload', type: 'json', nullable: true, comment: 'Task data' },
      { id: 'col_7', name: 'scheduled_at', type: 'datetime', nullable: true, comment: 'When to process' },
      { id: 'col_8', name: 'started_at', type: 'datetime', nullable: true, comment: 'Processing start time' },
      { id: 'col_9', name: 'completed_at', type: 'datetime', nullable: true, comment: 'Processing end time' },
      { id: 'col_10', name: 'retry_count', type: 'number', nullable: false, defaultValue: '0', comment: 'Number of retries' },
      { id: 'col_11', name: 'max_retries', type: 'number', nullable: false, defaultValue: '3', comment: 'Maximum retry attempts' },
      { id: 'col_12', name: 'error_message', type: 'string', nullable: true, comment: 'Last error message' },
      { id: 'col_13', name: 'created_at', type: 'datetime', nullable: false, comment: 'Creation timestamp' }
    ],
    primaryKey: ['id'],
    indexes: [
      { name: 'idx_queue_status', columns: ['queue_name', 'status'], unique: false },
      { name: 'idx_scheduled_at', columns: ['scheduled_at'], unique: false },
      { name: 'idx_priority_status', columns: ['priority', 'status'], unique: false }
    ]
  },
  {
    id: 'config',
    name: 'Configuration Table',
    description: 'Application configuration and settings',
    columns: [
      { id: 'col_1', name: 'id', type: 'number', nullable: false },
      { id: 'col_2', name: 'category', type: 'string', nullable: false, comment: 'Configuration category' },
      { id: 'col_3', name: 'key', type: 'string', nullable: false, comment: 'Configuration key' },
      { id: 'col_4', name: 'value', type: 'string', nullable: true, comment: 'Configuration value' },
      { id: 'col_5', name: 'data_type', type: 'string', nullable: false, defaultValue: 'string', comment: 'string, number, boolean, json' },
      { id: 'col_6', name: 'description', type: 'string', nullable: true, comment: 'Configuration description' },
      { id: 'col_7', name: 'is_encrypted', type: 'boolean', nullable: false, defaultValue: 'false', comment: 'Whether value is encrypted' },
      { id: 'col_8', name: 'is_editable', type: 'boolean', nullable: false, defaultValue: 'true', comment: 'Can be edited at runtime' },
      { id: 'col_9', name: 'updated_by', type: 'number', nullable: true, comment: 'Last updated by user' },
      { id: 'col_10', name: 'created_at', type: 'datetime', nullable: false, comment: 'Creation timestamp' },
      { id: 'col_11', name: 'updated_at', type: 'datetime', nullable: true, comment: 'Last update timestamp' }
    ],
    primaryKey: ['id'],
    uniqueConstraints: [
      { name: 'idx_category_key_unique', columns: ['category', 'key'], unique: true }
    ],
    indexes: [
      { name: 'idx_category', columns: ['category'], unique: false }
    ]
  },
  {
    id: 'state',
    name: 'State Table (Workflow)',
    description: 'State transitions and workflow management',
    columns: [
      { id: 'col_1', name: 'id', type: 'number', nullable: false },
      { id: 'col_2', name: 'entity_type', type: 'string', nullable: false, comment: 'Type of entity' },
      { id: 'col_3', name: 'entity_id', type: 'number', nullable: false, comment: 'Entity reference' },
      { id: 'col_4', name: 'current_state', type: 'string', nullable: false, comment: 'Current state' },
      { id: 'col_5', name: 'previous_state', type: 'string', nullable: true, comment: 'Previous state' },
      { id: 'col_6', name: 'transition_reason', type: 'string', nullable: true, comment: 'Reason for transition' },
      { id: 'col_7', name: 'metadata', type: 'json', nullable: true, comment: 'State-specific data' },
      { id: 'col_8', name: 'transitioned_by', type: 'number', nullable: true, comment: 'User who triggered transition' },
      { id: 'col_9', name: 'transitioned_at', type: 'datetime', nullable: false, comment: 'Transition timestamp' },
      { id: 'col_10', name: 'expires_at', type: 'datetime', nullable: true, comment: 'State expiration time' },
      { id: 'col_11', name: 'created_at', type: 'datetime', nullable: false, comment: 'Creation timestamp' }
    ],
    primaryKey: ['id'],
    indexes: [
      { name: 'idx_entity_state', columns: ['entity_type', 'entity_id', 'current_state'], unique: false },
      { name: 'idx_current_state', columns: ['current_state'], unique: false },
      { name: 'idx_expires_at', columns: ['expires_at'], unique: false }
    ]
  }
]