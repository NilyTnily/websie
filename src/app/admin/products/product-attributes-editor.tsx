"use client";

import { Plus, X } from "lucide-react";
import * as React from "react";

import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";

export type CoreFieldName =
  | "caseMaterial"
  | "caseSizeMm"
  | "gemstone"
  | "metal"
  | "movement"
  | "strapMaterial"
  | "waterResistanceM";

interface FieldSpec {
  fieldName: CoreFieldName;
  label: string;
  placeholder?: string;
  type: "number" | "text";
}

interface AttributeRow {
  fieldName: CoreFieldName | null;
  id: string;
  label: string;
  placeholder?: string;
  type: "number" | "text";
  value: string;
}

const WATCH_CORE_FIELDS: FieldSpec[] = [
  {
    fieldName: "movement",
    label: "Movement",
    placeholder: "Automatic, Hand-Wound, Quartz…",
    type: "text",
  },
  {
    fieldName: "caseMaterial",
    label: "Case Material",
    placeholder: "Steel, Rose Gold…",
    type: "text",
  },
  { fieldName: "caseSizeMm", label: "Case Size (mm)", type: "number" },
  {
    fieldName: "strapMaterial",
    label: "Strap Material",
    placeholder: "Leather, Steel bracelet…",
    type: "text",
  },
  {
    fieldName: "waterResistanceM",
    label: "Water Resistance (m)",
    type: "number",
  },
];

const JEWELRY_CORE_FIELDS: FieldSpec[] = [
  {
    fieldName: "metal",
    label: "Metal",
    placeholder: "18k White Gold…",
    type: "text",
  },
  {
    fieldName: "gemstone",
    label: "Gemstone",
    placeholder: "Diamond, Sapphire…",
    type: "text",
  },
];

const WATCH_SUGGESTIONS = [
  "Dial Color",
  "Case Thickness (mm)",
  "Bezel Material",
  "Crystal",
  "Clasp Type",
  "Power Reserve (hours)",
  "Complications",
  "Box & Papers",
  "Condition",
  "Year of Manufacture",
];

const JEWELRY_SUGGESTIONS = [
  "Metal Purity",
  "Carat Weight",
  "Cut",
  "Color Grade",
  "Clarity",
  "Ring Size",
  "Chain Length",
  "Setting Type",
];

let nextRowId = 0;
function makeRowId(): string {
  nextRowId += 1;
  return `row-${nextRowId}`;
}

function coreRowsFor(
  isJewelry: boolean,
  defaults: Partial<Record<CoreFieldName, null | number | string>>,
): AttributeRow[] {
  const fields = isJewelry ? JEWELRY_CORE_FIELDS : WATCH_CORE_FIELDS;
  return fields.map((field) => ({
    ...field,
    id: makeRowId(),
    value: defaults[field.fieldName]?.toString() ?? "",
  }));
}

interface ProductAttributesEditorProps {
  defaultCoreValues: Partial<Record<CoreFieldName, null | number | string>>;
  defaultSpecs: Record<string, string>;
  isJewelry: boolean;
}

export function ProductAttributesEditor({
  defaultCoreValues,
  defaultSpecs,
  isJewelry,
}: ProductAttributesEditorProps) {
  const [coreRows, setCoreRows] = React.useState<AttributeRow[]>(() =>
    coreRowsFor(isJewelry, defaultCoreValues),
  );
  const [customRows, setCustomRows] = React.useState<AttributeRow[]>(() =>
    Object.entries(defaultSpecs).map(([label, value]) => ({
      fieldName: null,
      id: makeRowId(),
      label,
      type: "text",
      value,
    })),
  );

  const wasJewelry = React.useRef(isJewelry);
  if (wasJewelry.current !== isJewelry) {
    wasJewelry.current = isJewelry;
    setCoreRows(coreRowsFor(isJewelry, {}));
  }

  const suggestions = (
    isJewelry ? JEWELRY_SUGGESTIONS : WATCH_SUGGESTIONS
  ).filter(
    (suggestion) =>
      !customRows.some(
        (row) => row.label.toLowerCase() === suggestion.toLowerCase(),
      ),
  );

  const specsValue = customRows
    .filter((row) => row.label.trim() && row.value.trim())
    .map((row) => `${row.label.trim()}: ${row.value.trim()}`)
    .join("\n");

  return (
    <div className="space-y-4 border-t pt-6">
      <div>
        <h3 className="text-sm font-medium">
          {isJewelry ? "Jewelry attributes" : "Watch attributes"}
        </h3>
        <p className="text-xs text-muted-foreground">
          Add or remove whatever applies to this piece — the highlighted ones
          power the storefront filters.
        </p>
      </div>

      <div className="space-y-3">
        {coreRows.map((row) => (
          <div className="flex items-end gap-2" key={row.id}>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor={row.fieldName ?? row.id}>{row.label}</Label>
              <Input
                id={row.fieldName ?? row.id}
                min={row.type === "number" ? 0 : undefined}
                name={row.fieldName ?? undefined}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setCoreRows((prev) =>
                    prev.map((r) =>
                      r.id === row.id ? { ...r, value: nextValue } : r,
                    ),
                  );
                }}
                placeholder={row.placeholder}
                type={row.type}
                value={row.value}
              />
            </div>
            <Button
              aria-label={`Remove ${row.label}`}
              className="mb-0.5"
              onClick={() =>
                setCoreRows((prev) => prev.filter((r) => r.id !== row.id))
              }
              size="icon"
              type="button"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {customRows.map((row) => (
          <div className="flex items-end gap-2" key={row.id}>
            <div className="w-40 space-y-1.5">
              <Label htmlFor={`${row.id}-label`}>Attribute</Label>
              <Input
                id={`${row.id}-label`}
                onChange={(e) => {
                  const nextLabel = e.target.value;
                  setCustomRows((prev) =>
                    prev.map((r) =>
                      r.id === row.id ? { ...r, label: nextLabel } : r,
                    ),
                  );
                }}
                placeholder="e.g. Dial Color"
                value={row.label}
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor={`${row.id}-value`}>Value</Label>
              <Input
                id={`${row.id}-value`}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setCustomRows((prev) =>
                    prev.map((r) =>
                      r.id === row.id ? { ...r, value: nextValue } : r,
                    ),
                  );
                }}
                value={row.value}
              />
            </div>
            <Button
              aria-label="Remove attribute"
              className="mb-0.5"
              onClick={() =>
                setCustomRows((prev) => prev.filter((r) => r.id !== row.id))
              }
              size="icon"
              type="button"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() =>
            setCustomRows((prev) => [
              ...prev,
              {
                fieldName: null,
                id: makeRowId(),
                label: "",
                type: "text",
                value: "",
              },
            ])
          }
          size="sm"
          type="button"
          variant="outline"
        >
          <Plus className="h-3.5 w-3.5" />
          Add attribute
        </Button>

        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            onClick={() =>
              setCustomRows((prev) => [
                ...prev,
                {
                  fieldName: null,
                  id: makeRowId(),
                  label: suggestion,
                  type: "text",
                  value: "",
                },
              ])
            }
            size="sm"
            type="button"
            variant="ghost"
          >
            <Plus className="h-3.5 w-3.5" />
            {suggestion}
          </Button>
        ))}
      </div>

      <input name="specs" type="hidden" value={specsValue} />
    </div>
  );
}
