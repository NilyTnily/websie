import { createTestimonialAction } from "../actions";
import { TestimonialForm } from "../testimonial-form";

export default function NewTestimonialPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">New Testimonial</h2>
      <TestimonialForm
        action={createTestimonialAction}
        submitLabel="Create Testimonial"
      />
    </div>
  );
}
