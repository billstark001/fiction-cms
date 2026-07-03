import { useMemo, useState } from 'react';
import type { EvaluationIssue, FieldHint, JsonSchema, Locale, SchemaAssetOption } from './types';
import { isLocalizedSchema, isRecord, localizedValue, normalizePath, schemaDefault, titleCase, unwrapSchema } from './schema-utils';

interface SchemaFieldProps {
  schema: JsonSchema;
  path?: string;
  value: unknown;
  hints?: Record<string, FieldHint>;
  assets?: SchemaAssetOption[];
  issues?: Record<string, EvaluationIssue[]>;
  locale?: Locale;
  onChange: (value: unknown) => void;
}

const fieldStyle = {
  display: 'grid',
  gap: 6,
  marginBottom: 14,
} satisfies React.CSSProperties;

const sectionStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 12,
  marginBottom: 14,
  background: '#ffffff',
} satisfies React.CSSProperties;

const inputStyle = {
  border: '1px solid #d1d5db',
  borderRadius: 6,
  padding: '8px 10px',
  minWidth: 0,
  width: '100%',
} satisfies React.CSSProperties;

export function SchemaField({
  assets = [],
  hints = {},
  issues = {},
  locale = 'en',
  onChange,
  path = '',
  schema,
  value,
}: SchemaFieldProps) {
  const unwrapped = unwrapSchema(schema);
  const hint = hints[path] || hints[normalizePath(path)] || {};
  const props = unwrapped.properties || {};
  const label = localizedValue(hint.label, locale) || titleCase(path.split('.').pop() || 'Content');
  const tooltip = localizedValue(hint.tooltip, locale);
  const pathIssues = issues[path] || [];
  const isAssetRef = hint.widget === 'assetRef' || Boolean(props.assetId && props.url);

  if (isLocalizedSchema(unwrapped)) {
    const current = isRecord(value) ? value : { en: '', zh: '', ja: '', fr: '' };
    return (
      <section style={sectionStyle}>
        <FieldHeading label={label} tooltip={tooltip} />
        <FieldIssues issues={pathIssues} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {['en', 'zh', 'ja', 'fr'].map((fieldLocale) => (
            <label key={fieldLocale} style={fieldStyle}>
              <span>{fieldLocale.toUpperCase()}</span>
              {hint.widget === 'textarea' ? (
                <textarea style={inputStyle} value={String(current[fieldLocale] || '')} onChange={(event) => onChange({ ...current, [fieldLocale]: event.target.value })} />
              ) : (
                <input style={inputStyle} value={String(current[fieldLocale] || '')} onChange={(event) => onChange({ ...current, [fieldLocale]: event.target.value })} />
              )}
              <FieldIssues issues={issues[`${path}.${fieldLocale}`] || []} />
            </label>
          ))}
        </div>
      </section>
    );
  }

  if (isAssetRef) {
    const current = isRecord(value) ? value : { assetId: '', url: '', alt: { en: '', zh: '', ja: '', fr: '' } };
    const allowedKinds = hint.assetKinds || ['image', 'video', 'audio', 'document', 'binary'];
    const choices = assets.filter((asset) => allowedKinds.includes(asset.kind));
    return (
      <section style={sectionStyle}>
        <FieldHeading label={label} tooltip={tooltip} />
        <FieldIssues issues={pathIssues} />
        <label style={fieldStyle}>
          <span>Library asset</span>
          <select style={inputStyle} value={String(current.assetId || '')} onChange={(event) => onChange({ ...current, assetId: event.target.value })}>
            <option value="">Select asset</option>
            {choices.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.kind}: {asset.label || asset.publicUrl || asset.id}
              </option>
            ))}
          </select>
        </label>
        <label style={fieldStyle}>
          <span>External URL</span>
          <input style={inputStyle} type="url" value={String(current.url || '')} onChange={(event) => onChange({ ...current, url: event.target.value })} />
        </label>
        {props.alt ? (
          <SchemaField assets={assets} hints={hints} issues={issues} locale={locale} onChange={(next) => onChange({ ...current, alt: next })} path={`${path}.alt`} schema={props.alt} value={current.alt} />
        ) : null}
      </section>
    );
  }

  if (unwrapped.type === 'array') {
    const items = Array.isArray(value) ? value : [];
    return (
      <section style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <FieldHeading label={label} tooltip={tooltip} />
          <button type="button" onClick={() => onChange([...items, schemaDefault(unwrapped.items || {}, `${path}.${items.length}`, hints)])}>
            Add
          </button>
        </div>
        <FieldIssues issues={pathIssues} />
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map((item, index) => (
            <ArrayItem
              assets={assets}
              hints={hints}
              index={index}
              issues={issues}
              item={item}
              items={items}
              key={index}
              locale={locale}
              onChange={onChange}
              path={path}
              schema={unwrapped.items || {}}
            />
          ))}
        </div>
      </section>
    );
  }

  if (unwrapped.type === 'object' || unwrapped.properties) {
    const current = isRecord(value) ? value : {};
    const isRoot = path === '';
    return (
      <section style={isRoot ? undefined : sectionStyle}>
        {!isRoot ? <FieldHeading label={label} tooltip={tooltip} /> : null}
        <FieldIssues issues={pathIssues} />
        {Object.entries(props).map(([key, child]) => (
          <SchemaField
            assets={assets}
            hints={hints}
            issues={issues}
            key={key}
            locale={locale}
            onChange={(nextValue) => onChange({ ...current, [key]: nextValue })}
            path={path ? `${path}.${key}` : key}
            schema={child}
            value={current[key]}
          />
        ))}
      </section>
    );
  }

  if (unwrapped.enum || hint.options) {
    const options = hint.options?.map((item) => item.value) || unwrapped.enum || [];
    return (
      <label style={fieldStyle}>
        <FieldLabel label={label} tooltip={tooltip} />
        <select style={inputStyle} value={String(value ?? options[0] ?? '')} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option key={option} value={option}>
              {hint.options?.find((item) => item.value === option)?.label || titleCase(option)}
            </option>
          ))}
        </select>
        <FieldIssues issues={pathIssues} />
      </label>
    );
  }

  if (unwrapped.type === 'boolean') {
    return (
      <label style={{ ...fieldStyle, display: 'flex', alignItems: 'center' }}>
        <input checked={Boolean(value)} type="checkbox" onChange={(event) => onChange(event.target.checked)} />
        <FieldLabel label={label} tooltip={tooltip} />
        <FieldIssues issues={pathIssues} />
      </label>
    );
  }

  if (unwrapped.type === 'number' || unwrapped.type === 'integer') {
    return (
      <label style={fieldStyle}>
        <FieldLabel label={label} tooltip={tooltip} />
        <input style={inputStyle} type="number" value={typeof value === 'number' ? value : ''} onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))} />
        <FieldIssues issues={pathIssues} />
      </label>
    );
  }

  const inputType = hint.widget === 'color' ? 'color' : hint.widget === 'url' || unwrapped.format === 'uri' || /href|url/i.test(path) ? 'url' : 'text';
  const useTextarea = hint.widget === 'textarea' || /note|summary|description|body|content/i.test(path);
  return (
    <label style={fieldStyle}>
      <FieldLabel label={label} tooltip={tooltip} />
      {useTextarea ? (
        <textarea style={{ ...inputStyle, minHeight: 88 }} value={String(value || '')} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input style={inputStyle} type={inputType} value={String(value || '')} onChange={(event) => onChange(event.target.value)} />
      )}
      <FieldIssues issues={pathIssues} />
    </label>
  );
}

interface ArrayItemProps {
  assets: SchemaAssetOption[];
  hints: Record<string, FieldHint>;
  index: number;
  issues: Record<string, EvaluationIssue[]>;
  item: unknown;
  items: unknown[];
  locale: Locale;
  onChange: (value: unknown) => void;
  path: string;
  schema: JsonSchema;
}

function ArrayItem({ assets, hints, index, issues, item, items, locale, onChange, path, schema }: ArrayItemProps) {
  const [expanded, setExpanded] = useState(true);
  const itemPath = `${path}.${index}`;
  const title = useMemo(() => `Item ${index + 1}`, [index]);
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
        <strong>{title}</strong>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => setExpanded(!expanded)}>{expanded ? 'Collapse' : 'Expand'}</button>
          <button type="button" disabled={index === 0} onClick={() => {
            const next = [...items];
            [next[index - 1], next[index]] = [next[index], next[index - 1]];
            onChange(next);
          }}>Up</button>
          <button type="button" disabled={index === items.length - 1} onClick={() => {
            const next = [...items];
            [next[index + 1], next[index]] = [next[index], next[index + 1]];
            onChange(next);
          }}>Down</button>
          <button type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
        </div>
      </div>
      {expanded ? <SchemaField assets={assets} hints={hints} issues={issues} locale={locale} onChange={(nextItem) => onChange(items.map((oldItem, itemIndex) => (itemIndex === index ? nextItem : oldItem)))} path={itemPath} schema={schema} value={item} /> : null}
    </div>
  );
}

function FieldHeading({ label, tooltip }: { label: string; tooltip?: string }) {
  return (
    <h3 style={{ fontSize: 13, margin: '0 0 8px', color: '#111827' }}>
      {label} {tooltip ? <small style={{ color: '#6b7280', fontWeight: 400 }}>{tooltip}</small> : null}
    </h3>
  );
}

function FieldLabel({ label, tooltip }: { label: string; tooltip?: string }) {
  return (
    <span>
      {label} {tooltip ? <small style={{ color: '#6b7280' }}>{tooltip}</small> : null}
    </span>
  );
}

function FieldIssues({ issues }: { issues: EvaluationIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      {issues.map((issue, index) => (
        <p key={`${issue.path}-${index}`} style={{ color: issue.severity === 'error' ? '#b91c1c' : issue.severity === 'warning' ? '#92400e' : '#2563eb', margin: 0, fontSize: 12 }}>
          <strong>{issue.severity}</strong>: {issue.message}
        </p>
      ))}
    </div>
  );
}
