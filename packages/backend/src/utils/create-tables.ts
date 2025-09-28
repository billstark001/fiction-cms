import { exec } from "child_process";
import { promisify } from "util";

const run = promisify(exec);

export async function createTables() {
  try {
    let { stdout, stderr } = await run(
      "npx drizzle-kit generate --config=drizzle.config.ts"
    );
    console.log(stdout);
    console.error(stderr);
    ({ stdout, stderr } = await run(
      "npx drizzle-kit push --config=drizzle.config.ts"
    ));
    console.log(stdout);
    console.error(stderr);
    console.log('Database tables created successfully!');
  } catch (error) {
    console.error("Database tables creation failed:", error);
  }
}