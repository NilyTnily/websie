import { notFound } from "next/navigation";

import { getTestimonialById } from "~/lib/queries/testimonials";

import { updateTestimonialAction } from "../actions";
import { TestimonialForm } from "../testimonial-form";

interface EditTestimonialPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTestimonialPage({
  params,
}: EditTestimonialPageProps) {
  const { id } = await params;
  const testimonial = await getTestimonialById(id);

  if (!testimonial) notFound();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Edit Testimonial</h2>
      <TestimonialForm
        action={updateTestimonialAction.bind(null, testimonial.id)}
        defaultValues={testimonial}
        submitLabel="Save Changes"
      />
    </div>
  );
}
