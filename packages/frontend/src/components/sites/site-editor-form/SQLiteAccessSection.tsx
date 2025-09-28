import type { FC } from 'react';
import { useFieldArray } from 'react-hook-form';
import type { Control, UseFieldArrayReturn, UseFormRegister } from 'react-hook-form';
import clsx from 'clsx';
import type { SiteFormValues } from './types';
import {
  createEmptySQLiteFile,
  createEmptySQLiteTable,
  emptyKeyValueField,
  emptyValueField,
  primaryKeyOptions
} from './utils';
import * as formStyles from '../../../styles/forms.css';
import * as siteEditorStyles from '../SiteEditorForm.css';

interface SQLiteAccessSectionProps {
  control: Control<SiteFormValues>;
  register: UseFormRegister<SiteFormValues>;
  sqliteFilesArray: UseFieldArrayReturn<SiteFormValues, 'sqliteFiles', 'id'>;
}

interface SQLiteTableFieldsProps {
  control: Control<SiteFormValues>;
  register: UseFormRegister<SiteFormValues>;
  fileIndex: number;
  tableIndex: number;
  onRemove: () => void;
}

const SQLiteTableFields: FC<SQLiteTableFieldsProps> = ({ control, register, fileIndex, tableIndex, onRemove }) => {
  const editableColumnsArray = useFieldArray({
    control,
    name: `sqliteFiles.${fileIndex}.editableTables.${tableIndex}.editableColumns` as const
  });

  const readableColumnsArray = useFieldArray({
    control,
    name: `sqliteFiles.${fileIndex}.editableTables.${tableIndex}.readableColumns` as const
  });

  const defaultValuesArray = useFieldArray({
    control,
    name: `sqliteFiles.${fileIndex}.editableTables.${tableIndex}.defaultValues` as const
  });

  return (
    <div className={siteEditorStyles.arrayItem}>
      <div className={siteEditorStyles.arrayItemHeader}>
        <div className={siteEditorStyles.arrayItemTitle}>
          <h5 className={siteEditorStyles.arrayItemHeading}>Table #{tableIndex + 1}</h5>
          <p className={siteEditorStyles.arrayItemSubtitle}>Configure editable access for this table</p>
        </div>
        <button
          type="button"
          className={clsx(formStyles.outlineButton, formStyles.smallButton)}
          onClick={onRemove}
        >
          Remove table
        </button>
      </div>

      <div className={siteEditorStyles.arrayItemBody}>
        <div className={siteEditorStyles.grid}>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Table name</label>
            <input
              className={formStyles.input}
              placeholder="e.g. posts"
              {...register(`sqliteFiles.${fileIndex}.editableTables.${tableIndex}.tableName`, {
                required: 'Table name is required'
              })}
            />
          </div>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Display name</label>
            <input
              className={formStyles.input}
              placeholder="Human friendly name"
              {...register(`sqliteFiles.${fileIndex}.editableTables.${tableIndex}.displayName`)}
            />
          </div>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Primary key strategy</label>
            <select
              className={formStyles.select}
              {...register(`sqliteFiles.${fileIndex}.editableTables.${tableIndex}.primaryKeyStrategy`)}
            >
              {primaryKeyOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={siteEditorStyles.nestedList}>
          <div>
            <div className={siteEditorStyles.arrayItemHeader}>
              <h6 className={siteEditorStyles.arrayItemHeading}>Editable columns</h6>
              <button
                type="button"
                className={clsx(formStyles.outlineButton, formStyles.smallButton)}
                onClick={() => editableColumnsArray.append(emptyValueField())}
              >
                Add column
              </button>
            </div>
            {editableColumnsArray.fields.length === 0 && (
              <div className={siteEditorStyles.emptyState}>Leave empty to allow editing all columns.</div>
            )}
            {editableColumnsArray.fields.map((column, columnIndex) => (
              <div key={column.id} className={siteEditorStyles.inlineInputs}>
                <input
                  className={formStyles.input}
                  placeholder="column_name"
                  {...register(
                    `sqliteFiles.${fileIndex}.editableTables.${tableIndex}.editableColumns.${columnIndex}.value`
                  )}
                />
                <button
                  type="button"
                  className={clsx(formStyles.secondaryButton, formStyles.smallButton)}
                  onClick={() => editableColumnsArray.remove(columnIndex)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div>
            <div className={siteEditorStyles.arrayItemHeader}>
              <h6 className={siteEditorStyles.arrayItemHeading}>Readable columns</h6>
              <button
                type="button"
                className={clsx(formStyles.outlineButton, formStyles.smallButton)}
                onClick={() => readableColumnsArray.append(emptyValueField())}
              >
                Add column
              </button>
            </div>
            {readableColumnsArray.fields.length === 0 && (
              <div className={siteEditorStyles.emptyState}>Leave empty to allow reading all columns.</div>
            )}
            {readableColumnsArray.fields.map((column, columnIndex) => (
              <div key={column.id} className={siteEditorStyles.inlineInputs}>
                <input
                  className={formStyles.input}
                  placeholder="column_name"
                  {...register(
                    `sqliteFiles.${fileIndex}.editableTables.${tableIndex}.readableColumns.${columnIndex}.value`
                  )}
                />
                <button
                  type="button"
                  className={clsx(formStyles.secondaryButton, formStyles.smallButton)}
                  onClick={() => readableColumnsArray.remove(columnIndex)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div>
            <div className={siteEditorStyles.arrayItemHeader}>
              <h6 className={siteEditorStyles.arrayItemHeading}>Default values</h6>
              <button
                type="button"
                className={clsx(formStyles.outlineButton, formStyles.smallButton)}
                onClick={() => defaultValuesArray.append(emptyKeyValueField())}
              >
                Add default pair
              </button>
            </div>
            {defaultValuesArray.fields.length === 0 && (
              <div className={siteEditorStyles.emptyState}>
                Optional key/value pairs used when creating new rows.
              </div>
            )}
            {defaultValuesArray.fields.map((pair, pairIndex) => (
              <div key={pair.id} className={siteEditorStyles.keyValueRow}>
                <input
                  className={formStyles.input}
                  placeholder="Column key"
                  {...register(
                    `sqliteFiles.${fileIndex}.editableTables.${tableIndex}.defaultValues.${pairIndex}.key`
                  )}
                />
                <div className={siteEditorStyles.inlineInputs}>
                  <input
                    className={formStyles.input}
                    placeholder="Value"
                    {...register(
                      `sqliteFiles.${fileIndex}.editableTables.${tableIndex}.defaultValues.${pairIndex}.value`
                    )}
                  />
                  <button
                    type="button"
                    className={clsx(formStyles.secondaryButton, formStyles.smallButton)}
                    onClick={() => defaultValuesArray.remove(pairIndex)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface SQLiteFileFieldsProps {
  control: Control<SiteFormValues>;
  register: UseFormRegister<SiteFormValues>;
  fileIndex: number;
  onRemove: () => void;
}

const SQLiteFileFields: FC<SQLiteFileFieldsProps> = ({ control, register, fileIndex, onRemove }) => {
  const tablesArray = useFieldArray({
    control,
    name: `sqliteFiles.${fileIndex}.editableTables` as const
  });

  return (
    <div className={siteEditorStyles.arrayItem}>
      <div className={siteEditorStyles.arrayItemHeader}>
        <div className={siteEditorStyles.arrayItemTitle}>
          <h4 className={siteEditorStyles.arrayItemHeading}>SQLite file #{fileIndex + 1}</h4>
          <p className={siteEditorStyles.arrayItemSubtitle}>Define which tables are editable in this file.</p>
        </div>
        <button
          type="button"
          className={clsx(formStyles.outlineButton, formStyles.smallButton)}
          onClick={onRemove}
        >
          Remove file
        </button>
      </div>

      <div className={siteEditorStyles.arrayItemBody}>
        <div className={formStyles.formGroup}>
          <label className={formStyles.label}>SQLite file path</label>
          <input
            className={formStyles.input}
            placeholder="e.g. data/content.db or data/*.db"
            {...register(`sqliteFiles.${fileIndex}.filePath`, {
              required: 'SQLite file path is required'
            })}
          />
        </div>

        <div className={siteEditorStyles.nestedList}>
          {tablesArray.fields.length === 0 && (
            <div className={siteEditorStyles.emptyState}>
              Add at least one table configuration for this file.
            </div>
          )}

          {tablesArray.fields.map((table, tableIndex) => (
            <SQLiteTableFields
              key={table.id}
              control={control}
              register={register}
              fileIndex={fileIndex}
              tableIndex={tableIndex}
              onRemove={() => tablesArray.remove(tableIndex)}
            />
          ))}

          <button
            type="button"
            className={clsx(formStyles.primaryButton, formStyles.smallButton)}
            onClick={() => tablesArray.append(createEmptySQLiteTable())}
          >
            Add table
          </button>
        </div>
      </div>
    </div>
  );
};

export const SQLiteAccessSection: FC<SQLiteAccessSectionProps> = ({ control, register, sqliteFilesArray }) => (
  <div className={siteEditorStyles.section}>
    <div className={siteEditorStyles.sectionHeader}>
      <h3 className={siteEditorStyles.sectionTitle}>SQLite access</h3>
      <p className={siteEditorStyles.sectionDescription}>
        Allow editors to manage data stored in SQLite databases with table-level controls.
      </p>
    </div>
    <div className={siteEditorStyles.sectionBody}>
      {sqliteFilesArray.fields.length === 0 && (
        <div className={siteEditorStyles.emptyState}>
          No SQLite files configured yet. Add one to expose structured content editing.
        </div>
      )}

      {sqliteFilesArray.fields.map((field, index) => (
        <SQLiteFileFields
          key={field.id}
          control={control}
          register={register}
          fileIndex={index}
          onRemove={() => sqliteFilesArray.remove(index)}
        />
      ))}

      <button
        type="button"
        className={formStyles.primaryButton}
        onClick={() => sqliteFilesArray.append(createEmptySQLiteFile())}
      >
        Add SQLite file
      </button>
    </div>
  </div>
);
