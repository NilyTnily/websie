import type { InferSelectModel } from "drizzle-orm";

import { homepageSettingsTable } from "./tables";

export type HomepageSettings = InferSelectModel<typeof homepageSettingsTable>;