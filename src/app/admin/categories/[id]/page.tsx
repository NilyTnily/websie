import { notFound } from "next/navigation";

import { getCategoryById, getSubcategories } from "~/lib/queries/catalog";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";

import { ConfirmSubmitButton } from "../../confirm-submit-button";
import {
  createSubcategoryAction,
  deleteSubcategoryAction,
  updateCategoryAction,
  updateSubcategoryAction,
} from "../actions";
import { CategoryForm } from "../category-form";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  const { id } = await params;
  const [category, subcategories] = await Promise.all([
    getCategoryById(id),
    getSubcategories(id),
  ]);

  if (!category) notFound();

  return (
    <div className="max-w-2xl space-y-10">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Edit Category</h2>
        <CategoryForm
          action={updateCategoryAction.bind(null, category.id)}
          defaultValues={category}
          submitLabel="Save Changes"
        />
      </div>

      <div className="space-y-4 border-t pt-8">
        <div>
          <h3 className="text-lg font-semibold">Subcategories</h3>
          <p className="text-sm text-muted-foreground">
            Shown as a &quot;Type&quot; filter on the storefront, and assignable
            to products in this category.
          </p>
        </div>

        <ul className="space-y-2">
          {subcategories.map((subcategory) => (
            <li className="flex items-center gap-2" key={subcategory.id}>
              <form
                action={updateSubcategoryAction}
                className="flex flex-1 items-center gap-2"
              >
                <input name="id" type="hidden" value={subcategory.id} />
                <Input
                  className="h-9"
                  defaultValue={subcategory.name}
                  name="name"
                  required
                />
                <Button size="sm" type="submit" variant="outline">
                  Save
                </Button>
              </form>
              <form action={deleteSubcategoryAction}>
                <input name="id" type="hidden" value={subcategory.id} />
                <ConfirmSubmitButton
                  className={`
                    text-sm text-destructive
                    hover:underline
                  `}
                  confirmMessage={`Delete subcategory "${subcategory.name}"?`}
                >
                  Delete
                </ConfirmSubmitButton>
              </form>
            </li>
          ))}
          {subcategories.length === 0 && (
            <li className="text-sm text-muted-foreground">
              No subcategories yet.
            </li>
          )}
        </ul>

        <form
          action={createSubcategoryAction}
          className={`flex items-center gap-2 pt-2`}
        >
          <input name="categoryId" type="hidden" value={category.id} />
          <Input
            className="h-9 max-w-xs"
            name="name"
            placeholder="New subcategory name"
            required
          />
          <Button size="sm" type="submit" variant="outline">
            Add
          </Button>
        </form>
      </div>
    </div>
  );
}
