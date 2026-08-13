import { createCategoryAction } from "../actions";
import { CategoryForm } from "../category-form";

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">New Category</h2>
      <CategoryForm
        action={createCategoryAction}
        submitLabel="Create Category"
      />
    </div>
  );
}
