import { pgTable, varchar, timestamp, uuid, text } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";

export const projectsTable = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  owner: varchar("owner", { length: 50 }).notNull().default("user"),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  slug: true,
});

export const selectProjectSchema = createSelectSchema(projectsTable);

export const updateProjectSchema = createUpdateSchema(projectsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  slug: true,
});
