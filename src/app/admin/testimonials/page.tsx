import Link from "next/link";

import { getAllTestimonialsForAdmin } from "~/lib/queries/testimonials";
import { Button } from "~/ui/primitives/button";

import { ConfirmSubmitButton } from "../confirm-submit-button";
import { deleteTestimonialAction } from "./actions";

export default async function AdminTestimonialsPage() {
  const testimonials = await getAllTestimonialsForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Testimonials</h2>
          <p className="text-sm text-muted-foreground">
            Shown in the rotating client-notes section on the homepage.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/testimonials/new">New Testimonial</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead
            className={`
              bg-muted/50 text-left text-xs text-muted-foreground uppercase
            `}
          >
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Quote</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {testimonials.map((testimonial) => (
              <tr className="border-t" key={testimonial.id}>
                <td className="px-4 py-3 font-medium">
                  {testimonial.customerName}
                  <div className="text-xs text-muted-foreground">
                    {testimonial.customerHandle}
                  </div>
                </td>
                <td
                  className={`
                    max-w-xs truncate px-4 py-3 text-muted-foreground
                  `}
                >
                  {testimonial.quote}
                </td>
                <td className="px-4 py-3">{testimonial.sortOrder}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      className={`
                        text-primary
                        hover:underline
                      `}
                      href={`/admin/testimonials/${testimonial.id}`}
                    >
                      Edit
                    </Link>
                    <form action={deleteTestimonialAction}>
                      <input name="id" type="hidden" value={testimonial.id} />
                      <ConfirmSubmitButton
                        className={`
                          text-destructive
                          hover:underline
                        `}
                        confirmMessage={`Delete the testimonial from "${testimonial.customerName}"?`}
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {testimonials.length === 0 && (
              <tr>
                <td
                  className="px-4 py-6 text-center text-muted-foreground"
                  colSpan={4}
                >
                  No testimonials yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
