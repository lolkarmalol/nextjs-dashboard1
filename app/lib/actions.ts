"use server";

import { custom, z } from "zod";
import { Invoice } from "./definitions";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });
/* Marcar que toda las funciones que se exportan en este archivo son de
servidor por lo tanto no se ejecutan ni se envian al cliente
 */
const createInvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

const createInvoiceFormSchema = createInvoiceSchema.omit({
  id: true,
  date: true,
});

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = createInvoiceFormSchema.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  //trasformamos para evitar errores de redondeo
  const amountInCents = amount * 100;
  //creamos la fecha actual 25-11-2021
  const date = new Date().toISOString().split("T")[0];

  console.log({
    customerId,
    amountInCents,
    status,
    date,
  });

  //const rawFormData = Object.fromEntries(formData.entries())

  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}
